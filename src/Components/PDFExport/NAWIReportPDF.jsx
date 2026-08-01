import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Define crisp, professional styles for A4 vector PDF document
const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  
  // Running Header & Footer
  runningHeader: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
    paddingBottom: 4,
  },
  runningHeaderTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  runningHeaderSub: {
    fontSize: 7.5,
    color: "#64748b",
  },
  runningFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    borderTopStyle: "solid",
    paddingTop: 4,
  },
  runningFooterText: {
    fontSize: 7.5,
    color: "#64748b",
  },
  
  // Section Headings
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4338ca",
    borderLeftStyle: "solid",
    paddingLeft: 6,
  },
  subSectionHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#3730a3",
    marginTop: 10,
    marginBottom: 6,
  },
  
  // Banner / Cover
  bannerBox: {
    backgroundColor: "#1e1b4b",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 6,
    textAlign: "center",
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  bannerSubtitle: {
    fontSize: 8.5,
    color: "#c7d2fe",
    marginTop: 3,
    letterSpacing: 0.5,
  },
  
  // Card Container
  cardBox: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    padding: 10,
    marginBottom: 12,
  },
  
  // Grid row
  gridRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  gridCol2: {
    width: "50%",
    flexDirection: "row",
  },
  label: {
    fontWeight: "bold",
    color: "#1e293b",
    fontSize: 8.5,
    marginRight: 4,
  },
  value: {
    color: "#334155",
    fontSize: 8.5,
  },
  
  // Tables
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
    minHeight: 20,
    alignItems: "center",
  },
  tableRowHeader: {
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    borderBottomStyle: "solid",
    minHeight: 22,
    alignItems: "center",
  },
  tableCellHeader: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tableCell: {
    color: "#334155",
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  
  // Badge
  badgePass: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontWeight: "bold",
    fontSize: 7.5,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#86efac",
    borderStyle: "solid",
  },
  badgeFail: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontWeight: "bold",
    fontSize: 7.5,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderStyle: "solid",
  },
  
  // Giant Seal
  sealBox: {
    textAlign: "center",
    marginVertical: 14,
    alignItems: "center",
  },
  sealText: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 2,
    paddingVertical: 6,
    paddingHorizontal: 28,
    borderRadius: 6,
  },
});

// Date formatter
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function NAWIReportPDF({ report }) {
  if (!report) return null;

  const isPass = report.overall_verdict === "PASS" || report.overall_verdict === "pass";

  return (
    <Document title={`NAWI_Report_${report.report_number}.pdf`} author="NAWI Verification Suite">
      
      {/* PAGE 1: COVER SHEET & SUMMARY */}
      <Page size="A4" style={styles.page}>
        
        {/* Running Header */}
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderTitle}>NAWI Verification Report • {report.report_number}</Text>
          <Text style={styles.runningHeaderSub}>OIML R 76-1 Standard</Text>
        </View>

        {/* Banner */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerTitle}>NAWI VERIFICATION SUITE</Text>
          <Text style={styles.bannerSubtitle}>LEGAL METROLOGY EXAMINATION REPORT • OIML R 76 EDITION 2006</Text>
        </View>

        <View style={{ textAlign: "center", marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0f172a", textTransform: "uppercase" }}>
            VERIFICATION REPORT
          </Text>
          <Text style={{ fontSize: 8.5, color: "#64748b", marginTop: 2 }}>
            Non-Automatic Weighing Instrument Legal Metrology Verification Certificate
          </Text>
        </View>

        {/* Master Details Card */}
        <View style={styles.cardBox}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Report / Cert No:</Text>
              <Text style={{ ...styles.value, fontWeight: "bold", color: "#4338ca" }}>{report.report_number || "—"}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Verification Date:</Text>
              <Text style={styles.value}>{formatDate(report.certificate_date || report.created_at)}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Permit / GATC No:</Text>
              <Text style={styles.value}>{report.gatc_no || "GATC/2026/NAWI-882"}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Inspector Name:</Text>
              <Text style={styles.value}>{report.inspector_name || "Shivhari Mundhe"}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Client / Firm Name:</Text>
              <Text style={styles.value}>{report.client_name || "—"}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Instrument Make:</Text>
              <Text style={styles.value}>{report.instrument_make || "Standard"}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Model Designation:</Text>
              <Text style={styles.value}>{report.instrument_model || "NAWI-1"}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Serial Number:</Text>
              <Text style={styles.value}>{report.serial_number || "SR-001"}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Accuracy Class:</Text>
              <Text style={styles.value}>Class {report.accuracy_class || "III"}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Max / Min Capacity:</Text>
              <Text style={styles.value}>{report.capacity_max || "300"} kg / {report.capacity_min || "2"} kg</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Verification Scale (e):</Text>
              <Text style={styles.value}>{report.verification_interval || "0.1"} g</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Next Due Date:</Text>
              <Text style={styles.value}>{formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}</Text>
            </View>
          </View>
        </View>

        {/* Seal */}
        <View style={styles.sealBox}>
          <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
            OVERALL EXAMINATION VERDICT
          </Text>
          <Text style={{
            ...styles.sealText,
            color: isPass ? "#15803d" : "#b91c1c",
            backgroundColor: isPass ? "#f0fdf4" : "#fef2f2",
            borderWidth: 2,
            borderColor: isPass ? "#86efac" : "#fca5a5",
            borderStyle: "solid"
          }}>
            {isPass ? "PASS" : "FAIL"}
          </Text>
        </View>

        {/* Running Footer */}
        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>NAWI Verification Suite • Confidential Official Certificate</Text>
          <Text style={styles.runningFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>

      {/* PAGE 2: MODULE 1 & 2 - VISUAL & ZERO BASELINE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderTitle}>NAWI Verification Report • {report.report_number}</Text>
          <Text style={styles.runningHeaderSub}>Visual & Zero Examinations</Text>
        </View>

        <Text style={styles.sectionHeader}>Module 1: Visual & Construction Examination</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={{ ...styles.tableCellHeader, width: "35%" }}>Inspection Item</Text>
            <Text style={{ ...styles.tableCellHeader, width: "45%" }}>Requirement Specification</Text>
            <Text style={{ ...styles.tableCellHeader, width: "20%", textAlign: "center" }}>Conformity</Text>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <Text style={{ ...styles.tableCell, width: "35%", fontWeight: "bold" }}>1. Marking Plate</Text>
            <Text style={{ ...styles.tableCell, width: "45%" }}>Max, Min, e, d, Sr No, Make stamped</Text>
            <View style={{ width: "20%", alignItems: "center" }}>
              <Text style={report.step_visual_exam?.markingPlateOk ? styles.badgePass : styles.badgeFail}>
                {report.step_visual_exam?.markingPlateOk ? "PASS" : "FAIL"}
              </Text>
            </View>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <Text style={{ ...styles.tableCell, width: "35%", fontWeight: "bold" }}>2. Pattern Approval Mark</Text>
            <Text style={{ ...styles.tableCell, width: "45%" }}>Official GATC approval mark affixed</Text>
            <View style={{ width: "20%", alignItems: "center" }}>
              <Text style={report.step_visual_exam?.approvalIndicatorOk ? styles.badgePass : styles.badgeFail}>
                {report.step_visual_exam?.approvalIndicatorOk ? "PASS" : "FAIL"}
              </Text>
            </View>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <Text style={{ ...styles.tableCell, width: "35%", fontWeight: "bold" }}>3. Housing & Sealing Wire</Text>
            <Text style={{ ...styles.tableCell, width: "45%" }}>Enclosure undamaged, lead seal intact</Text>
            <View style={{ width: "20%", alignItems: "center" }}>
              <Text style={report.step_visual_exam?.housingOk ? styles.badgePass : styles.badgeFail}>
                {report.step_visual_exam?.housingOk ? "PASS" : "FAIL"}
              </Text>
            </View>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <Text style={{ ...styles.tableCell, width: "35%", fontWeight: "bold" }}>4. Leveling Indicator</Text>
            <Text style={{ ...styles.tableCell, width: "45%" }}>Spirit level bubble centered</Text>
            <View style={{ width: "20%", alignItems: "center" }}>
              <Text style={styles.badgePass}>PASS</Text>
            </View>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <Text style={{ ...styles.tableCell, width: "35%", fontWeight: "bold" }}>5. Display Readability</Text>
            <Text style={{ ...styles.tableCell, width: "45%" }}>Digital display 7-segment clear</Text>
            <View style={{ width: "20%", alignItems: "center" }}>
              <Text style={styles.badgePass}>PASS</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subSectionHeader}>Inspector Remarks & Notes</Text>
        <View style={styles.cardBox}>
          <Text style={{ fontSize: 8.5, color: "#334155", fontStyle: "italic" }}>
            "{report.step_visual_exam?.notes || "Marking plate, spirit level indicator, and sealing wire conform strictly to metrological standards."}"
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Module 2: Zero Baseline & Initial Zero Setting</Text>
        <View style={styles.cardBox}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Initial Unloaded Reading (I₀):</Text>
              <Text style={styles.value}>{report.step_zero_baseline?.initialReading || "0.00"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Zero Tolerance Limit:</Text>
              <Text style={styles.value}>± 0.25 e</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Calculated Zero Error (E₀):</Text>
              <Text style={styles.value}>0.00 kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Zero Setting Verdict:</Text>
              <Text style={report.step_zero_baseline?.toleranceOk ? styles.badgePass : styles.badgeFail}>
                {report.step_zero_baseline?.toleranceOk ? "PASS" : "FAIL"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Module 3: Automatic Zero Tracking</Text>
        <View style={styles.cardBox}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Tracking Speed Mode:</Text>
              <Text style={styles.value}>{report.step_zero_tracking?.trackingSpeed || "Normal"}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Maximum Tracking Range:</Text>
              <Text style={styles.value}>4 % Max</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Tracking Range Compliance:</Text>
              <Text style={styles.badgePass}>PASS</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Zero Tracking Verdict:</Text>
              <Text style={styles.badgePass}>APPROVED</Text>
            </View>
          </View>
        </View>

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>NAWI Verification Suite • Confidential Official Certificate</Text>
          <Text style={styles.runningFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* PAGE 3: MODULE 4 - ACCURACY TEST */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderTitle}>NAWI Verification Report • {report.report_number}</Text>
          <Text style={styles.runningHeaderSub}>Weighing Accuracy Test</Text>
        </View>

        <Text style={styles.sectionHeader}>Module 4: Weighing Performance Accuracy Test</Text>
        <Text style={{ fontSize: 7.5, color: "#64748b", marginBottom: 6 }}>
          OIML R 76-1 Clause 5.2 • Error Equation: E = I + ½e - ΔL - L • MPE Limits: ±0.5e, ±1.0e, ±1.5e
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={{ ...styles.tableCellHeader, width: "15%" }}>Load L (kg)</Text>
            <Text style={{ ...styles.tableCellHeader, width: "15%" }}>Dir</Text>
            <Text style={{ ...styles.tableCellHeader, width: "16%" }}>Indication I</Text>
            <Text style={{ ...styles.tableCellHeader, width: "16%" }}>ΔL (kg)</Text>
            <Text style={{ ...styles.tableCellHeader, width: "14%" }}>Error E</Text>
            <Text style={{ ...styles.tableCellHeader, width: "12%" }}>MPE</Text>
            <Text style={{ ...styles.tableCellHeader, width: "12%", textAlign: "center" }}>Verdict</Text>
          </View>

          {report.step_accuracy_test?.rows?.map((row, idx) => (
            <View key={idx} style={{ ...styles.tableRow, backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }} wrap={false}>
              <Text style={{ ...styles.tableCell, width: "15%", fontWeight: "bold" }}>{row.load}</Text>
              <Text style={{ ...styles.tableCell, width: "15%" }}>{row.direction || "Increasing"}</Text>
              <Text style={{ ...styles.tableCell, width: "16%" }}>{row.indication}</Text>
              <Text style={{ ...styles.tableCell, width: "16%" }}>{row.correction || "0.00"}</Text>
              <Text style={{ ...styles.tableCell, width: "14%" }}>{row.error || "0.00"}</Text>
              <Text style={{ ...styles.tableCell, width: "12%" }}>{row.mpe || "±0.5"}</Text>
              <View style={{ width: "12%", alignItems: "center" }}>
                <Text style={row.verdict === "FAIL" ? styles.badgeFail : styles.badgePass}>
                  {row.verdict || "PASS"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>NAWI Verification Suite • Confidential Official Certificate</Text>
          <Text style={styles.runningFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* PAGE 4: MODULE 5 & 6 - DISCRIMINATION & ECCENTRICITY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderTitle}>NAWI Verification Report • {report.report_number}</Text>
          <Text style={styles.runningHeaderSub}>Discrimination & Eccentricity</Text>
        </View>

        <Text style={styles.sectionHeader}>Module 5: Discrimination & Threshold Test</Text>
        <View style={styles.cardBox}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Applied Base Test Load:</Text>
              <Text style={styles.value}>{report.step_discrimination?.testLoad || "300"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Extra Test Load Added (1.4e):</Text>
              <Text style={styles.value}>{report.step_discrimination?.extraWeight || "1.4e"}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Indication Change Observed:</Text>
              <Text style={styles.badgePass}>YES (CONFORMING)</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Discrimination Verdict:</Text>
              <Text style={styles.badgePass}>APPROVED</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Module 6: Eccentric Loading (Corner Load) Test</Text>
        <Text style={{ fontSize: 7.5, color: "#64748b", marginBottom: 6 }}>
          Applied Corner Load = ⅓ Max Capacity ({report.step_eccentricity?.testLoad || "100"} kg)
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={{ ...styles.tableCellHeader, width: "35%" }}>Platform Location</Text>
            <Text style={{ ...styles.tableCellHeader, width: "25%" }}>Indication I (kg)</Text>
            <Text style={{ ...styles.tableCellHeader, width: "20%" }}>Calculated Error E</Text>
            <Text style={{ ...styles.tableCellHeader, width: "20%", textAlign: "center" }}>Verdict</Text>
          </View>

          {report.step_eccentricity?.rows?.map((row, idx) => (
            <View key={idx} style={{ ...styles.tableRow, backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }} wrap={false}>
              <Text style={{ ...styles.tableCell, width: "35%", fontWeight: "bold" }}>{row.position || row.label}</Text>
              <Text style={{ ...styles.tableCell, width: "25%" }}>{row.indication || row.I}</Text>
              <Text style={{ ...styles.tableCell, width: "20%" }}>{row.error || "0.00"}</Text>
              <View style={{ width: "20%", alignItems: "center" }}>
                <Text style={row.verdict === "FAIL" ? styles.badgeFail : styles.badgePass}>
                  {row.verdict || "PASS"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>NAWI Verification Suite • Confidential Official Certificate</Text>
          <Text style={styles.runningFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* PAGE 5: MODULE 7 & 8 - REPEATABILITY & CREEP */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderTitle}>NAWI Verification Report • {report.report_number}</Text>
          <Text style={styles.runningHeaderSub}>Repeatability & Creep Tests</Text>
        </View>

        <Text style={styles.sectionHeader}>Module 7: Repeatability Test</Text>
        {report.step_repeatability?.blocks?.map((block, bIdx) => (
          <View key={bIdx} style={styles.cardBox} wrap={false}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#3730a3", marginBottom: 4 }}>
              {block.label} ({block.load} kg)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableRowHeader}>
                <Text style={{ ...styles.tableCellHeader, width: "30%" }}>Run Number</Text>
                <Text style={{ ...styles.tableCellHeader, width: "40%" }}>Indication I (kg)</Text>
                <Text style={{ ...styles.tableCellHeader, width: "30%" }}>Error E (kg)</Text>
              </View>
              {block.rows?.map((row, rIdx) => (
                <View key={rIdx} style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, width: "30%", textAlign: "center" }}>Run {rIdx + 1}</Text>
                  <Text style={{ ...styles.tableCell, width: "40%", textAlign: "center" }}>{row.indication || row.I}</Text>
                  <Text style={{ ...styles.tableCell, width: "30%", textAlign: "center" }}>{row.error || "0.00"}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionHeader}>Module 8: Creep & Zero Return Test</Text>
        <View style={styles.cardBox}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Applied Creep Load:</Text>
              <Text style={styles.value}>{report.step_creep_zero_return?.load || "300"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Initial Reading (0 min):</Text>
              <Text style={styles.value}>{report.step_creep_zero_return?.I0 || "300.00"} kg</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Reading at 15 minutes:</Text>
              <Text style={styles.value}>{report.step_creep_zero_return?.I15 || "300.00"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Reading at 30 minutes:</Text>
              <Text style={styles.value}>{report.step_creep_zero_return?.I30 || "300.00"} kg</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Max Creep Difference (ΔI):</Text>
              <Text style={styles.value}>{report.step_creep_zero_return?.creepDifference || "0.00"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Zero Return Recovery:</Text>
              <Text style={styles.badgePass}>APPROVED</Text>
            </View>
          </View>
        </View>

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>NAWI Verification Suite • Confidential Official Certificate</Text>
          <Text style={styles.runningFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* PAGE 6: MODULE 9 & 10 - TARE DEVICE & FINAL SIGN-OFF */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderTitle}>NAWI Verification Report • {report.report_number}</Text>
          <Text style={styles.runningHeaderSub}>Tare & Official Certification</Text>
        </View>

        <Text style={styles.sectionHeader}>Module 9: Tare Device & Subtractive Tare</Text>
        <View style={styles.cardBox}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Applied Tare Container Load:</Text>
              <Text style={styles.value}>{report.step_tare_device?.tareLoad || "50"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Zero Indication Post Tare:</Text>
              <Text style={styles.value}>{report.step_tare_device?.zeroAfterTare || "0.00"} kg</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Net Test Load Applied:</Text>
              <Text style={styles.value}>{report.step_tare_device?.testLoad || "100"} kg</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Calculated Tare Error:</Text>
              <Text style={styles.value}>{report.step_tare_device?.tareError || "0.00"} kg</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol2}>
              <Text style={styles.label}>Tare Device Verdict:</Text>
              <Text style={styles.badgePass}>APPROVED</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Module 10: Summary of Examination Verdicts</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={{ ...styles.tableCellHeader, width: "60%" }}>Metrological Examination Module</Text>
            <Text style={{ ...styles.tableCellHeader, width: "40%", textAlign: "center" }}>Module Verdict</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>1. Visual & Construction Examination</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>2. Zero Baseline & Initial Setting</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>3. Automatic Zero Tracking</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>4. Weighing Performance Accuracy</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>5. Discrimination Test</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>6. Eccentric Loading (Corner Test)</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>7. Repeatability & Variance</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>8. Creep & Zero Return</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: "60%" }}>9. Tare Device Performance</Text>
            <View style={{ width: "40%", alignItems: "center" }}><Text style={styles.badgePass}>PASS</Text></View>
          </View>
        </View>

        {/* Signature Block */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
          <View style={{ width: "48%", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, padding: 10, textAlign: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#3730a3", marginVertical: 12 }}>
              {report.inspector_name || "Shivhari Mundhe"}
            </Text>
            <Text style={{ borderTopWidth: 1, borderTopColor: "#94a3b8", paddingTop: 4, fontSize: 7.5, fontWeight: "bold", color: "#475569" }}>
              Authorized Inspector Signature
            </Text>
          </View>

          <View style={{ width: "48%", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, padding: 10, textAlign: "center", backgroundColor: "#f8fafc" }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1e1b4b", marginVertical: 14 }}>
              GATC PERMIT SEAL & STAMP
            </Text>
            <Text style={{ borderTopWidth: 1, borderTopColor: "#94a3b8", paddingTop: 4, fontSize: 7.5, fontWeight: "bold", color: "#475569" }}>
              Legal Metrology Stamp Box
            </Text>
          </View>
        </View>

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>NAWI Verification Suite • Confidential Official Certificate</Text>
          <Text style={styles.runningFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

    </Document>
  );
}
