import mongoose from "mongoose";
import Report from "../models/Report.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

// Helper to validate ObjectId format
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Creates a new calibration report.
 */
export async function createReport(req, res, next) {
  try {
    const { userId } = req.user;
    const reportData = req.body;

    // Validate required fields
    const requiredFields = [
      "client_name",
      "client_address",
      "instrument_make",
      "instrument_model",
      "serial_number",
      "capacity_max",
      "capacity_min",
      "verification_interval",
      "accuracy_class"
    ];

    const missingFields = requiredFields.filter(f => reportData[f] === undefined || reportData[f] === "");
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Fetch user profile to get inspector_name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Inspector user not found" });
    }

    const report = new Report({
      ...reportData,
      inspector_id: userId,
      inspector_name: user.username || user.email,
      status: "draft",
      current_step: 1,
    });

    const savedReport = await report.save();

    // Log action to AuditLog
    await AuditLog.create({
      user_id: userId,
      action: "CREATE_REPORT",
      report_id: savedReport._id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: { report_number: savedReport.report_number },
    });

    return res.status(201).json({
      success: true,
      report: savedReport,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a specific report by ID.
 */
export async function getReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const { userId, role } = req.user;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Verify ownership or check if admin
    if (report.inspector_id.toString() !== userId && role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a paginated list of reports for the logged-in user.
 */
export async function getUserReports(req, res, next) {
  try {
    const { userId } = req.user;
    let { page = 1, limit = 50, status } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
      return res.status(400).json({ success: false, message: "Page and limit must be positive numbers" });
    }

    const filter = { inspector_id: userId };
    if (status) {
      filter.status = status;
    }

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      reports,
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates report details and keeps track of modification history.
 */
export async function updateReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const { userId } = req.user;
    const updates = req.body;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Verify ownership
    if (report.inspector_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Capture modification history
    const historyEntries = [];
    const ignoreFields = ["_id", "inspector_id", "created_at", "updated_at", "modification_history", "report_number"];

    for (const key of Object.keys(updates)) {
      if (ignoreFields.includes(key)) continue;

      const oldValue = report[key];
      const newValue = updates[key];

      // Compare values (simple equality or stringified comparison for nested structures)
      const isDifferent = typeof oldValue === "object"
        ? JSON.stringify(oldValue) !== JSON.stringify(newValue)
        : oldValue !== newValue;

      if (isDifferent) {
        historyEntries.push({
          modified_by: userId,
          modified_at: new Date(),
          field_changed: key,
          old_value: oldValue,
          new_value: newValue,
        });
        report[key] = newValue;
      }
    }

    if (historyEntries.length > 0) {
      report.modification_history.push(...historyEntries);
    }

    report.updated_at = new Date();
    // If saving changes, set status to in_progress if currently draft
    if (report.status === "draft") {
      report.status = "in_progress";
    }

    const updatedReport = await report.save();

    // Log saving action
    await AuditLog.create({
      user_id: userId,
      action: "SAVE_REPORT",
      report_id: report._id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: { modified_fields: historyEntries.map(h => h.field_changed) },
    });

    return res.status(200).json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submits the report and generates a unique Certificate Number.
 */
export async function submitReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Verify ownership
    if (report.inspector_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Set overall status checks
    report.status = "completed";
    report.submitted_at = new Date();

    // Auto-generate Certificate Number CERT-YYYY-XXX
    if (!report.certificate_number) {
      const year = new Date().getFullYear();
      const count = await Report.countDocuments({
        status: "completed",
        submitted_at: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      });
      const sequentialNum = String(count + 1).padStart(3, "0");
      report.certificate_number = `CERT-${year}-${sequentialNum}`;
      report.certificate_date = new Date();
    }

    const submittedReport = await report.save();

    // Log submission action
    await AuditLog.create({
      user_id: userId,
      action: "SUBMIT_REPORT",
      report_id: report._id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: { certificate_number: submittedReport.certificate_number },
    });

    return res.status(200).json({
      success: true,
      report: submittedReport,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft deletes/archives a report.
 */
export async function deleteReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Verify ownership
    if (report.inspector_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    report.status = "archived";
    report.updated_at = new Date();
    await report.save();

    // Log deletion action
    await AuditLog.create({
      user_id: userId,
      action: "DELETE_REPORT",
      report_id: report._id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Report archived",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generates and returns a PDF representation of the report.
 */
export async function generatePDF(req, res, next) {
  try {
    const { reportId } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Verify ownership
    if (report.inspector_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Generate basic PDF text content (mocking PDF output stream)
    const pdfContent = `%PDF-1.4
%
1 0 obj
<< /Title (NAWI Calibration Verification Report - ${report.report_number})
   /Author (NAWI Verification Suite)
   /Subject (Calibration Certificate) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 595.27 841.89] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>
endobj
5 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
50 750 Td
(NAWI VERIFICATION SUITE REPORT) Tj
0 -20 Td
(Report Number: ${report.report_number}) Tj
0 -20 Td
(Client: ${report.client_name}) Tj
0 -20 Td
(Inspector: ${report.inspector_name}) Tj
0 -20 Td
(Status: ${report.status}) Tj
0 -20 Td
(Accuracy Class: ${report.accuracy_class}) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000015 00000 n 
0000000138 00000 n 
0000000188 00000 n 
0000000247 00000 n 
0000000378 00000 n 
0000000628 00000 n 
trailer
<< /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
705
%%EOF`;

    // Log PDF generation action
    await AuditLog.create({
      user_id: userId,
      action: "EXPORT_PDF",
      report_id: report._id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Report-${report.report_number}.pdf`);
    return res.status(200).send(Buffer.from(pdfContent, "utf-8"));
  } catch (error) {
    next(error);
  }
}
