import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "../../shared/ui/Footer";
import { clearCompare } from "../../features/vehicles/compareState";
import {
  getSelectedVehicleType,
  setSelectedVehicleType,
  type VehicleType,
} from "../../features/vehicles/vehicleTypeStorage";

export function VehicleTypeSelectPage() {
  const nav = useNavigate();

  const current = useMemo(() => getSelectedVehicleType(), []);

  function choose(next: VehicleType) {
    const prev = getSelectedVehicleType();

    // persist
    setSelectedVehicleType(next);

    // if switching type, it wipes compare (avoids mixed-type remnants)
    if (prev && prev !== next) {
      clearCompare();
    }

    nav(`/vehicles?type=${next}`, { replace: true });
  }

  return (
    <div className="public-page">
      <section className="hero">
        <div className="hero-layer">
          <div className="hero-copy">
            <h1 className="hero-title">What do you want to browse?</h1>
            <p className="hero-tagline">Pick one. You’ll see a clean, focused catalog.</p>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <button
                type="button"
                className="public-btn public-btn--primary"
                onClick={() => choose("bike")}
              >
                Browse Bikes {current === "bike" ? "✓" : ""}
              </button>

              <button
                type="button"
                className="public-btn public-btn--ghost"
                onClick={() => choose("car")}
              >
                Browse Cars {current === "car" ? "✓" : ""}
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
