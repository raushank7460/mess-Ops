const Student = require("../models/studentModel");

// ========================================
// Add Student
// POST /api/students
// ========================================
const addStudent = async (req, res) => {
  try {
    const { name, rollNumber, roomNumber, course, phone } = req.body;

    if (!name || !rollNumber || !roomNumber || !course || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check duplicate roll number
    const existingStudent = await Student.findOne({ rollNumber });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Roll Number already exists.",
      });
    }

    const student = await Student.create({
      name,
      rollNumber,
      roomNumber,
      course,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Student added successfully.",
      student,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ========================================
// Get All Students
// GET /api/students
// ========================================
const getStudents = async (req, res) => {

  try {

    const students = await Student.find().sort({
      rollNumber: 1,
    });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ========================================
// Get Student By ID
// GET /api/students/:id
// ========================================
const getStudentById = async (req, res) => {

  try {

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.status(200).json({
      success: true,
      student,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ========================================
// Update Student
// PUT /api/students/:id
// ========================================
const updateStudent = async (req, res) => {

  try {

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Check duplicate roll number if changed
    if (
      req.body.rollNumber &&
      req.body.rollNumber !== student.rollNumber
    ) {
      const exists = await Student.findOne({
        rollNumber: req.body.rollNumber,
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Roll Number already exists.",
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      student: updatedStudent,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ========================================
// Delete Student
// DELETE /api/students/:id
// ========================================
const deleteStudent = async (req, res) => {

  try {

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ========================================
// Search Students
// GET /api/students/search?keyword=rahul
// ========================================
const searchStudents = async (req, res) => {

  try {

    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Keyword is required.",
      });
    }

    const students = await Student.find({
      $or: [
        {
          name: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          course: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          rollNumber: Number(keyword) || -1,
        },
        {
          roomNumber: Number(keyword) || -1,
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  searchStudents,
};