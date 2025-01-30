const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllStudents(page, limit, search, className, hasParent) {
  try {
    const whereClause = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { className: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(className && { className }),
      ...(hasParent === 'true' && { parentId: { not: null } }),
      ...(hasParent === 'false' && { parentId: null })
    };

    const skip = (page - 1) * limit;

    const [total, students] = await prisma.$transaction([
      prisma.student.count({ where: whereClause }),
      prisma.student.findMany({
        where: whereClause,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { className: 'asc' },
          { name: 'asc' }
        ]
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages
      }
    };

  } catch (error) {
    console.error('Get all students service error:', error);
    throw error;
  }
}

async function createBulkStudents(students) {
  try {
    const duplicateNames = students.map(s => s.name.toLowerCase());
    const hasDuplicates = new Set(duplicateNames).size !== duplicateNames.length;
    
    if (hasDuplicates) {
      return {
        status: false,
        message: 'Terdapat nama siswa yang sama dalam data'
      };
    }
    const existingStudents = await prisma.student.findMany({
      where: {
        name: {
          in: students.map(s => s.name),
          mode: 'insensitive'
        },
        isActive: true
      }
    });

    if (existingStudents.length > 0) {
      return {
        status: false,
        message: `Siswa dengan nama ${existingStudents.map(s => s.name).join(', ')} sudah terdaftar`
      };
    }

    const result = await prisma.$transaction(
      students.map(student =>
        prisma.student.create({
          data: {
            name: student.name,
            className: student.className,
            isActive: true
          }
        })
      )
    );

    return {
      status: true,
      message: `${result.length} siswa berhasil ditambahkan`,
      data: result
    };

  } catch (error) {
    console.error('Create bulk students service error:', error);
    throw error;
  }
}

async function updateClass(students) {
  try {
    const studentIds = students.map(s => Number(s.id));
    const existingStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        isActive: true
      }
    });

    if (existingStudents.length !== students.length) {
      const foundIds = existingStudents.map(s => s.id);
      const notFoundIds = studentIds.filter(id => !foundIds.includes(id));
      
      return {
        status: false,
        message: `Beberapa siswa tidak ditemukan atau tidak aktif: ID ${notFoundIds.join(', ')}`
      };
    }

    const result = await prisma.$transaction(
      students.map(student =>
        prisma.student.update({
          where: {
            id: Number(student.id)
          },
          data: {
            className: student.className
          },
          include: {
            parent: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
      )
    );

    return {
      status: true,
      message: `${result.length} siswa berhasil diperbarui kelasnya`,
      data: result
    };

  } catch (error) {
    console.error('Update class service error:', error);
    throw error;
  }
}

module.exports = {
  getAllStudents,
  createBulkStudents,
  updateClass
};