
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },

    rollNumber: {
      type: Number,
      required: [true, "Roll number is required"],
      unique: true,
    },

    roomNumber: {
      type: Number,
      required: [true, "Room number is required"],
    },

    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Enter a valid 10 digit phone number"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);