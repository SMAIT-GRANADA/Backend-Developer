const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { checkAuth, isSuperAdmin } = require("../middlewares/authMiddleware");
const multerHandler = require("../middlewares/multerHandler");

router.post(
  "/news",
  checkAuth,
  isSuperAdmin,
  multerHandler,
  newsController.createNews
);

// router.get("/", newsController.getNews);

module.exports = router;
