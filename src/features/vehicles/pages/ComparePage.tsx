// src/features/vehicles/pages/ComparePage.tsx

import { useEffect, useMemo, useState } from "react";
import { loadCompare, saveCompare } from "../compareState";
import {
  COMMON_FIELDS,
  BIKE_FIELDS,
  CAR_FIELDS,
  type VehicleKind,
} from "../comparisonFields";
import { getPublicVehicleBySlug } from "../api";
import type { VehicleWithDetailsDto } from "../types";

const FALLBACK_IMG =
  "https://dummyimage.com/120x80/cccccc/000000&text=No+Image";

function dash(v?: string) {
  return v && v.trim().length ? v : "—";
}

function normalizeKind(v: unknown): VehicleKind | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s === "Bike" || s === "Car" ? s : undefined;
}

function safeCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "—";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string") return v.trim().length ? v : "—";
  return String(v);
}

export function ComparePage() {
  // ✅ keep compare state reactive (so unselect/select updates without refresh)
  const [compare, setCompare] = useState(loadCompare());

  const [loading, setLoading] = useState(true);
  const [dtos, setDtos] = useState<VehicleWithDetailsDto[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleKind | undefined>(
    undefined
  );
  const [err, setErr] = useState<string | null>(null);

  // ✅ whenever localStorage compare changes (list page toggles), refresh compare here
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "autorovers_compare_v1") setCompare(loadCompare());
    };
    window.addEventListener("storage", onStorage);

    // also refresh on focus (same-tab updates won't fire "storage")
    const onFocus = () => setCompare(loadCompare());
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        if (compare.items.length < 2) {
          if (!cancelled) {
            setDtos([]);
            setVehicleType(undefined);
            setLoading(false);
          }
          return;
        }

        const slugs = compare.items
          .map((x) => x.slug)
          .filter(
            (s): s is string => typeof s === "string" && s.trim().length > 0
          );

        const loaded = await Promise.all(
          slugs.map((slug) => getPublicVehicleBySlug(slug))
        );

        const firstType = normalizeKind(
          loaded.find((x) => x.vehicleType)?.vehicleType
        );

        const cleaned = firstType
          ? loaded.filter((x) => normalizeKind(x.vehicleType) === firstType)
          : loaded;

        if (!cancelled) {
          setDtos(cleaned);
          setVehicleType(firstType);
          setLoading(false);
        }

        // ✅ keep localStorage consistent if mixed types somehow got in
        if (firstType && cleaned.length !== loaded.length) {
          const keepIds = new Set(cleaned.map((x) => x.id));
          const nextItems = compare.items.filter((x) => keepIds.has(x.id));
          saveCompare({ items: nextItems });
          setCompare({ items: nextItems, vehicleType: firstType });
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
  }, [compare.items]);

  const fields = useMemo(() => {
    if (vehicleType === "Bike") return [...COMMON_FIELDS, ...BIKE_FIELDS];
    if (vehicleType === "Car") return [...COMMON_FIELDS, ...CAR_FIELDS];
    return [...COMMON_FIELDS];
  }, [vehicleType]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading comparison…</p>;
  if (err) return <p style={{ padding: "2rem", color: "crimson" }}>{err}</p>;

  if (dtos.length < 2) {
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
        Comparing {dtos.length} {vehicleType ?? "vehicles"}
      </p>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Spec</th>
              {dtos.map((v) => {
                const brand = dash(v.brand);
                const model = dash(v.model);
                const variant = dash(v.variant);
                const img = v.imageUrl?.trim() ? v.imageUrl : FALLBACK_IMG;

                return (
                  <th key={v.id}>
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
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
            {fields.map((f) => (
              <tr key={f.key}>
                <td style={{ fontWeight: 800 }}>{f.label}</td>
                {dtos.map((v) => {
                  const raw = f.get(v);
                  const cell = f.format ? f.format(raw) : safeCell(raw);
                  return <td key={`${v.id}-${f.key}`}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
