import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { appEvents } from "../events/appEvents.js";

const TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
const restoreStock = async (order) => {
  for (const i of order.items) await Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity } });
};

// CUSTOMER — checkout with ATOMIC stock deduction + rollback
const checkout = asyncHandler(async (req, res) => {
  const { deliveryDetails } = req.body || {};
  if (!deliveryDetails || !deliveryDetails.fullName || !deliveryDetails.phone || !deliveryDetails.address) {
    throw new ApiError(400, "deliveryDetails (fullName, phone, address) required");
  }
  const cart = await Cart.findOne({ customer: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Cart is empty");

  const deducted = [];
  const orderItems = [];
  let subtotal = 0;
  try {
    for (const item of cart.items) {
      const p = item.product;
      if (!p || !p.isActive) throw new ApiError(400, "A product in your cart is unavailable");
      // 🔒 ATOMIC: only deduct if stock >= qty at this exact moment (prevents overselling)
      const updated = await Product.findOneAndUpdate(
        { _id: p._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) throw new ApiError(409, `Insufficient stock for ${p.name}`);
      deducted.push({ id: p._id, qty: item.quantity });
      const line = { product: p._id, seller: p.seller, name: p.name, price: p.price, quantity: item.quantity, subtotal: p.price * item.quantity };
      orderItems.push(line);
      subtotal += line.subtotal;
      if (updated.stock <= updated.lowStockThreshold) {
        appEvents.emit("stock-low", { productId: p._id, seller: p.seller, stock: updated.stock });
      }
    }
    const order = await Order.create({
      orderNumber: `SP-${Date.now()}`,
      customer: req.user._id,
      items: orderItems,
      deliveryDetails,
      subtotal,
      total: subtotal,
      statusHistory: [{ status: "placed" }],
    });
    await Cart.findOneAndUpdate({ customer: req.user._id }, { $set: { items: [] } });
    appEvents.emit("order-placed", { orderId: order._id, customer: req.user._id, total: subtotal, sellers: [...new Set(orderItems.map((i) => i.seller.toString()))] });
    return res.status(201).json(new ApiResponse(201, order, "Order placed (payment simulated)"));
  } catch (err) {
    for (const d of deducted) await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } }); // rollback
    throw err;
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, orders, "My orders fetched"));
});

const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid order id");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  const uid = req.user._id.toString();
  const isOwner = order.customer.toString() === uid;
  const isSeller = order.items.some((i) => i.seller.toString() === uid);
  if (!isOwner && !isSeller && req.user.role !== "admin") throw new ApiError(403, "Not your order");
  return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

// SELLER/ADMIN — status update with business rules
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (req.user.role === "seller" && !order.items.some((i) => i.seller.toString() === req.user._id.toString())) {
    throw new ApiError(403, "Not your order");
  }
  if (!(TRANSITIONS[order.status] || []).includes(status)) {
    throw new ApiError(409, `Invalid transition: ${order.status} -> ${status}`);
  }
  if (status === "cancelled") await restoreStock(order);
  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  appEvents.emit("order-status-changed", { orderId: order._id, customer: order.customer, status });
  return res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});

// CUSTOMER — cancel (restores stock)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.customer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not your order");
  if (!["placed", "confirmed", "packed"].includes(order.status)) throw new ApiError(409, "Cannot cancel at this stage");
  await restoreStock(order);
  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled" });
  await order.save();
  appEvents.emit("order-status-changed", { orderId: order._id, customer: order.customer, status: "cancelled" });
  return res.status(200).json(new ApiResponse(200, order, "Order cancelled, stock restored"));
});

export { checkout, getMyOrders, getOrderById, updateStatus, cancelOrder };