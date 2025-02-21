const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { 
  checkAuth, 
  isTeacher, 
  isSuperAdmin,
  isTeacherOrSuperAdmin 
} = require('../middlewares/authMiddleware');
const { 
  checkGeolocation,
  validatePhoto,
  checkTeacherOrStudent,
  checkAttendanceTime
} = require('../middlewares/attendanceMiddleware');

router.use(checkAuth);

// Check-in route (guru & siswa)
router.post('/attendance/check-in',
  checkTeacherOrStudent,
  validatePhoto,
  checkGeolocation,
  checkAttendanceTime,
  attendanceController.checkIn
);

router.post('/attendance/check-out',
  isTeacher,
  validatePhoto,
  checkGeolocation,
  attendanceController.checkOut
);

router.get('/attendance/today',
  checkTeacherOrStudent,
  attendanceController.getTodayStatus
);

router.get('/attendance/history',
  checkTeacherOrStudent,
  attendanceController.getOwnHistory
);

// Get attendance history for specific user (admin/teacher access)
router.get('/attendance/user/:userId/history',
  isTeacherOrSuperAdmin,
  attendanceController.getUserHistory
);

router.get('/attendance/report',
  isTeacherOrSuperAdmin,
  attendanceController.getAttendanceReport
);

router.delete('/attendance/:id',
  isSuperAdmin,
  attendanceController.deleteAttendance
);

router.get('/attendance/statistics',
  isTeacherOrSuperAdmin,
  attendanceController.getStatistics
);

router.get('/attendance/export',
  isTeacherOrSuperAdmin,
  attendanceController.exportAttendance
);

router.put('/attendance/:id',
  isSuperAdmin,
  attendanceController.updateAttendanceRecord
);

module.exports = router;