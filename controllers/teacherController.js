const teacherService = require('../services/teacherService');

async function getAllTeachers(req, res) {
  try {
    const result = await teacherService.getAllTeachers(req.user.id);

    if (!result.status) {
      return res.status(403).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllTeachers controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  getAllTeachers
};