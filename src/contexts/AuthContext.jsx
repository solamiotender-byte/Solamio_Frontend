// contexts/AuthContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext({});
const API_BASE_URL = "https://solar-backend-1-4szm.onrender.com/api/v1";


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /* ===============================
     CHECK AUTHENTICATION
  =============================== */

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) return false;

    try {
      const parsedUser = JSON.parse(savedUser);
      return !!(parsedUser && parsedUser.email && parsedUser.role);
    } catch {
      return false;
    }
  }, []);

  /* ===============================
     INIT AUTH FROM LOCAL STORAGE
  =============================== */

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (token && savedUser && isAuthenticated()) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated]);

  /* ===============================
     API HELPER
  =============================== */

  const fetchAPI = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const config = {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          setUser(null);
          window.location.href = "/login";
        }
        throw new Error(data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }, []);

  /* ===============================
     SAFE API HELPER
  =============================== */

  const safeFetchAPI = useCallback(
    async (endpoint, options = {}) => {
      try {
        const result = await fetchAPI(endpoint, options);
        return { success: true, ...result };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Request failed",
        };
      }
    },
    [fetchAPI],
  );

  /* ===============================
     LOGIN
  =============================== */

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const token = response.result?.token || response.token;
      const userData = response.result?.user || response.result || response;

      if (!token) throw new Error("No token received");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setSuccess("Login successful");

      return { success: true, user: userData, token };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     LOGOUT
  =============================== */

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  /* ===============================
     ROLE HELPERS
  =============================== */

  // ✅ FIX: Define punchIn and punchOut as proper functions
  const punchIn = useCallback(
    async (locationData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAPI("/attendance/punch-in", {
          method: "POST",
          body: JSON.stringify(locationData),
        });

        if (response.success) {
          // Update user or do any other necessary state updates
          setUser((prev) => ({
            ...prev,
            lastPunchIn: new Date().toISOString(),
          }));
        }

        return response;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI],
  );

  const punchOut = useCallback(
    async (locationData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAPI("/attendance/punch-out", {
          method: "POST",
          body: JSON.stringify(locationData),
        });

        if (response.success) {
          // Update user or do any other necessary state updates
          setUser((prev) => ({
            ...prev,
            lastPunchOut: new Date().toISOString(),
          }));
        }

        return response;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI],
  );

  const getUserRole = useCallback(() => user?.role || null, [user]);
  const isTeamMember = useCallback(() => user?.role === "TEAM", [user]);
  const isManager = useCallback(
    () => ["ZSM", "ASM", "Head_office"].includes(user?.role),
    [user],
  );

  const value = {
    user,
    loading,
    error,
    success,
    login,
    logout,
    fetchAPI,
    punchIn, // ✅ Make sure these are included
    punchOut,
    safeFetchAPI,
    isAuthenticated,
    getUserRole,
    isTeamMember,
    isManager,
    setError,
    setSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
