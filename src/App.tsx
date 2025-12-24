import { Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "./app/layouts/PublicLayout";
import { AdminLayout } from "./app/layouts/AdminLayout";
import { RequireAuth } from "./app/guards/RequireAuth";

import { VehiclesPage } from "./pages/public/VehiclesPage";
import { VehicleDetailsPage } from "./pages/public/VehicleDetailsPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { VehicleListPage } from "./features/vehicles/components/VehicleListPage";
import { ComparePage } from "./features/vehicles/pages/ComparePage";

// ✅ NEW: Selector
import { VehicleTypeSelectPage } from "./pages/public/VehicleTypeSelectPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        {/* ✅ Entry choice */}
        <Route path="/" element={<VehicleTypeSelectPage />} />

        {/* ✅ Listing requires type (otherwise bounce to /) */}
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:slug" element={<VehicleDetailsPage />} />

        {/* ✅ Comparison (public, read-only) */}
        <Route path="/compare" element={<ComparePage />} />
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
