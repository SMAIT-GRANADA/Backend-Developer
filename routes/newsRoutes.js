const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { checkAuth } = require("../middlewares/authMiddleware");
const upload = require("../configs/multerConfig");
