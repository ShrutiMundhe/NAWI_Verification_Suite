import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/api.js";
import { X, Loader2, AlertCircle, Save, Clock } from "lucide-react";

export default function ReportEditModal({ reportId, onClose }) {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields State
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [instrumentMake, setInstrumentMake] = useState("");
  const [instrumentModel, setInstrumentModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [capacityMin, setCapacityMin] = useState("");
  const [overallVerdict, setOverallVerdict] = useState("PASS");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    async function loadReportDetails() {
      try {
        const res = await adminService.adminGetReportWithHistory(reportId);
        setReport(res.report);
        setHistory(res.history || []);
        
        // Populate form
        setClientName(res.report.client_name || "");
        setClientAddress(res.report.client_address || "");
        setInstrumentMake(res.report.instrument_make || "");
        setInstrumentModel(res.report.instrument_model || "");
        setSerialNumber(res.report.serial_number || "");
        setCapacityMax(res.report.capacity_max || "");
        setCapacityMin(res.report.capacity_min || "");
        setOverallVerdict(res.report.overall_verdict || "PASS");
        setStatus(res.report.status || "draft");
      } catch (err) {
        setError(err.message || "Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    }
    if (reportId) {
      loadReportDetails();
    }
  }, [reportId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates = {
        client_name: clientName,
        client_address: clientAddress,
        instrument_make: instrumentMake,
        instrument_model: instrumentModel,
        serial_number: serialNumber,
        capacity_max: parseFloat(capacityMax),
        capacity_min: parseFloat(capacityMin),
        overall_verdict: overallVerdict,
        status,
      };

      await adminService.adminUpdateReport(reportId, updates);
      alert("Report updated by admin");
      onClose();
    } catch (err) {
      alert("Failed to save updates: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            Admin Edit - {report?.report_number || "Loading..."}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {isLoading ? (
            <div className="col-span-2 flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : error ? (
            <div className="col-span-2 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Form Side */}
              <form onSubmit={handleSave} className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1">Report Parameters</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Client Name
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Client Address
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Instrument Make
                    <input
                      type="text"
                      value={instrumentMake}
                      onChange={(e) => setInstrumentMake(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Instrument Model
                    <input
                      type="text"
                      value={instrumentModel}
                      onChange={(e) => setInstrumentModel(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Serial Number
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Verdict
                    <select
                      value={overallVerdict}
                      onChange={(e) => setOverallVerdict(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium bg-white"
                    >
                      <option value="PASS">PASS</option>
                      <option value="CONDITIONAL">CONDITIONAL</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Max Capacity
                    <input
                      type="number"
                      value={capacityMax}
                      onChange={(e) => setCapacityMax(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                    Min Capacity
                    <input
                      type="number"
                      value={capacityMin}
                      onChange={(e) => setCapacityMin(e.target.value)}
                      className="px-3 py-2 border rounded-lg font-medium"
                      required
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg font-medium bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 mt-6"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Admin Changes"}
                </button>
              </form>

              {/* History Timeline Side */}
              <div className="space-y-4 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-6 lg:pt-0">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-1">
                  <Clock size={16} className="text-indigo-500" />
                  Modification History
                </h4>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {history.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">No modification history recorded yet.</p>
                  ) : (
                    history.map((h, i) => (
                      <div key={i} className="text-xs border p-3 rounded-xl bg-slate-50 relative">
                        <div className="font-bold text-slate-700">
                          {h.modified_by?.username || h.modified_by?.email || "System User"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(h.modified_at).toLocaleString()}
                        </div>
                        <div className="mt-2 text-slate-600">
                          Changed <span className="font-mono bg-slate-200 px-1 py-0.5 rounded">{h.field_changed}</span> from:
                          <div className="bg-white border rounded p-1 font-mono text-[10px] mt-1 truncate">
                            {JSON.stringify(h.old_value)}
                          </div>
                          to:
                          <div className="bg-white border rounded p-1 font-mono text-[10px] mt-1 truncate">
                            {JSON.stringify(h.new_value)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
