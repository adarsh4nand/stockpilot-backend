import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper: safe pagination (page >= 1, limit capped at 50)
const buildPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

// SELLER / ADMIN — create product
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, sku, stock, lowStockThreshold, images } = req.body;

  if (!name || price === undefined || !category || !sku) {
    throw new ApiError(400, "name, price, category and sku are required");
  }
  if (!mongoose.isValidObjectId(category)) throw new ApiError(400, "Invalid category id");

  // Referential validation: category must exist
  const categoryExists = await Category.findById(category);
  if (!categoryExists) throw new ApiError(404, "Category does not exist");

  const product = await Product.create({
    name,
    description,
    price,
    category,
    sku,
    stock: stock ?? 0,
    lowStockThreshold: lowStockThreshold ?? 5,
    images: images || [],
    seller: req.user._id, // 🔒 SECURITY: seller is set from the token, NEVER from the body
  });

  return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

// PUBLIC — search, filter, sort, pagination
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, inStock, sort } = req.query;
  const { page, limit, skip } = buildPagination(req.query);

  const filter = { isActive: true };

  if (search) filter.$text = { $search: search }; // uses the text index

  if (category) {
    if (!mongoose.isValidObjectId(category)) throw new ApiError(400, "Invalid category id");
    filter.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      if (Number.isNaN(Number(minPrice))) throw new ApiError(400, "minPrice must be a number");
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      if (Number.isNaN(Number(maxPrice))) throw new ApiError(400, "maxPrice must be a number");
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (inStock === "true") filter.stock = { $gt: 0 };

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("seller", "name")
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }, "Products fetched successfully")
  );
});

// PUBLIC — single product
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("seller", "name email");
  if (!product) throw new ApiError(404, "Product not found");

  return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});

// SELLER (own only) / ADMIN (any) — update
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  // 🔒 OWNERSHIP RULE: sellers can modify only their own products
  if (req.user.role === "seller" && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only modify your own products");
  }

  // Whitelist: seller/ownership and sku can never be changed here
  const allowed = ["name", "description", "price", "category", "stock", "lowStockThreshold", "images", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.category) {
    if (!mongoose.isValidObjectId(updates.category)) throw new ApiError(400, "Invalid category id");
    const cat = await Category.findById(updates.category);
    if (!cat) throw new ApiError(404, "Category does not exist");
  }

  const updated = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Product updated successfully"));
});

// SELLER (own only) / ADMIN (any) — delete
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  if (req.user.role === "seller" && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own products");
  }

  // Note: order items will store name/price snapshots (Phase 3),
  // so deleting a product never corrupts order history.
  await Product.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});

// SELLER / ADMIN — my own listings (includes inactive products)
const getMyProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = { seller: req.user._id };

  const [products, total] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }, "My products fetched successfully")
  );
});

export { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getMyProducts };