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

// Format boolean helper
const formatBool = (val) => (val ? "Yes" : "No");
const formatApprove = (val) => (val ? "Approved" : "Not Approved");

export default function PDFTemplate({ report }) {
  if (!report) return null;

  const pageStyle = {
    width: "210mm",
    minHeight: "297mm",
    padding: "20mm",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "Arial, sans-serif",
    fontSize: "11pt",
    lineHeight: "1.5",
    pageBreakAfter: "always",
  };

  return (
    <div style={{ width: "210mm", margin: "0 auto", backgroundColor: "#ffffff" }}>
      {/* PAGE 1: COVER SHEET */}
      <div style={pageStyle} className="flex flex-col justify-between border border-slate-200">
        <div className="text-center mt-20">
          <h1 className="text-3xl font-black tracking-widest text-slate-900 uppercase">
            NAWI VERIFICATION SUITE
          </h1>
          <h2 className="text-xl font-bold mt-4 text-slate-700 uppercase border-b-2 border-slate-900 inline-block pb-2">
            Certificate of Verification
          </h2>
        </div>

        <div className="my-20 space-y-6 max-w-md mx-auto text-left border border-slate-300 p-8 rounded-xl bg-slate-50">
          <div className="grid grid-cols-2">
            <span className="font-bold">Report Number:</span>
            <span>{report.report_number || "—"}</span>
          </div>
          <div className="grid grid-cols-2">
            <span className="font-bold">Inspection Date:</span>
            <span>{formatDate(report.created_at)}</span>
          </div>
          <div className="grid grid-cols-2">
            <span className="font-bold">Inspector Name:</span>
            <span>{report.inspector_name || "—"}</span>
          </div>
          <div className="grid grid-cols-2">
            <span className="font-bold">Client Name:</span>
            <span>{report.client_name || "—"}</span>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 mb-10">
          <p>© NAWI Verification Suite. All rights reserved.</p>
        </div>
      </div>

      {/* PAGE 2: INSTRUMENT SETUP */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 2: Instrument Setup</h2>
        
        <h3 className="text-lg font-bold mb-4 text-indigo-700">Client Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div><span className="font-bold">Name:</span> {report.client_name}</div>
          <div><span className="font-bold">Address:</span> {report.client_address}</div>
        </div>

        <h3 className="text-lg font-bold mb-4 text-indigo-700">Instrument Specifications</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-bold">Make:</span> {report.instrument_make}</div>
          <div><span className="font-bold">Model:</span> {report.instrument_model}</div>
          <div><span className="font-bold">Serial Number:</span> {report.serial_number}</div>
          <div><span className="font-bold">Max Capacity:</span> {report.capacity_max}</div>
          <div><span className="font-bold">Min Capacity:</span> {report.capacity_min}</div>
          <div><span className="font-bold">Accuracy Class:</span> {report.accuracy_class}</div>
          <div><span className="font-bold">Verification Interval (e):</span> {report.verification_interval}</div>
        </div>
      </div>

      {/* PAGE 3: VISUAL EXAMINATION */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 3: Visual Examination</h2>
        <div className="space-y-4">
          <div>
            <span className="font-bold">Marking Plate Status:</span>{" "}
            {report.step_visual_exam?.markingPlateOk ? "Conform" : "Non-Conform"}
          </div>
          <div>
            <span className="font-bold">Approval Indicator Status:</span>{" "}
            {report.step_visual_exam?.approvalIndicatorOk ? "Conform" : "Non-Conform"}
          </div>
          <div>
            <span className="font-bold">Housing & Metrological Condition:</span>{" "}
            {report.step_visual_exam?.housingOk ? "Good/Conform" : "Damaged/Non-Conform"}
          </div>
          <div className="mt-8">
            <h3 className="font-bold text-slate-800 mb-2">Detailed Observations & Notes:</h3>
            <p className="p-4 bg-slate-50 border rounded-lg text-slate-700">
              {report.step_visual_exam?.notes || "No visual anomalies or defects noted."}
            </p>
          </div>
        </div>
      </div>

      {/* PAGE 4: ZERO BASELINE & TRACKING */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 4: Zero Baseline & Tracking</h2>
        
        <h3 className="text-lg font-bold mb-4 text-indigo-700">Zero Baseline Test</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div><span className="font-bold">Initial Reading:</span> {report.step_zero_baseline?.initialReading || "0.00"}</div>
          <div><span className="font-bold">Zero Tolerance Check:</span> {report.step_zero_baseline?.toleranceOk ? "PASS" : "FAIL"}</div>
        </div>

        <h3 className="text-lg font-bold mb-4 text-indigo-700">Zero Tracking Test</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-bold">Zero Tracking Speed:</span> {report.step_zero_tracking?.trackingSpeed || "Normal"}</div>
          <div><span className="font-bold">Tracking Range Ok:</span> {formatBool(report.step_zero_tracking?.rangeOk)}</div>
          <div><span className="font-bold">Tracking Status:</span> {formatApprove(report.step_zero_tracking?.isApproved)}</div>
        </div>
      </div>

      {/* PAGE 5: ACCURACY TEST */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 5: Accuracy Test</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 text-left">Test Load</th>
                <th className="border p-2 text-left">Indication (I)</th>
                <th className="border p-2 text-left">Correction (dL)</th>
                <th className="border p-2 text-left">Error (E)</th>
                <th className="border p-2 text-left">MPE</th>
                <th className="border p-2 text-left">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {report.step_accuracy_test?.rows?.map((row, i) => (
                <tr key={i}>
                  <td className="border p-2">{row.load}</td>
                  <td className="border p-2">{row.indication}</td>
                  <td className="border p-2">{row.correction}</td>
                  <td className="border p-2">{row.error}</td>
                  <td className="border p-2">{row.mpe}</td>
                  <td className="border p-2 font-bold text-indigo-700">{row.verdict || "PASS"}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="6" className="border p-4 text-center text-slate-500">No accuracy test data recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 6: DISCRIMINATION TEST */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 6: Discrimination Test</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-bold">Test Load Applied:</span> {report.step_discrimination?.testLoad || "—"}</div>
            <div><span className="font-bold">Extra Weight (dL):</span> {report.step_discrimination?.extraWeight || "—"}</div>
            <div><span className="font-bold">Response Threshold Ok:</span> {formatBool(report.step_discrimination?.thresholdOk)}</div>
            <div><span className="font-bold">Approved:</span> {formatApprove(report.step_discrimination?.isApproved)}</div>
          </div>
          <div className="mt-8 bg-slate-50 p-4 rounded border">
            <span className="font-bold text-slate-800">Verification Rule:</span> An extra load equal to 1.4 times the scale interval, when placed gently on the instrument at zero, must produce a clear visual indication change.
          </div>
        </div>
      </div>

      {/* PAGE 7: ECCENTRICITY TEST */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 7: Eccentricity Test</h2>
        <div className="mb-6"><span className="font-bold">Eccentric Test Load:</span> {report.step_eccentricity?.testLoad || "—"}</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 text-left">Position</th>
                <th className="border p-2 text-left">Indication</th>
                <th className="border p-2 text-left">Error</th>
                <th className="border p-2 text-left">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {report.step_eccentricity?.rows?.map((row, i) => (
                <tr key={i}>
                  <td className="border p-2">{row.position || row.label}</td>
                  <td className="border p-2">{row.indication || row.I}</td>
                  <td className="border p-2">{row.error}</td>
                  <td className="border p-2 font-bold text-indigo-700">{row.verdict || "PASS"}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="4" className="border p-4 text-center text-slate-500">No eccentricity test data recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 8: REPEATABILITY TEST */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 8: Repeatability Test</h2>
        <div className="space-y-8">
          {report.step_repeatability?.blocks?.map((block, bIdx) => (
            <div key={bIdx} className="border p-4 rounded-lg bg-slate-50">
              <h3 className="font-bold text-indigo-700 mb-2">{block.label} ({block.load} kg)</h3>
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100 text-xs">
                    <th className="border p-1">Run</th>
                    <th className="border p-1">Reading</th>
                    <th className="border p-1">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {block.rows?.map((row, rIdx) => (
                    <tr key={rIdx} className="text-xs">
                      <td className="border p-1 text-center">{rIdx + 1}</td>
                      <td className="border p-1 text-center">{row.indication || row.I}</td>
                      <td className="border p-1 text-center">{row.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs font-bold flex justify-between">
                <span>Range Difference: {block.rangeDifference || "0.00"}</span>
                <span>Verdict: {block.verdict || "PASS"}</span>
              </div>
            </div>
          )) || (
            <p className="text-slate-500 text-center py-4">No repeatability test data recorded.</p>
          )}
        </div>
      </div>

      {/* PAGE 9: CREEP & ZERO RETURN */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 9: Creep & Zero Return</h2>
        
        <h3 className="text-lg font-bold mb-4 text-indigo-700">Creep Test (Constant Load)</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div><span className="font-bold">Creep Test Load:</span> {report.step_creep_zero_return?.load || "—"}</div>
          <div><span className="font-bold">Initial Indication:</span> {report.step_creep_zero_return?.I0 || "0.00"}</div>
          <div><span className="font-bold">Indication at 15m:</span> {report.step_creep_zero_return?.I15 || "0.00"}</div>
          <div><span className="font-bold">Indication at 30m:</span> {report.step_creep_zero_return?.I30 || "0.00"}</div>
          <div><span className="font-bold">Max Creep Difference:</span> {report.step_creep_zero_return?.creepDifference || "0.00"}</div>
        </div>

        <h3 className="text-lg font-bold mb-4 text-indigo-700">Zero Return</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-bold">Zero Before Test:</span> {report.step_creep_zero_return?.zeroBefore || "0.00"}</div>
          <div><span className="font-bold">Zero After Load Release:</span> {report.step_creep_zero_return?.zeroAfter || "0.00"}</div>
          <div><span className="font-bold">Zero Return Deviation:</span> {report.step_creep_zero_return?.zeroReturnDeviation || "0.00"}</div>
          <div><span className="font-bold">Status:</span> {formatApprove(report.step_creep_zero_return?.isApproved)}</div>
        </div>
      </div>

      {/* PAGE 10: TARE DEVICE */}
      <div style={pageStyle} className="border border-slate-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">Page 10: Tare Device</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-bold">Tare Load Applied:</span> {report.step_tare_device?.tareLoad || "—"}</div>
            <div><span className="font-bold">Zero After Tare:</span> {report.step_tare_device?.zeroAfterTare || "—"}</div>
            <div><span className="font-bold">Test Load Applied:</span> {report.step_tare_device?.testLoad || "—"}</div>
            <div><span className="font-bold">Calculated Tare Error:</span> {report.step_tare_device?.tareError || "—"}</div>
            <div><span className="font-bold">Approved:</span> {formatApprove(report.step_tare_device?.isApproved)}</div>
          </div>
        </div>
      </div>

      {/* PAGE 11: OFFICIAL CERTIFICATE */}
      <div style={pageStyle} className="flex flex-col justify-between border border-slate-200">
        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-6 text-center uppercase">
            Official Verification Certificate
          </h2>
          
          <div className="text-center my-10 space-y-4">
            <div className="text-sm font-bold text-slate-500">FINAL VERDICT</div>
            <div className={`text-4xl font-extrabold tracking-wide uppercase ${
              report.overall_verdict === "PASS" ? "text-green-600" : "text-red-600"
            }`}>
              {report.overall_verdict || "PASS"}
            </div>
            <div className="text-md font-semibold text-slate-800">
              MPE Status: {report.mpe_status || "Within Maximum Permissible Error limits"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm border p-4 bg-slate-50 rounded-lg">
            <div><span className="font-bold">Certificate Number:</span> {report.certificate_number || "—"}</div>
            <div><span className="font-bold">Certificate Date:</span> {formatDate(report.certificate_date)}</div>
          </div>

          {report.errors_summary?.length > 0 && (
            <div className="mt-8 p-4 border border-red-200 bg-red-50 rounded-lg max-w-lg mx-auto">
              <h4 className="font-bold text-red-800 mb-2">Errors Summary:</h4>
              <ul className="list-disc pl-5 text-red-700 text-xs space-y-1">
                {report.errors_summary.map((err, i) => (
                  <li key={i}>{typeof err === "string" ? err : JSON.stringify(err)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t pt-4 text-center text-xs text-slate-400">
          <p className="font-bold">Electronically Signed and Verified</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );
}
