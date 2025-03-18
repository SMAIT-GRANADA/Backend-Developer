const { createClient } = require('@supabase/supabase-js');
const path = require('path');

let supabase;
let storageEnabled = false;
let storageBucket;

try {
  const missingVars = [];
  if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!process.env.SUPABASE_KEY) missingVars.push('SUPABASE_KEY');
  if (!process.env.SUPABASE_STORAGE_BUCKET) missingVars.push('SUPABASE_STORAGE_BUCKET');
  
  if (missingVars.length > 0) {
    console.warn(`Konfigurasi Supabase Storage tidak lengkap. Yang kurang: ${missingVars.join(', ')}. Fitur Storage akan dinonaktifkan.`);
  } else {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
    storageEnabled = true;
    console.log('Supabase Storage berhasil diinisialisasi dengan bucket:', storageBucket);
  }
} catch (error) {
  console.error('Error saat menginisialisasi Supabase Storage:', error);
  console.error('Fitur Storage akan dinonaktifkan');
}

const uploadPhotoToStorage = async (photoBase64, userId) => {
  try {
    if (!storageEnabled) {
      console.warn('Percobaan upload foto tetapi Storage tidak diaktifkan');
      throw new Error('Storage tidak diaktifkan');
    }
    
    if (!photoBase64) {
      throw new Error('Photo base64 diperlukan');
    }

    const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Format base64 tidak valid');
    }

    const photoBuffer = Buffer.from(matches[2], 'base64');
    const photoFileName = `attendance/${userId}/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(photoFileName, photoBuffer, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
        upsert: false
      });
    
    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(photoFileName);

    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error saat upload ke Storage:', error);
    throw error;
  }
};

async function deletePhotoFromStorage(url) {
  try {
    if (!storageEnabled || !url) {
      return;
    }
    let filePath = '';
    if (url.includes(storageBucket)) {
      const parts = url.split(`${storageBucket}/`);
      if (parts.length > 1) {
        filePath = parts[1];
      }
    } else {
      const fileName = url.split('/').pop();
      if (url.includes('attendance')) {
        filePath = `attendance/${fileName}`;
      } else {
        filePath = `salary-slips/${fileName}`;
      }
    }
    
    if (!filePath) {
      console.error('Tidak dapat mengekstrak path file dari URL:', url);
      return;
    }
    
    const { data, error } = await supabase.storage
      .from(storageBucket)
      .remove([filePath]);
    
    if (error) {
      console.error('Error saat menghapus file:', error);
      throw error;
    }
    
    console.log(`File ${filePath} berhasil dihapus dari Storage`);
  } catch (error) {
    console.error('Error di deletePhotoFromStorage:', error);
    throw error;
  }
}

async function testStorageConnection() {
  if (!storageEnabled) {
    console.log('Storage tidak diaktifkan, melewati tes koneksi');
    return false;
  }
  
  try {
    const { data, error } = await supabase.storage.getBucket(storageBucket);
    
    if (error) {
      console.error('Tes koneksi Storage: GAGAL', error);
      return false;
    }
    
    console.log('Tes koneksi Storage: BERHASIL');
    return true;
  } catch (error) {
    console.error('Tes koneksi Storage: GAGAL', error);
    return false;
  }
}

testStorageConnection().then(result => {
  console.log(`Status koneksi Storage: ${result ? 'OK' : 'ERROR'}`);
});

module.exports = {
  supabase,
  uploadPhotoToStorage,
  deletePhotoFromStorage,
  isEnabled: () => storageEnabled,
  testConnection: testStorageConnection
};