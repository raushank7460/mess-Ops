const Attendance = require("../models/attendanceModel");
const Student = require("../models/studentModel");

// =============================================
// Helper: check if given month/year is the current month/year
// =============================================
const isCurrentMonthYear = (month, year) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
  const currentYear = now.getFullYear();
  return Number(month) === currentMonth && Number(year) === currentYear;
};

// =============================================
// Mark Attendance (Create/Update)
// =============================================
const markAttendance = async (req, res) => {
  try {
    const { studentId, day, month, year, status } = req.body;

    if (!studentId || !day || !month || !year || !status) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (day < 1 || day > 31) {
      return res.status(400).json({
        success: false,
        message: "Day must be between 1 and 31.",
      });
    }

    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Present or Absent.",
      });
    }

    // Restrict marking to the current month/year only
    if (!isCurrentMonthYear(month, year)) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance can only be marked for the current month. Previous months are locked.",
      });
    }

    // Restrict marking to today or earlier in the current month (no future dates)
    const now = new Date();
    if (Number(day) > now.getDate()) {
      return res.status(400).json({
        success: false,
        message: "You cannot mark attendance for a future date.",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    let attendance = await Attendance.findOne({
      student: studentId,
      month,
      year,
    });

    // Create monthly document if not exists
    if (!attendance) {
      attendance = await Attendance.create({
        student: studentId,
        month,
        year,
      });
    }

    attendance.attendance[day] = status;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance saved successfully.",
      attendance,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================================
// Get Monthly Attendance of One Student
// =============================================
const getStudentAttendance = async (req, res) => {
  try {

    const { studentId, month, year } = req.query;

    const attendance = await Attendance.findOne({
      student: studentId,
      month,
      year,
    }).populate("student");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found.",
      });
    }

    let present = 0;
    let absent = 0;

    Object.values(attendance.attendance).forEach((value) => {
      if (value === "Present") present++;
      else absent++;
    });

    res.status(200).json({
      success: true,
      attendance,
      summary: {
        present,
        absent,
        totalDays: present + absent,
        percentage:
          ((present / (present + absent)) * 100).toFixed(2) + "%",
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================================
// Get Attendance of All Students
// =============================================
const getAllAttendance = async (req, res) => {

  try {

    const { month, year } = req.query;

    const attendance = await Attendance.find({
      month,
      year,
    }).populate("student");

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =============================================
// Update Attendance
// =============================================
const updateAttendance = async (req, res) => {

  try {

    const { day, status } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    // Restrict updates to the current month/year only
    if (!isCurrentMonthYear(attendance.month, attendance.year)) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance can only be updated for the current month. Previous months are locked.",
      });
    }

    // Restrict to today or earlier in the current month (no future dates)
    const now = new Date();
    if (Number(day) > now.getDate()) {
      return res.status(400).json({
        success: false,
        message: "You cannot mark attendance for a future date.",
      });
    }

    attendance.attendance[day] = status;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      attendance,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =============================================
// Delete Monthly Attendance
// =============================================
const deleteAttendance = async (req, res) => {

  try {

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    // Restrict deletion to the current month/year only
    if (!isCurrentMonthYear(attendance.month, attendance.year)) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance records from previous months are locked and cannot be deleted.",
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully.",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =============================================
// Monthly Summary
// =============================================
const monthlySummary = async (req, res) => {

  try {

    const { month, year } = req.query;

    const attendanceList = await Attendance.find({
      month,
      year,
    }).populate("student");

    // Skip orphaned records where the referenced student no longer exists
    const validAttendance = attendanceList.filter((item) => item.student);

    const summary = validAttendance.map((item) => {

      let present = 0;
      let absent = 0;

      Object.values(item.attendance).forEach((status) => {
        if (status === "Present")
          present++;
        else
          absent++;
      });

      return {
        studentId: item.student._id,
        name: item.student.name,
        rollNumber: item.student.rollNumber,
        roomNumber: item.student.roomNumber,
        course: item.student.course,
        present,
        absent,
        percentage:
          ((present / (present + absent)) * 100).toFixed(2) + "%",
      };

    });

    res.status(200).json({
      success: true,
      count: summary.length,
      summary,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  monthlySummary,
};