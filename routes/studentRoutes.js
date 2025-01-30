const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { checkAuth, isSuperAdmin } = require('../middlewares/authMiddleware');

router.use(checkAuth);
router.use(isSuperAdmin);

router.get('/students', studentController.getAllStudents);
router.post('/students/bulk', studentController.createBulkStudents);
router.put('/students/class', studentController.updateClass);

module.exports = router;