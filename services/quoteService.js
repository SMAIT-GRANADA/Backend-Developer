const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSuperAdminByUserId(userId) {
  return await prisma.superAdmin.findFirst({
    where: {
      userId: userId
    }
  });
}

async function createQuote(quoteData) {
  try {
    const newQuote = await prisma.quote.create({
      data: {
        content: quoteData.content,
        superAdminId: quoteData.superAdminId,
        isActive: true
      },
      include: {
        superAdmin: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    return newQuote;
  } catch (error) {
    throw error;
  }
}

async function getAllQuotes(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const random = req.query.random === 'true';
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: false,
        message: 'Page dan limit harus lebih besar dari 0'
      });
    }

    const safeLimit = Math.min(limit, 100);

    const result = await quoteService.getAllQuotes(page, safeLimit, random);

    return res.json({
      status: true,
      message: 'Data quote berhasil diambil',
      data: result.data,
      meta: result.meta
    });

  } catch (error) {
    console.error('Get all quotes error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}
async function updateQuote(id, quoteData) {
  try {
    const existingQuote = await prisma.quote.findUnique({
      where: { id: Number(id) }
    });

    if (!existingQuote) {
      throw new Error('Quote tidak ditemukan');
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: Number(id) },
      data: {
        content: quoteData.content,
        isActive: quoteData.isActive
      },
      include: {
        superAdmin: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return updatedQuote;
  } catch (error) {
    throw error;
  }
}

async function deleteQuote(id) {
  try {
    const existingQuote = await prisma.quote.findUnique({
      where: { id: Number(id) }
    });

    if (!existingQuote) {
      throw new Error('Quote tidak ditemukan');
    }

    await prisma.quote.delete({
      where: { id: Number(id) }
    });

    return { message: 'Quote deleted successfully' };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getSuperAdminByUserId,
  createQuote,
  getAllQuotes,
  updateQuote,
  deleteQuote
};