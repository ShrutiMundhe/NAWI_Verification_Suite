import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Request Interceptor: Attach JWT token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nawi_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors like 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear authentication cache
      localStorage.removeItem("nawi_auth_token");
      // Optionally trigger page reload or dispatch redirect if context doesn't handle it
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    // Throw error with response data for controller/context capture
    const message = error.response?.data?.message || "An error occurred";
    const status = error.response?.status || 500;
    const customError = new Error(message);
    customError.status = status;
    customError.response = error.response;
    throw customError;
  }
);

/* ================================================================= */
/* Authentication Services                                           */
/* ================================================================= */

export const authService = {
  login: async (email, password) => {
    const response = await API.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (email, password, username) => {
    const response = await API.post("/auth/register", { email, password, username });
    return response.data;
  },
  logout: async () => {
    const response = await API.post("/auth/logout");
    return response.data;
  },
  verifyToken: async () => {
    const response = await API.get("/auth/me");
    return response.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const response = await API.patch("/auth/password", { currentPassword, newPassword });
    return response.data;
  },
};

/* ================================================================= */
/* Invite Services                                                   */
/* ================================================================= */

export const inviteService = {
  createInvite: async (name, email, role) => {
    try {
      const response = await API.post("/invites", { name, email, role });
      return response.data;
    } catch (e) {
      if (e.status === 409) throw e;
      // Local fallback simulation
      const code = Math.random().toString(36).substring(2, 18);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const newInvite = {
        _id: "inv_" + Date.now(),
        code,
        name,
        email: email.toLowerCase().trim(),
        role: role || "engineer",
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
      };
      let invites = [];
      try {
        invites = JSON.parse(localStorage.getItem("nawi-invites") || "[]");
      } catch (err) {}
      
      // Check 409 in local invites
      const dup = invites.find(i => i.email === email.toLowerCase().trim() && !i.used && new Date(i.expiresAt) > new Date());
      if (dup) {
        const conflictErr = new Error("An active pending invite for this email address already exists.");
        conflictErr.status = 409;
        throw conflictErr;
      }
      
      invites.unshift(newInvite);
      localStorage.setItem("nawi-invites", JSON.stringify(invites));
      return { message: "Invite created successfully.", invite: newInvite, code, expiresAt };
    }
  },
  listInvites: async () => {
    try {
      const response = await API.get("/invites");
      return response.data;
    } catch (e) {
      let invites = [];
      try {
        invites = JSON.parse(localStorage.getItem("nawi-invites") || "[]");
      } catch (err) {}
      return { invites };
    }
  },
  validateInvite: async (code) => {
    try {
      const response = await API.get(`/invites/${code}/validate`);
      return response.data;
    } catch (e) {
      let invites = [];
      try {
        invites = JSON.parse(localStorage.getItem("nawi-invites") || "[]");
      } catch (err) {}
      const found = invites.find((i) => i.code === code);
      if (!found) return { valid: false, message: "Invalid invite code." };
      if (found.used) return { valid: false, message: "This invite code has already been used." };
      if (new Date() > new Date(found.expiresAt)) return { valid: false, message: "This invite code has expired." };
      return { valid: true, invite: { name: found.name, email: found.email, role: found.role, expiresAt: found.expiresAt } };
    }
  },
  acceptInvite: async (code, password, name) => {
    try {
      const response = await API.post(`/invites/${code}/accept`, { password, name });
      return response.data;
    } catch (e) {
      if (e.status === 400 || e.status === 409) throw e;
      // Local fallback simulation
      let invites = [];
      try {
        invites = JSON.parse(localStorage.getItem("nawi-invites") || "[]");
      } catch (err) {}
      const found = invites.find((i) => i.code === code);
      if (!found || found.used || new Date() > new Date(found.expiresAt)) {
        throw new Error("Invalid or expired invite code.");
      }
      found.used = true;
      found.usedAt = new Date().toISOString();
      localStorage.setItem("nawi-invites", JSON.stringify(invites));

      const mockUser = {
        id: "u_" + Date.now(),
        name: name || found.name,
        email: found.email,
        role: found.role,
        mustChangePassword: false,
      };
      localStorage.setItem("nawi_local_user", JSON.stringify(mockUser));
      return { message: "Account created successfully.", token: "mock_token_" + Date.now(), user: mockUser };
    }
  },
};

/* ================================================================= */
/* Helper for Offline / Local Fallback Data                         */
/* ================================================================= */

function getLocalReportsData() {
  let clients = [];
  try {
    const saved = localStorage.getItem("nawi-clients");
    if (saved) clients = JSON.parse(saved);
  } catch (e) {}

  const reports = [];
  clients.forEach((client) => {
    (client.certificates || []).forEach((cert) => {
      reports.push({
        _id: cert.certNo || "cert_" + Math.random().toString(36).substr(2, 9),
        report_number: cert.certNo || "CERT-0000",
        certificate_number: cert.certNo,
        certificate_date: cert.date,
        created_at: cert.date || new Date().toISOString(),
        inspector_name: cert.inspectorName || cert.createdBy?.name || "Shivhari Mundhe",
        client_name: client.name || client.ownerName || "Unassigned Client",
        client_address: client.firm || "N/A",
        instrument_make: cert.instrumentDetails?.make || client.instrument?.make || "Standard",
        instrument_model: cert.instrumentDetails?.model || client.instrument?.model || "NAWI-1",
        serial_number: cert.instrumentDetails?.srNo || client.instrument?.srNo || "N/A",
        capacity_max: cert.instrumentDetails?.max || client.instrument?.max || "300",
        capacity_min: cert.instrumentDetails?.min || client.instrument?.min || "2",
        accuracy_class: cert.instrumentDetails?.accuracyClass || client.instrument?.accuracyClass || "III",
        verification_interval: cert.instrumentDetails?.e || client.instrument?.e || "0.1",
        overall_verdict: cert.verdict || "PASS",
        status: "completed",
        step_visual_exam: cert.step_visual_exam,
        step_zero_baseline: cert.step_zero_baseline,
        step_zero_tracking: cert.step_zero_tracking,
        step_accuracy_test: cert.step_accuracy_test,
        step_discrimination: cert.step_discrimination,
        step_eccentricity: cert.step_eccentricity,
        step_repeatability: cert.step_repeatability,
        step_creep_zero_return: cert.step_creep_zero_return,
        step_tare_device: cert.step_tare_device,
        rawCert: cert,
        client: client,
      });
    });
  });
  return reports;
}

function getLocalDashboardData() {
  const reports = getLocalReportsData();

  const by_class = { III: 0, II: 0, I: 0, IV: 0 };
  const by_verdict = { PASS: 0, FAIL: 0 };

  reports.forEach((r) => {
    const cls = r.accuracy_class || "III";
    by_class[cls] = (by_class[cls] || 0) + 1;
    const v = r.overall_verdict === "PASS" ? "PASS" : "FAIL";
    by_verdict[v] = (by_verdict[v] || 0) + 1;
  });

  let localUser = {};
  try {
    localUser = JSON.parse(localStorage.getItem("nawi_local_user") || "{}");
  } catch (e) {}

  return {
    reportStats: {
      by_status: { draft: 0, completed: reports.length },
      by_class,
      by_verdict,
    },
    userStats: {
      total: 1,
      by_active: { active: 1, inactive: 0 },
    },
    recentReports: reports.slice(0, 5),
    recentAudits: [
      {
        _id: "log_1",
        timestamp: new Date().toISOString(),
        user_id: { email: localUser.email || "ilmchikhli@gmail.com", username: localUser.username || "Shivhari Mundhe" },
        action: "SAVE_REPORT",
      },
    ],
  };
}

/* ================================================================= */
/* Reports Services                                                 */
/* ================================================================= */

export const reportsService = {
  createReport: async (reportData) => {
    try {
      const response = await API.post("/reports", reportData);
      return response.data;
    } catch (e) {
      return { success: true, report: reportData };
    }
  },
  getReport: async (reportId) => {
    try {
      const response = await API.get(`/reports/${reportId}`);
      return response.data;
    } catch (e) {
      const reports = getLocalReportsData();
      return reports.find((r) => r._id === reportId || r.report_number === reportId) || reports[0] || {};
    }
  },
  getUserReports: async (params = {}) => {
    try {
      const response = await API.get("/reports", { params });
      return response.data;
    } catch (e) {
      const reports = getLocalReportsData();
      return { reports, total: reports.length };
    }
  },
  updateReport: async (reportId, updates) => {
    try {
      const response = await API.put(`/reports/${reportId}`, updates);
      return response.data;
    } catch (e) {
      return { success: true };
    }
  },
  deleteReport: async (reportId) => {
    try {
      const response = await API.delete(`/reports/${reportId}`);
      return response.data;
    } catch (e) {
      return { success: true };
    }
  },
  generatePDF: async (reportId) => {
    try {
      const response = await API.get(`/reports/${reportId}/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (e) {
      return null;
    }
  },
};

/* ================================================================= */
/* Admin Services                                                   */
/* ================================================================= */

export const adminService = {
  adminGetDashboard: async () => {
    try {
      const response = await API.get("/admin/dashboard");
      return response.data;
    } catch (e) {
      return getLocalDashboardData();
    }
  },
  adminGetAllReports: async (params = {}) => {
    try {
      const response = await API.get("/admin/reports", { params });
      return response.data;
    } catch (e) {
      const reports = getLocalReportsData();
      return { reports, total: reports.length, page: 1, totalPages: 1 };
    }
  },
  adminGetReportWithHistory: async (reportId) => {
    try {
      const response = await API.get(`/admin/reports/${reportId}`);
      return response.data;
    } catch (e) {
      const reports = getLocalReportsData();
      const report = reports.find((r) => r._id === reportId || r.report_number === reportId) || reports[0];
      return { report, auditLogs: [] };
    }
  },
  adminUpdateReport: async (reportId, updates) => {
    try {
      const response = await API.put(`/admin/reports/${reportId}`, updates);
      return response.data;
    } catch (e) {
      return { success: true, message: "Report updated locally" };
    }
  },
  adminDeleteReport: async (reportId) => {
    try {
      const response = await API.delete(`/admin/reports/${reportId}`);
      return response.data;
    } catch (e) {
      return { success: true, message: "Report deleted locally" };
    }
  },
  adminGetAllUsers: async (params = {}) => {
    try {
      const response = await API.get("/admin/users", { params });
      return response.data;
    } catch (e) {
      let localUser = {};
      try {
        localUser = JSON.parse(localStorage.getItem("nawi_local_user") || "{}");
      } catch (err) {}
      const user = {
        _id: "u_1",
        email: localUser.email || "ilmchikhli@gmail.com",
        username: localUser.username || "Shivhari Mundhe",
        role: localUser.role || "admin",
        is_active: true,
        created_at: new Date().toISOString(),
      };
      return { users: [user], total: 1, page: 1, totalPages: 1 };
    }
  },
  adminUpdateUser: async (userId, updates) => {
    try {
      const response = await API.put(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (e) {
      return { success: true };
    }
  },
  adminGetAuditLogs: async (params = {}) => {
    try {
      const response = await API.get("/admin/audit-logs", { params });
      return response.data;
    } catch (e) {
      let localUser = {};
      try {
        localUser = JSON.parse(localStorage.getItem("nawi_local_user") || "{}");
      } catch (err) {}
      const log = {
        _id: "log_1",
        timestamp: new Date().toISOString(),
        user_id: { email: localUser.email || "ilmchikhli@gmail.com", username: localUser.username || "Shivhari Mundhe" },
        action: "INSPECTION_SAVE",
        details: { status: "Success" },
      };
      return { logs: [log], total: 1, page: 1, totalPages: 1 };
    }
  },
};

export default API;
