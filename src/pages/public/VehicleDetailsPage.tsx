// src/pages/public/VehicleDetailsPage.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import type {
  VehicleWithDetailsDto,
  VehicleDetailsDto,
  VehicleVariantDto,
  VariantAddonDto,
  VehicleListItem,
} from "../../features/vehicles/types";
import { getPublicVehicleBySlug } from "../../features/vehicles/api";
import {
  loadCompare,
  toggleCompareWithResult,
  onCompareChanged,
} from "../../features/vehicles/compareState";
import { Footer } from "../../shared/ui/Footer";
import {
  getSelectedVehicleType,
  onVehicleTypeChanged,
  type VehicleType,
} from "../../features/vehicles/vehicleTypeStorage";


type MaybeError = { message?: string };

const FALLBACK_IMG = "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";

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

function sum(nums: number[]): number {
  let s = 0;
  for (const n of nums) s += n;
  return s;
}

function upsertMeta(name: string, content: string) {
  const head = document.head;
  if (!head) return;

  let tag = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function norm(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function toSelectedTypeFromVehicleType(vt: unknown): VehicleType | undefined {
  const t = norm(vt);
  if (t === "bike") return "bike";
  if (t === "car") return "car";
  return undefined;
}

function inferSelectedTypeFromCategory(catRaw: unknown): VehicleType | undefined {
  const c = norm(catRaw);
  if (!c) return undefined;

  const bike = new Set(
    ["Sport", "Commuter", "Cruiser", "Tourer", "Off-road", "Scooter", "EV Bike"].map((x) =>
      x.toLowerCase()
    )
  );
  const car = new Set(["Hatchback", "Sedan", "SUV", "MUV", "Coupe", "EV Car"].map((x) => x.toLowerCase()));

  if (bike.has(c)) return "bike";
  if (car.has(c)) return "car";
  return undefined;
}

function asComparableListItem(v: VehicleWithDetailsDto): VehicleListItem {
  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    variant: v.variant,
    year: v.year,
    price: v.price,
    category: v.category,
    transmission: v.transmission,
    slug: v.slug,
    imageUrl: v.imageUrl,
    vehicleType: v.vehicleType,
    fuelType: v.fuelType,
  };
}

/* =======================
   Component
======================= */

export function VehicleDetailsPage() {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [selectedType, setSelectedType] = useState<VehicleType | undefined>(() =>
    getSelectedVehicleType()
  );

  useEffect(() => {
    return onVehicleTypeChanged(setSelectedType);
  }, []);

  useEffect(() => {
    if (!selectedType) nav("/", { replace: true });
  }, [selectedType, nav]);

  const backTo = selectedType ? `/vehicles?type=${selectedType}` : "/";

  const [vehicle, setVehicle] = useState<VehicleWithDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);

  const [compare, setCompare] = useState(loadCompare());

  useEffect(() => {
    const off = onCompareChanged(setCompare);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "autorovers_compare_v1") setCompare(loadCompare());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      off();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const details: VehicleDetailsDto = vehicle?.details ?? {};

  const colors = useMemo(() => parseColors(details.colorsAvailableJson), [details.colorsAvailableJson]);

  const variants: VehicleVariantDto[] = useMemo(() => {
    const list = vehicle?.variants ?? [];
    return [...list].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      if (a.price !== b.price) return a.price - b.price;
      return a.name.localeCompare(b.name);
    });
  }, [vehicle?.variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (selectedVariantId == null) return variants.find((x) => x.isDefault) ?? variants[0];
    return variants.find((x) => x.id === selectedVariantId) ?? null;
  }, [variants, selectedVariantId]);

  useEffect(() => {
    if (!variants.length) return;
    if (selectedVariantId != null) return;

    const def = variants.find((x) => x.isDefault) ?? variants[0];
    setSelectedVariantId(def.id);
  }, [variants, selectedVariantId]);

  useEffect(() => {
    setSelectedAddonIds([]);
  }, [selectedVariant?.id]);

  const selectedAddons: VariantAddonDto[] = useMemo(() => {
    const addons = selectedVariant?.addons ?? [];
    if (!addons.length) return [];
    const set = new Set(selectedAddonIds);
    return addons.filter((a) => set.has(a.id));
  }, [selectedVariant?.addons, selectedAddonIds]);

  const addonsTotal = useMemo(() => sum(selectedAddons.map((a) => a.price ?? 0)), [selectedAddons]);

  const baseVariantPrice = selectedVariant?.price ?? 0;
  const finalPriceNumber =
    (baseVariantPrice > 0 ? baseVariantPrice : vehicle?.price ?? 0) + (addonsTotal > 0 ? addonsTotal : 0);

  const d = details;
  const eng = d.engine ?? {};
  const ev = d.ev ?? {};
  const dim = d.dimensions ?? {};
  const dyn = d.dynamics ?? {};
  const bike = d.bike ?? {};
  const car = d.car ?? {};

  const engineType = d.engineType ?? eng.engineType;
  const inductionType = d.inductionType ?? eng.inductionType;
  const emission = d.emission ?? eng.emission;

  const power = d.power ?? eng.power;
  const powerRpm = d.powerRpm ?? eng.powerRpm;
  const torque = d.torque ?? eng.torque;
  const torqueRpm = d.torqueRpm ?? eng.torqueRpm;
  const mileage = d.mileage ?? eng.mileage;

  const range = d.range ?? eng.range ?? ev.range;

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
    if (!finalPriceNumber || finalPriceNumber <= 0) return "—";
    return formatINR(finalPriceNumber);
  }, [finalPriceNumber]);

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

  const fetchedType = useMemo(() => {
    if (!vehicle) return undefined;
    return toSelectedTypeFromVehicleType(vehicle.vehicleType) ?? inferSelectedTypeFromCategory(vehicle.category);
  }, [vehicle]);

  // Enforce invariant: details must match selectedType
  useEffect(() => {
    if (!vehicle) return;
    if (!selectedType) return;

    if (fetchedType && fetchedType !== selectedType) {
      nav(`/vehicles?type=${selectedType}`, { replace: true });
    }
  }, [vehicle, selectedType, fetchedType, nav]);

  // SEO for details page
  useEffect(() => {
    if (!vehicle || !selectedType) return;

    const typeLabel = selectedType === "car" ? "Cars" : "Bikes";
    const yr = vehicle.year ? `${vehicle.year}` : "";
    const baseName = [vehicle.brand, vehicle.model].filter(Boolean).join(" ").trim();
    const name = [baseName, yr].filter(Boolean).join(" ");

    document.title = `${name} — Specs, variants & price | Autorovers`;
    upsertMeta(
      "description",
      `${name}: view clean specs, variants, and pricing. Compare with other ${typeLabel.toLowerCase()} on Autorovers.`
    );
  }, [vehicle, selectedType]);

  const canCompare = useMemo(() => {
    if (!vehicle) return { ok: false as const, reason: "Vehicle not loaded" };
    if (!selectedType) return { ok: false as const, reason: "Type not selected" };

    const s = (vehicle.slug ?? "").trim();
    if (!s) return { ok: false as const, reason: "Missing slug" };

    const rowType = fetchedType;
    if (rowType && rowType !== selectedType)
      return { ok: false as const, reason: `Wrong type (${rowType})` };

    return { ok: true as const };
  }, [vehicle, selectedType, fetchedType]);

  function onToggleCompareFromDetails() {
    if (!vehicle) return;

    const cur = loadCompare();
    const item = asComparableListItem(vehicle);
    const res = toggleCompareWithResult(cur, item);

    setCompare(res.state);
    if (!res.ok) window.alert(res.reason);
  }

  const compared = useMemo(() => {
    if (!vehicle) return false;
    return compare.items.some((x) => x.id === vehicle.id);
  }, [compare.items, vehicle]);

  if (loading) return <div className="public-page">Loading vehicle…</div>;
  if (error) return <div className="public-page error">{error}</div>;
  if (!vehicle) return <div className="public-page">Vehicle not found.</div>;

  const v = vehicle;
  const hasVariants = variants.length > 0;

  return (
    <div className="public-page">
      <div className="public-topbar">
        <Link to={backTo} className="btn btn-ghost">
          ← Back to catalog
        </Link>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className={`public-btn ${compared ? "public-btn--danger" : "public-btn--primary"}`}
            disabled={!canCompare.ok}
            title={canCompare.ok ? (compared ? "Remove from compare" : "Add to compare") : canCompare.reason}
            onClick={onToggleCompareFromDetails}
          >
            {compared ? "Remove from Compare" : "Add to Compare"}
          </button>

          <button
            type="button"
            className="public-btn public-btn--ghost"
            onClick={() => nav("/compare")}
            disabled={compare.items.length < 2}
            title={compare.items.length < 2 ? "Add at least 2 vehicles to compare" : "Open compare"}
          >
            Compare ({compare.items.length}/4)
          </button>
        </div>
      </div>

      <div className="vehicle-hero">
        <div className="vehicle-hero-main">
          <h1 className="vehicle-title">{title}</h1>

          <p className="vehicle-subtitle">
            {text(v.year)} • {text(v.category)} • {text(v.transmission)}
          </p>

          <div className="vehicle-features">
            {hasValue(v.category) && <span className="feature-badge">{text(v.category)}</span>}
            {hasValue(v.transmission) && <span className="feature-badge">{text(v.transmission)}</span>}
            {hasValue(d.specification) && <span className="feature-badge">{text(d.specification)}</span>}
            {hasValue(engineType) && <span className="feature-badge">{text(engineType)}</span>}
            {colors.length > 0 && <span className="feature-badge">{colors.length} colors</span>}
          </div>

          {hasVariants && (
            <div className="vehicle-variant-picker">
              <div className="label">Variant</div>

              <div className="variant-pills" role="radiogroup" aria-label="Select variant">
                {variants.map((x) => {
                  const active = selectedVariant?.id === x.id;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      className={`variant-pill ${active ? "is-active" : ""}`}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedVariantId(x.id)}
                    >
                      <span className="variant-pill-name">{x.name}</span>
                      <span className="variant-pill-price">{formatINR(x.price)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="variant-hint">{selectedVariant?.isDefault ? "Default variant selected" : ""}</div>
            </div>
          )}

          <div className="vehicle-price">
            {displayPrice} <span className="price-note">Ex-showroom (approx.)</span>
          </div>

          {selectedVariant && selectedVariant.addons?.length > 0 && (
            <div className="vehicle-addons">
              <div className="addons-title">Add-ons</div>

              <ul className="addons-list">
                {selectedVariant.addons.map((a) => {
                  const checked = selectedAddonIds.includes(a.id);
                  return (
                    <li key={a.id} className="addons-item">
                      <label className="addons-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setSelectedAddonIds((prev) => {
                              if (next) return [...prev, a.id];
                              return prev.filter((id) => id !== a.id);
                            });
                          }}
                        />
                        <span className="addons-name">{a.name}</span>
                      </label>

                      <span className="addons-price">{formatINR(a.price)}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="addons-total">
                Add-ons total: <strong>{formatINR(addonsTotal)}</strong>
              </div>
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
            {hasValue(range) && (
              <div className="vehicle-highlight">
                <span className="label">Range</span>
                <span className="value">{unit(range, "km")}</span>
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
          hasValue(eng.fuelType) ||
          hasValue(d.fuelType)) && (
          <section className="spec-card">
            <h2>Powertrain</h2>
            <dl>
              <Spec label="Engine type" value={text(engineType)} />
              <Spec label="Induction" value={text(inductionType)} />
              <Spec label="Fuel type" value={text(d.fuelType ?? eng.fuelType)} />
              <Spec label="Emission" value={text(emission)} />
            </dl>
          </section>
        )}

        {(hasValue(power) ||
          hasValue(torque) ||
          hasValue(d.warrantyYears) ||
          hasValue(d.serviceIntervalKm) ||
          hasValue(mileage) ||
          hasValue(range)) && (
          <section className="spec-card">
            <h2>Performance</h2>
            <dl>
              <Spec label="Power" value={powerText(power ?? null, powerRpm ?? null)} />
              <Spec label="Torque" value={torqueText(torque ?? null, torqueRpm ?? null)} />
              <Spec label="Mileage" value={unit(mileage, "kmpl")} />
              <Spec label="Range" value={unit(range, "km")} />
              <Spec label="Warranty" value={hasValue(d.warrantyYears) ? `${d.warrantyYears} years` : "—"} />
              <Spec label="Service interval" value={unit(d.serviceIntervalKm, "km")} />
            </dl>
          </section>
        )}

        {(hasValue(ev.batteryCapacity) ||
          hasValue(ev.chargingTimeFast) ||
          hasValue(ev.chargingTimeNormal) ||
          hasValue(ev.motorPower) ||
          hasValue(ev.motorTorque) ||
          hasValue(ev.fastChargingPort)) && (
          <section className="spec-card">
            <h2>EV</h2>
            <dl>
              <Spec label="Battery" value={unit(ev.batteryCapacity, "kWh")} />
              <Spec label="Fast charge" value={unit(ev.chargingTimeFast, "min")} />
              <Spec label="Normal charge" value={unit(ev.chargingTimeNormal, "hr")} />
              <Spec label="Motor power" value={unit(ev.motorPower, "kW")} />
              <Spec label="Motor torque" value={unit(ev.motorTorque, "Nm")} />
              <Spec label="Fast charging" value={hasValue(ev.fastChargingPort) ? (ev.fastChargingPort ? "Yes" : "No") : "—"} />
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

        {(hasValue(personCapacity) || hasValue(rows) || hasValue(doors) || hasValue(bootSpace) || hasValue(tankSize)) && (
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
          hasValue(wheelMaterial) ||
          hasValue(d.spare)) && (
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

        {(hasValue(bike.numberOfGears) ||
          hasValue(bike.abs) ||
          hasValue(bike.tractionControl) ||
          hasValue(bike.bluetooth) ||
          hasValue(bike.navigation) ||
          hasValue(bike.smartConnectivity)) && (
          <section className="spec-card">
            <h2>Bike tech</h2>
            <dl>
              <Spec label="Gears" value={text(bike.numberOfGears)} />
              <Spec label="ABS" value={hasValue(bike.abs) ? (bike.abs ? "Yes" : "No") : "—"} />
              <Spec
                label="Traction control"
                value={hasValue(bike.tractionControl) ? (bike.tractionControl ? "Yes" : "No") : "—"}
              />
              <Spec label="Bluetooth" value={hasValue(bike.bluetooth) ? (bike.bluetooth ? "Yes" : "No") : "—"} />
              <Spec label="Navigation" value={hasValue(bike.navigation) ? (bike.navigation ? "Yes" : "No") : "—"} />
              <Spec
                label="Smart connectivity"
                value={hasValue(bike.smartConnectivity) ? (bike.smartConnectivity ? "Yes" : "No") : "—"}
              />
            </dl>
          </section>
        )}

        {(hasValue(car.airbags) ||
          hasValue(car.rearViewCamera) ||
          hasValue(car.parkingSensors) ||
          hasValue(car.cruiseControl) ||
          hasValue(car.hillAssist) ||
          hasValue(car.smartConnectivity)) && (
          <section className="spec-card">
            <h2>Car safety & tech</h2>
            <dl>
              <Spec label="Airbags" value={text(car.airbags)} />
              <Spec
                label="Rear camera"
                value={hasValue(car.rearViewCamera) ? (car.rearViewCamera ? "Yes" : "No") : "—"}
              />
              <Spec
                label="Parking sensors"
                value={hasValue(car.parkingSensors) ? (car.parkingSensors ? "Yes" : "No") : "—"}
              />
              <Spec
                label="Cruise control"
                value={hasValue(car.cruiseControl) ? (car.cruiseControl ? "Yes" : "No") : "—"}
              />
              <Spec label="Hill assist" value={hasValue(car.hillAssist) ? (car.hillAssist ? "Yes" : "No") : "—"} />
              <Spec
                label="Smart connectivity"
                value={hasValue(car.smartConnectivity) ? (car.smartConnectivity ? "Yes" : "No") : "—"}
              />
            </dl>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  if (value === "—") return null;
  return (
    <div className="spec-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
