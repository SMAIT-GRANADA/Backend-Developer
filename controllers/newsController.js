const newsService = require("../services/newsService");

async function createNews(req, res) {
  try {
    const { title, description, isPublished } = req.body;
    const files = req.files;

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Judul berita harus diisi",
      });
    }

    const result = await newsService.createNews(
      {
        title,
        description,
        superAdminId: req.session.user.id,
        isPublished: isPublished === "true" || isPublished === true,
      },
      files
    );

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in createNews controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server",
    });
  }
}

module.exports = {
  createNews,
};
