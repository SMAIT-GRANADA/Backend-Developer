const multer = require("multer");
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan gambar atau video."), false);
  }
};

// Konfigurasi upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Handler untuk media (multiple files)
const multerHandler = (req, res, next) => {
  upload.fields([{ name: "media", maxCount: 5 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: false,
          message: "Ukuran file terlalu besar. Maksimal 10MB",
        });
      }
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    } else if (err) {
      return res.status(500).json({
        status: false,
        message: err.message || "Terjadi kesalahan saat upload file",
      });
    }
    next();
  });
};

// Handler untuk single file
const singleFileHandler = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: false,
          message: "Ukuran file terlalu besar. Maksimal 10MB",
        });
      }
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    } else if (err) {
      return res.status(500).json({
        status: false,
        message: err.message || "Terjadi kesalahan saat upload file",
      });
    }
    next();
  });
};

module.exports = {
  multerHandler,
  singleFileHandler
};