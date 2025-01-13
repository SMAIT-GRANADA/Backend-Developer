const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function createUser(userData) {
  try {
    const requiredFields = ['username', 'password', 'name', 'email', 'roleId'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`${field} is required`);
      }
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

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with role in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          name: userData.name,
          email: userData.email,
          roles: {
            create: {
              roleId: userData.roleId
            }
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
      return user;
    });

    return newUser;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
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
      include: {
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

    // Hash password if it's being updated
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: userData,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return updatedUser;
  } catch (error) {
    throw error;
  }
}

async function deleteUser(id) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({
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

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};