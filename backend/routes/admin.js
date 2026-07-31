import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getDashboard,
  getAllReports,
  viewReportWithHistory,
  adminUpdateReport,
  adminDeleteReport,
  getAllUsers,
  updateUser,
  getAuditLogs,
} from "../controllers/adminController.js";

const router = express.Router();

// Apply administrative protections globally to all endpoints under this router
router.use(authenticate);
router.use(authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/reports", getAllReports);
router.get("/reports/:reportId", viewReportWithHistory);
router.put("/reports/:reportId", adminUpdateReport);
router.delete("/reports/:reportId", adminDeleteReport);
router.get("/users", getAllUsers);
router.put("/users/:userId", updateUser);
router.get("/audit-logs", getAuditLogs);

export default router;
