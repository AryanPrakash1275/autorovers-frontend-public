import { Link } from "react-router-dom";
import { Footer } from "../../shared/ui/Footer";

export function VehicleTypeSelectPage() {
  return (
    <div className="public-page">
      <section className="hero">
        <div className="hero-layer">
          <div className="hero-copy">
            <h1 className="hero-title">What do you want to browse?</h1>
            <p className="hero-tagline">
              Pick one. You’ll see a clean, focused catalog.
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <Link className="public-btn public-btn--primary" to="/vehicles?type=bike">
                Browse Bikes
              </Link>
              <Link className="public-btn public-btn--ghost" to="/vehicles?type=car">
                Browse Cars
              </Link>
            </div>

            <p className="public-subtitle" style={{ marginTop: 14 }}>
              You can switch later anytime.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
