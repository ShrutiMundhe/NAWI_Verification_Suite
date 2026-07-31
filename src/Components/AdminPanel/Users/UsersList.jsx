import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/api.js";
import { Loader2, AlertCircle, ShieldAlert, ToggleLeft, ToggleRight, Edit, Check, X } from "lucide-react";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, activeFilter]);

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
    <div className="space-y-6">
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
            <option value="user">User</option>
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
                  <th className="py-3 px-6">Username</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Phone</th>
                  <th className="py-3 px-6">Last Login</th>
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
                      <td className="py-4 px-6">{u.username || "—"}</td>
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
                        {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="hover:opacity-80 transition-opacity"
                        >
                          {u.is_active ? (
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
