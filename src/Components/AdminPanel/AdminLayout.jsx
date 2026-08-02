import React, { useState } from "react";
import { Navigate, Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import UserProfileModal from "../UserProfileModal.jsx";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  History,
  LogOut,
  User as UserIcon,
  Menu,
  Scale
} from "lucide-react";

const ADMIN_EMAIL = "ilmchikhli@gmail.com";

export default function AdminLayout() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Guard routing
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/verification" replace />;
  }

  const navigationItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Pending Approvals", path: "/admin/pending", icon: Scale },
    { label: "Verification Reports", path: "/admin/reports", icon: FileSpreadsheet },
    { label: "Clients Directory", path: "/admin/clients", icon: Users },
    { label: "Audit Logs", path: "/admin/audit", icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Mobile Menu Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 transform md:relative md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-6 py-7 border-b border-slate-800 flex items-center justify-start">
            <img src="/Icon.png" alt="Logo" className="h-20 w-auto max-w-[210px] object-contain rounded-xl drop-shadow-lg" />
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & logout section */}
        <div className="p-4 border-t border-slate-800">
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-slate-950/50 hover:bg-slate-800 transition-all cursor-pointer border border-slate-800/60"
            title="Click to edit profile"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md border border-indigo-500/30">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.username || user?.name || user?.email || "A").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="overflow-hidden truncate">
              <div className="font-bold text-white text-xs truncate">{user?.username || user?.name || "Admin"}</div>
              <div className="text-[10px] text-indigo-400 font-mono truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/30 rounded-xl border border-red-900/30 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
              {navigationItems.find((item) => item.path === location.pathname)?.label || "Administration"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/verification"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
            >
              Back to Suite
            </Link>
          </div>
        </header>

        {/* Content Outlet scroll area */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
