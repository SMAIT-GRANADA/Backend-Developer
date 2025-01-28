const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE,
  projectId: process.env.GCS_PROJECT_ID
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function uploadPhotoToGCS(fileBase64, path) {
  try {
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

async function deletePhotoFromGCS(fileUrl) {
  try {
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    throw error;
  }
}

module.exports = {
  uploadPhotoToGCS,
  deletePhotoFromGCS
};