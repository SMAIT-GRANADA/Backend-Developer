const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { checkAuth, isTeacher } = require('../middlewares/authMiddleware');
const { 
  checkGeolocation,
  validatePhoto,
  validateAttendanceTime,
  checkTeacherOrStudent
} = require('../middlewares/attendanceMiddleware');

router.use(checkAuth);
router.use(checkTeacherOrStudent);

// Check-in route (guru & siswa)
router.post('/check-in',
  validatePhoto,
  checkGeolocation,
  validateAttendanceTime,
  attendanceController.checkIn
);

// Check-out route (guru only)
router.post('/check-out',
  isTeacher,
  validatePhoto,
  checkGeolocation,
  validateAttendanceTime,
  attendanceController.checkOut
);

module.exports = router;
