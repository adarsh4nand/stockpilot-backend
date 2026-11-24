import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { appEvents } from "../events/appEvents.js";

export const initializeSocket = (server) => {
  const io = new Server(server, { cors: { origin: process.env.CLIENT_URL, credentials: true } });

  // 🔒 Socket auth: same JWT as the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select("name role");
      if (!user) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.user._id.toString();
    socket.join(`user:${uid}`);
    if (socket.user.role === "seller") socket.join(`seller:${uid}`);
    if (socket.user.role === "admin") socket.join("admins");
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role})`);
    socket.on("disconnect", () => console.log(`❌ Disconnected: ${socket.user.name}`));
  });

  // EventEmitter → Socket.IO bridge (decoupled: controllers never import socket code)
  appEvents.on("order-placed", ({ orderId, customer, total, sellers = [] }) => {
    io.to(`user:${customer}`).emit("order:placed", { orderId, total });
    sellers.forEach((s) => io.to(`seller:${s}`).emit("order:placed", { orderId, total }));
    io.to("admins").emit("order:placed", { orderId, total });
  });
  appEvents.on("order-status-changed", ({ orderId, customer, status }) => {
    io.to(`user:${customer}`).emit("order:statusChanged", { orderId, status });
  });
  appEvents.on("stock-low", ({ productId, seller, stock }) => {
    io.to(`seller:${seller}`).emit("stock:low", { productId, stock });
    io.to("admins").emit("stock:low", { productId, stock });
  });

  return io;
};