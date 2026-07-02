const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // Student Reference
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Month (1-12)
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    // Year
    year: {
      type: Number,
      required: true,
    },

    // Attendance of every day
    attendance: {
      "1": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "2": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "3": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "4": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "5": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "6": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "7": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "8": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "9": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "10": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "11": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "12": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "13": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "14": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "15": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "16": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "17": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "18": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "19": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "20": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "21": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "22": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "23": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "24": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "25": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "26": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "27": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "28": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "29": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "30": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
      "31": {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent",
      },
    },
  },
  {
    timestamps: true,
  }
);

// One attendance document per student per month
attendanceSchema.index(
  {
    student: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);