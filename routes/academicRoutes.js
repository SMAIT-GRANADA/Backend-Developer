const express = require("express");
const router = express.Router();
const academicController = require("../controllers/academicController");
const { checkAuth, academicAccess } = require("../middlewares/authMiddleware");

router.use(checkAuth);

router.post("/academic", academicAccess("create"), academicController.createAcademicRecord);
router.get("/academic", academicAccess("read"), academicController.getAcademicRecords);
router.get("/academic/:id", academicAccess("read"), academicController.getAcademicRecordById);
router.put("/academic/:id", academicAccess("update"), academicController.updateAcademicRecord);
router.delete("/academic/:id", academicAccess("delete"), academicController.deleteAcademicRecord);

module.exports = router;