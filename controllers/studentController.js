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
      if (!student.name || !student.className) {
        return res.status(400).json({
          status: false,
          message: 'Nama dan kelas siswa harus diisi'
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

async function updateClass(req, res) {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Data siswa tidak valid'
      });
    }
    for (const student of students) {
      if (!student.id || !student.className) {
        return res.status(400).json({
          status: false,
          message: 'ID siswa dan kelas baru harus diisi'
        });
      }
    }

    const result = await studentService.updateClass(students);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.json(result);

  } catch (error) {
    console.error('Update class error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  getAllStudents,
  createBulkStudents,
  updateClass
};