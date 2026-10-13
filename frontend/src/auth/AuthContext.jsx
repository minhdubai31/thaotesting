import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../lib/api";
import { STAFF_ROLES } from "../lib/format";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const clearSession = useCallback(() => {
    setToken("");
    setTokenState("");
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api("/api/me")
      .then((data) => setUser(data.user))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [token, clearSession]);

  const startSession = useCallback((data) => {
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (identifier, password) =>
      startSession(await api("/api/login", { method: "POST", body: { identifier, password } })),
    [startSession]
  );

  const signup = useCallback(
    async (values) => startSession(await api("/api/signup", { method: "POST", body: values })),
    [startSession]
  );

  const isAuthenticated = Boolean(token && user);
  const isStaff = Boolean(user?.roles?.some((role) => STAFF_ROLES.includes(role)));

  const value = useMemo(
    () => ({ token, user, loading, login, signup, logout: clearSession, isAuthenticated, isStaff }),
    [token, user, loading, login, signup, clearSession, isAuthenticated, isStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
