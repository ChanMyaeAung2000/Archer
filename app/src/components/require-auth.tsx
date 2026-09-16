import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth-provider";

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">Loading your workspace…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
