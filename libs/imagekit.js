const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadToImageKit(file, folder = "news") {
  try {
    const uploadResponse = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: `${folder}/${Date.now()}-${file.originalname}`,
      folder: folder
    });

    return {
      url: uploadResponse.url,
      fileId: uploadResponse.fileId
    };
  } catch (error) {
    console.error("Error uploading to ImageKit:", error);
    throw error;
  }
}

module.exports = {
  imagekit,
  uploadToImageKit
};