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

    if (files && files.media) {
      const mediaFiles = Array.isArray(files.media)
        ? files.media
        : [files.media];

      const mediaPromises = mediaFiles.map((file) => {
        return prisma.newsMedia.create({
          data: {
            newsId: news.id,
            mediaType: file.mimetype.startsWith("image/") ? "image" : "video",
            mediaUrl: file.path.replace(/\\/g, "/"),
          },
        });
      });

      await Promise.all(mediaPromises);
    }

    const createdNews = await prisma.news.findUnique({
      where: { id: news.id },
      include: {
        media: true,
      },
    });

    return {
      status: true,
      message: "Berita berhasil dibuat",
      data: createdNews,
    };
  } catch (error) {
    console.error("Error in createNews service:", error);
    return {
      status: false,
      message: error.message || "Gagal membuat berita",
    };
  }
}

async function getAllNews(queryParams = {}) {
  try {
    const { page = 1, limit = 10 } = queryParams;
    const skip = (page - 1) * Number(limit);

    const where = { isPublished: true };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        skip,
        take: Number(limit),
        where,
        include: {
          media: true,
          superAdmin: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.news.count({ where }),
    ]);

    return {
      status: true,
      data: news,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  } catch (error) {
    console.error("Error in getAllNews service:", error);
    return {
      status: false,
      message: "Gagal mengambil data berita",
    };
  }
}

async function getNewsById(id, user = null) {
  try {
    const news = await prisma.news.findUnique({
      where: { id: Number(id) },
      include: {
        media: true,
        superAdmin: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!news) {
      return {
        status: false,
        message: "Berita tidak ditemukan",
      };
    }
    if (!user && !news.isPublished) {
      return {
        status: false,
        message: "Berita tidak ditemukan",
      };
    }

    return {
      status: true,
      data: news,
    };
  } catch (error) {
    console.error("Error in getNewsById service:", error);
    return {
      status: false,
      message: "Gagal mengambil detail berita",
    };
  }
}

async function updateNews(id, data, files) {
  try {
    const existingNews = await prisma.news.findUnique({
      where: { id: Number(id) },
      include: { media: true },
    });

    if (!existingNews) {
      return {
        status: false,
        message: "Berita tidak ditemukan",
      };
    }

    const updatedNews = await prisma.news.update({
      where: { id: Number(id) },
      data: {
        title: data.title,
        description: data.description,
        isPublished: data.isPublished || false,
        publishedAt: data.isPublished ? new Date() : null,
      },
      include: { media: true },
    });

    if (files && files.media) {
      const mediaFiles = Array.isArray(files.media)
        ? files.media
        : [files.media];
      const mediaPromises = mediaFiles.map((file) => {
        return prisma.newsMedia.create({
          data: {
            newsId: updatedNews.id,
            mediaType: file.mimetype.startsWith("image/") ? "image" : "video",
            mediaUrl: file.path.replace(/\\/g, "/"),
          },
        });
      });

      await Promise.all(mediaPromises);
    }

    const finalNews = await prisma.news.findUnique({
      where: { id: Number(id) },
      include: { media: true },
    });

    return {
      status: true,
      message: "Berita berhasil diperbarui",
      data: finalNews,
    };
  } catch (error) {
    console.error("Error in updateNews service:", error);
    return {
      status: false,
      message: "Gagal memperbarui berita",
    };
  }
}

async function deleteNews(id) {
  try {
    const existingNews = await prisma.news.findUnique({
      where: { id: Number(id) },
    });

    if (!existingNews) {
      return {
        status: false,
        message: "Berita tidak ditemukan",
      };
    }

    await prisma.newsMedia.deleteMany({
      where: { newsId: Number(id) },
    });

    await prisma.news.delete({
      where: { id: Number(id) },
    });

    return {
      status: true,
      message: "Berita berhasil dihapus",
    };
  } catch (error) {
    console.error("Error in deleteNews service:", error);
    return {
      status: false,
      message: "Gagal menghapus berita",
    };
  }
}

async function deleteNewsMedia(mediaId) {
  try {
    const media = await prisma.newsMedia.findUnique({
      where: { id: Number(mediaId) },
    });

    if (!media) {
      return {
        status: false,
        message: "Media tidak ditemukan",
      };
    }

    const deletedMedia = await prisma.newsMedia.delete({
      where: { id: Number(mediaId) },
    });

    return {
      status: true,
      message: "Media berita berhasil dihapus",
      data: deletedMedia,
    };
  } catch (error) {
    console.error("Error in deleteNewsMedia service:", error);
    return {
      status: false,
      message: "Gagal menghapus media berita",
    };
  }
}

module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  deleteNewsMedia,
};