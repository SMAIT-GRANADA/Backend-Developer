const quoteService = require('../services/quoteService');

async function createQuote(req, res) {
  try {
    if (!req.body || !req.body.content) {
      return res.status(400).json({
        status: false,
        message: 'Konten quote harus diisi'
      });
    }
    
    const superAdmin = await quoteService.getSuperAdminByUserId(req.user.id);
    if (!superAdmin) {
      return res.status(403).json({
        status: false,
        message: 'Akses ditolak - User bukan superadmin'
      });
    }

    const result = await quoteService.createQuote({
      content: req.body.content,
      superAdminId: superAdmin.id
    });

    return res.status(201).json({
      status: true,
      message: 'Quote berhasil dibuat',
      data: result
    });

  } catch (error) {
    console.error('Create quote error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function getAllQuotes(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const random = req.query.random === 'true';

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: false,
        message: 'Page dan limit harus lebih besar dari 0'
      });
    }

    const safeLimit = Math.min(limit, 100);

    const result = await quoteService.getAllQuotes(page, safeLimit, random);

    return res.json({
      status: true,
      message: 'Data quote berhasil diambil',
      data: result.data,
      meta: result.meta
    });

  } catch (error) {
    console.error('Get all quotes error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function updateQuote(req, res) {
  try {
    const { id } = req.params;
    const { content, isActive } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const updatedQuote = await quoteService.updateQuote(Number(id), {
      content,
      isActive
    });

    return res.json({
      status: true,
      message: 'Quote berhasil diperbarui',
      data: updatedQuote
    });

  } catch (error) {
    console.error('Update quote error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: false,
        message: error.message
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function deleteQuote(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    await quoteService.deleteQuote(Number(id));

    return res.json({
      status: true,
      message: 'Quote berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete quote error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: false,
        message: error.message
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  createQuote,
  getAllQuotes,
  updateQuote,
  deleteQuote
};