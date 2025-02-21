const express = require("express");
const router = express.Router();
const salarySlipController = require("../controllers/salarySlipController");
const {
  checkAuth,
  isAdmin,
  checkRole,
} = require("../middlewares/authMiddleware");
const { singleFileHandler } = require("../middlewares/multerHandler");

router.use(checkAuth);

router.post(
  "/salary-slips",
  isAdmin,
  singleFileHandler,
  salarySlipController.createSalarySlip
);

router.put(
  "/salary-slips/:id",
  isAdmin,
  singleFileHandler,
  salarySlipController.updateSalarySlip
);

router.delete(
  "/salary-slips/:id",
  isAdmin,
  salarySlipController.deleteSalarySlip
);

router.get(
  "/salary-slips",
  checkRole(["admin", "guru"]),
  salarySlipController.getSalarySlips
);

module.exports = router;