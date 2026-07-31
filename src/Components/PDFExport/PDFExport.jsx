import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import html2pdf from "html2pdf.js";
import { Download, Loader2 } from "lucide-react";
import { reportsService } from "../../services/api.js";
import PDFTemplate from "./PDFTemplate.jsx";

export default function PDFExport({ reportId, reportNumber }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      // 1. Fetch detailed report data from API
      const report = await reportsService.getReport(reportId);
      
      // 2. Create a temporary hidden DOM container to mount the template
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      document.body.appendChild(tempDiv);

      // 3. Render PDFTemplate inside container
      const root = ReactDOM.createRoot(tempDiv);
      root.render(<PDFTemplate report={report} />);

      // Wait brief moment for React to finish rendering in DOM
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Configure html2pdf options
      const opt = {
        margin: [10, 10, 10, 10], // 10mm margins
        filename: `NAWI_Report_${reportNumber || report.report_number || "export"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // 5. Convert HTML container to PDF and download
      await html2pdf().from(tempDiv).set(opt).save();

      // Clean up temporary DOM container
      document.body.removeChild(tempDiv);
    } catch (err) {
      console.error("PDF Export Error:", err);
      setError("Failed to export PDF report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {isExporting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download size={14} />
            Export PDF
          </>
        )}
      </button>
      {error && <span className="text-[10px] text-red-500 mt-1">{error}</span>}
    </div>
  );
}
