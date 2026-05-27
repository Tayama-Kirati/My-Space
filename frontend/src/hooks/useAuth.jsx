import { useState, useEffect, useCallback, useContext, createContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then((res) => {
        const u = res.data.user;
        localStorage.setItem("authUserId", u._id);
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUserId");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const token = response.data.token || response.data.accessToken;
      const u = response.data.user;
      if (!token || !u) throw new Error("Invalid login response from server");
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUserId", u._id);
      setUser(u);
      setError(null);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async ({ email, username, password, firstName, lastName }) => {
    try {
      const response = await api.post("/auth/register", { email, username, password, firstName, lastName });
      const token = response.data.token || response.data.accessToken;
      const u = response.data.user;
      if (!token || !u) throw new Error("Invalid register response from server");
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUserId", u._id);
      setUser(u);
      setError(null);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.response?.data?.message || err.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUserId");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
