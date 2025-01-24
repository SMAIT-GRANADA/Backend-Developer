const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkAuth } = require('../middlewares/authMiddleware');

router.post('/auth/login', userController.login);
router.post('/auth/logout', checkAuth, userController.logout);
router.post('/auth/forgot-password', userController.forgotPassword);
router.post('/auth/verify-otp', userController.verifyOtp);
router.post('/auth/reset-password', userController.resetPassword);

router.use(checkAuth);

router.post('/users', userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;