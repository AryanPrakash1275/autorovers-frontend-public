import { Link, Outlet } from "react-router-dom";
import { isLoggedIn } from "../../features/auth/storage";
import { Logo } from "../../shared/ui/Logo";

export function PublicLayout() {
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
