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
    const response = await API.post("/auth/verify");
    return response.data;
  },
};

/* ================================================================= */
/* Reports Services                                                 */
/* ================================================================= */

export const reportsService = {
  createReport: async (reportData) => {
    const response = await API.post("/reports", reportData);
    return response.data;
  },
  getReport: async (reportId) => {
    const response = await API.get(`/reports/${reportId}`);
    return response.data;
  },
  getUserReports: async (params = {}) => {
    const response = await API.get("/reports", { params });
    return response.data;
  },
  updateReport: async (reportId, updates) => {
    const response = await API.put(`/reports/${reportId}`, updates);
    return response.data;
  },
  deleteReport: async (reportId) => {
    const response = await API.delete(`/reports/${reportId}`);
    return response.data;
  },
  generatePDF: async (reportId) => {
    const response = await API.get(`/reports/${reportId}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
};

/* ================================================================= */
/* Admin Services                                                   */
/* ================================================================= */

export const adminService = {
  adminGetDashboard: async () => {
    const response = await API.get("/admin/dashboard");
    return response.data;
  },
  adminGetAllReports: async (params = {}) => {
    const response = await API.get("/admin/reports", { params });
    return response.data;
  },
  adminGetReportWithHistory: async (reportId) => {
    const response = await API.get(`/admin/reports/${reportId}`);
    return response.data;
  },
  adminUpdateReport: async (reportId, updates) => {
    const response = await API.put(`/admin/reports/${reportId}`, updates);
    return response.data;
  },
  adminDeleteReport: async (reportId) => {
    const response = await API.delete(`/admin/reports/${reportId}`);
    return response.data;
  },
  adminGetAllUsers: async (params = {}) => {
    const response = await API.get("/admin/users", { params });
    return response.data;
  },
  adminUpdateUser: async (userId, updates) => {
    const response = await API.put(`/admin/users/${userId}`, updates);
    return response.data;
  },
  adminGetAuditLogs: async (params = {}) => {
    const response = await API.get("/admin/audit-logs", { params });
    return response.data;
  },
};

export default API;
