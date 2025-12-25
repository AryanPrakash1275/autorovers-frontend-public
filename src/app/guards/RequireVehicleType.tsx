import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSelectedVehicleType } from "../../features/vehicles/vehicleTypeStorage";

export function RequireVehicleType({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const t = getSelectedVehicleType();

  if (!t) {
    return <Navigate to="/" replace state={{ from: loc.pathname + loc.search }} />;
  }

  return <>{children}</>;
}
