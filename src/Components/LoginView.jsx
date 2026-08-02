import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Scale, Shield, AlertCircle, CheckCircle2, Clock, User, Mail, Lock, Award, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginView({ onLogin }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regIdNumber, setRegIdNumber] = useState("");

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // UI status feedback state
  const [errorMsg, setErrorMsg] = useState("");
  const [statusType, setStatusType] = useState(null); // "pending" | "rejected" | "success" | null
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFeedback = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setStatusType(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg("Email address and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onLogin) {
        await onLogin({ email: loginEmail.trim(), password: loginPassword });
      } else {
        await login(loginEmail.trim(), loginPassword);
      }
    } catch (err) {
      if (err.status === "pending" || err.message?.includes("awaiting approval")) {
        setStatusType("pending");
        setErrorMsg("Your account is awaiting approval from the administrator.");
      } else if (err.status === "rejected" || err.message?.includes("rejected")) {
        setStatusType("rejected");
        setErrorMsg("Your account access has been rejected by the administrator.");
      } else {
        setErrorMsg(err.message || "Invalid email or password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();

    if (!regName.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg("Email Address is required.");
      return;
    }
    if (!regPassword.trim()) {
      setErrorMsg("Password is required.");
      return;
    }
    if (!regIdNumber.trim()) {
      setErrorMsg("Official Inspector ID Number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        idNumber: regIdNumber.trim(),
      });

      if (res && res.status === "approved") {
        setSuccessMsg("Master Admin registration successful! Redirecting...");
        setTimeout(() => {
          login(regEmail.trim(), regPassword);
        }, 1000);
      } else {
        setStatusType("success");
        setSuccessMsg("Registration successful! Awaiting administrator approval.");
        setRegPassword("");
      }
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please check your information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header with Enlarged Logo & Removed NAWI Suite Text */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src="/Icon.png"
              alt="Logo"
              className="h-28 w-auto max-w-[280px] object-contain drop-shadow-2xl rounded-2xl"
            />
          </div>
          <p className="text-slate-400 mt-1 text-xs">
            Non-Automatic Weighing Instrument Verification Portal
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 mb-4 shadow-lg">
          <button
            type="button"
            onClick={() => { setMode("login"); resetFeedback(); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Inspector Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); resetFeedback(); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "register"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            New Inspector Register
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-7 shadow-2xl relative">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800/60">
            <Shield className="text-indigo-400" size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {mode === "login" ? "Technician Authorization" : "Official Inspector Registration"}
            </h2>
          </div>

          {/* Success Notification Banner */}
          {successMsg && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs font-semibold flex items-start gap-3 shadow-md animate-fadeIn">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm">Registration Successful!</div>
                <div className="mt-0.5 text-emerald-300">{successMsg}</div>
              </div>
            </div>
          )}

          {/* Pending Approval Notice Card */}
          {statusType === "pending" && (
            <div className="mb-5 p-4 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 text-xs font-medium flex items-start gap-3 shadow-md animate-fadeIn">
              <Clock size={20} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-amber-300 text-xs uppercase tracking-wider">Account Approval Pending</div>
                <div className="mt-1 text-slate-200 leading-relaxed">
                  Your account is awaiting approval from the administrator. Once approved, you will have immediate access to the Verification Suite.
                </div>
              </div>
            </div>
          )}

          {/* Rejected Account Alert Card */}
          {statusType === "rejected" && (
            <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs font-medium flex items-start gap-3 shadow-md animate-fadeIn">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-300 text-xs uppercase tracking-wider">Access Rejected</div>
                <div className="mt-1 text-slate-200 leading-relaxed">
                  Your account access has been rejected by the administrator. Please contact system support for authorization.
                </div>
              </div>
            </div>
          )}

          {/* General Error Message */}
          {errorMsg && !statusType && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 text-xs bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-400" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your mail id"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-400" /> Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Authenticating..." : "Authorize & Enter Suite"}
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-indigo-400" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-400" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your mail id"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-400" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Award size={13} className="text-indigo-400" /> Official Inspector ID Number
                </label>
                <input
                  type="text"
                  placeholder="Enter your license no"
                  value={regIdNumber}
                  onChange={(e) => setRegIdNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Submitting Registration..." : "Submit Registration for Admin Approval"}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-600">
          Weighcal Metrology Services © 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}