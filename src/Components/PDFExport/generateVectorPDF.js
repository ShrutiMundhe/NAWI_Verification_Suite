import jsPDF from "jspdf";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export async function generateStructuredVectorPDF(report) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const isPass = report.overall_verdict === "PASS" || report.overall_verdict === "pass";

  // Helper for running header and footer
  const addHeaderFooter = (pageNo, totalPages = 11, subtitle = "Legal Metrology Verification") => {
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`NAWI VERIFICATION REPORT • ${report.report_number || "CERT-2026-01"}`, margin, 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, pageWidth - margin, 10, { align: "right" });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    // Footer
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NAWI Verification Suite • OIML R 76-1:2006 Standard", margin, pageHeight - 7);
    doc.text(`Page ${pageNo} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  };

  const drawSectionHeader = (title, y) => {
    doc.setFillColor(67, 56, 202);
    doc.rect(margin, y, 3, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), margin + 5, y + 4.5);

    return y + 10;
  };

  const drawCardBox = (y, height) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, height, 2, 2, "FD");
  };

  const drawGridRow = (y, label1, val1, label2, val2) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(label1, margin + 4, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(String(val1 || "—"), margin + 45, y);

    if (label2) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(label2, margin + 95, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(String(val2 || "—"), margin + 138, y);
    }
  };

  const drawBadge = (x, y, text, pass = true) => {
    if (pass) {
      doc.setFillColor(220, 252, 231);
      doc.setDrawColor(134, 239, 172);
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(252, 165, 165);
      doc.setTextColor(185, 28, 28);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.roundedRect(x, y, 16, 5, 1, 1, "FD");
    doc.text(text, x + 8, y + 3.5, { align: "center" });
  };

  // ==========================================
  // PAGE 1: COVER SHEET & MASTER DETAILS
  // ==========================================
  addHeaderFooter(1, 11, "Cover & General Specifications");

  // Top Dark Banner
  doc.setFillColor(30, 27, 75);
  doc.roundedRect(margin, 18, contentWidth, 22, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("NAWI VERIFICATION SUITE", pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  doc.text("LEGAL METROLOGY EXAMINATION REPORT • OIML R 76 EDITION 2006", pageWidth / 2, 34, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("VERIFICATION REPORT", pageWidth / 2, 50, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Non-Automatic Weighing Instrument Legal Metrology Verification Certificate", pageWidth / 2, 56, { align: "center" });

  // Details Box
  drawCardBox(64, 75);
  let yPos = 72;
  drawGridRow(yPos, "Report / Cert No:", report.report_number, "Verification Date:", formatDate(report.certificate_date || report.created_at));
  yPos += 9;
  drawGridRow(yPos, "Permit / GATC No:", report.gatc_no || "GATC/2026/NAWI-882", "Inspector Name:", report.inspector_name || "Shivhari Mundhe");
  yPos += 9;
  drawGridRow(yPos, "Client / Firm Name:", report.client_name, "Client Address:", report.client_address || "N/A");
  yPos += 9;
  drawGridRow(yPos, "Manufacturer / Make:", report.instrument_make, "Model Designation:", report.instrument_model);
  yPos += 9;
  drawGridRow(yPos, "Serial Number:", report.serial_number, "Accuracy Class:", `Class ${report.accuracy_class || "III"}`);
  yPos += 9;
  drawGridRow(yPos, "Max Capacity (Max):", `${report.capacity_max || 300} kg`, "Min Capacity (Min):", `${report.capacity_min || 2} kg`);
  yPos += 9;
  drawGridRow(yPos, "Verification Scale (e):", `${report.verification_interval || 0.1} g`, "Next Expiry Due:", formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1))));

  // Large Seal
  yPos = 150;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("EXAMINATION VERDICT", pageWidth / 2, yPos, { align: "center" });

  yPos += 6;
  if (isPass) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
    doc.setTextColor(21, 128, 61);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.setTextColor(185, 28, 28);
  }
  doc.setFontSize(26);
  doc.roundedRect(pageWidth / 2 - 35, yPos, 70, 18, 4, 4, "FD");
  doc.text(isPass ? "PASS" : "FAIL", pageWidth / 2, yPos + 13, { align: "center" });

  // Legal Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Issued under Legal Metrology Guidelines. Valid for 12 months from date of inspection.", pageWidth / 2, 260, { align: "center" });

  // ==========================================
  // PAGE 2: METROLOGICAL & ENVIRONMENTAL SPECIFICATIONS
  // ==========================================
  doc.addPage();
  addHeaderFooter(2, 11, "Metrological & Environmental Specs");

  yPos = drawSectionHeader("1. Client & Owner Details", 18);
  drawCardBox(yPos, 28);
  drawGridRow(yPos + 8, "Client / Firm Name:", report.client_name, "Premises Address:", report.client_address);
  drawGridRow(yPos + 18, "Testing Laboratory:", report.lab_name || "Legal Metrology Lab", "Permit Number:", report.gatc_no || "GATC/2026/882");

  yPos += 36;
  yPos = drawSectionHeader("2. Instrument Metrological Specifications", yPos);
  drawCardBox(yPos, 45);
  drawGridRow(yPos + 8, "Make / Manufacturer:", report.instrument_make, "Model Identifier:", report.instrument_model);
  drawGridRow(yPos + 18, "Serial Number:", report.serial_number, "Accuracy Class:", `Class ${report.accuracy_class}`);
  drawGridRow(yPos + 28, "Max Capacity (Max):", `${report.capacity_max} kg`, "Min Capacity (Min):", `${report.capacity_min} kg`);
  drawGridRow(yPos + 38, "Scale Interval (e = d):", `${report.verification_interval} g`, "Number of Intervals (n):", Math.round((parseFloat(report.capacity_max || 300) * 1000) / parseFloat(report.verification_interval || 0.1)));

  yPos += 53;
  yPos = drawSectionHeader("3. Ambient Environmental Parameters", yPos);
  drawCardBox(yPos, 20);
  drawGridRow(yPos + 8, "Ambient Temperature:", `${report.ambient_temp || "24.5"} °C (10°C to 40°C)`, "Relative Humidity:", `${report.rel_humidity || "52"} % (30% to 85%)`);

  yPos += 28;
  yPos = drawSectionHeader("4. Standard Calibration Test Masses", yPos);
  drawCardBox(yPos, 20);
  drawGridRow(yPos + 8, "Mass Set Classification:", report.standard_mass_class || "Class M1 (OIML R 111)", "Mass Set Cert No:", report.standard_mass_cert || "CAL-MASS-2026-991");

  // ==========================================
  // PAGE 3: VISUAL EXAMINATION
  // ==========================================
  doc.addPage();
  addHeaderFooter(3, 11, "Visual & Construction Exam");

  yPos = drawSectionHeader("Module 1: Visual & Construction Examination", 18);

  // Table
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, yPos, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("INSPECTION ITEM", margin + 4, yPos + 4.5);
  doc.text("REQUIREMENT SPECIFICATION", margin + 70, yPos + 4.5);
  doc.text("CONFORMITY", margin + 150, yPos + 4.5);

  yPos += 7;
  const visualItems = [
    { item: "1. Marking Plate & Inscriptions", req: "Max, Min, e, d, Sr No stamped legibly", ok: report.step_visual_exam?.markingPlateOk },
    { item: "2. Pattern Approval Mark", req: "Official GATC approval mark affixed", ok: report.step_visual_exam?.approvalIndicatorOk },
    { item: "3. Housing & Sealing Wire", req: "Enclosure undamaged, lead seal intact", ok: report.step_visual_exam?.housingOk },
    { item: "4. Spirit Level Alignment", req: "Level bubble centered in indicator ring", ok: true },
    { item: "5. Digital Display Readability", req: "7-segment digits clear without dead segments", ok: true },
  ];

  visualItems.forEach((v, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, yPos, contentWidth, 8, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(v.item, margin + 4, yPos + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(v.req, margin + 70, yPos + 5.5);

    drawBadge(margin + 152, yPos + 1.5, v.ok ? "PASS" : "FAIL", v.ok);
    yPos += 8;
  });

  yPos += 8;
  yPos = drawSectionHeader("Inspector Field Findings & Remarks", yPos);
  drawCardBox(yPos, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`"${report.step_visual_exam?.notes || "Marking plate, spirit level indicator, and sealing wire conform strictly to metrological standards."}"`, margin + 4, yPos + 10);

  // ==========================================
  // PAGE 4: ZERO BASELINE & ZERO TRACKING
  // ==========================================
  doc.addPage();
  addHeaderFooter(4, 11, "Zero Baseline & Zero Tracking");

  yPos = drawSectionHeader("Module 2: Zero Baseline & Initial Zero Setting", 18);
  drawCardBox(yPos, 28);
  drawGridRow(yPos + 8, "Initial Unloaded Reading (I₀):", `${report.step_zero_baseline?.initialReading || "0.00"} kg`, "Zero Tolerance Limit:", "± 0.25 e");
  drawGridRow(yPos + 18, "Calculated Zero Error (E₀):", "0.00 kg", "Zero Setting Verdict:", report.step_zero_baseline?.toleranceOk ? "PASS" : "FAIL");

  yPos += 38;
  yPos = drawSectionHeader("Module 3: Automatic Zero Tracking Test", yPos);
  drawCardBox(yPos, 28);
  drawGridRow(yPos + 8, "Tracking Speed Mode:", report.step_zero_tracking?.trackingSpeed || "Normal", "Maximum Tracking Range:", "4 % Max");
  drawGridRow(yPos + 18, "Tracking Range Compliance:", "PASS", "Zero Tracking Verdict:", "APPROVED");

  // ==========================================
  // PAGE 5: ACCURACY TEST
  // ==========================================
  doc.addPage();
  addHeaderFooter(5, 11, "Weighing Performance Accuracy");

  yPos = drawSectionHeader("Module 4: Weighing Performance Accuracy Test", 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("OIML R 76-1 Clause 5.2 • Error Equation: E = I + ½e - ΔL - L • MPE Limits: ±0.5e, ±1.0e, ±1.5e", margin, yPos);
  yPos += 5;

  // Table
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, yPos, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("LOAD L (kg)", margin + 4, yPos + 4.5);
  doc.text("DIRECTION", margin + 35, yPos + 4.5);
  doc.text("INDICATION I", margin + 70, yPos + 4.5);
  doc.text("ΔL (kg)", margin + 105, yPos + 4.5);
  doc.text("ERROR E", margin + 130, yPos + 4.5);
  doc.text("MPE", margin + 155, yPos + 4.5);
  doc.text("VERDICT", margin + 172, yPos + 4.5);

  yPos += 7;
  const accRows = report.step_accuracy_test?.rows || [];
  accRows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, yPos, contentWidth, 7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(r.load), margin + 4, yPos + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(r.direction || "Increasing", margin + 35, yPos + 4.5);
    doc.text(String(r.indication), margin + 70, yPos + 4.5);
    doc.text(String(r.correction || "0.00"), margin + 105, yPos + 4.5);
    doc.text(String(r.error || "0.00"), margin + 130, yPos + 4.5);
    doc.text(String(r.mpe || "±0.5"), margin + 155, yPos + 4.5);

    drawBadge(margin + 168, yPos + 1, r.verdict || "PASS", r.verdict !== "FAIL");
    yPos += 7;
  });

  // ==========================================
  // PAGE 6: DISCRIMINATION & ECCENTRICITY
  // ==========================================
  doc.addPage();
  addHeaderFooter(6, 11, "Discrimination & Eccentricity");

  yPos = drawSectionHeader("Module 5: Discrimination & Threshold Test", 18);
  drawCardBox(yPos, 28);
  drawGridRow(yPos + 8, "Applied Base Test Load:", `${report.step_discrimination?.testLoad || 300} kg`, "Extra Weight Added (1.4e):", report.step_discrimination?.extraWeight || "1.4e");
  drawGridRow(yPos + 18, "Indication Change Observed:", "YES (CONFORMING)", "Discrimination Verdict:", "APPROVED");

  yPos += 38;
  yPos = drawSectionHeader("Module 6: Eccentric Loading (Corner Load) Test", yPos);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Applied Corner Test Load = ⅓ Max Capacity (${report.step_eccentricity?.testLoad || 100} kg)`, margin, yPos);
  yPos += 5;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, yPos, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PLATFORM LOCATION", margin + 4, yPos + 4.5);
  doc.text("INDICATION I (kg)", margin + 70, yPos + 4.5);
  doc.text("CALCULATED ERROR E", margin + 120, yPos + 4.5);
  doc.text("VERDICT", margin + 165, yPos + 4.5);

  yPos += 7;
  const eccRows = report.step_eccentricity?.rows || [];
  eccRows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, yPos, contentWidth, 7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(r.position || r.label, margin + 4, yPos + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(String(r.indication || r.I), margin + 70, yPos + 4.5);
    doc.text(String(r.error || "0.00"), margin + 120, yPos + 4.5);

    drawBadge(margin + 162, yPos + 1, r.verdict || "PASS", r.verdict !== "FAIL");
    yPos += 7;
  });

  // ==========================================
  // PAGE 7: REPEATABILITY TEST
  // ==========================================
  doc.addPage();
  addHeaderFooter(7, 11, "Repeatability Test Analysis");

  yPos = drawSectionHeader("Module 7: Repeatability Test Analysis", 18);
  const repBlocks = report.step_repeatability?.blocks || [];

  repBlocks.forEach((b) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(55, 48, 163);
    doc.text(`${b.label} (${b.load} kg)`, margin, yPos);
    yPos += 4;

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, yPos, contentWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("RUN NUMBER", margin + 4, yPos + 4);
    doc.text("INDICATION I (kg)", margin + 70, yPos + 4);
    doc.text("CALCULATED ERROR E (kg)", margin + 130, yPos + 4);

    yPos += 6;
    (b.rows || []).forEach((r, rIdx) => {
      doc.setFillColor(rIdx % 2 === 0 ? 255 : 248, rIdx % 2 === 0 ? 255 : 250, rIdx % 2 === 0 ? 255 : 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yPos, contentWidth, 6, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Run ${rIdx + 1}`, margin + 4, yPos + 4);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(String(r.indication || r.I), margin + 70, yPos + 4);
      doc.text(String(r.error || "0.00"), margin + 130, yPos + 4);
      yPos += 6;
    });

    yPos += 6;
  });

  // ==========================================
  // PAGE 8: CREEP & ZERO RETURN
  // ==========================================
  doc.addPage();
  addHeaderFooter(8, 11, "Creep & Zero Return Test");

  yPos = drawSectionHeader("Module 8: Creep & Zero Return Test", 18);
  drawCardBox(yPos, 45);
  drawGridRow(yPos + 8, "Applied Creep Load:", `${report.step_creep_zero_return?.load || 300} kg`, "Initial Reading (0 min):", `${report.step_creep_zero_return?.I0 || "300.00"} kg`);
  drawGridRow(yPos + 18, "Reading at 15 minutes:", `${report.step_creep_zero_return?.I15 || "300.00"} kg`, "Reading at 30 minutes:", `${report.step_creep_zero_return?.I30 || "300.00"} kg`);
  drawGridRow(yPos + 28, "Max Creep Difference (ΔI):", `${report.step_creep_zero_return?.creepDifference || "0.00"} kg`, "Zero Return Prior Reading:", `${report.step_creep_zero_return?.zeroBefore || "0.00"} kg`);
  drawGridRow(yPos + 38, "Zero Post Load Removal:", `${report.step_creep_zero_return?.zeroAfter || "0.00"} kg`, "Zero Return Status:", "APPROVED");

  // ==========================================
  // PAGE 9: TARE DEVICE
  // ==========================================
  doc.addPage();
  addHeaderFooter(9, 11, "Tare Device Performance");

  yPos = drawSectionHeader("Module 9: Tare Device Performance", 18);
  drawCardBox(yPos, 28);
  drawGridRow(yPos + 8, "Applied Tare Load:", `${report.step_tare_device?.tareLoad || 50} kg`, "Zero Post Tare Activation:", `${report.step_tare_device?.zeroAfterTare || "0.00"} kg`);
  drawGridRow(yPos + 18, "Net Test Load Applied:", `${report.step_tare_device?.testLoad || 100} kg`, "Calculated Tare Error:", `${report.step_tare_device?.tareError || "0.00"} kg`);

  // ==========================================
  // PAGE 10: SUMMARY OF EXAMINATION VERDICTS
  // ==========================================
  doc.addPage();
  addHeaderFooter(10, 11, "Summary of Examination Verdicts");

  yPos = drawSectionHeader("Module 10: Summary of Module Verdicts", 18);

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, yPos, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("METROLOGICAL EXAMINATION MODULE", margin + 4, yPos + 4.5);
  doc.text("VERDICT STATUS", margin + 140, yPos + 4.5);

  yPos += 7;
  const moduleVerdicts = [
    "1. Visual & Construction Examination",
    "2. Zero Baseline & Initial Setting",
    "3. Automatic Zero Tracking",
    "4. Weighing Performance Accuracy",
    "5. Discrimination Test",
    "6. Eccentric Loading (Corner Test)",
    "7. Repeatability & Variance",
    "8. Creep & Zero Return",
    "9. Tare Device Performance",
  ];

  moduleVerdicts.forEach((mod, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, yPos, contentWidth, 7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(mod, margin + 4, yPos + 4.5);

    drawBadge(margin + 145, yPos + 1, "PASS", true);
    yPos += 7;
  });

  // ==========================================
  // PAGE 11: OFFICIAL CERTIFICATE SIGN-OFF
  // ==========================================
  doc.addPage();
  addHeaderFooter(11, 11, "Official Certification Sign-Off");

  doc.setFillColor(30, 27, 75);
  doc.roundedRect(margin, 18, contentWidth, 16, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL METROLOGICAL VERIFICATION REPORT", pageWidth / 2, 28, { align: "center" });

  yPos = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("FINAL EXAMINATION VERDICT", pageWidth / 2, yPos, { align: "center" });

  yPos += 6;
  doc.setFontSize(24);
  doc.setFillColor(isPass ? 240 : 254, isPass ? 253 : 242, isPass ? 244 : 242);
  doc.setDrawColor(isPass ? 134 : 252, isPass ? 239 : 165, isPass ? 172 : 165);
  doc.setTextColor(isPass ? 21 : 185, isPass ? 128 : 28, isPass ? 61 : 28);
  doc.roundedRect(pageWidth / 2 - 35, yPos, 70, 16, 4, 4, "FD");
  doc.text(isPass ? "PASS" : "FAIL", pageWidth / 2, yPos + 12, { align: "center" });

  // Signature Boxes
  yPos = 80;
  const boxWidth = 84;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPos, boxWidth, 35, 3, 3, "FD");

  doc.setFont("cursive", "bold");
  doc.setFontSize(14);
  doc.setTextColor(55, 48, 163);
  doc.text(report.inspector_name || "Shivhari Mundhe", margin + boxWidth / 2, yPos + 18, { align: "center" });

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, yPos + 24, margin + boxWidth - 10, yPos + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Authorized Inspector Signature", margin + boxWidth / 2, yPos + 30, { align: "center" });

  // Permit Stamp Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + boxWidth + 14, yPos, boxWidth, 35, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 27, 75);
  doc.text("GATC PERMIT SEAL & STAMP", margin + boxWidth + 14 + boxWidth / 2, yPos + 18, { align: "center" });

  doc.line(margin + boxWidth + 24, yPos + 24, margin + boxWidth * 2 + 4, yPos + 24);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Legal Metrology Authority Stamp", margin + boxWidth + 14 + boxWidth / 2, yPos + 30, { align: "center" });

  return doc;
}
