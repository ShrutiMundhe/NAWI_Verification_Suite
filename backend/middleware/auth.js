import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

/**
 * Middleware to enforce Admin role check.
 * Must be used after verifyToken middleware.
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access forbidden. Admin role required." });
  }
  next();
};

/**
 * Middleware to enforce Account Approval check.
 */
export const requireApproved = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role === "admin" || req.user.approved === true) {
    return next();
  }

  try {
    const dbUser = await User.findById(req.user.id || req.user._id);
    if (dbUser && (dbUser.role === "admin" || dbUser.approved === true)) {
      req.user.approved = true;
      return next();
    }
  } catch (err) {}

  return res.status(403).json({ error: "Account is pending admin approval" });
};

// Aliases for backward compatibility
export const authenticate = verifyToken;
export const authorize = (role) => (role === "admin" ? isAdmin : (req, res, next) => next());
