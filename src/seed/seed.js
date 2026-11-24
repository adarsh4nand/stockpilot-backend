import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🗑️ Clearing existing data...");
    await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);

    console.log("👤 Creating Users...");
    const admin = await User.create({ name: "Admin", email: "admin@stockpilot.dev", password: "Password123", role: "admin" });
    const seller1 = await User.create({ name: "Seller One", email: "seller1@test.com", password: "Password123", role: "seller" });
    const seller2 = await User.create({ name: "Seller Two", email: "seller2@test.com", password: "Password123", role: "seller" });
    const customer = await User.create({ name: "Customer One", email: "customer1@test.com", password: "Password123", role: "customer" });

    console.log("📂 Creating Categories...");
    const electronics = await Category.create({ name: "Electronics", description: "Gadgets", createdBy: admin._id });
    const books = await Category.create({ name: "Books", description: "Reading material", createdBy: admin._id });

    console.log("📦 Creating Products...");
    const p1 = await Product.create({ name: "Wireless Mouse", description: "Ergonomic", price: 799, category: electronics._id, seller: seller1._id, sku: "SKU-MOUSE-001", stock: 25, lowStockThreshold: 5 });
    const p2 = await Product.create({ name: "Mechanical Keyboard", description: "RGB Backlit", price: 2499, category: electronics._id, seller: seller1._id, sku: "SKU-KB-002", stock: 4, lowStockThreshold: 5 }); // Low stock trigger
    const p3 = await Product.create({ name: "Node.js in Action", description: "Backend book", price: 1200, category: books._id, seller: seller2._id, sku: "SKU-BOOK-001", stock: 50, lowStockThreshold: 10 });

    console.log("✅ Seed completed successfully!");
    console.log("\n🔑 Demo Credentials:");
    console.log("Admin: admin@stockpilot.dev / Password123");
    console.log("Seller 1: seller1@test.com / Password123");
    console.log("Customer: customer1@test.com / Password123");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seedDB();