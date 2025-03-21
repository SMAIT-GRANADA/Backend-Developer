require('dotenv').config();

const ATTENDANCE_START_HOUR = 5; // Jam 5 pagi
const ATTENDANCE_LATE_HOUR = 7;  // Jam 7 pagi
const ATTENDANCE_LATE_MINUTE = 20; // 20 menit

const SCHOOL_LATITUDE = parseFloat(process.env.SCHOOL_LATITUDE);
const SCHOOL_LONGITUDE = parseFloat(process.env.SCHOOL_LONGITUDE);
const MAX_DISTANCE = 2000; // dalam meter

const checkGeolocation = (req, res, next) => {
  const { latitude, longitude } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({
      status: false,
      message: 'Mohon aktifkan GPS Anda'
    });
  }

  // Hitung jarak dengan rumus Haversine
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = SCHOOL_LATITUDE * Math.PI/180;
  const φ2 = latitude * Math.PI/180;
  const Δφ = (latitude - SCHOOL_LATITUDE) * Math.PI/180;
  const Δλ = (longitude - SCHOOL_LONGITUDE) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  if (distance > MAX_DISTANCE) {
    return res.status(403).json({
      status: false,
      message: 'Anda harus berada di area sekolah untuk melakukan absensi'
    });
  }

  next();
};

const validatePhoto = (req, res, next) => {
  const { photoBase64 } = req.body;

  if (!photoBase64) {
    return res.status(400).json({
      status: false,
      message: 'Foto wajib diisi'
    });
  }

  if (!photoBase64.match(/^data:image\/(jpeg|jpg|png);base64,/)) {
    return res.status(400).json({
      status: false,
      message: 'Format foto tidak valid. Gunakan format JPEG/JPG/PNG'
    });
  }

  const base64Data = photoBase64.split(';base64,').pop();
  const fileSize = Buffer.from(base64Data, 'base64').length;
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (fileSize > maxSize) {
    return res.status(400).json({
      status: false,
      message: 'Ukuran foto terlalu besar. Maksimal 5MB'
    });
  }

  next();
};

const checkTeacherOrStudent = (req, res, next) => {
  const userRoles = req.user.roles;
  
  if (!userRoles.includes('guru') && !userRoles.includes('siswa')) {
    return res.status(403).json({
      status: false,
      message: 'Akses ditolak - Hanya Guru dan Siswa yang dapat mengakses fitur absensi'
    });
  }
  next();
};

const checkAttendanceTime = (req, res, next) => {
  const now = new Date();
  const hour = now.getHours();

  if (hour < ATTENDANCE_START_HOUR) {
    return res.status(403).json({
      status: false,
      message: 'Absensi hanya dapat dilakukan mulai pukul 6 pagi'
    });
  }

  req.isLate = (hour > ATTENDANCE_LATE_HOUR) || 
               (hour === ATTENDANCE_LATE_HOUR && now.getMinutes() > ATTENDANCE_LATE_MINUTE);

  next();
};

const checkLateStatus = (req, res, next) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  req.attendanceStatus = {
    isLate: (hour > ATTENDANCE_LATE_HOUR) || 
            (hour === ATTENDANCE_LATE_HOUR && minute > ATTENDANCE_LATE_MINUTE),
    time: {
      hour,
      minute
    }
  };

  next();
};

module.exports = {
  checkGeolocation,
  validatePhoto,
  checkTeacherOrStudent,
  checkAttendanceTime,
  checkLateStatus,
  ATTENDANCE_START_HOUR,
  ATTENDANCE_LATE_HOUR,
  ATTENDANCE_LATE_MINUTE
};