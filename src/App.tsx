import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import type { JSX, ReactNode } from "react";

import { VehiclesPage } from "./public/VehiclesPage";
import { VehicleDetailsPage } from "./public/VehicleDetailsPage";
import { VehicleListPage } from "./features/vehicles/components/VehicleListPage";
import { LoginPage } from "./public/LoginPage";
import { isLoggedIn, clearToken } from "./features/auth/storage";
import {Logo} from "./public/Logo"

import "./styles/admin.css";
import "./styles/public.css";

type LayoutProps = {
  children: ReactNode;
};

function PublicLayout({ children }: LayoutProps) {
  const loggedIn = isLoggedIn();

  return (
    <div className="public-root">
      <header className="public-header">
        <div className="public-logo">
          <Link to="/vehicles" aria-label="Autorovers home">
          <Logo size="md" />
          </Link>
        </div>

        <nav className="public-nav">
          <Link to="/vehicles" className="public-nav-link">
            Vehicles
          </Link>

          {loggedIn ? (
            <Link to="/admin/vehicles" className="public-nav-link">
              Login
            </Link>
          ) : (
            <Link to="/login" className="public-nav-link">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main className="public-main">{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>Autorovers Admin</h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link to="/vehicles" className="btn btn-ghost">
              View site
            </Link>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-content">
          <VehicleListPage />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public catalog */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <VehiclesPage />
          </PublicLayout>
        }
      />

      <Route
        path="/vehicles"
        element={
          <PublicLayout>
            <VehiclesPage />
          </PublicLayout>
        }
      />

      <Route
        path="/vehicles/:slug"
        element={
          <PublicLayout>
            <VehicleDetailsPage />
          </PublicLayout>
        }
      />

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected admin */}
      <Route
        path="/admin/vehicles"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/vehicles" replace />} />
    </Routes>
  );
}

export default App;
