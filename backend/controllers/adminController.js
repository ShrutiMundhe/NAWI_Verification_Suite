import mongoose from "mongoose";
import Report from "../models/Report.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

// Helper to validate ObjectId format
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Fetches administration statistics dashboard data.
 */
export async function getDashboard(req, res, next) {
  try {
    // 1. Report counts by status
    const reportsByStatusRaw = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const by_status = { draft: 0, in_progress: 0, completed: 0, archived: 0 };
    reportsByStatusRaw.forEach(item => {
      if (item._id in by_status) {
        by_status[item._id] = item.count;
      }
    });

    // 2. Report counts by verdict
    const reportsByVerdictRaw = await Report.aggregate([
      { $match: { overall_verdict: { $ne: null } } },
      { $group: { _id: "$overall_verdict", count: { $sum: 1 } } }
    ]);
    const by_verdict = { PASS: 0, CONDITIONAL: 0, FAIL: 0 };
    reportsByVerdictRaw.forEach(item => {
      if (item._id in by_verdict) {
        by_verdict[item._id] = item.count;
      }
    });

    // 3. Report counts by accuracy class
    const reportsByClassRaw = await Report.aggregate([
      { $group: { _id: "$accuracy_class", count: { $sum: 1 } } }
    ]);
    const by_class = { I: 0, II: 0, III: 0, IIII: 0 };
    reportsByClassRaw.forEach(item => {
      if (item._id in by_class) {
        by_class[item._id] = item.count;
      }
    });

    // 4. User stats (total & by role)
    const totalUsers = await User.countDocuments();
    const usersByRoleRaw = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    const by_role = { admin: 0, user: 0 };
    usersByRoleRaw.forEach(item => {
      if (item._id in by_role) {
        by_role[item._id] = item.count;
      }
    });

    // 5. User stats by active status
    const usersByActiveRaw = await User.aggregate([
      { $group: { _id: "$is_active", count: { $sum: 1 } } }
    ]);
    const by_active = { active: 0, inactive: 0 };
    usersByActiveRaw.forEach(item => {
      const key = item._id ? "active" : "inactive";
      by_active[key] = item.count;
    });

    // 6. Recent reports (last 10)
    const recentReports = await Report.find()
      .sort({ created_at: -1 })
      .limit(10);

    // 7. Recent audits (last 10)
    const recentAudits = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("user_id", "email username");

    return res.status(200).json({
      reportStats: {
        by_status,
        by_verdict,
        by_class,
      },
      userStats: {
        total: totalUsers,
        by_role,
        by_active,
      },
      recentReports,
      recentAudits,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches all reports with filters.
 */
export async function getAllReports(req, res, next) {
  try {
    let { page = 1, limit = 50, status, inspectorId, dateFrom, dateTo } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
      return res.status(400).json({ success: false, message: "Page and limit must be positive numbers" });
    }

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (inspectorId) {
      if (!isValidObjectId(inspectorId)) {
        return res.status(400).json({ success: false, message: "Invalid inspector ID format" });
      }
      filter.inspector_id = inspectorId;
    }
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) {
        filter.created_at.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.created_at.$lte = new Date(dateTo);
      }
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
 * Views report along with full history trace.
 */
export async function viewReportWithHistory(req, res, next) {
  try {
    const { reportId } = req.params;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId).populate(
      "modification_history.modified_by",
      "email username"
    );

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    return res.status(200).json({
      report,
      history: report.modification_history,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Allows admin to edit ANY field on ANY report.
 */
export async function adminUpdateReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const adminId = req.user.userId;
    const updates = req.body;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const historyEntries = [];
    const ignoreFields = ["_id", "created_at", "updated_at", "modification_history", "report_number"];

    for (const key of Object.keys(updates)) {
      if (ignoreFields.includes(key)) continue;

      const oldValue = report[key];
      const newValue = updates[key];

      const isDifferent = typeof oldValue === "object"
        ? JSON.stringify(oldValue) !== JSON.stringify(newValue)
        : oldValue !== newValue;

      if (isDifferent) {
        historyEntries.push({
          modified_by: adminId,
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
    const updatedReport = await report.save();

    // Log admin edit action
    await AuditLog.create({
      user_id: adminId,
      action: "ADMIN_EDIT",
      report_id: report._id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: { modified_fields: historyEntries.map(h => h.field_changed), user_role: "admin" },
    });

    return res.status(200).json({
      success: true,
      report: updatedReport,
      modification: historyEntries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Allows admin to soft delete a report.
 */
export async function adminDeleteReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const adminId = req.user.userId;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    report.status = "archived";
    report.updated_at = new Date();
    await report.save();

    // Log admin delete action
    await AuditLog.create({
      user_id: adminId,
      action: "ADMIN_DELETE_REPORT",
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
 * Returns all users.
 */
export async function getAllUsers(req, res, next) {
  try {
    let { page = 1, limit = 50, role, active } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
      return res.status(400).json({ success: false, message: "Page and limit must be positive numbers" });
    }

    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (active !== undefined) {
      filter.is_active = active === "true";
    }

    const total = await User.countDocuments(filter);
    
    // Express / mongoose excludes password_hash automatically via model methods
    // but we add it explicitly here to enforce security
    const users = await User.find(filter)
      .select("-password_hash")
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      users,
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Allows admin to toggle status, department, and phone of a user.
 */
export async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const { is_active, department, phone } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Do NOT allow changing role or email via this endpoint
    if (is_active !== undefined) user.is_active = is_active;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;

    const updatedUser = await user.save();

    // Log admin update user action
    await AuditLog.create({
      user_id: adminId,
      action: "ADMIN_UPDATE_USER",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      details: { updated_user_id: userId },
    });

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns audit log tracking data.
 */
export async function getAuditLogs(req, res, next) {
  try {
    let { page = 1, limit = 50, userId, action, dateFrom, dateTo } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
      return res.status(400).json({ success: false, message: "Page and limit must be positive numbers" });
    }

    const filter = {};
    if (userId) {
      if (!isValidObjectId(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
      }
      filter.user_id = userId;
    }
    if (action) {
      filter.action = action;
    }
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.timestamp.$lte = new Date(dateTo);
      }
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user_id", "email username role");

    return res.status(200).json({
      logs,
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
}
