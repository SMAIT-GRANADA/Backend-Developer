const { Storage } = require('@google-cloud/storage');
const path = require('path');

let storage;
let bucket;
let gcsEnabled = false;

try {
  const missingVars = [];
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) missingVars.push('GOOGLE_CLOUD_PROJECT_ID');
  if (!process.env.GOOGLE_CLOUD_BUCKET_NAME) missingVars.push('GOOGLE_CLOUD_BUCKET_NAME');
  let storageConfig = {};
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    storageConfig.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  }
  console.log('Using Application Default Credentials for GCS authentication');
  
  if (missingVars.length > 0) {
    console.warn(`GCS configuration incomplete. Missing: ${missingVars.join(', ')}. GCS features will be disabled.`);
  } else {
    storage = new Storage(storageConfig);
    
    if (process.env.GOOGLE_CLOUD_BUCKET_NAME) {
      bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
      gcsEnabled = true;
      console.log('GCS initialized successfully with bucket:', process.env.GOOGLE_CLOUD_BUCKET_NAME);
    }
  }
} catch (error) {
  console.error('Error initializing Google Cloud Storage:', error);
  console.error('GCS features will be disabled');
}

const uploadPhotoToGCS = async (photoBase64, userId) => {
  try {
    if (!gcsEnabled) {
      console.warn('Upload photo attempted but GCS is not enabled');
      return null;
    }
    
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
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    return signedUrl;
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    return null;
  }
};

async function deletePhotoFromGCS(url) {
  try {
    if (!gcsEnabled || !url) {
      return;
    }
    
    const fileName = url.split('/').pop();
    const file = bucket.file(`salary-slips/${fileName}`);
    
    try {
      const exists = await file.exists();
      if (!exists[0]) {
        console.log(`File ${fileName} does not exist in GCS`);
        return;
      }
      
      await file.delete();
      console.log(`File ${fileName} deleted successfully from GCS`);
    } catch (fileError) {
      console.error('Error checking or deleting file:', fileError);
    }
  } catch (error) {
    console.error('Error in deletePhotoFromGCS:', error);
  }
}

module.exports = {
  storage,
  bucket,
  uploadPhotoToGCS,
  deletePhotoFromGCS,
  isEnabled: () => gcsEnabled
};