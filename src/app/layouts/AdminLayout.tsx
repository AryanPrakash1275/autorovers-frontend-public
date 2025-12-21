import { Outlet, useNavigate, Link } from "react-router-dom";
import { clearToken } from "../../features/auth/storage";
import { Logo } from "../../shared/ui/Logo";

// Shared layout shell for admin routes (header + outlet).
export function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }


  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <Link to="/vehicles" aria-label="Go to vehicles page">
              <Logo size="sm" />
            </Link>
            <span className="admin-header-tag">Admin</span>
          </div>

          <div className="admin-header-actions">
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
