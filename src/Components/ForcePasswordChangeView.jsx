import React, { useState } from "react";
import { authService } from "../services/api.js";
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ForcePasswordChangeView({ onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Policy check
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError("");

    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        if (onPasswordChanged) onPasswordChanged();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Password Reset Required</h1>
          <p className="text-slate-400 text-xs mt-1">
            Your account was initialized with a temporary password. You must set a new password before continuing.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Password Updated Successfully</h3>
              <p className="text-xs text-slate-400">Redirecting to NAWI Verification Suite...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current / Temporary Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Enter current password (e.g., ChangeMe123!)"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/80"
                  />
                </div>
              </div>

              {/* Password Policy Checklist */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={13} />
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-2 ${hasLetter ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={13} />
                  <span>Contains at least one letter</span>
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={13} />
                  <span>Contains at least one number</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordsMatch ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={13} />
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password & Enter Suite"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
