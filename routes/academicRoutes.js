const express = require("express");
const router = express.Router();
const academicController = require("../controllers/academicController");
const { checkAuth, academicAccess } = require("../middlewares/authMiddleware");

router.use(checkAuth);

// Create academic record (Guru & Superadmin only)
router.post("/",academicAccess("create"),academicController.createAcademicRecord);

// Get all academic records (Guru, Superadmin, Ortu)
router.get("/", academicAccess("read"), academicController.getAcademicRecords);

// Get specific academic record (Guru, Superadmin, Ortu)
router.get("/:id",academicAccess("read"),academicController.getAcademicRecordById);

// Update academic record (Guru & Superadmin only)
router.put("/:id",academicAccess("update"),academicController.updateAcademicRecord);

// Delete academic record (Superadmin only)
router.delete("/:id", academicAccess("delete"),academicController.deleteAcademicRecord);

module.exports = router;