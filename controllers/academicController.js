const academicService = require('../services/academicService');

async function createAcademicRecord(req, res) {
  try {
    const { studentId, semester, academicYear, grades } = req.body;

    if (!studentId || !semester || !academicYear || !grades) {
      return res.status(400).json({
        status: false,
        message: 'Semua field harus diisi'
      });
    }

    // Format tahun akademik YYYY/YYYY
    if (!/^\d{4}\/\d{4}$/.test(academicYear)) {
      return res.status(400).json({
        status: false,
        message: 'Format tahun akademik tidak valid (YYYY/YYYY)'
      });
    }

    // Validasi semester
    if (!['Ganjil', 'Genap'].includes(semester)) {
      return res.status(400).json({
        status: false,
        message: 'Semester harus Ganjil atau Genap'
      });
    }

    const result = await academicService.createAcademicRecord(req.body);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in createAcademicRecord controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function getAcademicRecords(req, res) {
  try {
    const userRole = req.session.user.roles[0];
    const userId = req.session.user.id;
    
    const filters = {
      studentId: req.query.studentId,
      semester: req.query.semester,
      academicYear: req.query.academicYear
    };

    const result = await academicService.getAcademicRecords(filters, userRole, userId);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAcademicRecords controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function getAcademicRecordById(req, res) {
  try {
    const { id } = req.params;
    const userRole = req.session.user.roles[0];
    const userId = req.session.user.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const result = await academicService.getAcademicRecordById(id, userRole, userId);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAcademicRecordById controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function updateAcademicRecord(req, res) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const result = await academicService.updateAcademicRecord(id, req.body);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in updateAcademicRecord controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function deleteAcademicRecord(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const result = await academicService.deleteAcademicRecord(id);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteAcademicRecord controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  createAcademicRecord,
  getAcademicRecords,
  getAcademicRecordById,
  updateAcademicRecord,
  deleteAcademicRecord
};