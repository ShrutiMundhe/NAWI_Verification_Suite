import React, { useState } from "react";
import { Scale, Shield, AlertCircle } from "lucide-react";

export default function LoginView({ onLogin }) {
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Technician name is required.");
      return;
    }
    if (!credentials.trim()) {
      setError("Credentials / License Number is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    setError("");
    const formattedEmail = email.trim().toLowerCase();
    const isAdmin = formattedEmail === "ilmchikhli@gmail.com";

    onLogin({
      name: name.trim(),
      credentials: credentials.trim(),
      email: formattedEmail,
      role: isAdmin ? "admin" : "user"
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
            <Scale size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-300">
            NAWI Suite
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Non-Automatic Weighing Instrument Verification Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-800/60">
            <Shield className="text-indigo-400" size={20} />
            <h2 className="text-lg font-bold text-white">Technician Authorization</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-300 rounded-lg">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Technician Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Credentials / Seal ID
              </label>
              <input
                type="text"
                placeholder="Enter your license no"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your mail id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              Authorize & Enter Suite
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-600">
          Weighcal Metrology Services © 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}