const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { checkAuth, pointAccess } = require('../middlewares/authMiddleware');

router.use(checkAuth);

router.post('/points', pointAccess('create'), pointController.createPoint);
router.get('/points', pointAccess('read'), pointController.getPoints);
router.put('/points/:id', pointAccess('update'),pointController.updatePoint);
router.delete('/points/:id', pointAccess('delete'), pointController.deletePoint);

module.exports = router;