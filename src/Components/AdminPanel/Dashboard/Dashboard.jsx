import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/api.js";
import {
  FileText,
  Users,
  Activity,
  Award,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await adminService.adminGetDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to fetch dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200 flex items-center gap-3">
        <AlertCircle />
        <span>{error}</span>
      </div>
    );
  }

  const { reportStats, userStats, recentReports, recentAudits } = data;

  // Format charts data
  const classChartData = Object.entries(reportStats.by_class).map(([name, value]) => ({
    name: `Class ${name}`,
    value,
  }));

  const verdictChartData = Object.entries(reportStats.by_verdict).map(([name, count]) => ({
    name,
    count,
  }));

  const metrics = [
    { label: "Draft Reports", value: reportStats.by_status.draft, icon: FileText, color: "text-indigo-600 bg-indigo-50" },
    { label: "Completed Reports", value: reportStats.by_status.completed, icon: Award, color: "text-green-600 bg-green-50" },
    { label: "Total Users", value: userStats.total, icon: Users, color: "text-amber-600 bg-amber-50" },
    { label: "Active Users", value: userStats.by_active.active, icon: Activity, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{m.label}</span>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{m.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${m.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart: Reports by Accuracy Class */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6">Reports by Accuracy Class</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {classChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Reports by Verdict */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6">Reports by Verdict</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verdictChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Reports Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4">Recent Reports</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-400 bg-slate-50 uppercase">
                <tr>
                  <th className="py-3 px-4">Report Number</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.report_number}</td>
                    <td className="py-3 px-4">{r.inspector_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.overall_verdict === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>{r.overall_verdict}</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium uppercase text-slate-400">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Logs Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4">Recent System Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-400 bg-slate-50 uppercase">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((l) => (
                  <tr key={l._id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium">{l.user_id?.username || l.user_id?.email || "System"}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 text-xs">{l.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
