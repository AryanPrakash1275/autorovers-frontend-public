// src/features/vehicles/pages/ComparePage.tsx

import { useEffect, useMemo, useState } from "react";
import { loadCompare, saveCompare, onCompareChanged, clearCompare } from "../compareState";
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

function safeCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "—";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string") return v.trim().length ? v : "—";
  return String(v);
}

/** Match compareState.ts inference exactly */
const CAR_CATEGORIES = new Set(
  [
    "suv",
    "hatchback",
    "sedan",
    "coupe",
    "convertible",
    "wagon",
    "muv",
    "mpv",
    "crossover",
    "pickup",
    "truck",
    "van",
  ].map((x) => x.toLowerCase())
);

const BIKE_CATEGORIES = new Set(
  [
    "naked",
    "classic",
    "roadster",
    "cruiser",
    "sports",
    "sport",
    "adventure",
    "scooter",
    "commuter",
    "tourer",
    "cafe racer",
    "scrambler",
    "off-road",
    "off road",
  ].map((x) => x.toLowerCase())
);

function inferKindFromCategory(category?: string | null): VehicleKind | undefined {
  const raw = (category ?? "").trim();
  if (!raw) return undefined;

  const lc = raw.toLowerCase();

  if (CAR_CATEGORIES.has(lc)) return "Car";
  if (BIKE_CATEGORIES.has(lc)) return "Bike";

  // fallback heuristic (same spirit as compareState)
  if (lc.includes("suv") || lc.includes("hatch") || lc.includes("sedan")) return "Car";
  if (lc.includes("bike") || lc.includes("scooter") || lc.includes("cruiser")) return "Bike";

  return undefined;
}

export function ComparePage() {
  const [compare, setCompare] = useState(loadCompare());

  const [loading, setLoading] = useState(true);
  const [dtos, setDtos] = useState<VehicleWithDetailsDto[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleKind | undefined>();
  const [err, setErr] = useState<string | null>(null);

  /* =========================
     Reactivity (same + multi tab)
     ========================= */

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

  /* =========================
     Actions (no compareState edits)
     ========================= */

  function handleRemove(slug?: string | null) {
    if (!slug) return;

    const cur = loadCompare();
    const nextItems = cur.items.filter((x) => x.slug !== slug);

    const next =
      nextItems.length >= 2
        ? { ...cur, items: nextItems }
        : { items: nextItems, vehicleType: undefined };

    saveCompare(next);
    setCompare(next);
  }

  function handleClearAll() {
    const next = clearCompare();
    setCompare(next);
  }

  /* =========================
     Load vehicles by slug
     ========================= */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        if (compare.items.length < 2) {
          setDtos([]);
          setVehicleType(undefined);
          setLoading(false);
          return;
        }

        const slugs = compare.items
          .map((x) => x.slug)
          .filter(
            (s): s is string => typeof s === "string" && s.trim().length > 0
          );

        if (slugs.length < 2) {
          setDtos([]);
          setVehicleType(undefined);
          setLoading(false);
          return;
        }

        // allow partial failures; then we sanitize compare storage
        const settled = await Promise.allSettled(
          slugs.map((slug) => getPublicVehicleBySlug(slug))
        );

        const ok: VehicleWithDetailsDto[] = [];
        const failedSlugs: string[] = [];

        settled.forEach((r, idx) => {
          if (r.status === "fulfilled") ok.push(r.value);
          else failedSlugs.push(slugs[idx]);
        });

        const inferred = inferKindFromCategory(ok[0]?.category);

        const cleaned =
          inferred === undefined
            ? ok
            : ok.filter((x) => inferKindFromCategory(x.category) === inferred);

        if (cancelled) return;

        setDtos(cleaned);
        setVehicleType(inferred);
        setLoading(false);

        // sanitize storage: remove failed slugs + mismatched category types
        if (failedSlugs.length > 0 || cleaned.length !== ok.length) {
          const keepSlugs = new Set(cleaned.map((x) => x.slug).filter(Boolean));

          const nextItems = compare.items.filter((x) => {
            if (!x.slug) return false;
            return keepSlugs.has(x.slug) && !failedSlugs.includes(x.slug);
          });

          const next = { items: nextItems, vehicleType: inferred };
          saveCompare(next);
          setCompare(next);
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

  /* =========================
     Render
     ========================= */

  if (loading) return <p style={{ padding: "2rem" }}>Loading comparison…</p>;
  if (err) return <p style={{ padding: "2rem", color: "crimson" }}>{err}</p>;

  if (dtos.length < 2) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: 6 }}>Compare</h1>
        <p className="muted" style={{ marginBottom: 14 }}>
          Select at least 2 vehicles of the same type to compare.
        </p>
        <button className="btn" onClick={handleClearAll}>
          Clear compare
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 6 }}>Compare</h1>
          <p className="muted">
            Comparing {dtos.length} {vehicleType ?? "vehicles"}
          </p>
        </div>

        <button className="btn" onClick={handleClearAll}>
          Clear all
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 980 }}>
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
                    <div style={{ display: "grid", gap: 10 }}>
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

                      <button
                        className="btn btn-danger"
                        onClick={() => handleRemove(v.slug)}
                        style={{ justifySelf: "start" }}
                      >
                        Remove
                      </button>
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
