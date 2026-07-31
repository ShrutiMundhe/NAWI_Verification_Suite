import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createReport,
  getUserReports,
  getReport,
  updateReport,
  submitReport,
  deleteReport,
  generatePDF,
} from "../controllers/reportController.js";

const router = express.Router();

// All routes require user authentication
router.use(authenticate);

router.post("/", createReport);
router.get("/", getUserReports);
router.get("/:reportId", getReport);
router.put("/:reportId", updateReport);
router.post("/:reportId/submit", submitReport);
router.delete("/:reportId", deleteReport);
router.get("/:reportId/pdf", generatePDF);

export default router;
