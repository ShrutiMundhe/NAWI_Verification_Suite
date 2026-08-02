import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();
const ADMIN_EMAIL = "ilmchikhli@gmail.com";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      idNumber: user.idNumber || user.credentials
    },
    process.env.JWT_SECRET || "your_jwt_secret_key",
    { expiresIn: "7d" }
  );
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, idNumber, credentials, avatar } = req.body;
    const finalIdNumber = (idNumber || credentials || "").trim();

    if (!name || !email || !password || !finalIdNumber) {
      return res.status(400).json({
        message: "Full Name, Email, Password, and Official ID Number are required."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const isMasterAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    const role = isMasterAdmin ? "admin" : "user";
    const status = isMasterAdmin ? "approved" : "pending";
    const approved = isMasterAdmin;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      idNumber: finalIdNumber,
      credentials: finalIdNumber,
      avatar: avatar || "",
      role,
      status,
      approved,
      active: status !== "rejected"
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: isMasterAdmin
        ? "Master Admin account registered and approved successfully."
        : "Registration successful! Awaiting administrator approval.",
      status: user.status,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        idNumber: user.idNumber,
        credentials: user.credentials,
        avatar: user.avatar || "",
        role: user.role,
        status: user.status,
        approved: user.approved,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (user.status === "pending" && user.role !== "admin" && !user.approved) {
      return res.status(403).json({
        success: false,
        message: "Your account is awaiting approval from the administrator.",
        status: "pending"
      });
    }

    if (user.status === "rejected" || user.active === false) {
      return res.status(403).json({
        success: false,
        message: "Your account access has been rejected by the administrator.",
        status: "rejected"
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        idNumber: user.idNumber || user.credentials,
        credentials: user.idNumber || user.credentials,
        avatar: user.avatar || "",
        role: user.role,
        status: user.status,
        approved: user.approved !== false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, credentials, idNumber, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (idNumber || credentials) {
      const idVal = (idNumber || credentials).trim();
      user.idNumber = idVal;
      user.credentials = idVal;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        idNumber: user.idNumber,
        credentials: user.credentials,
        avatar: user.avatar || "",
        role: user.role,
        status: user.status,
        approved: user.approved,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Server error updating profile." });
  }
});

router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully."
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Server error updating password." });
  }
});

router.get("/pending-users", verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      users: pendingUsers,
      pendingUsers,
      total: pendingUsers.length
    });
  } catch (error) {
    console.error("Fetch Pending Users Error:", error);
    return res.status(500).json({ message: "Server error fetching pending users." });
  }
});

router.put("/users/:id/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.status = status;
    user.approved = status === "approved";
    user.active = status !== "rejected";

    await user.save();

    return res.json({
      success: true,
      message: `User status updated to ${status} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        idNumber: user.idNumber,
        avatar: user.avatar || "",
        role: user.role,
        status: user.status,
        approved: user.approved,
        active: user.active
      }
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
    return res.status(500).json({ message: "Server error updating user status." });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        idNumber: user.idNumber || user.credentials,
        credentials: user.credentials || user.idNumber,
        avatar: user.avatar || "",
        role: user.role,
        status: user.status,
        approved: user.approved !== false,
        active: user.active !== false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return res.status(500).json({ message: "Server error fetching user profile." });
  }
});

export default router;
