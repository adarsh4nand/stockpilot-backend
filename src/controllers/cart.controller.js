import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getOrCreate = async (customerId) => {
  let cart = await Cart.findOne({ customer: customerId });
  if (!cart) cart = await Cart.create({ customer: customerId, items: [] });
  return cart;
};
const sendCart = async (res, cartId, message, code = 200) => {
  const cart = await Cart.findById(cartId).populate("items.product", "name price stock isActive sku");
  const items = cart.items.filter((i) => i.product);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0); // server-side totals
  return res.status(code).json(new ApiResponse(code, { items, totalItems: items.length, subtotal }, message));
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id);
  return sendCart(res, cart._id, "Cart fetched");
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body || {};
  if (!mongoose.isValidObjectId(productId)) throw new ApiError(400, "Invalid product id");
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, "Quantity must be a positive whole number");
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  const cart = await getOrCreate(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  const newQty = (existing ? existing.quantity : 0) + qty;
  if (newQty > product.stock) throw new ApiError(409, `Only ${product.stock} left in stock`);
  if (existing) existing.quantity = newQty; else cart.items.push({ product: productId, quantity: qty });
  await cart.save();
  return sendCart(res, cart._id, "Item added to cart");
});

const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const qty = Number((req.body || {}).quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, "Quantity must be a positive whole number");
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (qty > product.stock) throw new ApiError(409, `Only ${product.stock} left in stock`);
  const cart = await getOrCreate(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError(404, "Item not in cart");
  item.quantity = qty;
  await cart.save();
  return sendCart(res, cart._id, "Cart item updated");
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  return sendCart(res, cart._id, "Item removed");
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id);
  cart.items = [];
  await cart.save();
  return sendCart(res, cart._id, "Cart cleared");
});

export { getCart, addItem, updateItem, removeItem, clearCart };