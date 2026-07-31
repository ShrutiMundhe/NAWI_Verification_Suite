import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  verifyTokenController,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Rate limiter for login: max 5 requests per minute
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after a minute.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Authentication endpoints
router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", authenticate, logout);
router.post("/verify", authenticate, verifyTokenController);

export default router;
