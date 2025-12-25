import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../../features/auth/storage";

export function RequireAuth({ children }: { children: ReactElement }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}
