import React, { useState, useEffect } from "react";
import { adminService, inviteService } from "../../../services/api.js";
import { Loader2, AlertCircle, ToggleLeft, ToggleRight, Edit, Check, X, UserPlus, Copy, CheckCheck, Link2 } from "lucide-react";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("engineer");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const [invitesList, setInvitesList] = useState([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);

  // User edit state
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDept, setEditDept] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        role: roleFilter || undefined,
        active: activeFilter || undefined,
      };
      const res = await adminService.adminGetAllUsers(params);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load users list");
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvites = async () => {
    setIsLoadingInvites(true);
    try {
      const res = await inviteService.listInvites();
      setInvitesList(res.invites || []);
    } catch (err) {
      console.error("Failed to load invites:", err);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadInvites();
  }, [page, roleFilter, activeFilter]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setIsCreatingInvite(true);
    setInviteError("");
    setGeneratedInviteUrl("");

    try {
      const res = await inviteService.createInvite(inviteName.trim(), inviteEmail.trim(), inviteRole);
      const url = `${window.location.origin}/?code=${res.code}`;
      setGeneratedInviteUrl(url);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("engineer");
      loadInvites();
    } catch (err) {
      if (err.status === 409 || err.message?.includes("already exists")) {
        setInviteError("An account or active pending invite for this email address already exists.");
      } else {
        setInviteError(err.message || "Failed to generate invite link.");
      }
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyToClipboard = (text, codeId) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(""), 2500);
  };

  const handleToggleActive = async (user) => {
    try {
      await adminService.adminUpdateUser(user._id, { is_active: !user.is_active });
      alert(`User status toggled successfully.`);
      loadUsers();
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user._id);
    setEditDept(user.department || "");
    setEditPhone(user.phone || "");
  };

  const handleSaveUser = async (userId) => {
    try {
      await adminService.adminUpdateUser(userId, { department: editDept, phone: editPhone });
      alert("User updated successfully");
      setEditingUserId(null);
      loadUsers();
    } catch (err) {
      alert("Failed to update user: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Invite New User Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <UserPlus className="text-indigo-600" size={20} />
          <h2 className="text-base font-bold text-slate-800">Invite New User</h2>
        </div>

        {inviteError && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}

        {generatedInviteUrl && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCheck size={16} /> Invite Created Successfully!
              </span>
              <span className="text-[10px] font-medium text-emerald-600">Valid for 7 Days</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInviteUrl}
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg text-slate-700 font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(generatedInviteUrl, "new_invite")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedCode === "new_invite" ? (
                  <>
                    <CheckCheck size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Rajesh Sharma"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g., rajesh@nawi.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="engineer">Engineer</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isCreatingInvite}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCreatingInvite ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <UserPlus size={16} /> Generate Invite Link
              </>
            )}
          </button>
        </form>
      </div>

      {/* Pending / Active Invites List */}
      {invitesList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-3 p-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Link2 size={16} className="text-indigo-600" /> Pending & Sent Invites ({invitesList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-400 bg-slate-50 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Created Date</th>
                  <th className="py-2.5 px-4">Expires</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitesList.map((inv) => {
                  const inviteUrl = `${window.location.origin}/?code=${inv.code}`;
                  const isExpired = new Date() > new Date(inv.expiresAt);
                  const isUsed = inv.used;
                  return (
                    <tr key={inv._id || inv.code} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{inv.name}</td>
                      <td className="py-3 px-4">{inv.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                          {inv.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(inv.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isUsed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            USED
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isUsed && !isExpired && (
                          <button
                            onClick={() => copyToClipboard(inviteUrl, inv.code)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCode === inv.code ? (
                              <CheckCheck size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                            Copy Link
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="officer">Officer</option>
            <option value="engineer">Engineer</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users table */}
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
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Phone</th>
                  <th className="py-3 px-6">Created Date</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isEditing = editingUserId === u._id;
                  return (
                    <tr key={u._id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{u.email}</td>
                      <td className="py-4 px-6">{u.name || u.username || "—"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="px-2 py-1 border rounded w-full text-xs"
                          />
                        ) : (
                          u.department || "—"
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="px-2 py-1 border rounded w-full text-xs"
                          />
                        ) : (
                          u.phone || "—"
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="hover:opacity-80 transition-opacity"
                        >
                          {u.is_active !== false ? (
                            <ToggleRight className="text-green-500" size={28} />
                          ) : (
                            <ToggleLeft className="text-slate-300" size={28} />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveUser(u._id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Edit details"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
