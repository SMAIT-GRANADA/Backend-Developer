const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function isAdmin(userId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      roles: {
        some: {
          role: {
            name: 'admin'
          }
        }
      },
      isActive: true
    }
  });
  return !!user;
}

async function getAllTeachers(userId) {
  try {
    const admin = await isAdmin(userId);
    if (!admin) {
      return {
        status: false,
        message: 'Unauthorized: Only admin can access teacher list'
      };
    }

    const teachers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'guru'
            }
          }
        },
        isActive: true
      },
      select: {
        id: true,
        username: true, 
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      status: true,
      message: 'Data guru berhasil diambil',
      data: teachers
    };
  } catch (error) {
    console.error('Error in getAllTeachers:', error);
    return {
      status: false,
      message: 'Gagal mengambil data guru'
    };
  }
}

module.exports = {
  getAllTeachers
};