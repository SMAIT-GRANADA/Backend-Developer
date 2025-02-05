const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { checkAuth, isSuperAdmin, isTeacherOrSuperAdmin } = require('../middlewares/authMiddleware');

router.use(checkAuth);

router.get('/students', isTeacherOrSuperAdmin, studentController.getAllStudents);
router.post('/students/bulk', isSuperAdmin, studentController.createBulkStudents);
router.put('/students/class', isSuperAdmin, studentController.updateStudents);

module.exports = router;