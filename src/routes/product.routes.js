import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  createProduct, getProducts, getProductById, updateProduct, deleteProduct, getMyProducts,
} from "../controllers/product.controller.js";

const router = Router();

// ⚠️ IMPORTANT: "/seller/my" MUST come before "/:id",
// otherwise Express treats "seller" as an :id value!
router.get("/seller/my", verifyJWT, authorizeRoles("seller", "admin"), getMyProducts);

router.route("/")
  .get(getProducts)                                          // public catalog
  .post(verifyJWT, authorizeRoles("seller", "admin"), createProduct);

router.route("/:id")
  .get(getProductById)
  .patch(verifyJWT, authorizeRoles("seller", "admin"), updateProduct)
  .delete(verifyJWT, authorizeRoles("seller", "admin"), deleteProduct);

export default router;