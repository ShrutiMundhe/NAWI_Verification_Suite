import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/api.js";
import { Loader2, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function AuditLogTable() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [actionFilter, setActionFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [users, setUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await adminService.adminGetAllUsers({ limit: 100 });
        setUsers(res.users || []);
      } catch (err) {
        console.error("Failed to load user dependencies for log filters");
      }
    }
    loadUsers();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        userId: userIdFilter || undefined,
        action: actionFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const res = await adminService.adminGetAuditLogs(params);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter, userIdFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Filters panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* User filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-500">Filter by User</span>
          <select
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username || u.email}
              </option>
            ))}
          </select>
        </div>

        {/* Action filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-500">Filter by Action</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="REGISTER">REGISTER</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE_REPORT">CREATE_REPORT</option>
            <option value="SAVE_REPORT">SAVE_REPORT</option>
            <option value="SUBMIT_REPORT">SUBMIT_REPORT</option>
            <option value="DELETE_REPORT">DELETE_REPORT</option>
            <option value="EXPORT_PDF">EXPORT_PDF</option>
            <option value="ADMIN_EDIT">ADMIN_EDIT</option>
            <option value="ADMIN_DELETE_REPORT">ADMIN_DELETE_REPORT</option>
            <option value="ADMIN_UPDATE_USER">ADMIN_UPDATE_USER</option>
          </select>
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-500">Date From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-500">Date To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
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
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">IP Address</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {l.user_id?.email || "System"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-lg tracking-wider uppercase">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {l.ip_address || "—"}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
          <span className="text-xs text-slate-500">Total {total} logs</span>
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
              disabled={logs.length < limit}
              className="p-1.5 border rounded-lg bg-white disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
