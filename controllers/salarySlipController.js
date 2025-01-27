const salarySlipService = require('../services/salarySlipService');

async function createSalarySlip(req, res) {
  try {
    const { teacherId, period } = req.body;
    const fileBase64 = req.file ? 
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : 
      null;

    if (!teacherId || !period || !fileBase64) {
      return res.status(400).json({
        status: false,
        message: 'Semua field harus diisi'
      });
    }

    // Validasi format periode (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        status: false,
        message: 'Format periode tidak valid (YYYY-MM)'
      });
    }

    const result = await salarySlipService.createSalarySlip({
      teacherId: parseInt(teacherId),
      period,
      fileBase64
    }, req.user.id);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in createSalarySlip controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function getSalarySlips(req, res) {
  try {
    const userRole = req.user.roles[0];
    const result = await salarySlipService.getSalarySlips(req.user.id, userRole);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getSalarySlips controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function updateSalarySlip(req, res) {
  try {
    const { id } = req.params;
    const { period } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        status: false,
        message: 'Format periode tidak valid (YYYY-MM)'
      });
    }

    const fileBase64 = req.file ? 
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : 
      null;

    const result = await salarySlipService.updateSalarySlip(id, {
      period,
      fileBase64
    });

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in updateSalarySlip controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function deleteSalarySlip(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const result = await salarySlipService.deleteSalarySlip(id);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteSalarySlip controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  createSalarySlip,
  getSalarySlips,
  updateSalarySlip,
  deleteSalarySlip
};