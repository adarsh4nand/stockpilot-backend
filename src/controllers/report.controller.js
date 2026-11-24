import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// PIPELINE 1+2: sales summary + date-wise sales
const salesSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: { $ne: "cancelled" } };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }
  const [totals] = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: "$total" } } },
  ]);
  const daily = await Order.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return res.status(200).json(new ApiResponse(200, {
    totals: totals || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }, daily,
  }, "Sales summary"));
});

// PIPELINE 3: best-selling products ($unwind + $group + $sort + $limit)
const bestSelling = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));
  const data = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", name: { $first: "$items.name" }, totalQty: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
    { $sort: { totalQty: -1 } },
    { $limit: limit },
  ]);
  return res.status(200).json(new ApiResponse(200, data, "Best-selling products"));
});

// PIPELINE 4+5: inventory summary + category-wise ($lookup join)
const inventorySummary = asyncHandler(async (req, res) => {
  const [overall] = await Product.aggregate([
    { $group: {
      _id: null,
      totalProducts: { $sum: 1 },
      outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
      lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] }, 1, 0] } },
      stockValue: { $sum: { $multiply: ["$price", "$stock"] } },
    } },
  ]);
  const byCategory = await Product.aggregate([
    { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "cat" } },
    { $unwind: "$cat" },
    { $group: { _id: "$cat.name", products: { $sum: 1 }, stockValue: { $sum: { $multiply: ["$price", "$stock"] } } } },
    { $sort: { stockValue: -1 } },
  ]);
  return res.status(200).json(new ApiResponse(200, { overall: overall || {}, byCategory }, "Inventory summary"));
});

export { salesSummary, bestSelling, inventorySummary };