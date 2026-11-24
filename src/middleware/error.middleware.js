import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose schema validation errors → 400
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, "Validation failed", details);
  }
  // Invalid ObjectId / cast errors → 400
  else if (err instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid value for field: ${err.path}`);
  }
  // Duplicate key (unique index) → 409
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    error = new ApiError(409, `Duplicate value for: ${field}`);
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};