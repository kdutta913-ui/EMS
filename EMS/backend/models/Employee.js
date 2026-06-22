const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    department: {
      type: String,
      enum: ["TeamLead", "HR", "Finance", "Employee"],
    },
    role: {
      type: String,
    },
    designation: {
      type: String,
    },
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Intern"],
      default: "Full-Time",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "probation"],
      default: "active",
    },
    dateOfJoining: {
      type: Date,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    salary: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    bankDetails: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    skills: [String],
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
  },
  { timestamps: true }
);

// Unique per company, not globally
employeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });

employeeSchema.pre("save", async function () {
  if (!this.employeeCode) {
    const count = await mongoose.model("Employee").countDocuments({ companyId: this.companyId });
    this.employeeCode = `EMP${String(count + 1).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("Employee", employeeSchema);
