const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const { checkAuth, isAdmin } = require("../middlewares/authMiddleware");

router.use(checkAuth);

router.get("/teachers", isAdmin, teacherController.getAllTeachers);

module.exports = router;
