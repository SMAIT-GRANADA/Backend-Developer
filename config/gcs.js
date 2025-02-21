const { Storage } = require('@google-cloud/storage');
const path = require('path');

let storage;
let bucket;

try {
  storage = new Storage({
    keyFilename: path.join(__dirname, 'keys', process.env.GCS_KEYFILE),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
  
  bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
} catch (error) {
  console.error('Error initializing Google Cloud Storage:', error);
  throw error;
}

const uploadPhotoToGCS = async (photoBase64, userId) => {
  try {
    if (!photoBase64) {
      throw new Error('Photo base64 is required');
    }

    const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 format');
    }

    const photoBuffer = Buffer.from(matches[2], 'base64');
    const photoFileName = `attendance/${userId}/${Date.now()}.jpg`;
    const file = bucket.file(photoFileName);
    
    const options = {
      contentType: 'image/jpeg',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      }
    };

    await file.save(photoBuffer, options);

    // Generate signed URL yang berlaku 7 hari
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    return signedUrl;
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
};

async function deletePhotoFromGCS(url) {
  try {
    if (!url) return;
    
    const fileName = url.split('/').pop();
    const file = bucket.file(`salary-slips/${fileName}`);
    
    const exists = await file.exists();
    if (!exists[0]) {
      console.log(`File ${fileName} does not exist in GCS`);
      return;
    }
    
    await file.delete();
  } catch (error) {
    console.error('Error deleting from GCS:', error);
  }
}

module.exports = {
  storage,
  bucket,
  uploadPhotoToGCS,
  deletePhotoFromGCS
};