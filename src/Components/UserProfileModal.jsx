import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { User, Mail, Shield, Award, Check, X, LogOut, Camera, Lock, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"

  // Profile Details state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [credentials, setCredentials] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.username || user.name || "");
      setEmail(user.email || "");
      setCredentials(user.idNumber || user.credentials || "");
      setAvatar(user.avatar || "");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProfile({
      username: name.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      credentials: credentials.trim(),
      idNumber: credentials.trim(),
      avatar: avatar,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdSuccess(false);

    if (!currentPassword) {
      setPwdMsg("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPwdMsg("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg("New password and confirmation password do not match.");
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setPwdSuccess(true);
      setPwdMsg(res?.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdSuccess(false);
      setPwdMsg(err.message || "Incorrect current password or failed to update.");
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          className="hidden"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header with Interactive Avatar Upload */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-800">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 cursor-pointer group shrink-0 border-2 border-indigo-500/40 hover:border-indigo-400 transition-all"
            title="Click to upload profile picture"
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{(name || "U").charAt(0).toUpperCase()}</span>
            )}
            <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
              <Camera size={16} />
              <span>Change</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Account Settings</h3>
            <p className="text-xs text-slate-400">Manage account details & security credentials</p>
          </div>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab("profile"); setPwdMsg(""); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User size={14} /> Profile Details
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("password"); setPwdMsg(""); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "password"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound size={14} /> Change Password
          </button>
        </div>

        {/* TAB 1: PROFILE DETAILS FORM */}
        {activeTab === "profile" ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-indigo-400" /> Technician Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-400" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your mail id"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Award size={14} className="text-indigo-400" /> Official Inspector ID Number
              </label>
              <input
                type="text"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="Enter your license no"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Shield size={14} className="text-indigo-400" /> Assigned Role
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{user?.role || "user"}</span>
                <span className="text-[10px] text-slate-500 font-normal">System Role</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaved}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check size={16} className="text-emerald-400" /> Saved Profile Changes!
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: SECURE CHANGE PASSWORD FORM */
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  pwdSuccess
                    ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-200"
                    : "bg-red-950/60 border border-red-800/60 text-red-200"
                }`}
              >
                {pwdSuccess ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-red-400 shrink-0" />}
                <span>{pwdMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-indigo-400" /> Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound size={13} className="text-indigo-400" /> New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-indigo-400" /> Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isUpdatingPwd}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUpdatingPwd ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
