const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

const createAttendance = async (data) => {
  try {
    // Upload foto ke GCS
    const photoBuffer = Buffer.from(data.photoBase64.split(';base64,').pop(), 'base64');
    const photoFileName = `attendance/${data.userId}/${Date.now()}.jpg`;
    const file = bucket.file(photoFileName);
    
    await file.save(photoBuffer, {
      contentType: 'image/jpeg'
    });

    const photoUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${photoFileName}`;

    const attendance = await prisma.attendance.create({
      data: {
        userId: data.userId,
        checkInTime: new Date(),
        checkInPhotoUrl: photoUrl,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        status: 'hadir'
      },
      include: {
        user: {
          select: {
            name: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    return attendance;
  } catch (error) {
    throw error;
  }
};

const updateAttendance = async (id, data) => {
  try {
    // Upload foto ke GCS
    const photoBuffer = Buffer.from(data.photoBase64.split(';base64,').pop(), 'base64');
    const photoFileName = `attendance/${data.userId}/checkout_${Date.now()}.jpg`;
    const file = bucket.file(photoFileName);
    
    await file.save(photoBuffer, {
      contentType: 'image/jpeg'
    });

    const photoUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${photoFileName}`;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkOutTime: new Date(),
        checkOutPhotoUrl: photoUrl,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude
      },
      include: {
        user: {
          select: {
            name: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    return attendance;
  } catch (error) {
    throw error;
  }
};

const getTodayAttendance = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.attendance.findFirst({
    where: {
      userId,
      checkInTime: {
        gte: today,
        lt: tomorrow
      }
    }
  });
};

module.exports = {
  createAttendance,
  updateAttendance,
  getTodayAttendance
};