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

async function getPoints(userRole, userId) {
  try {
    if (userRole === 'ortu') {
      const parentStudents = await prisma.student.findMany({
        where: {
          parentId: userId,
          isActive: true
        }
      });

      if (parentStudents.length === 0) {
        return {
          status: false,
          message: 'Tidak ditemukan data siswa terkait'
        };
      }

      // Ambil point hanya untuk siswa yang merupakan anak dari orang tua tersebut
      const points = await prisma.studentPoint.findMany({
        where: {
          studentId: {
            in: parentStudents.map(student => student.id)
          }
        },
        include: {
          student: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      const transformedPoints = points.map(point => ({
        id: point.id,
        points: point.points,
        description: point.description,
        studentName: point.student.name,
        className: point.student.className
      }));

      return {
        status: true,
        message: 'Data point berhasil diambil',
        data: transformedPoints
      };
    } 
    else {
      const points = await prisma.studentPoint.findMany({
        include: {
          student: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const transformedPoints = points.map(point => ({
        id: point.id,
        points: point.points,
        description: point.description,
        studentName: point.student.name,
        className: point.student.className
      }));

      return {
        status: true,
        message: 'Data point berhasil diambil',
        data: transformedPoints
      };
    }
  } catch (error) {
    console.error('Error in getPoints:', error);
    return {
      status: false,
      message: 'Terjadi kesalahan saat mengambil data point'
    };
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