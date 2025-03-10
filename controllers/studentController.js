const studentService = require('../services/studentService');

async function getAllStudents(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const className = req.query.className;
    const hasParent = req.query.hasParent;

    const result = await studentService.getAllStudents(page, limit, search, className, hasParent);

    return res.json({
      status: true,
      message: 'Data siswa berhasil diambil',
      data: result.data,
      meta: result.meta
    });

  } catch (error) {
    console.error('Get all students error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function createBulkStudents(req, res) {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Data siswa tidak valid'
      });
    }
    for (const student of students) {
      if (!student.nisn || !student.name || !student.className) {
        return res.status(400).json({
          status: false,
          message: 'NISN, nama, dan kelas siswa harus diisi'
        });
      }
      if (!/^\d{10}$/.test(student.nisn)) {
        return res.status(400).json({
          status: false,
          message: `NISN ${student.nisn} tidak valid. NISN harus 10 digit angka`
        });
      }
    }
    const result = await studentService.createBulkStudents(students);
    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    console.error('Create bulk students error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function updateStudents(req, res) {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Data siswa tidak valid'
      });
    }

    for (const student of students) {
      if (!student.id || isNaN(Number(student.id))) {
        return res.status(400).json({
          status: false,
          message: 'ID siswa tidak valid'
        });
      }
      if (!student.className && !student.name && 
          student.isActive === undefined && !student.parentId &&
          !student.nisn) {
        return res.status(400).json({
          status: false,
          message: 'Minimal satu field harus diisi untuk update (kelas, nama, status, NISN, atau orang tua)'
        });
      }
      if (student.nisn && !/^\d{10}$/.test(student.nisn)) {
        return res.status(400).json({
          status: false,
          message: `NISN ${student.nisn} tidak valid. NISN harus 10 digit angka`
        });
      }
      if (student.parentId !== undefined && 
          student.parentId !== null && 
          isNaN(Number(student.parentId))) {
        return res.status(400).json({
          status: false,
          message: 'ID orang tua tidak valid'
        });
      }
    }

    const result = await studentService.updateStudents(students);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.json(result);

  } catch (error) {
    console.error('Update students error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  getAllStudents,
  createBulkStudents,
  updateStudents
};