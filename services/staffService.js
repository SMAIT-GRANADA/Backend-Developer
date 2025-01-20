const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAllStaff(queryParams = {}) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "",
      position = "" 
    } = queryParams;
    
    const skip = (page - 1) * Number(limit);
    
    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          position: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (position) {
      where.position = {
        equals: position,
        mode: 'insensitive'
      };
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        skip,
        take: Number(limit),
        where,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          name: true,
          position: true,
          imageUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.staff.count({ where })
    ]);

    return {
      status: true,
      data: staff,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    console.error("Error in getAllStaff service:", error);
    return {
      status: false,
      message: "Gagal mengambil data staff"
    };
  }
}

module.exports = {
  getAllStaff
};