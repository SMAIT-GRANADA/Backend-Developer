const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllStudents(page, limit, search, className, hasParent) {
  try {
    const whereClause = {
      isActive: true,
      ...(search && {
        OR: [
          { nisn: { contains: search, mode: 'insensitive' } },
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
      status: true,
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
    const duplicateNISNs = students.map(s => s.nisn);
    const hasDuplicates = new Set(duplicateNISNs).size !== duplicateNISNs.length;
    
    if (hasDuplicates) {
      return {
        status: false,
        message: 'Terdapat NISN yang sama dalam data'
      };
    }

    const existingStudents = await prisma.student.findMany({
      where: {
        nisn: {
          in: students.map(s => s.nisn)
        },
        isActive: true
      }
    });

    if (existingStudents.length > 0) {
      return {
        status: false,
        message: `Siswa dengan NISN ${existingStudents.map(s => s.nisn).join(', ')} sudah terdaftar`
      };
    }

    const result = await prisma.$transaction(
      students.map(student =>
        prisma.student.create({
          data: {
            nisn: student.nisn,
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

async function updateStudents(students) {
  try {
    const validatedStudents = students.map(student => ({
      ...student,
      id: Number(student.id),
      parentId: student.parentId ? Number(student.parentId) : null
    }));

    const studentIds = validatedStudents.map(s => s.id);

    const existingStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds }
      },
      include: {
        parent: true
      }
    });

    if (existingStudents.length !== validatedStudents.length) {
      const foundIds = existingStudents.map(s => s.id);
      const notFoundIds = studentIds.filter(id => !foundIds.includes(id));
      
      return {
        status: false,
        message: `Beberapa siswa tidak ditemukan: ID ${notFoundIds.join(', ')}`
      };
    }
    const newNisns = validatedStudents
      .filter(s => s.nisn)
      .map(s => s.nisn);
    
    if (newNisns.length > 0) {
      const existingNisns = await prisma.student.findMany({
        where: {
          nisn: { in: newNisns },
          id: { notIn: studentIds },
          isActive: true
        }
      });

      if (existingNisns.length > 0) {
        return {
          status: false,
          message: `NISN ${existingNisns.map(s => s.nisn).join(', ')} sudah digunakan oleh siswa lain`
        };
      }
    }
    if (validatedStudents.some(s => s.parentId)) {
      const parentIds = validatedStudents
        .map(s => s.parentId)
        .filter(id => id !== null);
      
      const existingParents = await prisma.user.findMany({
        where: {
          id: { in: parentIds }
        }
      });

      if (existingParents.length !== new Set(parentIds).size) {
        const foundParentIds = existingParents.map(p => p.id);
        const invalidParentIds = parentIds.filter(id => !foundParentIds.includes(id));
        
        return {
          status: false,
          message: `Beberapa ID orang tua tidak valid: ${invalidParentIds.join(', ')}`
        };
      }
    }
    const result = await prisma.$transaction(
      validatedStudents.map(student => {
        const existingStudent = existingStudents.find(es => es.id === student.id);
        const updateData = {
          ...(student.className && { className: student.className }),
          ...(student.name && { name: student.name }),
          ...(student.nisn && { nisn: student.nisn }),
          ...(student.isActive !== undefined && { isActive: student.isActive }),
          parentId: student.parentId !== undefined ? student.parentId : existingStudent.parentId
        };

        return prisma.student.update({
          where: {
            id: student.id
          },
          data: updateData,
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true
              }
            }
          }
        });
      })
    );

    return {
      status: true,
      message: `${result.length} siswa berhasil diperbarui`,
      data: result
    };

  } catch (error) {
    console.error('Update students service error:', error);
    if (error.code === 'P2002') {
      return {
        status: false,
        message: 'NISN sudah digunakan oleh siswa lain'
      };
    }
    if (error.code === 'P2003') {
      return {
        status: false,
        message: 'ID orang tua yang diberikan tidak valid'
      };
    }
    throw error;
  }
}

module.exports = {
  getAllStudents,
  createBulkStudents,
  updateStudents
};