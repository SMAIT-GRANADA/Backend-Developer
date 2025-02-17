const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadPhotoToGCS, deletePhotoFromGCS } = require('../config/gcs');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

const ATTENDANCE_START_HOUR = 6;
const ATTENDANCE_LATE_HOUR = 7;
const ATTENDANCE_LATE_MINUTE = 30;

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

const isWithinAttendanceHours = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= ATTENDANCE_START_HOUR;
};

const isLate = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  return (hour > ATTENDANCE_LATE_HOUR) || 
         (hour === ATTENDANCE_LATE_HOUR && minute > ATTENDANCE_LATE_MINUTE);
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

const generateAttendanceMessage = async (userId, type) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  const isTeacher = user.roles.some(ur => ur.role.name === 'guru');
  
  if (type === 'checkin') {
    if (isTeacher) {
      return `Selamat datang, ${user.name}. Selamat menjalankan tugas dan Semoga hari ini berjalan lancar.`;
    } else {
      return `Selamat! Anda telah berhasil absen ${user.name}. Jangan pernah berhenti belajar karena selama kita hidup, ada selalu sesuatu yang baru untuk dipelajari :)`;
    }
  } else if (type === 'checkout' && isTeacher) {
    return `Terima kasih, ${user.name}, atas kontribusi Anda hari ini. Selamat beristirahat!`;
  }
  
  return 'Checkout berhasil';
};

const createAttendance = async (data) => {
  try {
    if (!data.userId || !data.latitude || !data.longitude) {
      throw new Error('Data attendance tidak lengkap');
    }

    if (!isWithinAttendanceHours()) {
      throw new Error('Absensi hanya dapat dilakukan mulai pukul 6 pagi');
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

    // Set status berdasarkan waktu
    const status = isLate() ? 'telat' : 'hadir';

    const attendance = await prisma.attendance.create({
      data: {
        userId: data.userId,
        checkInTime: new Date(),
        checkInPhotoUrl: photoUrl,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        status
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

    const message = await generateAttendanceMessage(data.userId, 'checkin');
    return { attendance, message };

  } catch (error) {
    console.error('Error in createAttendance:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat membuat attendance');
  }
};

const updateAttendance = async (id, data) => {
  try {
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!existingAttendance) {
      throw new Error('Data attendance tidak ditemukan');
    }

    if (existingAttendance.checkOutTime) {
      throw new Error('Anda sudah melakukan checkout');
    }

    let updateData = {};
    let photoUrl;

    if (data.photoBase64 && data.latitude && data.longitude) {
      try {
        photoUrl = await uploadPhotoToGCS(data.photoBase64, existingAttendance.userId);
      } catch (uploadError) {
        console.error('Error uploading check-out photo:', uploadError);
        throw new Error('Gagal mengunggah foto check-out');
      }

      updateData = {
        checkOutTime: new Date(),
        checkOutPhotoUrl: photoUrl,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude
      };
    } else {
      updateData = { ...data };
      delete updateData.id;
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
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

    const message = await generateAttendanceMessage(existingAttendance.userId, 'checkout');
    return { attendance, message };

  } catch (error) {
    console.error('Error in updateAttendance:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat update attendance');
  }
};

const updateAttendanceStatus = async (id, updateData) => {
  try {
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id }
    });

    if (!existingAttendance) {
      throw new Error('Data attendance tidak ditemukan');
    }

    const safeUpdateData = { ...updateData };
    delete safeUpdateData.id;
    delete safeUpdateData.userId;
    delete safeUpdateData.checkInTime;
    delete safeUpdateData.checkInPhotoUrl;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: safeUpdateData,
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
    console.error('Error in updateAttendanceStatus:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat update attendance');
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
      hadir: attendances.filter(a => a.status === 'hadir').length,
      telat: attendances.filter(a => a.status === 'telat').length,
      izin: attendances.filter(a => a.status === 'izin').length,
      alpha: attendances.filter(a => a.status === 'alpha').length,
      checkoutComplete: attendances.filter(a => a.checkOutTime).length
    };

    return statistics;
  } catch (error) {
    console.error('Error in getAttendanceStatistics:', error);
    throw new Error('Gagal mengambil statistik attendance');
  }
};

const exportAttendance = async (startDate, endDate, format = 'csv') => {
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
            email: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        checkInTime: 'asc'
      }
    });

    const exportData = attendances.map(attendance => ({
      'ID': attendance.id,
      'Tanggal': new Date(attendance.checkInTime).toLocaleDateString('id-ID'),
      'Nama': attendance.user.name,
      'Email': attendance.user.email,
      'Role': attendance.user.roles.map(r => r.role.name).join(', '),
      'Status': attendance.status,
      'Jam Masuk': attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString('id-ID') : '-',
      'Lokasi Masuk': `${attendance.checkInLatitude}, ${attendance.checkInLongitude}`,
      'Jam Keluar': attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString('id-ID') : '-',
      'Lokasi Keluar': attendance.checkOutLatitude ? `${attendance.checkOutLatitude}, ${attendance.checkOutLongitude}` : '-'
    }));

    if (format === 'csv') {
      const csvFields = [
        'ID', 'Tanggal', 'Nama', 'Email', 'Role', 'Status',
        'Jam Masuk', 'Lokasi Masuk', 'Jam Keluar', 'Lokasi Keluar'
      ];
      const parser = new Parser({ fields: csvFields });
      return parser.parse(exportData);
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      worksheet.columns = [
        { header: 'ID', key: 'ID', width: 5 },
        { header: 'Tanggal', key: 'Tanggal', width: 12 },
        { header: 'Nama', key: 'Nama', width: 25 },
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Role', key: 'Role', width: 15 },
        { header: 'Status', key: 'Status', width: 10 },
        { header: 'Jam Masuk', key: 'Jam Masuk', width: 12 },
        { header: 'Lokasi Masuk', key: 'Lokasi Masuk', width: 25 },
        { header: 'Jam Keluar', key: 'Jam Keluar', width: 12 },
        { header: 'Lokasi Keluar', key: 'Lokasi Keluar', width: 25 }
      ];
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.addRows(exportData);
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      return await workbook.xlsx.writeBuffer();
    }
  } catch (error) {
    console.error('Error in exportAttendance:', error);
    throw new Error('Gagal mengekspor data absensi');
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
  updateAttendanceStatus,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceReport,
  getAttendanceStatistics,
  exportAttendance,
  deleteAttendance,
  validatePhotoBase64,
  isWithinAttendanceHours,
  isLate
};