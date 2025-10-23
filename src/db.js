const mongoose = require("mongoose");

async function connectDB(uri) {
  if (!uri) throw new Error("MONGODB_URI missing");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 20000,
  });
  console.log("✅ Mongo connected");
}

module.exports = { connectDB, mongoose };
