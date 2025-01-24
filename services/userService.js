const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  TEACHER: 3,
  PARENT: 4,
  STUDENT: 5
};

function isValidRoleId(roleId) {
  return Object.values(ROLE_IDS).includes(Number(roleId));
}

async function createUser(userData) {
  try {
    const requiredFields = ['username', 'password', 'name', 'email', 'roleId'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    if (!isValidRoleId(userData.roleId)) {
      throw new Error('Invalid role ID');
    }

    const roleExists = await prisma.role.findUnique({
      where: { id: Number(userData.roleId) }
    });

    if (!roleExists) {
      throw new Error('Role not found');
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: userData.username }
    });
    
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        name: userData.name,
        email: userData.email,
        roles: {
          create: [{
            role: {
              connect: {
                id: Number(userData.roleId)
              }
            }
          }]
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (Number(userData.roleId) === ROLE_IDS.SUPER_ADMIN) {
      await prisma.superAdmin.create({
        data: {
          userId: newUser.id
        }
      });
    }

    const userResponse = { ...newUser };
    delete userResponse.password;
    
    return userResponse;

  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error('Unique constraint violation');
    }
    throw error;
  }
}

async function getAllUsers(page = 1, limit = 10) {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const totalUsers = await prisma.user.count();

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      data: users,
      meta: {
        currentPage: page,
        totalPages,
        totalData: totalUsers,
        dataPerPage: limit
      }
    };
  } catch (error) {
    throw error;
  }
}

async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('User tidak ditemukan');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, userData) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!existingUser) {
      throw new Error('User tidak ditemukan');
    }

    if (userData.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: userData.username,
          NOT: { id: Number(id) }
        }
      });
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    if (userData.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: userData.email,
          NOT: { id: Number(id) }
        }
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    if (userData.roleId) {
      if (!isValidRoleId(userData.roleId)) {
        throw new Error('Invalid role ID');
      }

      const roleExists = await prisma.role.findUnique({
        where: { id: Number(userData.roleId) }
      });

      if (!roleExists) {
        throw new Error('Role not found');
      }

      await prisma.userRole.updateMany({
        where: { userId: Number(id) },
        data: { roleId: Number(userData.roleId) }
      });
      delete userData.roleId;
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: userData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (userData.password || userData.hasOwnProperty('isActive')) {
      await prisma.token.updateMany({
        where: { 
          userId: Number(id),
          isValid: true
        },
        data: { 
          isValid: false
        }
      });
    }

    return updatedUser;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error('Unique constraint violation');
    }
    throw error;
  }
}

async function deleteUser(id) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        roles: true,
        superAdmin: true
      }
    });

    if (!existingUser) {
      throw new Error('User tidak ditemukan');
    }

    if (existingUser.superAdmin) {
      throw new Error('Cannot delete superadmin user');
    }

    await prisma.$transaction([
      prisma.token.updateMany({
        where: { 
          userId: Number(id),
          isValid: true
        },
        data: { 
          isValid: false 
        }
      }),
      prisma.userRole.deleteMany({
        where: { userId: Number(id) }
      }),
      prisma.attendance.deleteMany({
        where: { userId: Number(id) }
      }),
      prisma.studentPoint.deleteMany({
        where: {
          OR: [
            { studentId: Number(id) },
            { teacherId: Number(id) }
          ]
        }
      }),
      prisma.academicRecord.deleteMany({
        where: { studentId: Number(id) }
      }),
      prisma.salarySlip.deleteMany({
        where: {
          OR: [
            { teacherId: Number(id) },
            { uploadedBy: Number(id) }
          ]
        }
      }),
      prisma.token.deleteMany({
        where: { userId: Number(id) }
      }),
      prisma.user.delete({
        where: { id: Number(id) }
      })
    ]);

    return { message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
}

async function validatePassword(inputPassword, hashedPassword) {
  return await bcrypt.compare(inputPassword, hashedPassword);
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  validatePassword,
  ROLE_IDS
};