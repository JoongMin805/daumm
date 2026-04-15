import mongoose from "mongoose";

let connecting = null;
let keepAliveTimer = null;

const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  family: 4
};

function startKeepAlive() {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  keepAliveTimer = setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        console.log("📍 MongoDB Keep-Alive Ping");
      }
    } catch (err) {
      console.error("❌ MongoDB Keep-Alive Failed:", err.message);
    }
  }, 3 * 60 * 1000); // 3분마다 핑
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    return; // Render 등 환경에서는 일단 에러 로그만 남기고 종료하지 않음 (재시도 대기)
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connecting) {
    return connecting;
  }

  console.log("🔄 Connecting to MongoDB...");
  connecting = mongoose.connect(uri, options)
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      startKeepAlive();
      connecting = null;
      return conn;
    })
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
      connecting = null;
      // 재연결 시도
      setTimeout(connectDB, 5000);
      throw err;
    });

  return connecting;
};

// 연결 상태 감시
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB Disconnected. Attempting to reconnect...");
  setTimeout(connectDB, 3000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error Event:", err.message);
});

export const dbReadyState = () => mongoose.connection.readyState;
