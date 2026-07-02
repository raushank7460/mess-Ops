// const express=require("express");
// const dotenv=require("dotenv");
// const cors=require("cors");
// const connectDB=require("./config/db");
// const studentRoutes = require("./routes/studentRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const authRoutes = require("./routes/authRoutes");
// dotenv.config();

// const app=express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({extended:true}));

// connectDB();
// connectDB().then(async () => {
//   // Sync indexes with current schema — drops stale/leftover indexes automatically
//   await Student.syncIndexes();
//   await Attendance.syncIndexes();
//   await Admin.syncIndexes();
//   console.log("Indexes synced successfully.");
// });
// app.get("/",(req,res)=>{
//     res.send("MESSOPS is working...");
// });
// app.use("/api/students", studentRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/auth", authRoutes);


// const port=process.env.PORT||5005;
// app.listen(port,()=>{
//     console.log(`server is running at :${port}`);
    
// })

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const authRoutes = require("./routes/authRoutes");

const Student = require("./models/studentModel");
const Attendance = require("./models/attendanceModel");
const Admin = require("./models/adminModel");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB().then(async () => {
  await Student.syncIndexes();
  await Attendance.syncIndexes();
  await Admin.syncIndexes();
  console.log("Indexes synced successfully.");
});

app.get("/", (req, res) => {
  res.send("MESSOPS is working...");
});
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 5005;
app.listen(port, () => {
  console.log(`server is running at :${port}`);
});