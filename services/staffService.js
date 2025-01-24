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

    let pageNum = parseInt(page);
    let limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
    
    const skip = (pageNum - 1) * limitNum;
    
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
        take: limitNum,
        where,
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" }
        ],
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

    const totalPages = Math.ceil(totalData / limitNum);

    return {
      status: true,
      message: "Data staff berhasil diambil",
      data: staff,
      meta: {
        currentPage: pageNum,
        totalPages,
        totalData,
        dataPerPage: limitNum
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