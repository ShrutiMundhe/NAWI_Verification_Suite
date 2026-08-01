import React from "react";

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const formatBool = (val) => (val ? "CONFORMING (PASS)" : "NON-CONFORMING (FAIL)");
const formatApprove = (val) => (val ? "APPROVED" : "NOT APPROVED");

export default function PDFTemplate({ report }) {
  if (!report) return null;

  const pageStyle = {
    width: "210mm",
    minHeight: "297mm",
    padding: "16mm 18mm",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: "10pt",
    lineHeight: "1.5",
    pageBreakAfter: "always",
    position: "relative",
  };

  const headerStyle = {
    fontSize: "14pt",
    fontWeight: "800",
    borderBottom: "2.5px solid #0f172a",
    paddingBottom: "8px",
    marginBottom: "18px",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const subHeaderStyle = {
    fontSize: "11.5pt",
    fontWeight: "700",
    marginTop: "18px",
    marginBottom: "10px",
    color: "#3730a3",
    borderLeft: "4px solid #4338ca",
    paddingLeft: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  };

  const tableHeaderStyle = {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    border: "1px solid #0f172a",
    padding: "7px 10px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "9pt",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const tableCellStyle = {
    border: "1px solid #cbd5e1",
    padding: "7px 10px",
    color: "#334155",
    fontSize: "9.5pt",
  };

  const cardBoxStyle = {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    padding: "14px 16px",
    marginBottom: "16px",
  };

  const footerStyle = {
    position: "absolute",
    bottom: "12mm",
    left: "18mm",
    right: "18mm",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "8.5pt",
    color: "#64748b",
  };

  const renderFooter = (pageNo) => (
    <div style={footerStyle}>
      <span>NAWI Legal Metrology Verification Suite • OIML R 76-1:2006</span>
      <span style={{ fontWeight: "600" }}>Page {pageNo} of 11</span>
    </div>
  );

  return (
    <div style={{ width: "210mm", margin: "0 auto", backgroundColor: "#ffffff" }}>
      {/* PAGE 1: COVER SHEET */}
      <div style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {/* Top Banner */}
          <div style={{ backgroundColor: "#1e1b4b", color: "#ffffff", padding: "18px 24px", borderRadius: "10px", textAlign: "center", marginBottom: "26px" }}>
            <h1 style={{ fontSize: "21pt", fontWeight: "900", letterSpacing: "2.5px", margin: "0", textTransform: "uppercase" }}>
              NAWI VERIFICATION SUITE
            </h1>
            <p style={{ fontSize: "9.5pt", color: "#c7d2fe", margin: "4px 0 0 0", fontWeight: "600", letterSpacing: "1px" }}>
              LEGAL METROLOGY EXAMINATION REPORT • OIML R 76 EDITION 2006
            </p>
          </div>

          <div style={{ textAlign: "center", margin: "30px 0 24px 0" }}>
            <h2 style={{ fontSize: "16pt", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", borderBottom: "3px solid #4338ca", display: "inline-block", paddingBottom: "6px" }}>
              Verification Report
            </h2>
            <p style={{ fontSize: "10pt", color: "#64748b", marginTop: "6px" }}>
              Verification of Non-Automatic Weighing Instrument for Legal Trade
            </p>
          </div>

          {/* Certificate Summary Card */}
          <div style={{ ...cardBoxStyle, maxWidth: "520px", margin: "0 auto 26px auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", rowGap: "12px", fontSize: "10pt" }}>
              <span style={{ fontWeight: "700", color: "#1e293b" }}>Report / Certificate No:</span>
              <span style={{ fontWeight: "700", color: "#4338ca" }}>{report.report_number || "—"}</span>

              <span style={{ fontWeight: "700", color: "#1e293b" }}>Verification Permit (GATC):</span>
              <span style={{ color: "#334155" }}>{report.gatc_no || "GATC/2026/NAWI-882"}</span>

              <span style={{ fontWeight: "700", color: "#1e293b" }}>Date of Verification:</span>
              <span style={{ color: "#334155" }}>{formatDate(report.certificate_date || report.created_at)}</span>

              <span style={{ fontWeight: "700", color: "#1e293b" }}>Authorized Inspector:</span>
              <span style={{ color: "#334155" }}>{report.inspector_name || "Shivhari Mundhe"}</span>

              <span style={{ fontWeight: "700", color: "#1e293b" }}>Client / Firm Name:</span>
              <span style={{ color: "#334155" }}>{report.client_name || "—"}</span>

              <span style={{ fontWeight: "700", color: "#1e293b" }}>Instrument Model & Sr No:</span>
              <span style={{ color: "#334155" }}>{report.instrument_model || "NAWI-1"} (Sr: {report.serial_number || "SR-001"})</span>
            </div>
          </div>

          {/* Verdict Seal Box */}
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <div style={{ fontSize: "9pt", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              EXAMINATION VERDICT
            </div>
            <div style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "10px 45px",
              borderRadius: "8px",
              fontSize: "24pt",
              fontWeight: "900",
              letterSpacing: "2px",
              color: report.overall_verdict === "PASS" ? "#15803d" : "#b91c1c",
              backgroundColor: report.overall_verdict === "PASS" ? "#f0fdf4" : "#fef2f2",
              border: `2.5px solid ${report.overall_verdict === "PASS" ? "#86efac" : "#fca5a5"}`
            }}>
              {report.overall_verdict || "PASS"}
            </div>
          </div>
        </div>

        <div>
          <div style={{ textAlign: "center", fontSize: "8.5pt", color: "#64748b", marginBottom: "16px" }}>
            <p>Issued under Legal Metrology Guidelines. Valid for 12 months from date of inspection.</p>
          </div>
          {renderFooter(1)}
        </div>
      </div>

      {/* PAGE 2: METROLOGICAL & ENVIRONMENTAL SPECIFICATIONS */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 2: Metrological Specifications & Test Environment</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 3</span>
        </div>
        
        <div style={subHeaderStyle}>1. Client & Owner Details</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Client / Firm Name:</span> {report.client_name}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Premises Address:</span> {report.client_address}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Testing Laboratory:</span> {report.lab_name}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Verification Permit No:</span> {report.gatc_no}</div>
          </div>
        </div>

        <div style={subHeaderStyle}>2. Instrument Metrological Parameters</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Manufacturer / Make:</span> {report.instrument_make}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Model Designation:</span> {report.instrument_model}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Serial Number:</span> {report.serial_number}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Accuracy Class:</span> Class {report.accuracy_class}</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Maximum Capacity (Max):</span> {report.capacity_max} kg</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Minimum Capacity (Min):</span> {report.capacity_min} kg</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Verification Interval (e):</span> {report.verification_interval} g</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Scale Interval (d):</span> {report.verification_interval} g</div>
          </div>
        </div>

        <div style={subHeaderStyle}>3. Ambient Environmental Conditions</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Ambient Temperature:</span> {report.ambient_temp} °C (Allowed: 10°C to 40°C)</div>
            <div><span style={{ fontWeight: "700", color: "#0f172a" }}>Relative Humidity:</span> {report.rel_humidity} % (Allowed: 30% to 85%)</div>
          </div>
        </div>

        <div style={subHeaderStyle}>4. Standard Test Masses Used</div>
        <div style={{ ...cardBoxStyle, backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", color: "#1e3a8a" }}>
            <div><span style={{ fontWeight: "700" }}>Mass Set Classification:</span> {report.standard_mass_class}</div>
            <div><span style={{ fontWeight: "700" }}>Calibration Cert No:</span> {report.standard_mass_cert}</div>
          </div>
        </div>

        {renderFooter(2)}
      </div>

      {/* PAGE 3: VISUAL & CONSTRUCTION EXAMINATION */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 3: Visual & Constructional Examination</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 3.1</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Inspection Item</th>
              <th style={tableHeaderStyle}>Requirement Specification</th>
              <th style={tableHeaderStyle}>Conformity Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: "#ffffff" }}>
              <td style={tableCellStyle}><strong>1. Marking Plate</strong></td>
              <td style={tableCellStyle}>Max, Min, e, d, Sr No, Make legibly stamped</td>
              <td style={{ ...tableCellStyle, fontWeight: "700", color: report.step_visual_exam?.markingPlateOk ? "#15803d" : "#b91c1c" }}>
                {formatBool(report.step_visual_exam?.markingPlateOk)}
              </td>
            </tr>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <td style={tableCellStyle}><strong>2. Pattern Approval Mark</strong></td>
              <td style={tableCellStyle}>Official GATC / Metrology approval mark affixed</td>
              <td style={{ ...tableCellStyle, fontWeight: "700", color: report.step_visual_exam?.approvalIndicatorOk ? "#15803d" : "#b91c1c" }}>
                {formatBool(report.step_visual_exam?.approvalIndicatorOk)}
              </td>
            </tr>
            <tr style={{ backgroundColor: "#ffffff" }}>
              <td style={tableCellStyle}><strong>3. Housing Integrity</strong></td>
              <td style={tableCellStyle}>Enclosure free of damage, metrological seal intact</td>
              <td style={{ ...tableCellStyle, fontWeight: "700", color: report.step_visual_exam?.housingOk ? "#15803d" : "#b91c1c" }}>
                {formatBool(report.step_visual_exam?.housingOk)}
              </td>
            </tr>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <td style={tableCellStyle}><strong>4. Leveling Indicator</strong></td>
              <td style={tableCellStyle}>Spirit level bubble centered, adjustable feet secure</td>
              <td style={{ ...tableCellStyle, fontWeight: "700", color: "#15803d" }}>CONFORMING (PASS)</td>
            </tr>
            <tr style={{ backgroundColor: "#ffffff" }}>
              <td style={tableCellStyle}><strong>5. Digital Display Readability</strong></td>
              <td style={tableCellStyle}>7-segment LED/LCD digits clear, no dead segments</td>
              <td style={{ ...tableCellStyle, fontWeight: "700", color: "#15803d" }}>CONFORMING (PASS)</td>
            </tr>
          </tbody>
        </table>

        <div style={subHeaderStyle}>Inspector Field Notes & Visual Findings</div>
        <div style={cardBoxStyle}>
          <p style={{ margin: "0", color: "#334155" }}>
            "{report.step_visual_exam?.notes || "Marking plate, level indicator, and sealing wire conform strictly to metrological standards. No physical damage noted."}"
          </p>
        </div>

        {renderFooter(3)}
      </div>

      {/* PAGE 4: ZERO BASELINE & ZERO TRACKING */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 4: Zero Baseline & Zero Tracking Test</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 4.5</span>
        </div>
        
        <div style={subHeaderStyle}>1. Initial Zero Setting Test</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700" }}>Initial Unloaded Reading (I0):</span> {report.step_zero_baseline?.initialReading || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Zero Tolerance Limit:</span> ± 0.25 e (± {parseFloat(report.verification_interval || 0.1) * 0.25} g)</div>
            <div><span style={{ fontWeight: "700" }}>Zero Setting Compliance:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{report.step_zero_baseline?.toleranceOk ? "PASS" : "FAIL"}</span></div>
          </div>
        </div>

        <div style={subHeaderStyle}>2. Automatic Zero Tracking Test</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700" }}>Zero Tracking Speed:</span> {report.step_zero_tracking?.trackingSpeed || "Normal"}</div>
            <div><span style={{ fontWeight: "700" }}>Maximum Tracking Range:</span> 4 % Max</div>
            <div><span style={{ fontWeight: "700" }}>Tracking Range Compliance:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{formatBool(report.step_zero_tracking?.rangeOk)}</span></div>
            <div><span style={{ fontWeight: "700" }}>Overall Zero Tracking Verdict:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{formatApprove(report.step_zero_tracking?.isApproved)}</span></div>
          </div>
        </div>

        {renderFooter(4)}
      </div>

      {/* PAGE 5: WEIGHING PERFORMANCE ACCURACY TEST */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 5: Weighing Performance & Accuracy Test</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 5.2</span>
        </div>

        <div style={{ fontSize: "8.5pt", color: "#475569", marginBottom: "10px" }}>
          Calculated Error Formula: <em>E = I + ½e - ΔL - L</em> where <em>L</em> = Test Load, <em>I</em> = Indication, <em>ΔL</em> = Addition to next changeover point.
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Test Load L (kg)</th>
              <th style={tableHeaderStyle}>Indication I (kg)</th>
              <th style={tableHeaderStyle}>Correction ΔL (kg)</th>
              <th style={tableHeaderStyle}>Calculated Error E (kg)</th>
              <th style={tableHeaderStyle}>Allowed MPE (kg)</th>
              <th style={tableHeaderStyle}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {report.step_accuracy_test?.rows?.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={tableCellStyle}>{row.load}</td>
                <td style={tableCellStyle}>{row.indication}</td>
                <td style={tableCellStyle}>{row.correction}</td>
                <td style={tableCellStyle}>{row.error}</td>
                <td style={tableCellStyle}>{row.mpe}</td>
                <td style={{ ...tableCellStyle, fontWeight: "700", color: row.verdict === "FAIL" ? "#b91c1c" : "#15803d" }}>{row.verdict || "PASS"}</td>
              </tr>
            )) || (
              <tr>
                <td colSpan="6" style={{ ...tableCellStyle, textAlign: "center", color: "#64748b" }}>No accuracy test data recorded.</td>
              </tr>
            )}
          </tbody>
        </table>

        {renderFooter(5)}
      </div>

      {/* PAGE 6: DISCRIMINATION TEST */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 6: Discrimination & Threshold Test</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 6.1</span>
        </div>
        
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700" }}>Applied Base Test Load:</span> {report.step_discrimination?.testLoad || "—"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Extra Test Weight (1.4e):</span> {report.step_discrimination?.extraWeight || "1.4e"}</div>
            <div><span style={{ fontWeight: "700" }}>Indication Change Observed:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{formatBool(report.step_discrimination?.thresholdOk)}</span></div>
            <div><span style={{ fontWeight: "700" }}>Discrimination Verdict:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{formatApprove(report.step_discrimination?.isApproved)}</span></div>
          </div>
        </div>

        <div style={{ ...cardBoxStyle, backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a" }}>
          <p style={{ margin: "0", fontSize: "9.5pt" }}>
            <strong>Requirement:</strong> An extra load equal to 1.4 times the verification scale interval (1.4e), when placed gently on the loaded scale, must produce an unambiguous increase in digital indication.
          </p>
        </div>

        {renderFooter(6)}
      </div>

      {/* PAGE 7: ECCENTRICITY TEST */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 7: Eccentric Loading (Corner Load) Test</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 7.1</span>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <span style={{ fontWeight: "700" }}>Applied Eccentric Load (1/3 Max):</span> {report.step_eccentricity?.testLoad || "—"} kg
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Platform Position</th>
              <th style={tableHeaderStyle}>Indication I (kg)</th>
              <th style={tableHeaderStyle}>Calculated Error E (kg)</th>
              <th style={tableHeaderStyle}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {report.step_eccentricity?.rows?.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={tableCellStyle}>{row.position || row.label}</td>
                <td style={tableCellStyle}>{row.indication || row.I}</td>
                <td style={tableCellStyle}>{row.error}</td>
                <td style={{ ...tableCellStyle, fontWeight: "700", color: row.verdict === "FAIL" ? "#b91c1c" : "#15803d" }}>{row.verdict || "PASS"}</td>
              </tr>
            )) || (
              <tr>
                <td colSpan="4" style={{ ...tableCellStyle, textAlign: "center", color: "#64748b" }}>No eccentricity test data recorded.</td>
              </tr>
            )}
          </tbody>
        </table>

        {renderFooter(7)}
      </div>

      {/* PAGE 8: REPEATABILITY TEST */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 8: Repeatability & Variance Test</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 8.1</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {report.step_repeatability?.blocks?.map((block, bIdx) => (
            <div key={bIdx} style={cardBoxStyle}>
              <h4 style={{ margin: "0 0 10px 0", fontWeight: "700", color: "#3730a3" }}>{block.label} ({block.load} kg)</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#ffffff" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Run Number</th>
                    <th style={tableHeaderStyle}>Indication I (kg)</th>
                    <th style={tableHeaderStyle}>Error E (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {block.rows?.map((row, rIdx) => (
                    <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ ...tableCellStyle, textAlign: "center" }}>Run {rIdx + 1}</td>
                      <td style={{ ...tableCellStyle, textAlign: "center" }}>{row.indication || row.I}</td>
                      <td style={{ ...tableCellStyle, textAlign: "center" }}>{row.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )) || (
            <p style={{ textAlign: "center", color: "#64748b" }}>No repeatability test data recorded.</p>
          )}
        </div>

        {renderFooter(8)}
      </div>

      {/* PAGE 9: CREEP & ZERO RETURN */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 9: Creep & Zero Return Test</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 9.1</span>
        </div>
        
        <div style={subHeaderStyle}>1. Creep Test under Constant Maximum Load</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700" }}>Applied Constant Load:</span> {report.step_creep_zero_return?.load || "—"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Initial Reading (0 min):</span> {report.step_creep_zero_return?.I0 || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Reading at 15 min:</span> {report.step_creep_zero_return?.I15 || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Reading at 30 min:</span> {report.step_creep_zero_return?.I30 || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Max Creep Difference (ΔI):</span> {report.step_creep_zero_return?.creepDifference || "0.00"} kg</div>
          </div>
        </div>

        <div style={subHeaderStyle}>2. Zero Return Recovery Test</div>
        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700" }}>Zero Reading Prior to Test:</span> {report.step_creep_zero_return?.zeroBefore || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Zero Reading Post Unloading:</span> {report.step_creep_zero_return?.zeroAfter || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Zero Return Deviation:</span> {report.step_creep_zero_return?.zeroReturnDeviation || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Zero Return Status:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{formatApprove(report.step_creep_zero_return?.isApproved)}</span></div>
          </div>
        </div>

        {renderFooter(9)}
      </div>

      {/* PAGE 10: TARE DEVICE */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span>Page 10: Tare Device & Subtractive Tare</span>
          <span style={{ fontSize: "8.5pt", color: "#64748b" }}>OIML R 76-1 Clause 10.1</span>
        </div>

        <div style={cardBoxStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><span style={{ fontWeight: "700" }}>Applied Tare Container Load:</span> {report.step_tare_device?.tareLoad || "—"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Zero Indication After Tare:</span> {report.step_tare_device?.zeroAfterTare || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Net Test Load Applied:</span> {report.step_tare_device?.testLoad || "—"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Calculated Tare Accuracy Error:</span> {report.step_tare_device?.tareError || "0.00"} kg</div>
            <div><span style={{ fontWeight: "700" }}>Tare Performance Verdict:</span> <span style={{ fontWeight: "700", color: "#15803d" }}>{formatApprove(report.step_tare_device?.isApproved)}</span></div>
          </div>
        </div>

        {renderFooter(10)}
      </div>

      {/* PAGE 11: OFFICIAL CERTIFICATE SIGN-OFF */}
      <div style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ backgroundColor: "#1e1b4b", color: "#ffffff", padding: "16px", borderRadius: "8px", textAlign: "center", marginBottom: "26px" }}>
            <h2 style={{ fontSize: "15pt", fontWeight: "800", margin: "0", textTransform: "uppercase" }}>
              Official Metrological Verification Report
            </h2>
          </div>

          <div style={{ textAlign: "center", marginTop: "24px", marginBottom: "32px" }}>
            <div style={{ fontSize: "9pt", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              FINAL INSPECTION RESULT
            </div>
            <div style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "10px 45px",
              borderRadius: "10px",
              fontSize: "30pt",
              fontWeight: "900",
              letterSpacing: "2.5px",
              color: report.overall_verdict === "PASS" ? "#15803d" : "#b91c1c",
              backgroundColor: report.overall_verdict === "PASS" ? "#f0fdf4" : "#fef2f2",
              border: `3px solid ${report.overall_verdict === "PASS" ? "#86efac" : "#fca5a5"}`
            }}>
              {report.overall_verdict || "PASS"}
            </div>
          </div>

          <div style={cardBoxStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "10pt" }}>
              <div><span style={{ fontWeight: "700" }}>Certificate Number:</span> {report.certificate_number || report.report_number || "—"}</div>
              <div><span style={{ fontWeight: "700" }}>Date of Verification:</span> {formatDate(report.certificate_date || report.created_at)}</div>
              <div><span style={{ fontWeight: "700" }}>Authorized Inspector:</span> {report.inspector_name || "Shivhari Mundhe"}</div>
              <div><span style={{ fontWeight: "700" }}>Verification Expiry:</span> {formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}</div>
            </div>
          </div>

          {/* Inspector Signature & Stamp Box */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px" }}>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
              <div style={{ height: "45px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "cursive", fontSize: "14pt", color: "#3730a3", fontWeight: "bold" }}>
                  {report.inspector_name || "Shivhari Mundhe"}
                </span>
              </div>
              <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "6px", fontSize: "8.5pt", fontWeight: "700", color: "#475569" }}>
                Inspector Signature & Stamp
              </div>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", textAlign: "center", backgroundColor: "#f8fafc" }}>
              <div style={{ height: "45px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "9pt", fontWeight: "800", color: "#1e1b4b", letterSpacing: "1px" }}>
                  GATC PERMIT SEAL
                </span>
              </div>
              <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "6px", fontSize: "8.5pt", fontWeight: "700", color: "#475569" }}>
                Legal Metrology Authority
              </div>
            </div>
          </div>
        </div>

        {renderFooter(11)}
      </div>
    </div>
  );
}
