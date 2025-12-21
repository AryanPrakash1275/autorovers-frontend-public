import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type {
  VehicleWithDetailsDto,
  VehicleDetailsDto,
} from "../../features/vehicles/types";
import { getPublicVehicleBySlug } from "../../features/vehicles/api";
import { Footer } from "../../shared/ui/Footer";

type MaybeError = { message?: string };

const FALLBACK_IMG =
  "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";

/* =======================
   Helpers
======================= */

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  if (typeof v === "boolean") return true;
  return false;
}

function text(v: unknown): string {
  return hasValue(v) ? String(v) : "—";
}

function unit(v: unknown, u: string): string {
  return hasValue(v) ? `${v} ${u}` : "—";
}

function powerText(power?: number | null, rpm?: number | null): string {
  if (!power || power <= 0) return "—";
  return rpm && rpm > 0 ? `${power} bhp @ ${rpm} rpm` : `${power} bhp`;
}

function torqueText(torque?: number | null, rpm?: number | null): string {
  if (!torque || torque <= 0) return "—";
  return rpm && rpm > 0 ? `${torque} Nm @ ${rpm} rpm` : `${torque} Nm`;
}

function parseColors(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/* =======================
   Component
======================= */

export function VehicleDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  const [vehicle, setVehicle] =
    useState<VehicleWithDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =======================
     ALL HOOKS COME FIRST
  ======================= */

  const title = useMemo(() => {
    if (!vehicle) return "Vehicle";
    return [vehicle.brand, vehicle.model, vehicle.variant]
      .filter(Boolean)
      .join(" ");
  }, [vehicle]);

  const price = useMemo(() => {
    if (!vehicle || typeof vehicle.price !== "number" || vehicle.price <= 0)
      return "—";
    return `₹ ${vehicle.price.toLocaleString("en-IN")}`;
  }, [vehicle]);

  const details: VehicleDetailsDto = vehicle?.details ?? {};

  const colors = useMemo(
    () => parseColors(details.colorsAvailableJson),
    [details.colorsAvailableJson]
  );

  /* =======================
     Data Fetch
  ======================= */

  useEffect(() => {
    if (!slug) {
      setError("Missing vehicle slug.");
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicVehicleBySlug(slug);
        if (alive) setVehicle(data);
      } catch (err: unknown) {
        const maybe = err as MaybeError;
        if (alive) setError(maybe?.message ?? "Failed to load vehicle");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  /* =======================
     Early Returns (SAFE)
  ======================= */

  if (loading) return <div className="public-page">Loading vehicle…</div>;
  if (error) return <div className="public-page error">{error}</div>;
  if (!vehicle) return <div className="public-page">Vehicle not found.</div>;

  const v = vehicle;
  const d = details;

  /* =======================
     Render
  ======================= */

  return (
    <div className="public-page">
      <div className="public-topbar">
        <Link to="/vehicles" className="btn btn-ghost">
          ← Back to catalog
        </Link>
      </div>

      <div className="vehicle-hero">
        <div className="vehicle-hero-main">
          <h1 className="vehicle-title">{title}</h1>

          <p className="vehicle-subtitle">
            {text(v.year)} • {text(v.category)} • {text(v.transmission)}
          </p>

          <div className="vehicle-features">
            {hasValue(v.category) && (
              <span className="feature-badge">{text(v.category)}</span>
            )}
            {hasValue(v.transmission) && (
              <span className="feature-badge">{text(v.transmission)}</span>
            )}
            {hasValue(d.specification) && (
              <span className="feature-badge">{text(d.specification)}</span>
            )}
            {hasValue(d.engineType) && (
              <span className="feature-badge">{text(d.engineType)}</span>
            )}
            {colors.length > 0 && (
              <span className="feature-badge">{colors.length} colors</span>
            )}
          </div>

          <div className="vehicle-price">
            {price} <span className="price-note">Ex-showroom (approx.)</span>
          </div>

          <div className="vehicle-highlight-row">
            {hasValue(d.power) && (
              <div className="vehicle-highlight">
                <span className="label">Power</span>
                <span className="value">{text(d.power)} bhp</span>
              </div>
            )}
            {hasValue(d.torque) && (
              <div className="vehicle-highlight">
                <span className="label">Torque</span>
                <span className="value">{text(d.torque)} Nm</span>
              </div>
            )}
            {hasValue(d.mileage) && (
              <div className="vehicle-highlight">
                <span className="label">Mileage</span>
                <span className="value">{unit(d.mileage, "kmpl")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="vehicle-hero-image">
          <img
            src={v.imageUrl || FALLBACK_IMG}
            alt={title}
            className="vehicle-hero-img"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
            }}
          />
        </div>
      </div>

      <div className="vehicle-spec-grid">
        {hasValue(d.description) && (
          <section className="spec-card">
            <h2>About</h2>
            <p className="vehicle-description">{text(d.description)}</p>
          </section>
        )}

        {(hasValue(d.engineType) ||
          hasValue(d.inductionType) ||
          hasValue(d.emission) ||
          hasValue(d.range)) && (
          <section className="spec-card">
            <h2>Engine</h2>
            <dl>
              <Spec label="Engine type" value={text(d.engineType)} />
              <Spec label="Induction" value={text(d.inductionType)} />
              <Spec label="Emission" value={text(d.emission)} />
              <Spec label="Range" value={unit(d.range, "km")} />
            </dl>
          </section>
        )}

        {(hasValue(d.power) ||
          hasValue(d.torque) ||
          hasValue(d.warrantyYears) ||
          hasValue(d.serviceIntervalKm)) && (
          <section className="spec-card">
            <h2>Performance</h2>
            <dl>
              <Spec
                label="Power"
                value={powerText(d.power ?? null, d.powerRpm ?? null)}
              />
              <Spec
                label="Torque"
                value={torqueText(d.torque ?? null, d.torqueRpm ?? null)}
              />
              <Spec
                label="Warranty"
                value={
                  hasValue(d.warrantyYears)
                    ? `${d.warrantyYears} years`
                    : "—"
                }
              />
              <Spec
                label="Service interval"
                value={unit(d.serviceIntervalKm, "km")}
              />
            </dl>
          </section>
        )}

        {(hasValue(d.length) ||
          hasValue(d.width) ||
          hasValue(d.height) ||
          hasValue(d.weight) ||
          hasValue(d.wheelBase) ||
          hasValue(d.groundClearance)) && (
          <section className="spec-card">
            <h2>Dimensions & Weight</h2>
            <dl>
              <Spec label="Length" value={unit(d.length, "mm")} />
              <Spec label="Width" value={unit(d.width, "mm")} />
              <Spec label="Height" value={unit(d.height, "mm")} />
              <Spec label="Wheelbase" value={unit(d.wheelBase, "mm")} />
              <Spec
                label="Ground clearance"
                value={unit(d.groundClearance, "mm")}
              />
              <Spec label="Weight" value={unit(d.weight, "kg")} />
            </dl>
          </section>
        )}

        {(hasValue(d.personCapacity) ||
          hasValue(d.rows) ||
          hasValue(d.doors) ||
          hasValue(d.bootSpace) ||
          hasValue(d.tankSize)) && (
          <section className="spec-card">
            <h2>Capacity</h2>
            <dl>
              <Spec label="Seating" value={text(d.personCapacity)} />
              <Spec label="Rows" value={text(d.rows)} />
              <Spec label="Doors" value={text(d.doors)} />
              <Spec label="Boot space" value={unit(d.bootSpace, "L")} />
              <Spec label="Tank size" value={unit(d.tankSize, "L")} />
            </dl>
          </section>
        )}

        {(hasValue(d.frontType) ||
          hasValue(d.backType) ||
          hasValue(d.frontBrake) ||
          hasValue(d.backBrake) ||
          hasValue(d.tyreType) ||
          hasValue(d.wheelMaterial)) && (
          <section className="spec-card">
            <h2>Tyres & Brakes</h2>
            <dl>
              <Spec label="Front type" value={text(d.frontType)} />
              <Spec label="Rear type" value={text(d.backType)} />
              <Spec label="Front brake" value={text(d.frontBrake)} />
              <Spec label="Rear brake" value={text(d.backBrake)} />
              <Spec label="Tyre type" value={text(d.tyreType)} />
              <Spec label="Wheel material" value={text(d.wheelMaterial)} />
              <Spec label="Spare" value={text(d.spare)} />
            </dl>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* =======================
   Spec row
======================= */

function Spec({ label, value }: { label: string; value: string }) {
  if (value === "—") return null;
  return (
    <div className="spec-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
