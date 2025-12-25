import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../../features/auth/api";
import { Footer } from "../../shared/ui/Footer";
import { Logo } from "../../shared/ui/Logo";

type LoginError = { message?: string };

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate("/admin/vehicles");
    } catch (err: unknown) {
      console.error(err);
      const maybe = err as LoginError;
      setError(maybe?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
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
          <Link to="/login" className="public-nav-link public-nav-link--active">
            Login
          </Link>
        </nav>
      </header>

      <main className="login-main">
        <div className="login-card" role="form" aria-labelledby="login-title">
          <h1 id="login-title" className="login-title">
            Login
          </h1>
          <p className="login-subtitle">Sign in to manage the Autorovers catalog.</p>

          {error && <div className="alert alert-error login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field login-field login-field--last">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn login-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
