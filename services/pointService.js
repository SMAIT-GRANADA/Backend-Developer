const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createPoint(data) {
  try {
    const { name, className, points, description, teacherId } = data;
    
    const student = await prisma.student.findFirst({
      where: {
        name,
        className,
        isActive: true
      }
    });

    if (!student) {
      return {
        status: false,
        message: 'Siswa tidak ditemukan'
      };
    }

    const point = await prisma.studentPoint.create({
      data: {
        studentId: student.id,
        points,
        description,
        teacherId
      }
    });

    return {
      status: true,
      message: 'Point berhasil ditambahkan',
      data: point
    };
  } catch (error) {
    console.error('Error in createPoint service:', error);
    return {
      status: false,
      message: 'Gagal menambahkan point'
    };
  }
}

async function getPoints(userRole, userId) {
  try {
    if (userRole === 'ortu') {
      const parentStudents = await prisma.student.findMany({
        where: {
          parentId: userId,
          isActive: true
        }
      });

      if (parentStudents.length === 0) {
        return {
          status: false,
          message: 'Tidak ditemukan data siswa terkait'
        };
      }

      const points = await prisma.studentPoint.findMany({
        where: {
          studentId: {
            in: parentStudents.map(student => student.id)
          }
        },
        include: {
          student: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const transformedPoints = points.map(point => ({
        id: point.id,
        points: point.points,
        description: point.description,
        studentName: point.student.name,
        className: point.student.className
      }));

      return {
        status: true,
        message: 'Data point berhasil diambil',
        data: transformedPoints
      };
    } 
    else if (userRole === 'guru') {
      const points = await prisma.studentPoint.findMany({
        where: {
          teacherId: userId
        },
        include: {
          student: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const transformedPoints = points.map(point => ({
        id: point.id,
        points: point.points,
        description: point.description,
        studentName: point.student.name,
        className: point.student.className
      }));

      return {
        status: true,
        message: 'Data point berhasil diambil',
        data: transformedPoints
      };
    }
    else {
      return {
        status: false,
        message: 'Role tidak memiliki akses untuk melihat data point'
      };
    }
  } catch (error) {
    console.error('Error in getPoints:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat mengambil data point'
    };
  }
}

async function updatePoint(pointId, data, teacherId) {
  try {
    const existingPoint = await prisma.studentPoint.findFirst({
      where: {
        id: Number(pointId),
        teacherId: teacherId
      }
    });

    if (!existingPoint) {
      return {
        status: false,
        message: 'Point tidak ditemukan atau Anda tidak memiliki akses'
      };
    }
    const updatedPoint = await prisma.studentPoint.update({
      where: {
        id: Number(pointId)
      },
      data: {
        points: data.points,
        description: data.description
      },
      include: {
        student: true
      }
    });

    return {
      status: true,
      message: 'Point berhasil diupdate',
      data: {
        id: updatedPoint.id,
        points: updatedPoint.points,
        description: updatedPoint.description,
        studentName: updatedPoint.student.name,
        className: updatedPoint.student.className
      }
    };
  } catch (error) {
    console.error('Error in updatePoint service:', error);
    return {
      status: false,
      message: 'Gagal mengupdate point'
    };
  }
}

async function deletePoint(pointId, teacherId) {
  try {
    const existingPoint = await prisma.studentPoint.findFirst({
      where: {
        id: Number(pointId),
        teacherId: teacherId
      }
    });

    if (!existingPoint) {
      return {
        status: false,
        message: 'Point tidak ditemukan atau Anda tidak memiliki akses'
      };
    }

    await prisma.studentPoint.delete({
      where: {
        id: Number(pointId)
      }
    });

    return {
      status: true,
      message: 'Point berhasil dihapus'
    };
  } catch (error) {
    console.error('Error in deletePoint service:', error);
    return {
      status: false,
      message: 'Gagal menghapus point'
    };
  }
} 

module.exports = {
  createPoint,
  getPoints,
  updatePoint,
  deletePoint
};