const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAcademicRecord(data) {
  try {
    const student = await prisma.user.findFirst({
      where: {
        id: data.studentId,
        roles: {
          some: {
            role: {
              name: 'siswa'
            }
          }
        }
      }
    });

    if (!student) {
      return {
        status: false,
        message: 'Siswa tidak ditemukan atau ID bukan merupakan siswa'
      };
    }
    const existingRecord = await prisma.academicRecord.findFirst({
      where: {
        studentId: data.studentId,
        semester: data.semester,
        academicYear: data.academicYear
      }
    });

    if (existingRecord) {
      return {
        status: false,
        message: 'Data akademik untuk semester dan tahun ajaran ini sudah ada'
      };
    }

    const academicRecord = await prisma.academicRecord.create({
      data: {
        studentId: data.studentId,
        semester: data.semester,
        academicYear: data.academicYear,
        grades: data.grades
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return {
      status: true,
      message: 'Data akademik berhasil dibuat',
      data: academicRecord
    };
  } catch (error) {
    console.error('Error in createAcademicRecord:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat membuat data akademik'
    };
  }
}

async function getAcademicRecords(filters = {}, userRole, userId) {
  try {
    let whereClause = {};

    // Filter berdasarkan role
    if (userRole === 'ortu') {
      const parentStudent = await prisma.user.findFirst({
        where: {
          id: userId,
          roles: {
            some: {
              role: {
                name: 'ortu'
              }
            }
          }
        }
      });

      if (!parentStudent) {
        return {
          status: false,
          message: 'Data orang tua tidak ditemukan'
        };
      }

      whereClause.studentId = parentStudent.studentId;
    }

    if (filters.studentId) whereClause.studentId = parseInt(filters.studentId);
    if (filters.semester) whereClause.semester = filters.semester;
    if (filters.academicYear) whereClause.academicYear = filters.academicYear;

    const records = await prisma.academicRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      status: true,
      message: 'Data akademik berhasil diambil',
      data: records
    };
  } catch (error) {
    console.error('Error in getAcademicRecords:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat mengambil data akademik'
    };
  }
}

async function getAcademicRecordById(id, userRole, userId) {
  try {
    const record = await prisma.academicRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!record) {
      return {
        status: false,
        message: 'Data akademik tidak ditemukan'
      };
    }

    // Validasi akses untuk orang tua
    if (userRole === 'ortu') {
      const parentStudent = await prisma.user.findFirst({
        where: {
          id: userId,
          roles: {
            some: {
              role: {
                name: 'ortu'
              }
            }
          }
        }
      });

      if (parentStudent?.studentId !== record.studentId) {
        return {
          status: false,
          message: 'Anda tidak memiliki akses ke data ini'
        };
      }
    }

    return {
      status: true,
      message: 'Data akademik berhasil diambil',
      data: record
    };
  } catch (error) {
    console.error('Error in getAcademicRecordById:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat mengambil data akademik'
    };
  }
}

async function updateAcademicRecord(id, data) {
  try {
    const existingRecord = await prisma.academicRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecord) {
      return {
        status: false,
        message: 'Data akademik tidak ditemukan'
      };
    }

    const updatedRecord = await prisma.academicRecord.update({
      where: { id: parseInt(id) },
      data,
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return {
      status: true,
      message: 'Data akademik berhasil diperbarui',
      data: updatedRecord
    };
  } catch (error) {
    console.error('Error in updateAcademicRecord:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat memperbarui data akademik'
    };
  }
}

async function deleteAcademicRecord(id) {
  try {
    const existingRecord = await prisma.academicRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecord) {
      return {
        status: false,
        message: 'Data akademik tidak ditemukan'
      };
    }

    await prisma.academicRecord.delete({
      where: { id: parseInt(id) }
    });

    return {
      status: true,
      message: 'Data akademik berhasil dihapus'
    };
  } catch (error) {
    console.error('Error in deleteAcademicRecord:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat menghapus data akademik'
    };
  }
}

module.exports = {
  createAcademicRecord,
  getAcademicRecords,
  getAcademicRecordById,
  updateAcademicRecord,
  deleteAcademicRecord
};