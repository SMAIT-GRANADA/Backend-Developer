const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function createUser(userData) {
  try {
    // Validate required fields
    const requiredFields = ['username', 'password', 'name', 'email', 'roleId'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check if role exists
    const roleExists = await prisma.role.findUnique({
      where: { id: Number(userData.roleId) }
    });

    if (!roleExists) {
      throw new Error('Role not found');
    }

    // Check existing username
    const existingUsername = await prisma.user.findUnique({
      where: { username: userData.username }
    });
    
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with role
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

    // Remove password from response
    delete newUser.password;
    return newUser;

  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error('Unique constraint violation');
    }
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
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
    return users;
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
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, userData) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check username uniqueness if being updated
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

    // Check email uniqueness if being updated
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

    // Check if roleId exists and is valid when updating role
    if (userData.roleId) {
      const roleExists = await prisma.role.findUnique({
        where: { id: Number(userData.roleId) }
      });

      if (!roleExists) {
        throw new Error('Role not found');
      }

      // Update user role
      await prisma.userRole.updateMany({
        where: { userId: Number(id) },
        data: { roleId: Number(userData.roleId) }
      });

      // Remove roleId from userData to prevent duplicate update
      delete userData.roleId;
    }

    // Hash password if it's being updated
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
      throw new Error('User not found');
    }

    // Check if user is a superadmin
    if (existingUser.superAdmin) {
      throw new Error('Cannot delete superadmin user');
    }

    // Delete related records and user in a transaction
    await prisma.$transaction([
      // Delete UserRole records
      prisma.userRole.deleteMany({
        where: { userId: Number(id) }
      }),
      // Delete related records in other tables
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
      // Finally delete the user
      prisma.user.delete({
        where: { id: Number(id) }
      })
    ]);

    return { message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};