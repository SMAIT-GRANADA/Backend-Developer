const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  try {
    // Clean up existing data
    await prisma.newsMedia.deleteMany();
    await prisma.news.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.salarySlip.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.studentPoint.deleteMany();
    await prisma.academicRecord.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.superAdmin.deleteMany();
    await prisma.token.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.staff.deleteMany();

    // Data Staff
    const staffData = [
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC011238.webp?updatedAt=1737227693278",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC288.webp?updatedAt=1737227692822",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0131900.webp?updatedAt=1737227690617",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0127134.webp?updatedAt=1737227687042",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC012830.webp?updatedAt=1737227686998",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC012031.webp?updatedAt=1737227686951",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC012522.webp?updatedAt=1737227686912",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0124223.webp?updatedAt=1737227686871",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0121234.webp?updatedAt=1737227686787",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0112293.webp?updatedAt=1737227686707",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC019231.webp?updatedAt=1737227686653",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC013103.webp?updatedAt=1737227686671",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0112297.webp?updatedAt=1737227685346",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC012.webp?updatedAt=1737226372561",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC06.webp?updatedAt=1737226372541",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC12.webp?updatedAt=1737226372158",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DS1179.webp?updatedAt=1737226371944",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC011.webp?updatedAt=1737226371931",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC4.webp?updatedAt=1737226371900",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC00.webp?updatedAt=1737226371667",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DS204.webp?updatedAt=1737226371424",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC01.webp?updatedAt=1737226368096",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/D3.webp?updatedAt=1737226363412",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0122.webp?updatedAt=1737226363375",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC01112.webp?updatedAt=1737226363479",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC015.webp?updatedAt=1737226363477",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC266.webp?updatedAt=1737226363274",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC0206.webp?updatedAt=1737226363014",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DS.webp?updatedAt=1737226362754",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/12.webp?updatedAt=1737226362700",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/1.webp?updatedAt=1737226362683",
      },
      {
        name: "Wahyu",
        position: "Bimbingan Konseling",
        imageUrl:
          "https://ik.imagekit.io/wahyup/Foto%20Guru%20SMA%20IT%20Granada/DSC061.webp?updatedAt=1737226362586",
      },
    ];  
    await Promise.all(
      staffData.map(data => 
        prisma.staff.create({
          data: {
            name: data.name,
            position: data.position,
            imageUrl: data.imageUrl
          }
        })
      )
    );

    // Create Roles
    const roles = await Promise.all([
      prisma.role.create({
        data: {
          name: 'superadmin',
          description: 'Super Administrator with full access'
        }
      }),
      prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator with limited access'
        }
      }),
      prisma.role.create({
        data: {
          name: 'guru',
          description: 'Teacher role'
        }
      }),
      prisma.role.create({
        data: {
          name: 'ortu',
          description: 'Parent role'
        }
      }),
      prisma.role.create({
        data: {
          name: 'siswa',
          description: 'Student role'
        }
      })
    ]);
    const superAdminUser = await prisma.user.create({
      data: {
        username: 'superadmin',
        password: await hashPassword('superadmin123'),
        name: 'Super Admin',
        email: 'superadmin@granada.sch.id',
        roles: {
          create: {
            roleId: roles[0].id
          }
        }
      }
    });

    // Create SuperAdmin record
    const superAdmin = await prisma.superAdmin.create({
      data: {
        userId: superAdminUser.id
      }
    });

    // Create Admin User dengan password yang di-hash
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: await hashPassword('admin123'),
        name: 'Admin User',
        email: 'admin@granada.sch.id',
        roles: {
          create: {
            roleId: roles[1].id
          }
        }
      }
    });

    // Create Teacher Users dengan password yang di-hash
    const teachers = await Promise.all([
      prisma.user.create({
        data: {
          username: 'guru1',
          password: await hashPassword('guru123'),
          name: 'Ahmad Teacher',
          email: 'ahmad@granada.sch.id',
          roles: {
            create: {
              roleId: roles[2].id
            }
          }
        }
      }),
      prisma.user.create({
        data: {
          username: 'guru2',
          password: await hashPassword('guru123'),
          name: 'Siti Teacher',
          email: 'siti@granada.sch.id',
          roles: {
            create: {
              roleId: roles[2].id
            }
          }
        }
      })
    ]);

    // Create Student Users dengan password yang di-hash
    const students = await Promise.all([
      prisma.user.create({
        data: {
          username: 'siswa1',
          password: await hashPassword('siswa123'),
          name: 'Deni Student',
          email: 'deni@student.granada.sch.id',
          roles: {
            create: {
              roleId: roles[4].id
            }
          }
        }
      }),
      prisma.user.create({
        data: {
          username: 'siswa2',
          password: await hashPassword('siswa123'),
          name: 'Rina Student',
          email: 'rina@student.granada.sch.id',
          roles: {
            create: {
              roleId: roles[4].id
            }
          }
        }
      })
    ]);

    // Create Sample News
    const news = await prisma.news.create({
      data: {
        title: 'Pengumuman Tahun Ajaran Baru',
        description: 'Selamat datang di tahun ajaran baru 2024/2025',
        superAdminId: superAdmin.id,
        isPublished: true,
        publishedAt: new Date(),
        media: {
          create: {
            mediaType: 'image',
            mediaUrl: '/uploads/news/welcome-2024.jpg'
          }
        }
      }
    });

    // Create Sample Quotes
    await prisma.quote.create({
      data: {
        content: 'Pendidikan adalah kunci masa depan yang lebih baik',
        superAdminId: superAdmin.id,
        isActive: true
      }
    });

    // Create Sample Attendance Records dengan tanggal yang lebih realistis
    const today = new Date();
    await Promise.all(
      teachers.map(teacher =>
        prisma.attendance.create({
          data: {
            userId: teacher.id,
            checkInTime: new Date(today.setHours(7, 30, 0)), // Set waktu masuk jam 7:30
            checkInPhotoUrl: '/uploads/attendance/checkin.jpg',
            checkInLatitude: -0.457833,
            checkInLongitude: 117.1259754,
            checkOutTime: new Date(today.setHours(16, 0, 0)), // Set waktu pulang jam 16:00
            checkOutPhotoUrl: '/uploads/attendance/checkout.jpg',
            checkOutLatitude: -0.457833,
            checkOutLongitude: 117.1259754,
            status: 'hadir',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      )
    );

    // Create Sample Student Points
    await Promise.all(
      students.map(student =>
        prisma.studentPoint.create({
          data: {
            studentId: student.id,
            points: 100,
            description: 'Poin awal semester',
            teacherId: teachers[0].id
          }
        })
      )
    );

    // Create Sample Academic Records
    await Promise.all(
      students.map(student =>
        prisma.academicRecord.create({
          data: {
            studentId: student.id,
            semester: 'Ganjil',
            academicYear: '2024/2025',
            grades: {
              matematika: 85,
              bahasaIndonesia: 88,
              bahasaInggris: 90
            }
          }
        })
      )
    );

    // Create Sample Salary Slips dengan periode yang lebih realistis
    const currentMonth = new Date();
    await Promise.all(
      teachers.map(teacher =>
        prisma.salarySlip.create({
          data: {
            teacherId: teacher.id,
            slipImageUrl: '/uploads/salary/slip-januari-2024.pdf',
            period: currentMonth,
            uploadedBy: adminUser.id
          }
        })
      )
    );

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();