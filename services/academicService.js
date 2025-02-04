const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAcademicRecord(data, teacherId) {
  try {
    const { studentId, semester, academicYear, grades } = data;
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        isActive: true
      }
    });

    if (!student) {
      return {
        status: false,
        message: 'Siswa tidak ditemukan atau tidak aktif'
      };
    }

    const existingRecord = await prisma.academicRecord.findFirst({
      where: {
        studentId,
        semester,
        academicYear
      }
    });

    if (existingRecord) {
      const existingSubjects = Object.keys(existingRecord.grades);
      const newSubjects = Object.keys(grades);
      const overlappingSubjects = existingSubjects.filter(subject => 
        newSubjects.includes(subject)
      );

      if (overlappingSubjects.length > 0) {
        return {
          status: false,
          message: `Nilai untuk mata pelajaran ${overlappingSubjects.join(', ')} sudah ada. Gunakan fitur update untuk mengubah nilai.`
        };
      }
      const updatedGrades = {
        ...existingRecord.grades,
        ...grades
      };

      const updatedRecord = await prisma.academicRecord.update({
        where: { id: existingRecord.id },
        data: {
          grades: updatedGrades,
          teacherId
        },
        include: {
          student: true,
          teacher: {
            select: {
              name: true
            }
          }
        }
      });

      return {
        status: true,
        message: 'Nilai berhasil ditambahkan ke record yang ada',
        data: updatedRecord
      };
    }

    const academicRecord = await prisma.academicRecord.create({
      data: {
        studentId,
        semester,
        academicYear,
        grades,
        teacherId
      },
      include: {
        student: true,
        teacher: {
          select: {
            name: true
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
      message: 'Gagal membuat data akademik'
    };
  }
}

async function getAcademicRecords(userRole, userId) {
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

      const records = await prisma.academicRecord.findMany({
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

      const transformedRecords = records.map(record => ({
        id: record.id,
        studentName: record.student.name,
        className: record.student.className,
        semester: record.semester,
        academicYear: record.academicYear,
        grades: record.grades
      }));

      return {
        status: true,
        message: 'Data akademik berhasil diambil',
        data: transformedRecords
      };
    }
    // Jika role guru
    else if (userRole === 'guru') {
      const records = await prisma.academicRecord.findMany({
        include: {
          student: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const transformedRecords = records.map(record => ({
        id: record.id,
        studentName: record.student.name,
        className: record.student.className,
        semester: record.semester,
        academicYear: record.academicYear,
        grades: record.grades
      }));

      return {
        status: true,
        message: 'Data akademik berhasil diambil',
        data: transformedRecords
      };
    }

    else {
      return {
        status: false,
        message: 'Role tidak memiliki akses untuk melihat data akademik'
      };
    }
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

async function updateAcademicRecord(id, data, teacherId) {
  try {
    const existingRecord = await prisma.academicRecord.findUnique({
      where: { id: Number(id) }
    });

    if (!existingRecord) {
      return {
        status: false,
        message: 'Data akademik tidak ditemukan'
      };
    }

    const subjectToUpdate = Object.keys(data.grades)[0];
    const existingGrades = existingRecord.grades;
    
    if (existingGrades[subjectToUpdate] && existingRecord.teacherId !== teacherId) {
      return {
        status: false,
        message: `Anda tidak memiliki akses untuk mengubah nilai ${subjectToUpdate}`
      };
    }
    const updatedGrades = {
      ...existingGrades,
      ...data.grades
    };

    const updatedRecord = await prisma.academicRecord.update({
      where: { id: Number(id) },
      data: {
        grades: updatedGrades,
        teacherId 
      },
      include: {
        student: true,
        teacher: {
          select: {
            name: true
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
      message: 'Gagal memperbarui data akademik'
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
async function getAcademicRecordById(id, userRole, userId) {
  try {
    const record = await prisma.academicRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            className: true,
            isActive: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true
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

    if (userRole === 'ortu') {
      const parentStudent = await prisma.student.findFirst({
        where: {
          id: record.studentId,
          parentId: userId,
          isActive: true
        }
      });

      if (!parentStudent) {
        return {
          status: false,
          message: 'Anda tidak memiliki akses ke data ini'
        };
      }
    }
    const formattedRecord = {
      id: record.id,
      studentName: record.student.name,
      className: record.student.className,
      semester: record.semester,
      academicYear: record.academicYear,
      grades: record.grades,
      teacherName: record.teacher.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };

    return {
      status: true,
      message: 'Data akademik berhasil diambil',
      data: formattedRecord
    };
  } catch (error) {
    console.error('Error in getAcademicRecordById:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat mengambil data akademik'
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