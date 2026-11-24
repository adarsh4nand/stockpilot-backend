import { io } from "socket.io-client";
const token = process.argv[2];
if (!token) { console.log("Usage: node src/seed/socketClient.js <accessToken>"); process.exit(1); }
const socket = io("http://localhost:5000", { auth: { token } });
socket.on("connect", () => console.log("🔌 Connected! Waiting for events..."));
socket.on("connect_error", (e) => console.log("❌", e.message));
["order:placed", "order:statusChanged", "stock:low"].forEach((ev) =>
  socket.on(ev, (d) => console.log("📩", ev, JSON.stringify(d)))
);