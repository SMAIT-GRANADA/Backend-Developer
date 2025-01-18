const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "public/uploads/news";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak didukung. Gunakan gambar atau video."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const multerHandler = (req, res, next) => {
  upload.fields([{ name: "media", maxCount: 5 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    } else if (err) {
      return res.status(500).json({
        status: false,
        message: "Unexpected error occurred while uploading file",
      });
    }
    next();
  });
};

module.exports = multerHandler;
