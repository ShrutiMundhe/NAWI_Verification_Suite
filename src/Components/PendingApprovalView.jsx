import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Clock, ShieldAlert, RefreshCw, LogOut, Mail, User, Award } from "lucide-react";

export default function PendingApprovalView() {
  const { user, logout, verifyToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    setRefreshMsg("");
    try {
      const isApprovedNow = await verifyToken();
      if (isApprovedNow) {
        setRefreshMsg("Approval confirmed! Redirecting to Suite...");
        setTimeout(() => {
          window.location.href = "/verification";
        }, 1000);
      } else {
        setRefreshMsg("Your account is still pending approval by an admin.");
      }
    } catch {
      setRefreshMsg("Could not verify status. Please try again.");
    } finally {
      setIsRefreshing(false);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glowing background spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <img src="/Icon.png" alt="Logo" className="w-20 h-20 object-contain mx-auto mb-3 drop-shadow-xl" />
          <h1 className="text-2xl font-extrabold text-white tracking-wide">NAWI Verification Suite</h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Account Pending Admin Approval</h2>
              <p className="text-xs text-amber-400 font-medium">Awaiting one-time administrator authorization</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your technician account has been registered successfully, but access to the NAWI Verification Suite requires one-time approval by a System Administrator.
          </p>

          {/* Account details card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-bold"><User size={13} className="text-indigo-400" /> Technician:</span>
              <span className="font-bold text-white">{user?.username || user?.name || "Inspector"}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-bold"><Mail size={13} className="text-indigo-400" /> Email Address:</span>
              <span className="text-slate-200">{user?.email}</span>
            </div>
            {user?.credentials && (
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 font-bold"><Award size={13} className="text-indigo-400" /> License No:</span>
                <span className="font-mono text-slate-200">{user.credentials}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
              <span className="font-bold">Requested:</span>
              <span className="text-slate-400">{timeAgo(user?.createdAt)}</span>
            </div>
          </div>

          {refreshMsg && (
            <div className="p-3 text-xs rounded-xl bg-indigo-950/50 border border-indigo-800/50 text-indigo-200 text-center font-medium">
              {refreshMsg}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={handleCheckStatus}
              disabled={isRefreshing}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Checking Status..." : "Refresh Approval Status"}
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-600">
          Weighcal Metrology Services © 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}
