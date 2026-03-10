import mongoose from "mongoose";

let connecting = false;
let keepAliveTimer = null;

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
};

function startKeepAlive() {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  keepAliveTimer = setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().command({ ping: 1 });
      }
    } catch {}
  }, 5 * 60 * 1000);
}

export const connectDB = async () => {
  if (!uri) {
    console.error("MongoDB URI not set");
    return;
  }
  if (mongoose.connection.readyState === 1 || connecting) return;
  connecting = true;
  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    startKeepAlive();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    setTimeout(connectDB, 5000);
  } finally {
    connecting = false;
  }
};

let listenersBound = false;
if (!listenersBound) {
  listenersBound = true;
  mongoose.connection.on("disconnected", () => {
    setTimeout(connectDB, 3000);
  });
  mongoose.connection.on("error", () => {
    setTimeout(connectDB, 5000);
  });
}

export const dbReadyState = () => mongoose.connection.readyState;
