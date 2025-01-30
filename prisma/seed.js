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
    await prisma.student.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.superAdmin.deleteMany();
    await prisma.token.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.staff.deleteMany();
    // Data Staff
    const staffData = [
      {
        name: "Abd.Wahab Syahrani, M.Pd.",
        position: "Kepala Sekolah",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/Abd.WahabSyahraniM.Pd.webp?updatedAt=1737604483592",
        order: 1
      },
      {
        name: "Muhammad Alhimni Rusdi, M.Pd.",
        position: "Waka Kurikulum",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/MuhammadAlhimniRusdiM.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604483938",
          order: 2
      },
      {
        name: "Agus Salim Razak, S.Pd.",
        position: "Waka Kesiswaan",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AgusSalimRazakS.Pd.webp?updatedAt=1737604483062",
          order: 3
      },
      {
        name: "Andriansyah, SE.",
        position: "Bendahara",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AndriansyahSE.webp?updatedAt=1737604483634",
          order: 4
      },
      {
        name: "Luthfi Hernumurti, SE.",
        position: "Koordinator BPI",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/LuthfiHernumurtiSE_-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604489545",
          order: 5
      },
      {
        name: "Zunaydi, S.Pd.",
        position: "Guru",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/ZunaydiS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604483280",
          order: 6
      },
      {
        name: "Mashudi S.Pd.",
        position: "Koordinator Ruang Musik",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/MashudiS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604489816",
          order: 7
      },
      {
        name: "Ali Ibnu Sholih, S.Pd.",
        position: "Koordinator Sarpras",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AliIbnuSholihS.Pd.webp?updatedAt=1737604483324",
          order: 8
      },
      {
        name: "Didin Wahyudin, S.Pd.I.",
        position: "Pembina Pramuka",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/DidinWahyudinS.Pd.I.webp?updatedAt=1737604488408",
          order: 9
      },
      {
        name: "Lingga Pramana Putra, S.Psi.",
        position: "Guru BK Putra",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/LinggaPramanaPutraS.Psi.webp?updatedAt=1737604489468",
          order: 10
      },
      {
        name: "Jumri Raisi Sabe, S.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/JumriRaisiSabeS.Pd.webp?updatedAt=1737604489738",
          order: 11
      },
      {
        name: "Harish Jundana, S.Hut.",
        position: "Pembina BEST Putra",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/HarishJundanaS.Hut.webp?updatedAt=1737604489183",
          order: 12
      },
      {
        name: "Baruna Hardiantoro, S.S.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/BarunaHardiantoroS.S.webp?updatedAt=1737604488312",
          order: 13
      },
      {
        name: "Luqman Santoso, M.Pd",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/LuqmanSantosoM.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604489733",
          order: 14
      },
      {
        name: "Muhammad Afif AlHaq, BA.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/MuhammadAfifAlHaqBA_-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604483390",
          order: 15
      },
      {
        name: "Muhammad Nur Aini, S.Pd.",
        position: "Koordinator Perpustakaan",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/MuhammadNurAiniS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604483943",
          order: 16
      },
      {
        name: "Muhammad Arnurzami, S.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/MuhammadArnurzamiS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737604483442",
          order: 17
      },
      {
        name: "Alexandrean, S.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AlexandreanS.Pd.webp?updatedAt=1737604483454",
          order: 18
      },
      {
        name: "Fachrul Hadi, S.Kom.",
        position: "Koordinator Lab Multimedia",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/FachrulHadiS.Kom.webp?updatedAt=1737604488746",
          order: 19
      },
      {
        name: "Tanti Yoshefa, SP.",
        position: "Kepala TU",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/TantiYoshefaSP-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664701",
          order: 20
      },
      {
        name: "Miftahul Janah, S.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/MiftahulJanahS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664996",
          order: 21
      },
      {
        name: "Diah Rahmi Sari, S.HI. M.Pd.",
        position: "Koordinator UKS",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/DiahRahmiSariS.HI.M.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664915",
          order: 22
      },
      {
        name: "Ayu Paramita Rizkhi Handayani, S.Pd.",
        position: "Pembina BEST Putri",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AyuParamitaRizkhiHandayaniS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664710",
          order: 23
      },
      {
        name: "Recha Ammassa Ramadhani, S.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/RechaAmmassaRamadhaniS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664813",
          order: 24
      },
      {
        name: "Riska Tri Wulandari, S.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/RiskaTriWulandariS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664678",
          order: 25
      },
      {
        name: "Rochima, S.Kep.Ners.",
        position: "Koordinator Tahfidz",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/RochimaS.Kep.Ners-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911669846",
          order: 26
      },
      {
        name: "Farraz Ainun Fadhilla, M.H.",
        position: "Koordinator Takhosus",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/FarrazAinunFadhillaM.H-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664792",
          order: 27
      },
      {
        name: "Riski Vitria Ningsih, S.Psi.",
        position: "Guru BK Putri",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/RiskiVitriaNingsihS.Psi-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911669706",
          order: 28
      },
      {
        name: "Susi Susanti, S.Pd.",
        position: "Koordinator Kompetisi",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/SusiSusantiS.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911669882",
          order: 29
      },
      {
        name: "Nur Rasyidatul Muqit Telda, M.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/NurRasyidatulMuqitTelda.M.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664974",
          order: 30
      },
      {
        name: "Aidha Siti Khadijah, M.Pd.",
        position: "Staf TU",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AidhaSitiKhadijahM.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664592",
          order: 31
      },
      {
        name: "Al Mujahidatur Rifqiyah Al Ahmadi, Lc.M.Pd.",
        position: "Wali Kelas",
        imageUrl:
          "https://ik.imagekit.io/smaitgranada/Foto%20Guru%20SMA%20IT%20Granada/AlMujahidaturRifqiyahAlAhmadiLc.M.Pd-ezgif.com-jpg-to-webp-converter.webp?updatedAt=1737911664908",
          order: 32
      },
    ];  
    await Promise.all(
      staffData.map((data, index) => 
        prisma.staff.create({
          data: {
            name: data.name,
            position: data.position,
            imageUrl: data.imageUrl,
            order: index + 1
          }
        })
      )
    );

  // Create Roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        id: 1,
        name: 'superadmin',
        description: 'Super Administrator with full access'
      }
    }),
    prisma.role.create({
      data: {
        id: 2,
        name: 'admin',
        description: 'Administrator with limited access'
      }
    }),
    prisma.role.create({
      data: {
        id: 3,
        name: 'guru',
        description: 'Teacher role'
      }
    }),
    prisma.role.create({
      data: {
        id: 4,
        name: 'ortu',
        description: 'Parent role'
      }
    }),
    prisma.role.create({
      data: {
        id: 5,
        name: 'siswa',
        description: 'Student role'
      }
    })
  ]);

  // Create SuperAdmin
  const superAdminUser = await prisma.user.create({
    data: {
      username: 'superadmin',
      password: await hashPassword('superadmin123'),
      name: 'Super Admin',
      email: 'superadmin@granada.sch.id',
      roles: {
        create: {
          roleId: 1
        }
      }
    }
  });

  const superAdmin = await prisma.superAdmin.create({
    data: {
      userId: superAdminUser.id
    }
  });

  // Create Admin
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: await hashPassword('admin123'),
      name: 'Admin User',
      email: 'admin@granada.sch.id',
      roles: {
        create: {
          roleId: 2
        }
      }
    }
  });

  // Create Teacher (untuk memberi point)
  const teacher = await prisma.user.create({
    data: {
      username: 'guru1',
      password: await hashPassword('guru123'),
      name: 'Ahmad Teacher',
      email: 'ahmad@granada.sch.id',
      roles: {
        create: {
          roleId: 3 // role guru
        }
      }
    }
  });

  // Create Parent Users
  const parentBudi = await prisma.user.create({
    data: {
      username: 'ortubudi',
      password: await hashPassword('ortu123'),
      name: 'Budi (Orang Tua)',
      email: 'budi.parent@granada.sch.id',
      roles: {
        create: {
          roleId: 4 // role ortu
        }
      }
    }
  });

  // Create Student Account
  const studentUser = await prisma.user.create({
    data: {
      username: 'ahmad123',
      password: await hashPassword('student123'),
      name: 'Ahmad Student',
      email: 'ahmad.student@granada.sch.id',
      roles: {
        create: {
          roleId: 5 // role siswa
        }
      }
    }
  });

  // Create Students (tanpa user account)
  const studentAhmad = await prisma.student.create({
    data: {
      name: "Ahmad",
      className: "X IPA 1",
      parentId: parentBudi.id,
      isActive: true
    }
  });

  const studentFatimah = await prisma.student.create({
    data: {
      name: "Fatimah",
      className: "X IPA 1",
      parentId: parentBudi.id,
      isActive: true
    }
  });

  // Create Sample Points
  await Promise.all([
    prisma.studentPoint.create({
      data: {
        studentId: studentAhmad.id,
        points: 10,
        description: 'Terlambat',
        teacherId: teacher.id
      }
    }),
    prisma.studentPoint.create({
      data: {
        studentId: studentFatimah.id,
        points: 15,
        description: 'Berbohong',
        teacherId: teacher.id
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

  // Create Sample Attendance Record
  const today = new Date();
  await prisma.attendance.create({
    data: {
      userId: teacher.id,
      checkInTime: new Date(today.setHours(7, 30, 0)),
      checkInPhotoUrl: '/uploads/attendance/checkin.jpg',
      checkInLatitude: -0.457833,
      checkInLongitude: 117.1259754,
      checkOutTime: new Date(today.setHours(16, 0, 0)),
      checkOutPhotoUrl: '/uploads/attendance/checkout.jpg',
      checkOutLatitude: -0.457833,
      checkOutLongitude: 117.1259754,
      status: 'hadir'
    }
  });

  // Create Sample Salary Slip
  await prisma.salarySlip.create({
    data: {
      teacherId: teacher.id,
      slipImageUrl: '/uploads/salary/slip-januari-2024.pdf',
      period: new Date(),
      uploadedBy: adminUser.id
    }
  });

  console.log('Seed data created successfully');
} catch (error) {
  console.error('Error seeding data:', error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
}

main();