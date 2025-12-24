// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "./app/layouts/PublicLayout";
import { AdminLayout } from "./app/layouts/AdminLayout";
import { RequireAuth } from "./app/guards/RequireAuth";
import { RequireVehicleType } from "./app/guards/RequireVehicleType";

import { VehiclesPage } from "./pages/public/VehiclesPage";
import { VehicleDetailsPage } from "./pages/public/VehicleDetailsPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { VehicleListPage } from "./features/vehicles/components/VehicleListPage";
import { ComparePage } from "./features/vehicles/pages/ComparePage";

// ✅ Selector
import { VehicleTypeSelectPage } from "./pages/public/VehicleTypeSelectPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        {/* Entry choice */}
        <Route path="/" element={<VehicleTypeSelectPage />} />

        {/* ✅ Guarded public flow */}
        <Route
          path="/vehicles"
          element={
            <RequireVehicleType>
              <VehiclesPage />
            </RequireVehicleType>
          }
        />
        <Route
          path="/vehicles/:slug"
          element={
            <RequireVehicleType>
              <VehicleDetailsPage />
            </RequireVehicleType>
          }
        />
        <Route
          path="/compare"
          element={
            <RequireVehicleType>
              <ComparePage />
            </RequireVehicleType>
          }
        />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
