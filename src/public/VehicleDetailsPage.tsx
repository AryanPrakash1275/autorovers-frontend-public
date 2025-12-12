import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { Vehicle } from "../features/vehicles/types";
import { getPublicVehicleBySlug } from "../features/vehicles/api";
import { Footer } from "./Footer";

type MaybeError = { message?: string };

const FALLBACK_IMG =
  "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";

function n(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function text(v: unknown): string {
  const t = s(v).trim();
  return t.length ? t : "—";
}

function unit(val: unknown, u: string): string {
  const x = n(val);
  return x !== null && x > 0 ? `${x} ${u}` : "—";
}

function powerText(power: unknown, rpm: unknown): string {
  const p = n(power);
  const r = n(rpm);
  if (p === null || p <= 0) return "—";
  if (r !== null && r > 0) return `${p} bhp @ ${r} rpm`;
  return `${p} bhp`;
}

function torqueText(torque: unknown, rpm: unknown): string {
  const t = n(torque);
  const r = n(rpm);
  if (t === null || t <= 0) return "—";
  if (r !== null && r > 0) return `${t} Nm @ ${r} rpm`;
  return `${t} Nm`;
}

export function VehicleDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type = ((s(vehicle?.vehicleType) || s(vehicle?.category)).toLowerCase());
  const isBike = type.includes("bike");
  const isCar = type.includes("car");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setVehicle(null);
      setError("Missing vehicle slug.");
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
        console.error(err);
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

  if (loading) return <div className="public-page">Loading vehicle…</div>;
  if (error) return <div className="public-page error">{error}</div>;
  if (!vehicle) return <div className="public-page">Vehicle not found.</div>;

  const v = vehicle;

  const title =
    `${s(v.brand)} ${s(v.model)} ${s(v.variant)}`.trim() || "Vehicle";

  const powerHighlight =
    n(v.power) !== null && (v.power as number) > 0 ? `${v.power} bhp` : "—";
  const torqueHighlight =
    n(v.torque) !== null && (v.torque as number) > 0 ? `${v.torque} Nm` : "—";

  const powerDetail = powerText(v.power, v.powerRpm);
  const torqueDetail = torqueText(v.torque, v.torqueRpm);

  const mileage = unit(v.mileage, "kmpl");
  const tank = unit(v.tankSize, "L");
  const range = unit(v.range, "km");

  const length = unit(v.length, "mm");
  const width = unit(v.width, "mm");
  const height = unit(v.height, "mm");
  const wheelbase = unit(v.wheelBase, "mm");
  const groundClearance = unit(v.groundClearance, "mm");
  const weight = unit(v.weight, "kg");

  const boot = unit(v.bootSpace, "L");
  const seating =
    n(v.personCapacity) !== null && (v.personCapacity as number) > 0
      ? `${v.personCapacity} persons`
      : "—";

  const priceTextValue =
    typeof v.price === "number" && v.price > 0
      ? `₹ ${v.price.toLocaleString("en-IN")}`
      : "—";

  const imgSrc = s(v.imageUrl) || FALLBACK_IMG;

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
            {v.year ?? "—"} • {v.category ?? "—"} • {v.transmission ?? "—"}
          </p>

          <p className="vehicle-price">{priceTextValue}</p>

          <div className="vehicle-highlight-row">
            <div className="vehicle-highlight">
              <span className="label">Power</span>
              <span className="value">{powerHighlight}</span>
            </div>

            <div className="vehicle-highlight">
              <span className="label">Torque</span>
              <span className="value">{torqueHighlight}</span>
            </div>

            <div className="vehicle-highlight">
              <span className="label">Mileage</span>
              <span className="value">{mileage}</span>
            </div>

            <div className="vehicle-highlight">
              <span className="label">Tank</span>
              <span className="value">{tank}</span>
            </div>
          </div>
        </div>

        <div className="vehicle-hero-image">
          <img
            src={imgSrc}
            alt={`${s(v.brand)} ${s(v.model)}`.trim() || "Vehicle image"}
            className="vehicle-hero-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
            }}
          />
        </div>
      </div>

      <div className="vehicle-spec-grid">
        <section className="spec-card">
          <h2>Engine &amp; Performance</h2>
          <dl>
            <div className="spec-row">
              <dt>Engine type</dt>
              <dd>{text(v.engineType)}</dd>
            </div>
            <div className="spec-row">
              <dt>Specification</dt>
              <dd className="break-anywhere">{text(v.specification)}</dd>
            </div>
            <div className="spec-row">
              <dt>Induction</dt>
              <dd>{text(v.inductionType)}</dd>
            </div>
            <div className="spec-row">
              <dt>Power</dt>
              <dd>{powerDetail}</dd>
            </div>
            <div className="spec-row">
              <dt>Torque</dt>
              <dd>{torqueDetail}</dd>
            </div>
            <div className="spec-row">
              <dt>Emission</dt>
              <dd>{text(v.emission)}</dd>
            </div>
            <div className="spec-row">
              <dt>Mileage</dt>
              <dd>{mileage}</dd>
            </div>

            {isBike && (n(v.range) ?? 0) > 0 && (
              <div className="spec-row">
                <dt>Range</dt>
                <dd>{range}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="spec-card">
          <h2>Dimensions &amp; Weight</h2>
          <dl>
            <div className="spec-row">
              <dt>Length</dt>
              <dd>{length}</dd>
            </div>
            <div className="spec-row">
              <dt>Width</dt>
              <dd>{width}</dd>
            </div>
            <div className="spec-row">
              <dt>Height</dt>
              <dd>{height}</dd>
            </div>
            <div className="spec-row">
              <dt>Wheelbase</dt>
              <dd>{wheelbase}</dd>
            </div>
            <div className="spec-row">
              <dt>Ground clearance</dt>
              <dd>{groundClearance}</dd>
            </div>
            <div className="spec-row">
              <dt>Kerb weight</dt>
              <dd>{weight}</dd>
            </div>
          </dl>
        </section>

        {isCar && (
          <section className="spec-card">
            <h2>Capacity &amp; Layout</h2>
            <dl>
              <div className="spec-row">
                <dt>Seating</dt>
                <dd>{seating}</dd>
              </div>
              <div className="spec-row">
                <dt>Rows</dt>
                <dd>{v.rows ?? "—"}</dd>
              </div>
              <div className="spec-row">
                <dt>Doors</dt>
                <dd>{v.doors ?? "—"}</dd>
              </div>
              <div className="spec-row">
                <dt>Boot space</dt>
                <dd>{boot}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="spec-card">
          <h2>Tyres, Brakes &amp; Steering</h2>
          <dl>
            <div className="spec-row">
              <dt>Front type</dt>
              <dd>{text(v.frontType)}</dd>
            </div>
            <div className="spec-row">
              <dt>Back type</dt>
              <dd>{text(v.backType)}</dd>
            </div>
            <div className="spec-row">
              <dt>Front brake</dt>
              <dd>{text(v.frontBrake)}</dd>
            </div>
            <div className="spec-row">
              <dt>Rear brake</dt>
              <dd>{text(v.backBrake)}</dd>
            </div>
            <div className="spec-row">
              <dt>Tyre size (front)</dt>
              <dd>{text(v.tyreSizeFront)}</dd>
            </div>
            <div className="spec-row">
              <dt>Tyre size (rear)</dt>
              <dd>{text(v.tyreSizeBack)}</dd>
            </div>
            <div className="spec-row">
              <dt>Tyre type</dt>
              <dd>{text(v.tyreType)}</dd>
            </div>
            <div className="spec-row">
              <dt>Wheel material</dt>
              <dd>{text(v.wheelMaterial)}</dd>
            </div>

            {isCar && (
              <div className="spec-row">
                <dt>Spare</dt>
                <dd>{text(v.spare)}</dd>
              </div>
            )}

            {isCar && (
              <div className="spec-row">
                <dt>Power steering</dt>
                <dd>{text(v.poweredSteering)}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <Footer />
    </div>
  );
}
