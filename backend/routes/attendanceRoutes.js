const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  markAttendance,
  getStudentAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  monthlySummary,
} = require("../controllers/attendanceController");


router.post("/", protect, markAttendance);

router.get("/", protect, getAllAttendance);

router.get("/summary", protect, monthlySummary);

router.get("/student", protect, getStudentAttendance);


router.put("/:id", protect, updateAttendance);

router.delete("/:id", protect, deleteAttendance);

module.exports = router;