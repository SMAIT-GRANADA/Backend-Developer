const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

router.get("/staff", staffController.getAllStaff);

module.exports = router;