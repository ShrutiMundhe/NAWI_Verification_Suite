import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/tokens.js";

/**
 * Authentication middleware to verify Bearer JWT tokens.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Authorization middleware to check if user has the required role.
 * @param {string} requiredRole - e.g. 'admin' or 'user'
 */
export function authorize(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== requiredRole) {
      if (requiredRole === "admin") {
        return res.status(403).json({ message: "Admin access denied" });
      }
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Additional check for admin role
    if (requiredRole === "admin" && req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: "Admin access denied" });
    }

    next();
  };
}
