const newsService = require("../services/newsService");

async function getAllNews(req, res) {
  try {
    const result = await newsService.getAllNews(req.query);
    if (!result) {
      return res.status(500).json({
        status: false,
        message: "Gagal mengambil data berita" 
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAllNews controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

async function getNewsById(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "ID tidak valid"
      });
    }

    const result = await newsService.getNewsById(id, req.user || null);

    if (!result || !result.status) {
      return res.status(404).json({
        status: false,
        message: "Berita tidak ditemukan"
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getNewsById controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

async function createNews(req, res) {
  try {
    const { title, description, isPublished } = req.body;
    const files = req.files;

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Judul berita harus diisi"
      });
    }

    const result = await newsService.createNews({
      title,
      description,
      superAdminId: req.user.id,
      isPublished: isPublished === "true" || isPublished === true
    }, files);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in createNews controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

async function updateNews(req, res) {
  try {
    const { id } = req.params;
    const { title, description, isPublished } = req.body;
    const files = req.files;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "ID tidak valid"
      });
    }

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Judul berita harus diisi"
      });
    }

    const result = await newsService.updateNews(id, {
      title,
      description,
      isPublished: isPublished === "true" || isPublished === true
    }, files);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateNews controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

async function deleteNews(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "ID tidak valid"
      });
    }

    const result = await newsService.deleteNews(id);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in deleteNews controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

async function deleteNewsMedia(req, res) {
  try {
    const { mediaId } = req.params;

    if (!mediaId || isNaN(mediaId)) {
      return res.status(400).json({
        status: false,
        message: "ID media tidak valid"
      });
    }

    const result = await newsService.deleteNewsMedia(mediaId);

    if (!result.status) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in deleteNewsMedia controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  deleteNewsMedia
};