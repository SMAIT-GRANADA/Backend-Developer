const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createNews(data, files) {
  try {
    const news = await prisma.news.create({
      data: {
        title: data.title,
        description: data.description,
        superAdminId: data.superAdminId,
        isPublished: data.isPublished || false,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    if (files && files.length > 0) {
      const mediaPromises = files.map((file) => {
        return prisma.newsMedia.create({
          data: {
            newsId: news.id,
            mediaType: file.mimetype.startsWith("image/") ? "image" : "video",
            mediaUrl: file.path,
          },
        });
      });

      await Promise.all(mediaPromises);
    }

    return {
      status: true,
      message: "Berita berhasil dibuat",
      data: news,
    };
  } catch (error) {
    console.error("Error in createNews service:", error);
    return {
      status: false,
      message: "Gagal membuat berita",
    };
  }
}

module.exports = {
  createNews,
};
