require("dotenv").config();
const http    = require("http");
const express = require("express");
const { Server } = require("socket.io");
const cors    = require("cors");
const connectDB = require("./configdb.js");

const authRoutes         = require("./routes/authRoutes");
const employeeRoutes     = require("./routes/employeeRoutes");
const leaveRoutes        = require("./routes/leaveRoutes");
const attendanceRoutes   = require("./routes/attendanceRoutes");
const payrollRoutes      = require("./routes/payrollRoutes");
const taskRoutes         = require("./routes/taskRoutes");
const performanceRoutes  = require("./routes/performanceRoutes");
const departmentRoutes   = require("./routes/departmentRoutes");
const companyRoutes      = require("./routes/companyRoutes");
const dashboardRoutes    = require("./routes/dashboardRoutes");
const superadminRoutes   = require("./routes/superadminRoutes");
const ticketRoutes       = require("./routes/ticketRoutes");
const chatRoutes         = require("./routes/chatRoutes");
const aiRoutes           = require("./routes/aiRoutes");
const scheduleRoutes     = require("./routes/scheduleRoutes");
const trainingRoutes     = require("./routes/trainingRoutes");
const onboardingRoutes   = require("./routes/onboardingRoutes");
const offboardingRoutes  = require("./routes/offboardingRoutes");
const complianceRoutes   = require("./routes/complianceRoutes");
const documentRoutes     = require("./routes/documentRoutes");
const expenseRoutes      = require("./routes/expenseRoutes");
const reimbursementRoutes = require("./routes/reimbursementRoutes");

const app        = express();
const httpServer = http.createServer(app);

connectDB();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── REST routes ── */
app.use("/api/auth",           authRoutes);
app.use("/api/employees",      employeeRoutes);
app.use("/api/leaves",         leaveRoutes);
app.use("/api/attendance",     attendanceRoutes);
app.use("/api/payroll",        payrollRoutes);
app.use("/api/tasks",          taskRoutes);
app.use("/api/performance",    performanceRoutes);
app.use("/api/departments",    departmentRoutes);
app.use("/api/company",        companyRoutes);
app.use("/api/dashboard",      dashboardRoutes);
app.use("/api/superadmin",     superadminRoutes);
app.use("/api/tickets",        ticketRoutes);
app.use("/api/chat",           chatRoutes);
app.use("/api/ai",             aiRoutes);
app.use("/api/schedule",       scheduleRoutes);
app.use("/api/training",       trainingRoutes);
app.use("/api/onboarding",     onboardingRoutes);
app.use("/api/offboarding",    offboardingRoutes);
app.use("/api/compliance",     complianceRoutes);
app.use("/api/hrdocuments",    documentRoutes);
app.use("/api/expenses",       expenseRoutes);
app.use("/api/reimbursements", reimbursementRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

/* ── Socket.IO ── */
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true },
});
require("./socket/socketHandler")(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
