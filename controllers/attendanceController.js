const attendanceService = require('../services/attendanceService');

const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoBase64, latitude, longitude } = req.body;

    const attendance = await attendanceService.createAttendance({
      userId,
      photoBase64,
      latitude,
      longitude
    });

    return res.status(200).json({
      status: true,
      message: 'Check in berhasil',
      data: attendance
    });

  } catch (error) {
    console.error('Error in checkIn:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat melakukan check in'
    });
  }
};

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

    const attendance = await attendanceService.updateAttendance(existingAttendance.id, {
      userId,
      photoBase64,
      latitude,
      longitude
    });

    return res.status(200).json({
      status: true,
      message: 'Check out berhasil',
      data: attendance
    });

  } catch (error) {
    console.error('Error in checkOut:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat melakukan check out'
    });
  }
};

module.exports = {
  checkIn,
  checkOut
};