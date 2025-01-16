const multer = require("multer");
const upload = require("../configs/multerConfig");

const multerHandler = (req, res, next) => {
  upload.fields([{ name: "media", maxCount: 2 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: "Unexpected error occurred" });
    }
    next();
  });
};

module.exports = multerHandler;
