import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { canAccess } from "@/lib/rbac";

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!canAccess(user.role, location.pathname)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
