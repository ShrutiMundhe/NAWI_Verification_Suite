import mongoose from "mongoose";

const ModificationHistorySchema = new mongoose.Schema({
  modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  modified_at: {
    type: Date,
    default: Date.now,
  },
  field_changed: {
    type: String,
    required: true,
  },
  old_value: mongoose.Schema.Types.Mixed,
  new_value: mongoose.Schema.Types.Mixed,
}, { _id: false });

const ReportSchema = new mongoose.Schema(
  {
    report_number: {
      type: String,
      unique: true,
      index: true,
    },
    inspector_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inspector_name: {
      type: String,
      required: true,
    },
    client_name: {
      type: String,
      required: true,
    },
    client_address: {
      type: String,
      required: true,
    },
    instrument_make: {
      type: String,
      required: true,
    },
    instrument_model: {
      type: String,
      required: true,
    },
    serial_number: {
      type: String,
      required: true,
    },
    capacity_max: {
      type: Number,
      required: true,
    },
    capacity_min: {
      type: Number,
      required: true,
    },
    verification_interval: {
      type: String,
      required: true,
    },
    accuracy_class: {
      type: String,
      enum: ["I", "II", "III", "IIII"],
      required: true,
    },
    
    // Step configurations
    step_setup: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_visual_exam: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_zero_baseline: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_zero_tracking: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_accuracy_test: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_discrimination: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_eccentricity: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_repeatability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_creep_zero_return: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_tare_device: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    step_final_report: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    overall_verdict: {
      type: String,
      enum: ["PASS", "CONDITIONAL", "FAIL"],
    },
    mpe_status: {
      type: String,
    },
    errors_summary: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    certificate_number: {
      type: String,
      index: true,
    },
    certificate_date: {
      type: Date,
    },
    current_step: {
      type: Number,
      min: 1,
      max: 11,
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "in_progress", "completed", "archived"],
      default: "draft",
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    submitted_at: {
      type: Date,
    },
    modification_history: {
      type: [ModificationHistorySchema],
      default: [],
    },
  },
  {
    versionKey: false,
  }
);

// Pre-save hook to generate report number and handle updated_at
ReportSchema.pre("save", async function (next) {
  this.updated_at = new Date();

  // Generate unique report number if not present
  if (!this.report_number) {
    const year = new Date().getFullYear();
    try {
      const count = await mongoose.model("Report").countDocuments({
        created_at: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      });
      // Format number to be sequential e.g. REP-2026-001
      const sequentialNum = String(count + 1).padStart(3, "0");
      this.report_number = `REP-${year}-${sequentialNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Report = mongoose.model("Report", ReportSchema);
export default Report;
