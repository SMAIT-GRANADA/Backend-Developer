const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { isSuperAdmin } = require('../middlewares/authMiddleware');

// Public route
router.get('/quotes', quoteController.getAllQuotes);

// SuperAdmin only routes
router.post('/quotes', isSuperAdmin, quoteController.createQuote);
router.put('/quotes/:id', isSuperAdmin, quoteController.updateQuote);
router.delete('/quotes/:id', isSuperAdmin, quoteController.deleteQuote);

module.exports = router;