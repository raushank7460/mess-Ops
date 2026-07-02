const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
} = require("../controllers/authController");

// Register Admin v
router.post("/register", registerAdmin);

// Login Admin
router.post("/login", loginAdmin);

module.exports = router;