// src/pages/public/VehicleTypeSelectPage.tsx
import { useNavigate } from "react-router-dom";
import { Footer } from "../../shared/ui/Footer";
import { setSelectedVehicleType, type VehicleType } from "../../features/vehicles/vehicleTypeStorage";

export function VehicleTypeSelectPage() {
  const nav = useNavigate();

  function pick(type: VehicleType) {
    setSelectedVehicleType(type);
    nav(`/vehicles?type=${type}`);
  }

  return (
    <div className="public-page">
      <section className="hero">
        <div className="hero-layer">
          <div className="hero-copy">
            <h1 className="hero-title">What do you want to browse?</h1>
            <p className="hero-tagline">
              Pick one. You’ll see a clean, focused catalog.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="public-btn public-btn--primary"
                onClick={() => pick("bike")}
              >
                Browse Bikes
              </button>

              <button
                type="button"
                className="public-btn public-btn--ghost"
                onClick={() => pick("car")}
              >
                Browse Cars
              </button>
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
