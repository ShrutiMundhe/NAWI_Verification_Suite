import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { validateEmail, validatePassword } from "../utils/validator.js";
import { generateToken } from "../utils/tokens.js";

/**
 * Registers a new user.
 */
export async function register(req, res, next) {
  try {
    const { email, password, username, department, phone } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Validate password
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long, contain at least one uppercase letter and one number",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    // Create user. Mongoose pre-save hook hashes password_hash automatically
    const user = new User({
      email: normalizedEmail,
      username,
      password_hash: password, // Mongoose pre-save hook will hash this value
      department,
      phone,
      role: "user", // Default role
    });

    await user.save();

    // Log registration in AuditLog
    await AuditLog.create({
      user_id: user._id,
      action: "REGISTER",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: { email: normalizedEmail, username },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logs in a user.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user (email unique & lowercase)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Log to AuditLog
    await AuditLog.create({
      user_id: user._id,
      action: "LOGIN",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      token,
      expiresIn: "7 days",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logs out a user.
 */
export async function logout(req, res, next) {
  try {
    const userId = req.user.userId;

    // Log to AuditLog
    await AuditLog.create({
      user_id: userId,
      action: "LOGOUT",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Verifies if the token is valid.
 */
export async function verifyTokenController(req, res, next) {
  try {
    // req.user has already been set by authenticate middleware
    return res.status(200).json({
      valid: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}
