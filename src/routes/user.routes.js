import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getCurrentUser, updateProfile } from "../controllers/user.controller.js";

const router = Router();

router.use(verifyJWT); // everything below requires login
router.route("/me").get(getCurrentUser).patch(updateProfile);

export default router;