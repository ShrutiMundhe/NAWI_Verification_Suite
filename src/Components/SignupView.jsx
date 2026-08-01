import React, { useState, useEffect } from "react";
import { inviteService } from "../services/api.js";
import { Scale, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Lock, User, Mail } from "lucide-react";

export default function SignupView({ code, onLoginSuccess }) {
  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function checkInvite() {
      if (!code) {
        setValidationError("No invite token provided.");
        setIsValidating(false);
        return;
      }
      try {
        const res = await inviteService.validateInvite(code);
        if (res.valid && res.invite) {
          setInviteData(res.invite);
          setName(res.invite.name || "");
        } else {
          setValidationError(res.message || "Invalid or expired invite token.");
        }
      } catch (err) {
        setValidationError(err.message || "Failed to validate invite token.");
      } finally {
        setIsValidating(false);
      }
    }
    checkInvite();
  }, [code]);

  // Password policy validation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;
  const isFormValid = hasMinLength && hasLetter && hasNumber && passwordsMatch && name.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await inviteService.acceptInvite(code, password, name);
      if (res.token) {
        localStorage.setItem("nawi_auth_token", res.token);
      }
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to accept invite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={36} />
          <span className="text-sm font-medium text-slate-400">Validating your invite link...</span>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950/60 text-red-400 mb-2">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Invalid or Expired Invite Link</h2>
          <p className="text-slate-400 text-sm">{validationError}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all mt-4"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 text-white mb-3">
            <img src="/Icon.png" alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Accept Invitation</h1>
          <p className="text-slate-400 text-xs mt-1">Set your account password to complete registration</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={20} />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Invite Verified</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50 uppercase">
              Role: {inviteData.role}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3 text-xs bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  disabled
                  value={inviteData.email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
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
                  placeholder="Set your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
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
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Enter Suite"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
