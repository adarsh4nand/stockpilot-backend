import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import http from "http";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { initializeSocket } from "./sockets/socketHandler.js";

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`⚙️ Server running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed", err);
    process.exit(1);
  });