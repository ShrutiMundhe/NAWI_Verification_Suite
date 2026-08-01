import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api.js";

const AuthContext = createContext(null);
const ADMIN_EMAIL = "ilmchikhli@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("nawi_auth_token") || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify session on load
  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem("nawi_auth_token");
      if (storedToken) {
        if (storedToken.startsWith("local_token_")) {
          const savedLocalUser = localStorage.getItem("nawi_local_user");
          if (savedLocalUser) {
            try {
              setUser(JSON.parse(savedLocalUser));
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
            if (data && data.valid) {
              setUser(data.user);
              setToken(storedToken);
            } else {
              handleLogoutState();
            }
          } catch (err) {
            const savedLocalUser = localStorage.getItem("nawi_local_user");
            if (savedLocalUser) {
              try {
                setUser(JSON.parse(savedLocalUser));
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
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      if (data.success && data.token) {
        localStorage.setItem("nawi_auth_token", data.token);
        setUser(data.user);
        setToken(data.token);
        setIsLoading(false);
        return data;
      }
    } catch (err) {
      // Fallback for standalone / local mode when API server is offline
      const formattedEmail = email?.toLowerCase().trim() || "";
      const isAdmin = formattedEmail === ADMIN_EMAIL;
      const localUser = {
        id: "local_" + Date.now(),
        email: formattedEmail,
        username: extraData.name || extraData.username || formattedEmail.split("@")[0] || "Technician",
        role: isAdmin ? "admin" : "user",
        credentials: extraData.credentials || "",
      };
      const dummyToken = "local_token_" + Date.now();
      localStorage.setItem("nawi_auth_token", dummyToken);
      localStorage.setItem("nawi_local_user", JSON.stringify(localUser));
      setUser(localUser);
      setToken(dummyToken);
      setIsLoading(false);
      return { success: true, user: localUser, token: dummyToken };
    }
  };

  const register = async (email, password, username) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(email, password, username);
      if (data.success) {
        // Auto-login after successful registration
        return await login(email, password);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network errors on logout and proceed with local clearance
    } finally {
      handleLogoutState();
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  const verifyToken = async () => {
    try {
      const data = await authService.verifyToken();
      if (data && data.valid) {
        setUser(data.user);
        return true;
      }
      handleLogoutState();
      return false;
    } catch (err) {
      handleLogoutState();
      return false;
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = isAuthenticated && user?.role === "admin" && user?.email === ADMIN_EMAIL;

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
