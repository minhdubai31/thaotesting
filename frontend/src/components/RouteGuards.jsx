import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../auth/AuthContext";

function FullPageSpin() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <Spin size="large" />
    </div>
  );
}

// Customer pages: must be signed in.
export function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpin />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// Admin pages: must be signed in with a staff role.
export function RequireStaff() {
  const { isAuthenticated, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpin />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <Outlet />;
}
