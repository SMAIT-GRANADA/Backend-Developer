const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { checkAuth, isSuperAdmin } = require("../middlewares/authMiddleware");
const multerHandler = require("../middlewares/multerHandler");

router.get("/news", newsController.getAllNews);
router.get("/news/:id", newsController.getNewsById);

router.post(
  "/news",
  checkAuth,
  isSuperAdmin,
  multerHandler,
  newsController.createNews
);

router.put(
  "/news/:id",
  checkAuth,
  isSuperAdmin,
  multerHandler,
  newsController.updateNews
);

router.delete("/news/:id", checkAuth, isSuperAdmin, newsController.deleteNews);

router.delete(
  "/news/media/:mediaId",
  checkAuth,
  isSuperAdmin,
  newsController.deleteNewsMedia
);

module.exports = router;
