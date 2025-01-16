const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadPhotoToGCS, deletePhotoFromGCS, bucket } = require('../config/gcs');

const validatePhotoBase64 = (photoBase64) => {
  if (!photoBase64) {
    throw new Error('Foto tidak boleh kosong');
  }
  
  const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Format foto tidak valid');
  }
  
  return matches[2];
};

const createAttendance = async (data) => {
  try {
    if (!data.userId || !data.latitude || !data.longitude) {
      throw new Error('Data attendance tidak lengkap');
    }

    const existingAttendance = await getTodayAttendance(data.userId);
    if (existingAttendance) {
      throw new Error('Anda sudah melakukan absensi hari ini');
    }

    let photoUrl;
    try {
      const base64Data = validatePhotoBase64(data.photoBase64);
      const photoBuffer = Buffer.from(base64Data, 'base64');
      const photoFileName = `attendance/${data.userId}/${Date.now()}_checkin.jpg`;
      
      photoUrl = await uploadPhotoToGCS(data.photoBase64, data.userId);
    } catch (uploadError) {
      console.error('Error uploading check-in photo:', uploadError);
      throw new Error('Gagal mengunggah foto check-in');
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: data.userId,
        checkInTime: new Date(),
        checkInPhotoUrl: photoUrl,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        status: 'hadir'
      },
      include: {
        user: {
          select: {
            name: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    return attendance;
  } catch (error) {
    console.error('Error in createAttendance:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat membuat attendance');
  }
};

const updateAttendance = async (id, data) => {
  try {
    if (!id || !data.userId || !data.latitude || !data.longitude) {
      throw new Error('Data checkout tidak lengkap');
    }

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id }
    });

    if (!existingAttendance) {
      throw new Error('Data attendance tidak ditemukan');
    }

    if (existingAttendance.checkOutTime) {
      throw new Error('Anda sudah melakukan checkout');
    }

    let photoUrl;
    try {
      photoUrl = await uploadPhotoToGCS(data.photoBase64, data.userId);
    } catch (uploadError) {
      console.error('Error uploading check-out photo:', uploadError);
      throw new Error('Gagal mengunggah foto check-out');
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkOutTime: new Date(),
        checkOutPhotoUrl: photoUrl,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude
      },
      include: {
        user: {
          select: {
            name: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    return attendance;
  } catch (error) {
    console.error('Error in updateAttendance:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat update attendance');
  }
};

const getTodayAttendance = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.attendance.findFirst({
      where: {
        userId,
        checkInTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            name: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in getTodayAttendance:', error);
    throw new Error('Gagal mengambil data attendance hari ini');
  }
};

const getAttendanceHistory = async (userId, startDate, endDate) => {
  try {
    return await prisma.attendance.findMany({
      where: {
        userId,
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        checkInTime: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in getAttendanceHistory:', error);
    throw new Error('Gagal mengambil riwayat attendance');
  }
};

const getAttendanceReport = async (startDate, endDate, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          checkInTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          user: {
            select: {
              name: true,
              roles: {
                include: {
                  role: true
                }
              }
            }
          }
        },
        orderBy: {
          checkInTime: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.attendance.count({
        where: {
          checkInTime: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error in getAttendanceReport:', error);
    throw new Error('Gagal mengambil laporan attendance');
  }
};

const getAttendanceStatistics = async (startDate, endDate) => {
  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            name: true,
            roles: true
          }
        }
      }
    });

    const statistics = {
      total: attendances.length,
      onTime: 0,
      late: 0,
      checkoutComplete: 0,
      byRole: {}
    };

    attendances.forEach(attendance => {
      attendance.user.roles.forEach(role => {
        if (!statistics.byRole[role.name]) {
          statistics.byRole[role.name] = 0;
        }
        statistics.byRole[role.name]++;
      });

      if (attendance.checkOutTime) {
        statistics.checkoutComplete++;
      }
    });

    return statistics;
  } catch (error) {
    console.error('Error in getAttendanceStatistics:', error);
    throw new Error('Gagal mengambil statistik attendance');
  }
};

const deleteAttendance = async (id) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id }
    });

    if (!attendance) {
      throw new Error('Attendance tidak ditemukan');
    }

    if (attendance.checkInPhotoUrl) {
      try {
        await deletePhotoFromGCS(attendance.checkInPhotoUrl);
      } catch (error) {
        console.error('Error deleting check-in photo:', error);
      }
    }

    if (attendance.checkOutPhotoUrl) {
      try {
        await deletePhotoFromGCS(attendance.checkOutPhotoUrl);
      } catch (error) {
        console.error('Error deleting check-out photo:', error);
      }
    }

    await prisma.attendance.delete({
      where: { id }
    });

    return { message: 'Attendance berhasil dihapus' };
  } catch (error) {
    console.error('Error in deleteAttendance:', error);
    throw new Error(error.message || 'Gagal menghapus attendance');
  }
};

module.exports = {
  createAttendance,
  updateAttendance,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceReport,
  getAttendanceStatistics,
  deleteAttendance
};