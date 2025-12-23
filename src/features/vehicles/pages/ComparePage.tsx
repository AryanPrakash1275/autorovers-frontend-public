// src/features/vehicles/pages/ComparePage.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  loadCompare,
  saveCompare,
  onCompareChanged,
  clearCompare,
  type CompareState,
} from "../compareState";
import {
  COMMON_FIELDS,
  BIKE_FIELDS,
  CAR_FIELDS,
  type VehicleKind,
} from "../comparisonFields";
import { getPublicVehicleBySlug } from "../api";
import type { VehicleWithDetailsDto } from "../types";

const FALLBACK_IMG =
  "https://dummyimage.com/240x160/cccccc/000000&text=No+Image";

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

  if (lc.includes("suv") || lc.includes("hatch") || lc.includes("sedan")) return "Car";
  if (lc.includes("bike") || lc.includes("scooter") || lc.includes("cruiser")) return "Bike";

  return undefined;
}

function sanitizeStateFromDtos(
  prev: CompareState,
  cleaned: VehicleWithDetailsDto[],
  inferred?: VehicleKind
): CompareState {
  const keepSlugs = new Set(cleaned.map((x) => x.slug).filter(Boolean) as string[]);
  const nextItems = prev.items.filter((x) => !!x.slug && keepSlugs.has(x.slug));
  return { items: nextItems, vehicleType: inferred };
}

export function ComparePage() {
  const nav = useNavigate();

  const [compare, setCompare] = useState(loadCompare());

  const [loading, setLoading] = useState(true);
  const [dtos, setDtos] = useState<VehicleWithDetailsDto[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleKind | undefined>();
  const [err, setErr] = useState<string | null>(null);

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

  function handleRemove(slug?: string | null) {
    if (!slug) return;

    const cur = loadCompare();
    const nextItems = cur.items.filter((x) => x.slug !== slug);

    const next: CompareState =
      nextItems.length === 0 ? { items: [] } : { ...cur, items: nextItems };

    saveCompare(next);
    setCompare(next);
  }

  function handleClearAll() {
    const next = clearCompare();
    setCompare(next);
  }

  function handleAddMore() {
    nav("/vehicles");
  }

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
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0);

        if (slugs.length < 2) {
          setDtos([]);
          setVehicleType(undefined);
          setLoading(false);
          return;
        }

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
          setCompare((prev) => {
            const next = sanitizeStateFromDtos(prev, cleaned, inferred);
            saveCompare(next);
            return next;
          });
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
  }, [compare.items, compare.vehicleType]);

  const fields = useMemo(() => {
    if (vehicleType === "Bike") return [...COMMON_FIELDS, ...BIKE_FIELDS];
    if (vehicleType === "Car") return [...COMMON_FIELDS, ...CAR_FIELDS];
    return [...COMMON_FIELDS];
  }, [vehicleType]);

  if (loading) return <div className="public-page">Loading comparison…</div>;
  if (err) return <div className="public-page error">{err}</div>;

  if (dtos.length < 2) {
    return (
      <div className="public-page">
        <div className="compare-head">
          <div>
            <h1 className="public-title">Compare</h1>
            <p className="public-subtitle">
              Select at least 2 vehicles of the same type to compare.
            </p>
          </div>

          <div className="compare-actions">
            <button className="public-btn public-btn--ghost" onClick={handleAddMore}>
              Add vehicles
            </button>
            <button className="public-btn public-btn--danger" onClick={handleClearAll}>
              Clear
            </button>
          </div>
        </div>

        <div className="empty-state">
          <p className="muted">
            Your compare list is empty (or has only 1 vehicle).
          </p>
          <Link className="public-btn public-btn--primary" to="/vehicles">
            Browse vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="compare-head">
        <div>
          <h1 className="public-title">Compare</h1>
          <p className="public-subtitle">
            Comparing {dtos.length} {vehicleType ?? "vehicles"}
          </p>
        </div>

        <div className="compare-actions">
          <button className="public-btn public-btn--ghost" onClick={handleAddMore}>
            Add more
          </button>
          <button className="public-btn public-btn--danger" onClick={handleClearAll}>
            Clear all
          </button>
        </div>
      </div>

      <div className="compare-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-spec">Spec</th>

              {dtos.map((v) => {
                const brand = dash(v.brand);
                const model = dash(v.model);
                const variant = dash(v.variant);
                const img = v.imageUrl?.trim() ? v.imageUrl : FALLBACK_IMG;

                return (
                  <th key={v.id} className="compare-col">
                    <div className="compare-vehicle">
                      <div className="compare-vehicle-top">
                        <img
                          src={img}
                          alt={`${brand} ${model}`}
                          className="compare-img"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMG;
                          }}
                        />

                        <div className="compare-title">
                          <div className="compare-name">
                            {brand} {model}
                          </div>
                          {variant !== "—" && <div className="compare-variant">{variant}</div>}
                          <div className="compare-meta">
                            <span>{v.year ?? "—"}</span>
                            <span>·</span>
                            <span>{v.category ?? "—"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="compare-vehicle-actions">
                        {v.slug ? (
                          <Link
                            className="public-btn public-btn--ghost"
                            to={`/vehicles/${encodeURIComponent(v.slug)}`}
                          >
                            View
                          </Link>
                        ) : (
                          <button className="public-btn public-btn--ghost" disabled>
                            View
                          </button>
                        )}

                        <button
                          className="public-btn public-btn--danger"
                          onClick={() => handleRemove(v.slug)}
                        >
                          Remove
                        </button>
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
                <td className="compare-spec-cell">{f.label}</td>
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
