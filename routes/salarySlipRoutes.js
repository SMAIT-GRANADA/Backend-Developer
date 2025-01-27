const express = require("express");
const router = express.Router();
const salarySlipController = require("../controllers/salarySlipController");
const {
  checkAuth,
  isAdmin,
  checkRole,
} = require("../middlewares/authMiddleware");
const upload = require("../middlewares/fileUpload");

router.use(checkAuth);

// Admin routes
router.post(
  "/salary-slips",
  isAdmin,
  upload.single("file"),
  salarySlipController.createSalarySlip
);

router.put(
  "/salary-slips/:id",
  isAdmin,
  upload.single("file"),
  salarySlipController.updateSalarySlip
);

router.delete(
  "/salary-slips/:id",
  isAdmin,
  salarySlipController.deleteSalarySlip
);

// Shared route for both admin and teacher
router.get(
  "/salary-slips",
  checkRole(["admin", "guru"]),
  salarySlipController.getSalarySlips
);

module.exports = router;
