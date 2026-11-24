import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  createCategory, getCategories, getCategoryById, updateCategory, deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.route("/")
  .get(getCategories)                                        // public
  .post(verifyJWT, authorizeRoles("admin"), createCategory); // admin only

router.route("/:id")
  .get(getCategoryById)
  .patch(verifyJWT, authorizeRoles("admin"), updateCategory)
  .delete(verifyJWT, authorizeRoles("admin"), deleteCategory);

export default router;