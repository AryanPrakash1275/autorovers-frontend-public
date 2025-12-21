import { Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "./app/layouts/PublicLayout";
import { AdminLayout } from "./app/layouts/AdminLayout";
import { RequireAuth } from "./app/guards/RequireAuth";

import { VehiclesPage } from "./pages/public/VehiclesPage";
import { VehicleDetailsPage } from "./pages/public/VehicleDetailsPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { VehicleListPage } from "./features/vehicles/components/VehicleListPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<VehiclesPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:slug" element={<VehicleDetailsPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="vehicles" element={<VehicleListPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/vehicles" replace />} />
    </Routes>
  );
}
