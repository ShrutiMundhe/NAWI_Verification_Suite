import React, { useState, useEffect } from "react";
import { adminService } from "../../services/api.js";
import { Loader2, Check, X, ShieldAlert, Clock, UserCheck, RefreshCw, User, Mail, Award } from "lucide-react";

export default function PendingApprovals({ onCountChange }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionUserId, setActionUserId] = useState(null);

  const fetchPending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.listPendingUsers();
      const list = res.users || res.pendingUsers || res || [];
      setPendingUsers(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      setError(err.message || "Failed to load pending users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId, name) => {
    setActionUserId(userId);
    try {
      await adminService.updateUserStatus(userId, "approved");
      setPendingUsers((prev) => {
        const nextList = prev.filter((u) => (u.id || u._id) !== userId);
        if (onCountChange) onCountChange(nextList.length);
        return nextList;
      });
    } catch (err) {
      alert(`Failed to approve ${name || "user"}: ${err.message}`);
    } finally {
      setActionUserId(null);
    }
  };

  const handleReject = async (userId, name) => {
    if (!window.confirm(`Reject this account (${name || "user"})? This will deactivate access for this inspector.`)) {
      return;
    }
    setActionUserId(userId);
    try {
      await adminService.updateUserStatus(userId, "rejected");
      setPendingUsers((prev) => {
        const nextList = prev.filter((u) => (u.id || u._id) !== userId);
        if (onCountChange) onCountChange(nextList.length);
        return nextList;
      });
    } catch (err) {
      alert(`Failed to reject ${name || "user"}: ${err.message}`);
    } finally {
      setActionUserId(null);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold">
            <Clock size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              User Approvals
              {pendingUsers.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300">
              Review and authorize pending inspector registrations before granting system access
            </p>
          </div>
        </div>

        <button
          onClick={fetchPending}
          disabled={isLoading}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-all cursor-pointer"
          title="Refresh list"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Body Area */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
          <span className="text-xs font-medium">Checking pending inspector approvals...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-600 bg-red-50 text-xs font-medium flex items-center justify-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      ) : pendingUsers.length === 0 ? (
        /* Empty State */
        <div className="p-10 text-center flex flex-col items-center justify-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <UserCheck size={24} />
          </div>
          <p className="font-bold text-sm text-slate-700">No accounts awaiting approval</p>
          <p className="text-xs text-slate-400 max-w-sm">
            All registered inspector accounts have cleared administrative review. New registration requests will appear here automatically.
          </p>
        </div>
      ) : (
        /* Table List */
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Inspector Name</th>
                <th className="py-3 px-5">Email Address</th>
                <th className="py-3 px-5">Official ID Number</th>
                <th className="py-3 px-5">Date Registered</th>
                <th className="py-3 px-5 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingUsers.map((u) => {
                const uId = u.id || u._id;
                const isWorking = actionUserId === uId;
                const name = u.name || u.username || "Inspector";

                return (
                  <tr key={uId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold">{name}</div>
                        <div className="text-[10px] text-amber-600 font-semibold uppercase">{u.role || "user"}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-slate-800 font-semibold">
                      {u.idNumber || u.credentials || "INSP-PENDING"}
                    </td>

                    <td className="py-3.5 px-5 text-slate-400">
                      {timeAgo(u.createdAt || u.created_at)}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(uId, name)}
                          disabled={isWorking}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          {isWorking ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(uId, name)}
                          disabled={isWorking}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
