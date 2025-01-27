const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { checkAuth, pointAccess } = require('../middlewares/authMiddleware');

router.use(checkAuth);

router.post('/points', pointController.createPoint);
router.get('/points', pointController.getPoints);
router.put('/points/:id', pointController.updatePoint);
router.delete('/points/:id', pointController.deletePoint);

module.exports = router;