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
import { getPublicVehicleBySlug } from "../api";
import type { VehicleWithDetailsDto, VehicleType } from "../types";

import {
  getComparisonRowsForType,
  type ComparisonVehicle,
} from "../comparisonContract";
import { mapToComparisonVehicle } from "../mapToComparisonVehicle";

/* =========================
   Helpers
========================= */

function sanitizeStateFromSlugs(
  prev: CompareState,
  keepSlugs: Set<string>,
  lockedType?: VehicleType
): CompareState {
  const nextItems = prev.items.filter(
    (x) => !!x.slug && keepSlugs.has(x.slug)
  );
  return { items: nextItems, vehicleType: lockedType };
}

/* =========================
   Component
========================= */

export function ComparePage() {
  const nav = useNavigate();
  const [compare, setCompare] = useState(loadCompare());

  const [loading, setLoading] = useState(true);
  const [dtos, setDtos] = useState<VehicleWithDetailsDto[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleType | undefined>();
  const [err, setErr] = useState<string | null>(null);

  /* =========================
     Compare state listeners
  ========================= */

  useEffect(() => {
    const off = onCompareChanged(setCompare);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "autorovers_compare_v1") {
        setCompare(loadCompare());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      off();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* =========================
     Actions
  ========================= */

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

  /* =========================
     Load & validate vehicles
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

        const settled = await Promise.allSettled(
          slugs.map((slug) => getPublicVehicleBySlug(slug))
        );

        const ok: VehicleWithDetailsDto[] = [];
        const failedSlugs: string[] = [];

        settled.forEach((r, idx) => {
          if (r.status === "fulfilled") ok.push(r.value);
          else failedSlugs.push(slugs[idx]);
        });

        const publishable: VehicleWithDetailsDto[] = [];
        const publishableSlugs = new Set<string>();
        let lockedType: VehicleType | undefined;

        for (const dto of ok) {
          const mapped = mapToComparisonVehicle(dto);
          if (!mapped.ok) continue;

          const t = mapped.value.vehicleType;
          if (!lockedType) lockedType = t;
          if (t !== lockedType) continue;

          publishable.push(dto);
          publishableSlugs.add(mapped.value.slug);
        }

        if (cancelled) return;

        setDtos(publishable);
        setVehicleType(lockedType);
        setLoading(false);

        const shouldSanitize =
          failedSlugs.length > 0 || publishable.length !== ok.length;

        if (shouldSanitize) {
          setCompare((prev) => {
            const next = sanitizeStateFromSlugs(
              prev,
              publishableSlugs,
              lockedType
            );
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

  /* =========================
     Derived data
  ========================= */

  const rows = useMemo(() => {
    if (!vehicleType) return [];
    return getComparisonRowsForType(vehicleType);
  }, [vehicleType]);

  const mappedVehicles = useMemo((): ComparisonVehicle[] => {
    const out: ComparisonVehicle[] = [];

    for (const d of dtos) {
      const r = mapToComparisonVehicle(d);
      if (r.ok) out.push(r.value);
    }

    return out;
  }, [dtos]);

  /* =========================
     Render guards
  ========================= */

  if (loading) return <div className="public-page">Loading comparison…</div>;
  if (err) return <div className="public-page error">{err}</div>;

  if (mappedVehicles.length < 2 || !vehicleType) {
    return (
      <div className="public-page">
        <div className="compare-head">
          <div>
            <h1 className="public-title">Compare</h1>
            <p className="public-subtitle">
              Select at least 2 publishable vehicles of the same type to compare.
            </p>
          </div>

          <div className="compare-actions">
            <button
              className="public-btn public-btn--ghost"
              onClick={handleAddMore}
            >
              Add vehicles
            </button>
            <button
              className="public-btn public-btn--danger"
              onClick={handleClearAll}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="empty-state">
          <p className="muted">
            Your compare list is empty (or has only 1 publishable vehicle).
          </p>
          <Link className="public-btn public-btn--primary" to="/vehicles">
            Browse vehicles
          </Link>
        </div>
      </div>
    );
  }

  /* =========================
     Table
  ========================= */

  return (
    <div className="public-page">
      <div className="compare-head">
        <div>
          <h1 className="public-title">Compare</h1>
          <p className="public-subtitle">
            Comparing {mappedVehicles.length} {vehicleType}
          </p>
        </div>

        <div className="compare-actions">
          <button
            className="public-btn public-btn--ghost"
            onClick={handleAddMore}
          >
            Add more
          </button>
          <button
            className="public-btn public-btn--danger"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="compare-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-spec">Spec</th>

              {mappedVehicles.map((v) => (
                <th key={v.id} className="compare-col">
                  <div className="compare-vehicle">
                    <div className="compare-vehicle-top">
                      <img
                        src={v.imageUrl}
                        alt={`${v.brand} ${v.model}`}
                        className="compare-img"
                      />

                      <div className="compare-title">
                        <div className="compare-name">
                          {v.brand} {v.model}
                        </div>
                        <div className="compare-variant">{v.variant}</div>
                        <div className="compare-meta">
                          <span>{v.year}</span>
                          <span>·</span>
                          <span>{v.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="compare-vehicle-actions">
                      <Link
                        className="public-btn public-btn--ghost"
                        to={`/vehicles/${encodeURIComponent(v.slug)}`}
                      >
                        View
                      </Link>

                      <button
                        className="public-btn public-btn--danger"
                        onClick={() => handleRemove(v.slug)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="compare-spec-cell">{row.label}</td>
                {mappedVehicles.map((v) => (
                  <td key={`${v.id}-${row.key}`}>{row.get(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
