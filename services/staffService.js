const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAllStaff(queryParams = {}) {
  try {
    let { 
      page = 1, 
      limit = 4,
      search = "",
      position = "" 
    } = queryParams;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 4;
    
    const skip = (page - 1) * limit;
    
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

    const [staff, totalData] = await Promise.all([
      prisma.staff.findMany({
        skip,
        take: limit,
        where,
        orderBy: [
          { order: "asc" },
          { id: "asc" }
        ],
        select: {
          id: true,
          name: true,
          position: true,
          imageUrl: true,
          order: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.staff.count({ where })
    ]);

    const totalPages = Math.ceil(totalData / limit);

    return {
      status: true,
      message: "Data staff berhasil diambil",
      data: staff,
      meta: {
        currentPage: page,
        totalPages,
        totalData,
        dataPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
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