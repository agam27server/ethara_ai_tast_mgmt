import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, ...userData } = response.data;
      localStorage.setItem("token", token);
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || "Login failed. Please check credentials.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post("/auth/register", { name, email, password, role });
      const { token, ...userData } = response.data;
      localStorage.setItem("token", token);
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || "Registration failed. Try again.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = () => {
    return user && user.role === "Admin";
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
