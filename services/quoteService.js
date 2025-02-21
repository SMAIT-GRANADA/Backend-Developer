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

async function getAllQuotes(page, limit, random) {
  const skip = (page - 1) * limit;
  
  let quotes;
  let total;
  
  if (random) {
    quotes = await prisma.quote.findMany({
      take: limit,
      orderBy: {
        id: 'desc'
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
  } else {
    quotes = await prisma.quote.findMany({
      skip,
      take: limit,
      orderBy: {
        id: 'desc'
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
    
    total = await prisma.quote.count();
  }
  
  return {
    data: quotes,
    meta: {
      page,
      limit,
      total: total || quotes.length
    }
  };
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