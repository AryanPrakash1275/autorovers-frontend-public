// src/app/layouts/PublicLayout.tsx

import { Link, Outlet } from "react-router-dom";
import { isLoggedIn } from "../../features/auth/storage";
import { Logo } from "../../shared/ui/Logo";
import { getSelectedVehicleType } from "../../features/vehicles/vehicleTypeStorage";

export function PublicLayout() {
  const loggedIn = isLoggedIn();
  const selectedType = getSelectedVehicleType(); // "bike" | "car" | undefined

  const browseHref = selectedType ? `/vehicles?type=${selectedType}` : "/";
  const typeLabel = selectedType === "bike" ? "Bikes" : selectedType === "car" ? "Cars" : null;

  return (
    <div className="public-root">
      <header className="public-header">
        <div className="public-logo">
          <Link to={browseHref} aria-label="Autorovers home">
            <Logo size="md" />
          </Link>
        </div>

        <nav className="public-nav">
          <Link to={browseHref} className="public-nav-link">
            Browse{typeLabel ? ` ${typeLabel}` : ""}
          </Link>

          <Link to="/" className="public-nav-link" title="Switch vehicle type">
            Switch
          </Link>

          {loggedIn ? (
            <Link to="/admin/vehicles" className="public-nav-link">
              Admin
            </Link>
          ) : (
            <Link to="/login" className="public-nav-link">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}
