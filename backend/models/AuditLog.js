import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "REGISTER",
        "LOGIN",
        "LOGOUT",
        "CREATE_REPORT",
        "SAVE_REPORT",
        "ADMIN_EDIT",
        "DELETE_REPORT",
        "SUBMIT_REPORT",
        "ARCHIVE_REPORT",
        "EXPORT_PDF",
        "ADMIN_DELETE_REPORT",
        "ADMIN_UPDATE_USER",
      ],
    },
    report_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    versionKey: false,
  }
);

// Indexes
AuditLogSchema.index({ user_id: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;
