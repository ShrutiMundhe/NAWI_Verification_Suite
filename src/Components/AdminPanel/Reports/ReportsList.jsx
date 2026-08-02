import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/api.js";
import PDFExport from "../../PDFExport/PDFExport.jsx";
import ReportEditModal from "./ReportEditModal.jsx";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  const [statusFilter, setStatusFilter] = useState("");
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [users, setUsers] = useState([]);
  
  // Modals state
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewDetails, setViewDetails] = useState(null);

  useEffect(() => {
    async function loadFilterDependencies() {
      try {
        const res = await adminService.adminGetAllUsers({ limit: 100 });
        setUsers(res.users || []);
      } catch (err) {
        console.error("Failed to load user list for filters");
      }
    }
    loadFilterDependencies();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        status: statusFilter || undefined,
        inspectorId: inspectorFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      
      const res = await adminService.adminGetAllReports(params);
      
      // Filter client-side by search query if present
      let reportList = res.reports || [];
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        reportList = reportList.filter(
          (r) =>
            r.report_number.toLowerCase().includes(sq) ||
            r.client_name.toLowerCase().includes(sq)
        );
      }
      
      setReports(reportList);
      setTotal(res.total || reportList.length);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [page, statusFilter, inspectorFilter, dateFrom, dateTo, searchQuery]);

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to soft-delete/archive this report?")) return;
    try {
      await adminService.adminDeleteReport(reportId);
      alert("Report successfully archived.");
      loadReports();
    } catch (err) {
      alert("Failed to delete report: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by report number or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status dropdown */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Calibration Engineer dropdown */}
          <div className="w-full md:w-48">
            <select
              value={inspectorFilter}
              onChange={(e) => setInspectorFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Calibration Engineers</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username || u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Table container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 flex items-center justify-center gap-3">
            <AlertCircle />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-400 bg-slate-50 uppercase">
                <tr>
                  <th className="py-3 px-6">Report Number</th>
                  <th className="py-3 px-6">Client Name</th>
                  <th className="py-3 px-6">Date Created</th>
                  <th className="py-3 px-6">Calibration Engineer</th>
                  <th className="py-3 px-6">Verdict</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{r.report_number}</td>
                    <td className="py-4 px-6">{r.client_name}</td>
                    <td className="py-4 px-6 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-6">{r.inspector_name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        r.overall_verdict === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>{r.overall_verdict}</span>
                    </td>
                    <td className="py-4 px-6 uppercase text-xs font-semibold text-slate-400">{r.status}</td>
                    <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewDetails(r)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReportId(r._id);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Edit report"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Archive report"
                      >
                        <Trash2 size={16} />
                      </button>
                      <PDFExport reportId={r._id} reportNumber={r.report_number} reportData={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
          <span className="text-xs text-slate-500">Total {total} reports</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border rounded-lg bg-white disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={reports.length < limit}
              className="p-1.5 border rounded-lg bg-white disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {isEditModalOpen && (
        <ReportEditModal
          reportId={selectedReportId}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedReportId(null);
            loadReports();
          }}
        />
      )}

      {/* Inline details sheet */}
      {viewDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Report Details - {viewDetails.report_number}</h3>
            <pre className="text-xs bg-slate-50 p-4 rounded-xl font-mono overflow-auto max-h-[50vh]">
              {JSON.stringify(viewDetails, null, 2)}
            </pre>
            <button
              onClick={() => setViewDetails(null)}
              className="mt-6 px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
