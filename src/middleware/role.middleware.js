import { ApiError } from "../utils/ApiError.js";

// Usage: authorizeRoles("seller", "admin")
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized request"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. This action requires role: ${allowedRoles.join(" or ")}`)
      );
    }
    next();
  };
};