// src/pages/VehicleDetailsPage.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type {
  VehicleWithDetailsDto,
  VehicleDetailsDto,
  VehicleVariantDto,
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

function formatINR(n?: number): string {
  if (!n || n <= 0) return "—";
  return `₹ ${n.toLocaleString("en-IN")}`;
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

  const [vehicle, setVehicle] = useState<VehicleWithDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Variant selection
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );

  /* =======================
     Derived
  ======================= */

  const details: VehicleDetailsDto = vehicle?.details ?? {};

  const colors = useMemo(
    () => parseColors(details.colorsAvailableJson),
    [details.colorsAvailableJson]
  );

  const variants: VehicleVariantDto[] = useMemo(() => {
    const list = vehicle?.variants ?? [];
    // default first; then price; then name
    return [...list].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      if (a.price !== b.price) return a.price - b.price;
      return a.name.localeCompare(b.name);
    });
  }, [vehicle?.variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (selectedVariantId == null) return null;
    return variants.find((x) => x.id === selectedVariantId) ?? null;
  }, [variants, selectedVariantId]);

  // Resolve BOTH flat OR nested details
  const d = details;
  const eng = d.engine ?? {};
  const dim = d.dimensions ?? {};
  const dyn = d.dynamics ?? {};
  const bike = d.bike ?? {};
  const car = d.car ?? {};

  const engineType = d.engineType ?? eng.engineType;
  const inductionType = d.inductionType ?? eng.inductionType;
  const emission = d.emission ?? eng.emission;
  const range = d.range ?? eng.range;

  const power = d.power ?? eng.power;
  const powerRpm = d.powerRpm ?? eng.powerRpm;
  const torque = d.torque ?? eng.torque;
  const torqueRpm = d.torqueRpm ?? eng.torqueRpm;
  const mileage = d.mileage ?? eng.mileage;

  const length = d.length ?? dim.length;
  const width = d.width ?? dim.width;
  const height = d.height ?? dim.height;
  const weight = d.weight ?? dim.weight;
  const wheelBase = d.wheelBase ?? dim.wheelBase;
  const groundClearance = d.groundClearance ?? dim.groundClearance;

  const personCapacity = d.personCapacity ?? car.personCapacity;
  const rows = d.rows ?? car.rows;
  const doors = d.doors ?? car.doors;
  const bootSpace = d.bootSpace ?? car.bootSpace;
  const tankSize = d.tankSize ?? bike.tankSize;

  const frontType = d.frontType ?? dyn.frontType;
  const backType = d.backType ?? dyn.backType;
  const frontBrake = d.frontBrake ?? dyn.frontBrake;
  const backBrake = d.backBrake ?? dyn.backBrake;
  const tyreType = d.tyreType ?? dyn.tyreType;
  const wheelMaterial = d.wheelMaterial ?? dyn.wheelMaterial;

  const title = useMemo(() => {
    if (!vehicle) return "Vehicle";
    const base = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
    const vname = selectedVariant?.name ?? vehicle.variant;
    return [base, vname].filter(Boolean).join(" ");
  }, [vehicle, selectedVariant]);

  const displayPrice = useMemo(() => {
    // Prefer variant price; fallback to vehicle.price
    if (selectedVariant?.price && selectedVariant.price > 0)
      return formatINR(selectedVariant.price);
    return formatINR(vehicle?.price);
  }, [selectedVariant, vehicle?.price]);

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
        if (!alive) return;

        setVehicle(data);

        // Auto-select default variant (or first)
        const list = data.variants ?? [];
        if (list.length > 0) {
          const def = list.find((x) => x.isDefault) ?? list[0];
          setSelectedVariantId(def.id);
        } else {
          setSelectedVariantId(null);
        }
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
            {hasValue(engineType) && (
              <span className="feature-badge">{text(engineType)}</span>
            )}
            {colors.length > 0 && (
              <span className="feature-badge">{colors.length} colors</span>
            )}
          </div>

          {variants.length > 0 && (
            <div className="vehicle-variant-picker">
              <label className="label" htmlFor="variant">
                Variant
              </label>
              <select
                id="variant"
                className="input"
                value={selectedVariantId ?? ""}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setSelectedVariantId(Number.isFinite(next) ? next : null);
                }}
              >
                {variants.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {x.isDefault ? " (Default)" : ""} — {formatINR(x.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="vehicle-price">
            {displayPrice}{" "}
            <span className="price-note">Ex-showroom (approx.)</span>
          </div>

          {selectedVariant && selectedVariant.addons?.length > 0 && (
            <div className="vehicle-addons">
              <div className="addons-title">Add-ons</div>
              <ul className="addons-list">
                {selectedVariant.addons.map((a) => (
                  <li key={a.id} className="addons-item">
                    <span className="addons-name">{a.name}</span>
                    <span className="addons-price">{formatINR(a.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="vehicle-highlight-row">
            {hasValue(power) && (
              <div className="vehicle-highlight">
                <span className="label">Power</span>
                <span className="value">{text(power)} bhp</span>
              </div>
            )}
            {hasValue(torque) && (
              <div className="vehicle-highlight">
                <span className="label">Torque</span>
                <span className="value">{text(torque)} Nm</span>
              </div>
            )}
            {hasValue(mileage) && (
              <div className="vehicle-highlight">
                <span className="label">Mileage</span>
                <span className="value">{unit(mileage, "kmpl")}</span>
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

        {(hasValue(engineType) ||
          hasValue(inductionType) ||
          hasValue(emission) ||
          hasValue(range)) && (
          <section className="spec-card">
            <h2>Engine</h2>
            <dl>
              <Spec label="Engine type" value={text(engineType)} />
              <Spec label="Induction" value={text(inductionType)} />
              <Spec label="Emission" value={text(emission)} />
              <Spec label="Range" value={unit(range, "km")} />
            </dl>
          </section>
        )}

        {(hasValue(power) ||
          hasValue(torque) ||
          hasValue(d.warrantyYears) ||
          hasValue(d.serviceIntervalKm)) && (
          <section className="spec-card">
            <h2>Performance</h2>
            <dl>
              <Spec label="Power" value={powerText(power ?? null, powerRpm ?? null)} />
              <Spec label="Torque" value={torqueText(torque ?? null, torqueRpm ?? null)} />
              <Spec
                label="Warranty"
                value={hasValue(d.warrantyYears) ? `${d.warrantyYears} years` : "—"}
              />
              <Spec label="Service interval" value={unit(d.serviceIntervalKm, "km")} />
            </dl>
          </section>
        )}

        {(hasValue(length) ||
          hasValue(width) ||
          hasValue(height) ||
          hasValue(weight) ||
          hasValue(wheelBase) ||
          hasValue(groundClearance)) && (
          <section className="spec-card">
            <h2>Dimensions & Weight</h2>
            <dl>
              <Spec label="Length" value={unit(length, "mm")} />
              <Spec label="Width" value={unit(width, "mm")} />
              <Spec label="Height" value={unit(height, "mm")} />
              <Spec label="Wheelbase" value={unit(wheelBase, "mm")} />
              <Spec label="Ground clearance" value={unit(groundClearance, "mm")} />
              <Spec label="Weight" value={unit(weight, "kg")} />
            </dl>
          </section>
        )}

        {(hasValue(personCapacity) ||
          hasValue(rows) ||
          hasValue(doors) ||
          hasValue(bootSpace) ||
          hasValue(tankSize)) && (
          <section className="spec-card">
            <h2>Capacity</h2>
            <dl>
              <Spec label="Seating" value={text(personCapacity)} />
              <Spec label="Rows" value={text(rows)} />
              <Spec label="Doors" value={text(doors)} />
              <Spec label="Boot space" value={unit(bootSpace, "L")} />
              <Spec label="Tank size" value={unit(tankSize, "L")} />
            </dl>
          </section>
        )}

        {(hasValue(frontType) ||
          hasValue(backType) ||
          hasValue(frontBrake) ||
          hasValue(backBrake) ||
          hasValue(tyreType) ||
          hasValue(wheelMaterial)) && (
          <section className="spec-card">
            <h2>Tyres & Brakes</h2>
            <dl>
              <Spec label="Front type" value={text(frontType)} />
              <Spec label="Rear type" value={text(backType)} />
              <Spec label="Front brake" value={text(frontBrake)} />
              <Spec label="Rear brake" value={text(backBrake)} />
              <Spec label="Tyre type" value={text(tyreType)} />
              <Spec label="Wheel material" value={text(wheelMaterial)} />
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
