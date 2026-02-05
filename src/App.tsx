// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "./app/layouts/PublicLayout";
import { AdminLayout } from "./app/layouts/AdminLayout";
import { RequireAuth } from "./app/guards/RequireAuth";
import { RequireVehicleType } from "./app/guards/RequireVehicleType";

import { VehiclesPage } from "./pages/public/VehiclesPage";
import { VehicleDetailsPage } from "./pages/public/VehicleDetailsPage";
import { VehicleVariantsPage } from "./pages/public/VehicleVariantsPage";
import { VariantDetailsPage } from "./pages/public/VariantDetailsPage";

import { LoginPage } from "./pages/admin/LoginPage";
import { VehicleListPage } from "./features/vehicles/components/VehicleListPage";
import { ComparePage } from "./features/vehicles/pages/ComparePage";

import { VehicleTypeSelectPage } from "./pages/public/VehicleTypeSelectPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<VehicleTypeSelectPage />} />

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
          path="/vehicles/:slug/variants"
          element={
            <RequireVehicleType>
              <VehicleVariantsPage />
            </RequireVehicleType>
          }
        />

        <Route
          path="/vehicles/:slug/variants/:variantSlug"
          element={
            <RequireVehicleType>
              <VariantDetailsPage />
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

      <Route path="/login" element={<LoginPage />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
