const attendanceService = require('../services/attendanceService');

// Check In
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoBase64, latitude, longitude } = req.body;

    if (!userId || !photoBase64 || !latitude || !longitude) {
      return res.status(400).json({
        status: false,
        message: 'Semua field harus diisi'
      });
    }

    const { attendance, message } = await attendanceService.createAttendance({
      userId,
      photoBase64,
      latitude,
      longitude
    });

    return res.status(200).json({
      status: true,
      message: message,
      data: attendance
    });

  } catch (error) {
    console.error('Error in checkIn:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Terjadi kesalahan saat melakukan check in'
    });
  }
};

// Check Out
const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoBase64, latitude, longitude } = req.body;

    const existingAttendance = await attendanceService.getTodayAttendance(userId);
    if (!existingAttendance) {
      return res.status(400).json({
        status: false,
        message: 'Anda belum melakukan check in hari ini'
      });
    }

    const { attendance, message } = await attendanceService.updateAttendance(existingAttendance.id, {
      photoBase64,
      latitude,
      longitude
    });

    return res.status(200).json({
      status: true,
      message: message,
      data: attendance
    });

  } catch (error) {
    console.error('Error in checkOut:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Terjadi kesalahan saat melakukan check out'
    });
  }
};

// Get Today Status
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const attendance = await attendanceService.getTodayAttendance(userId);

    return res.status(200).json({
      status: true,
      message: 'Status absensi hari ini berhasil diambil',
      data: attendance || null
    });
  } catch (error) {
    console.error('Error in getTodayStatus:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil status absensi'
    });
  }
};

// Get Own History
const getOwnHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const history = await attendanceService.getAttendanceHistory(
      userId,
      parsedStartDate,
      parsedEndDate
    );

    return res.status(200).json({
      status: true,
      message: 'Riwayat absensi berhasil diambil',
      data: history
    });
  } catch (error) {
    console.error('Error in getOwnHistory:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil riwayat absensi'
    });
  }
};

// Get User History
const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: 'User ID diperlukan'
      });
    }

    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const history = await attendanceService.getAttendanceHistory(
      parseInt(userId),
      parsedStartDate,
      parsedEndDate
    );

    return res.status(200).json({
      status: true,
      message: 'Riwayat absensi user berhasil diambil',
      data: history
    });
  } catch (error) {
    console.error('Error in getUserHistory:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil riwayat absensi user'
    });
  }
};

// Get Attendance Report
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    const report = await attendanceService.getAttendanceReport(
      parsedStartDate,
      parsedEndDate,
      parsedPage,
      parsedLimit
    );

    return res.status(200).json({
      status: true,
      message: 'Laporan absensi berhasil diambil',
      data: report.data,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(report.total / parsedLimit),
        totalItems: report.total
      }
    });
  } catch (error) {
    console.error('Error in getAttendanceReport:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil laporan absensi'
    });
  }
};

// Get Statistics
const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const statistics = await attendanceService.getAttendanceStatistics(
      parsedStartDate,
      parsedEndDate
    );

    return res.status(200).json({
      status: true,
      message: 'Statistik absensi berhasil diambil',
      data: statistics
    });
  } catch (error) {
    console.error('Error in getStatistics:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil statistik absensi'
    });
  }
};

// Export Attendance
const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const exportData = await attendanceService.exportAttendance(
      parsedStartDate,
      parsedEndDate,
      format
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
    }

    return res.send(exportData);
  } catch (error) {
    console.error('Error in exportAttendance:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengekspor data absensi'
    });
  }
};

// Delete Attendance
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'ID absensi diperlukan'
      });
    }

    await attendanceService.deleteAttendance(parseInt(id));

    return res.status(200).json({
      status: true,
      message: 'Data absensi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error in deleteAttendance:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat menghapus data absensi'
    });
  }
};

// Update Attendance Record
const updateAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'ID absensi diperlukan'
      });
    }

    if (updateData.checkOutTime || updateData.checkOutPhotoUrl || 
        updateData.checkOutLatitude || updateData.checkOutLongitude) {
      const attendance = await attendanceService.updateAttendance(parseInt(id), updateData);
      return res.status(200).json({
        status: true,
        message: 'Data absensi berhasil diupdate',
        data: attendance
      });
    } 
    
    const attendance = await attendanceService.updateAttendanceStatus(parseInt(id), updateData);
    return res.status(200).json({
      status: true,
      message: 'Data absensi berhasil diupdate',
      data: attendance
    });

  } catch (error) {
    console.error('Error in updateAttendanceRecord:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengupdate data absensi'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getOwnHistory,
  getUserHistory,
  getAttendanceReport,
  getStatistics,
  exportAttendance,
  deleteAttendance,
  updateAttendanceRecord
};