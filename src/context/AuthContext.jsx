import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api.js";

const AuthContext = createContext(null);
const ADMIN_EMAIL = "ilmchikhli@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("nawi_auth_token") || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to ensure avatar persistence per user email
  const attachAvatar = (userData) => {
    if (!userData) return null;
    const email = userData.email?.toLowerCase().trim() || "";
    const cachedAvatar = email ? localStorage.getItem("nawi_avatar_" + email) : null;
    const avatar = userData.avatar || cachedAvatar || "";
    if (avatar && email) {
      localStorage.setItem("nawi_avatar_" + email, avatar);
    }
    return { ...userData, avatar };
  };

  // Initialize and verify session on load
  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem("nawi_auth_token");
      if (storedToken) {
        if (storedToken.startsWith("local_token_")) {
          const savedLocalUser = localStorage.getItem("nawi_local_user");
          if (savedLocalUser) {
            try {
              const parsed = JSON.parse(savedLocalUser);
              setUser(attachAvatar(parsed));
              setToken(storedToken);
            } catch {
              handleLogoutState();
            }
          } else {
            handleLogoutState();
          }
        } else {
          try {
            const data = await authService.verifyToken();
            if (data && data.valid && data.user) {
              setUser(attachAvatar(data.user));
              setToken(storedToken);
            } else {
              handleLogoutState();
            }
          } catch (err) {
            const savedLocalUser = localStorage.getItem("nawi_local_user");
            if (savedLocalUser) {
              try {
                const parsed = JSON.parse(savedLocalUser);
                setUser(attachAvatar(parsed));
                setToken(storedToken);
              } catch {
                handleLogoutState();
              }
            } else {
              handleLogoutState();
            }
          }
        }
      }
      setIsLoading(false);
    }
    initSession();
  }, []);

  const handleLogoutState = () => {
    localStorage.removeItem("nawi_auth_token");
    localStorage.removeItem("nawi_local_user");
    setUser(null);
    setToken(null);
  };

  const login = async (email, password, extraData = {}) => {
    const finalPassword = password || extraData.password || extraData.credentials || "";
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, finalPassword);
      if (data.success && data.token) {
        localStorage.setItem("nawi_auth_token", data.token);
        const finalUser = attachAvatar(data.user);
        setUser(finalUser);
        setToken(data.token);
        setIsLoading(false);
        return { ...data, user: finalUser };
      }
    } catch (err) {
      const status = err.response?.status || err.status;
      const respData = err.response?.data || {};

      // 403 Forbidden: Pending or Rejected account
      if (status === 403) {
        const errMsg = respData.message || err.message || "Your account is awaiting approval from the administrator.";
        setError(errMsg);
        setIsLoading(false);
        const customError = new Error(errMsg);
        customError.status = respData.status || (errMsg.includes("rejected") ? "rejected" : "pending");
        throw customError;
      }

      // Standalone / Local mode fallback when backend server is offline
      const formattedEmail = email?.toLowerCase().trim() || "";
      const isAdmin = formattedEmail === ADMIN_EMAIL.toLowerCase();
      const localUser = attachAvatar({
        id: "local_" + Date.now(),
        name: extraData.name || extraData.username || formattedEmail.split("@")[0] || "Technician",
        username: extraData.name || extraData.username || formattedEmail.split("@")[0] || "Technician",
        email: formattedEmail,
        idNumber: extraData.idNumber || extraData.credentials || "INSP-LOCAL",
        credentials: extraData.idNumber || extraData.credentials || "INSP-LOCAL",
        role: isAdmin ? "admin" : "user",
        status: "approved",
        approved: true,
      });
      const dummyToken = "local_token_" + Date.now();
      localStorage.setItem("nawi_auth_token", dummyToken);
      localStorage.setItem("nawi_local_user", JSON.stringify(localUser));
      setUser(localUser);
      setToken(dummyToken);
      setIsLoading(false);
      return { success: true, user: localUser, token: dummyToken };
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      setIsLoading(false);
      return data;
    } catch (err) {
      // Local dev fallback for registration when API offline
      const formattedEmail = userData.email?.toLowerCase().trim() || "";
      const isMasterAdmin = formattedEmail === ADMIN_EMAIL.toLowerCase();

      let pending = [];
      try {
        pending = JSON.parse(localStorage.getItem("nawi_pending_users") || "[]");
      } catch (e) {}

      const newPendingUser = {
        id: "u_" + Date.now(),
        name: userData.name,
        email: formattedEmail,
        idNumber: userData.idNumber,
        credentials: userData.idNumber,
        role: isMasterAdmin ? "admin" : "user",
        status: isMasterAdmin ? "approved" : "pending",
        approved: isMasterAdmin,
        createdAt: new Date().toISOString(),
      };

      if (!isMasterAdmin) {
        pending.push(newPendingUser);
        localStorage.setItem("nawi_pending_users", JSON.stringify(pending));
      }

      setIsLoading(false);
      return {
        success: true,
        message: isMasterAdmin
          ? "Master Admin account registered and approved successfully."
          : "Registration successful! Awaiting administrator approval.",
        status: newPendingUser.status,
        user: newPendingUser,
      };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      // Ignore errors on logout
    } finally {
      handleLogoutState();
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  const verifyToken = async () => {
    try {
      const data = await authService.verifyToken();
      if (data && data.valid && data.user) {
        setUser(attachAvatar(data.user));
        return true;
      }
      handleLogoutState();
      return false;
    } catch (err) {
      handleLogoutState();
      return false;
    }
  };

  const updateProfile = async (updatedFields) => {
    let finalUser = null;
    setUser((prevUser) => {
      const updated = { ...prevUser, ...updatedFields };
      const formattedEmail = updated.email?.toLowerCase().trim() || "";
      const isAdminRole = formattedEmail === ADMIN_EMAIL.toLowerCase();
      updated.role = isAdminRole ? "admin" : "user";

      if (updated.avatar && formattedEmail) {
        localStorage.setItem("nawi_avatar_" + formattedEmail, updated.avatar);
      }

      localStorage.setItem("nawi_local_user", JSON.stringify(updated));
      finalUser = updated;
      return updated;
    });

    // Save profile and avatar to MongoDB database via API
    try {
      if (finalUser) {
        await authService.updateProfile(finalUser);
      }
    } catch (err) {
      console.warn("Could not sync profile to backend MongoDB:", err);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = isAuthenticated && (user?.role === "admin" || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        register,
        verifyToken,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
