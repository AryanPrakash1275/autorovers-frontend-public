// src/features/vehicles/pages/ComparePage.tsx

import { useEffect, useMemo, useState } from "react";
import { loadCompare, saveCompare } from "../compareState";
import {
  COMMON_FIELDS,
  BIKE_FIELDS,
  CAR_FIELDS,
  type ComparisonField,
} from "../comparisonFields";
import { getPublicVehicleBySlug } from "../api";
import type { VehicleWithDetailsDto } from "../types";

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return !!v && typeof v === "object";
}

function get(obj: unknown, key: string): unknown {
  if (!isObj(obj)) return undefined;
  return obj[key];
}

function getStr(obj: unknown, key: string): string | undefined {
  const v = get(obj, key);
  return typeof v === "string" && v.trim().length ? v : undefined;
}

function getNum(obj: unknown, key: string): number | undefined {
  const v = get(obj, key);
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") return v.trim().length ? v : "—";
  return String(v);
}

function label(field: ComparisonField): string {
  switch (field) {
    case "price":
      return "Price (₹)";
    case "power":
      return "Power";
    case "torque":
      return "Torque";
    case "mileage":
      return "Mileage";
    case "range":
      return "Range";
    case "transmission":
      return "Transmission";
    case "warrantyYears":
      return "Warranty (years)";
    case "serviceIntervalKm":
      return "Service interval (km)";
    case "weight":
      return "Kerb weight";
    case "tankSize":
      return "Tank size";
    case "bootSpace":
      return "Boot space";
    default:
      return field;
  }
}

function toComparable(dto: VehicleWithDetailsDto): Obj {
  const out: Obj = {};
  const d = isObj(dto.details) ? dto.details : {};

  const engine = isObj(d.engine) ? d.engine : {};
  const dims = isObj(d.dimensions) ? d.dimensions : {};
  const bike = isObj(d.bike) ? d.bike : {};
  const car = isObj(d.car) ? d.car : {};

  // header
  out.id = dto.id;
  out.brand = dto.brand;
  out.model = dto.model;
  out.variant = dto.variant;
  out.vehicleType = dto.vehicleType;
  out.imageUrl = dto.imageUrl;

  // common
  out.price = dto.price ?? 0;
  out.transmission = dto.transmission;
  out.warrantyYears = d.warrantyYears;
  out.serviceIntervalKm = d.serviceIntervalKm;

  out.power = engine.power;
  out.torque = engine.torque;
  out.mileage = engine.mileage;
  out.range = engine.range;

  // bike-only
  out.weight = dims.weight;
  out.tankSize = bike.tankSize;

  // car-only
  out.bootSpace = car.bootSpace;

  return out;
}

const FALLBACK_IMG =
  "https://dummyimage.com/120x80/cccccc/000000&text=No+Image";

export function ComparePage() {
  const compare = loadCompare();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Obj[]>([]);
  const [vehicleType, setVehicleType] = useState<string | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        if (compare.items.length < 2) {
          if (!cancelled) {
            setRows([]);
            setVehicleType(undefined);
            setLoading(false);
          }
          return;
        }

        const dtos = await Promise.all(
          compare.items
            .map((x) => x.slug)
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .map((slug) => getPublicVehicleBySlug(slug))
        );

        const comps = dtos.map(toComparable);

        const lockedType = getStr(comps[0], "vehicleType");
        const cleaned = lockedType
          ? comps.filter((r) => getStr(r, "vehicleType") === lockedType)
          : comps;

        if (!cancelled) {
          setRows(cleaned);
          setVehicleType(lockedType);
          setLoading(false);
        }

        if (lockedType && cleaned.length !== comps.length) {
          const keepIds = new Set(cleaned.map((r) => getNum(r, "id")));
          const nextItems = compare.items.filter((x) => keepIds.has(x.id));
          saveCompare({ items: nextItems });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load comparison");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields = useMemo(() => {
    const isBike = vehicleType === "Bike";
    return [
      ...COMMON_FIELDS,
      ...(isBike ? BIKE_FIELDS : CAR_FIELDS),
    ] as readonly ComparisonField[];
  }, [vehicleType]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading comparison…</p>;
  if (err) return <p style={{ padding: "2rem", color: "crimson" }}>{err}</p>;

  if (rows.length < 2) {
    return (
      <p style={{ padding: "2rem" }}>
        Select at least 2 vehicles of the same type to compare.
      </p>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: 6 }}>Compare</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Comparing {rows.length} {vehicleType ?? "vehicles"}
      </p>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Spec</th>
              {rows.map((v) => {
                const brand = renderValue(get(v, "brand"));
                const model = renderValue(get(v, "model"));
                const variant = renderValue(get(v, "variant"));
                const img = getStr(v, "imageUrl") ?? FALLBACK_IMG;

                return (
                  <th key={String(get(v, "id"))}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <img
                        src={img}
                        alt={`${brand} ${model}`}
                        style={{
                          width: 120,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {brand} {model}
                        </div>
                        {variant !== "—" && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            {variant}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {fields.map((field) => (
              <tr key={field}>
                <td style={{ fontWeight: 800 }}>{label(field)}</td>
                {rows.map((v) => (
                  <td key={`${String(get(v, "id"))}-${field}`}>
                    {renderValue(get(v, field))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
