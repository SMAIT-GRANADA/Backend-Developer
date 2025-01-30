const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadPhotoToGCS, deletePhotoFromGCS } = require('../config/gcs');

async function createSalarySlip(data, uploadedBy) {
  try {
    const { teacherId, period, fileBase64 } = data;

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        roles: {
          some: {
            role: {
              name: 'guru'
            }
          }
        },
        isActive: true
      }
    });

    if (!teacher) {
      return {
        status: false,
        message: 'Guru tidak ditemukan atau tidak aktif'
      };
    }

    const slipImageUrl = await uploadPhotoToGCS(fileBase64, `salary-slips/${teacherId}`);

    const salarySlip = await prisma.salarySlip.create({
      data: {
        teacherId,
        slipImageUrl,
        period: new Date(period),
        uploadedBy
      },
      include: {
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            name: true
          }
        }
      }
    });

    return {
      status: true,
      message: 'Slip gaji berhasil dibuat',
      data: salarySlip
    };
  } catch (error) {
    console.error('Error in createSalarySlip:', error);
    return {
      status: false,
      message: 'Gagal membuat slip gaji'
    };
  }
}

async function getSalarySlips(userId, userRole) {
  try {
    let whereClause = {};
    if (userRole === 'guru') {
      whereClause.teacherId = userId;
    }

    const slips = await prisma.salarySlip.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        period: 'desc'
      }
    });

    return {
      status: true,
      message: 'Data slip gaji berhasil diambil',
      data: slips
    };
  } catch (error) {
    console.error('Error in getSalarySlips:', error);
    return {
      status: false,
      message: 'Gagal mengambil data slip gaji'
    };
  }
}

async function updateSalarySlip(id, data) {
  try {
    const existingSlip = await prisma.salarySlip.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSlip) {
      return {
        status: false,
        message: 'Slip gaji tidak ditemukan'
      };
    }

    const { period, fileBase64 } = data;
    let slipImageUrl = existingSlip.slipImageUrl;

    if (fileBase64) {
      await deletePhotoFromGCS(existingSlip.slipImageUrl);
      slipImageUrl = await uploadPhotoToGCS(fileBase64, `salary-slips/${existingSlip.teacherId}`);
    }

    const updatedSlip = await prisma.salarySlip.update({
      where: { id: parseInt(id) },
      data: {
        period: new Date(period),
        slipImageUrl
      },
      include: {
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            name: true
          }
        }
      }
    });

    return {
      status: true,
      message: 'Slip gaji berhasil diperbarui',
      data: updatedSlip
    };
  } catch (error) {
    console.error('Error in updateSalarySlip:', error);
    return {
      status: false,
      message: 'Gagal memperbarui slip gaji'
    };
  }
}

async function deleteSalarySlip(id) {
  try {
    const slip = await prisma.salarySlip.findUnique({
      where: { id: parseInt(id) }
    });

    if (!slip) {
      return {
        status: false,
        message: 'Slip gaji tidak ditemukan'
      };
    }

    await deletePhotoFromGCS(slip.slipImageUrl);
    await prisma.salarySlip.delete({
      where: { id: parseInt(id) }
    });

    return {
      status: true,
      message: 'Slip gaji berhasil dihapus'
    };
  } catch (error) {
    console.error('Error in deleteSalarySlip:', error);
    return {
      status: false,
      message: 'Gagal menghapus slip gaji'
    };
  }
}

module.exports = {
  createSalarySlip,
  getSalarySlips,
  updateSalarySlip,
  deleteSalarySlip
};