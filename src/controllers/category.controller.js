import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ADMIN only
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, "Category name is required");

  const category = await Category.create({
    name: name.trim(),
    description,
    createdBy: req.user._id,
  });
  return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

// PUBLIC
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

// PUBLIC
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid category id");

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  return res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));
});

// ADMIN only
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid category id");

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, description, isActive } = req.body;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save(); // runs validators + slug hook
  return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});

// ADMIN only — BUSINESS RULE: cannot delete a category that has products
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid category id");

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new ApiError(409, `Cannot delete: ${productCount} product(s) still use this category`);
  }

  await Category.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };