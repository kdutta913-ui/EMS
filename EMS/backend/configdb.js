const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    console.error("MONGODB_URL is not defined in environment variables");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop old global unique index on employeeCode (replaced by compound index per company)
    try {
      await conn.connection.collection("employees").dropIndex("employeeCode_1");
    } catch (_) {
      // Index may not exist — that's fine
    }
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;