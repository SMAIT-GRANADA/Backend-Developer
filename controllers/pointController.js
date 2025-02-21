const pointService = require('../services/pointService');

async function createPoint(req, res) {
  try {
    const { name, className, points, description } = req.body;
    const teacherId = req.user.id;

    if (!name || !className || !points || !description) {
      return res.status(400).json({
        status: false,
        message: 'Semua field harus diisi'
      });
    }

    const result = await pointService.createPoint({
      name,
      className,
      points,
      description,
      teacherId
    });

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in createPoint controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function getPoints(req, res) {
  try {
    const userRole = req.user.roles[0];
    const userId = req.user.id;
    
    const result = await pointService.getPoints(userRole, userId);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPoints controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function updatePoint(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const result = await pointService.updatePoint(id, req.body, teacherId);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in updatePoint controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function deletePoint(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const result = await pointService.deletePoint(id, teacherId);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in deletePoint controller:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  createPoint,
  getPoints,
  updatePoint,
  deletePoint
};