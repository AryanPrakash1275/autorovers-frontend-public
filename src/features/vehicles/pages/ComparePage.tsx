// src/features/vehicles/pages/ComparePage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  loadCompare,
  saveCompare,
  onCompareChanged,
  clearCompare,
  type CompareState,
  type CompareVehicleType,
} from "../compareState";
import { getPublicVehicleBySlug } from "../api";
import type { VehicleWithDetailsDto, VehicleListItem } from "../types";

import { getComparisonRowsForType, type ComparisonVehicle } from "../comparisonContract";
import { mapToComparisonVehicle } from "../mapToComparisonVehicle";
import {
  getSelectedVehicleType,
  type VehicleType as StoredVehicleType,
} from "../vehicleTypeStorage";

/* =========================
   URL helpers
========================= */

const QS_KEY = "slugs";

function normalizeSlug(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length ? t : null;
}

function encodeSlugs(slugs: string[]): string {
  return slugs.map((s) => encodeURIComponent(s)).join(",");
}

function decodeSlugs(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => {
      try {
        return decodeURIComponent(x);
      } catch {
        return x;
      }
    })
    .map((x) => x.trim())
    .filter(Boolean);
}

function uniqMax4(slugs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of slugs) {
    const n = normalizeSlug(s);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 4) break;
  }
  return out;
}

/* =========================
   Type normalizers
========================= */

type ContractVehicleType = "Bike" | "Car";

function toCompareType(v: unknown): CompareVehicleType | undefined {
  if (v === "bike" || v === "car") return v;

  if (v === "Bike") return "bike";
  if (v === "Car") return "car";

  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "bike") return "bike";
    if (t === "car") return "car";
  }

  return undefined;
}

function toContractType(v: CompareVehicleType): ContractVehicleType {
  return v === "bike" ? "Bike" : "Car";
}

/* =========================
   Helpers
========================= */

function sanitizeStateFromSlugs(
  prev: CompareState,
  keepSlugs: Set<string>,
  lockedType?: CompareVehicleType
): CompareState {
  const nextItems = prev.items.filter((x) => !!x.slug && keepSlugs.has(x.slug));
  if (nextItems.length === 0) return { items: [] };
  return { items: nextItems, vehicleType: lockedType };
}

function labelPlural(t: CompareVehicleType): string {
  return t === "bike" ? "Bikes" : "Cars";
}

function labelSingular(t: CompareVehicleType): string {
  return t === "bike" ? "Bike" : "Car";
}

/** tiny helper for "decision rows first" without touching comparisonContract */
function decisionRowScore(label: string): number {
  const t = label.trim().toLowerCase();

  if (t.includes("price")) return 0;
  if (t.includes("power")) return 1;
  if (t.includes("torque")) return 2;
  if (t.includes("mileage") || t.includes("kmpl") || t.includes("efficien")) return 3;
  if (t.includes("range")) return 4;

  if (t.includes("engine") || t.includes("displacement") || t.includes("motor")) return 10;
  if (t.includes("0-") || t.includes("accel") || t.includes("top speed")) return 11;

  return 100;
}

export function ComparePage() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [compare, setCompare] = useState(loadCompare());

  const [loading, setLoading] = useState(true);
  const [dtos, setDtos] = useState<VehicleWithDetailsDto[]>([]);
  const [vehicleType, setVehicleType] = useState<CompareVehicleType | undefined>();
  const [err, setErr] = useState<string | null>(null);

  // reactive selected type (Browse/Add-more always correct)
  const [selectedType, setSelectedType] = useState<StoredVehicleType | undefined>(() =>
    getSelectedVehicleType()
  );

  // prevent URL<->state infinite loops
  const urlHydratedOnce = useRef(false);
  const lastUrlSlugs = useRef<string>("");

  useEffect(() => {
    const sync = () => setSelectedType(getSelectedVehicleType());

    window.addEventListener("focus", sync);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "autorovers_vehicle_type_v1") sync();
      if (e.key === "autorovers_compare_v1") setCompare(loadCompare());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const off = onCompareChanged(setCompare);
    return () => off();
  }, []);

  // ✅ IMPORTANT: fallback type so "Add more" never dumps user back to "/"
  const effectiveBrowseType: CompareVehicleType | undefined =
    selectedType ?? compare.vehicleType ?? vehicleType;

  const browseTo = effectiveBrowseType ? `/vehicles?type=${effectiveBrowseType}` : "/";

  function handleRemove(slug?: string | null) {
    if (!slug) return;

    const cur = loadCompare();
    const nextItems = cur.items.filter((x) => x.slug !== slug);

    const next: CompareState =
      nextItems.length === 0 ? { items: [] } : { ...cur, items: nextItems };

    saveCompare(next);
  }

  function handleClearAll() {
    clearCompare();
  }

  function handleAddMore() {
    nav(browseTo);
  }

  function handleTrimTo4() {
    const cur = loadCompare();
    const slugs = uniqMax4(
      cur.items.map((x) => normalizeSlug(x.slug)).filter(Boolean) as string[]
    );

    const nextItems: VehicleListItem[] = slugs.map(
      (s) => ({ id: 0, slug: s } as unknown as VehicleListItem)
    );

    const next: CompareState = nextItems.length ? { ...cur, items: nextItems } : { items: [] };
    saveCompare(next);
  }

  /* =====================================================
     Stable slug key for effects
  ===================================================== */
  const compareSlugKey = useMemo(() => {
    const slugs = uniqMax4(
      compare.items.map((x) => normalizeSlug(x.slug)).filter(Boolean) as string[]
    );
    return slugs.join("|");
  }, [compare.items]);

  const rawCompareCount = useMemo(() => {
    const slugs = compare.items
      .map((x) => normalizeSlug(x.slug))
      .filter((x): x is string => !!x);
    return new Set(slugs).size;
  }, [compare.items]);

  const overLimit = rawCompareCount > 4;

  /* =====================================================
     (1) URL -> Compare hydration (RUN ONCE)
  ===================================================== */
  useEffect(() => {
    if (urlHydratedOnce.current) return;

    const raw = searchParams.get(QS_KEY);
    const slugsFromUrl = uniqMax4(decodeSlugs(raw));

    lastUrlSlugs.current = encodeSlugs(slugsFromUrl);
    urlHydratedOnce.current = true;

    if (slugsFromUrl.length < 2) return;

    const minimalItems: VehicleListItem[] = slugsFromUrl.map(
      (s) => ({ id: 0, slug: s } as unknown as VehicleListItem)
    );

    saveCompare({ items: minimalItems });
  }, [searchParams]);

  /* =====================================================
     (2) Compare -> URL (always shareable)
  ===================================================== */
  useEffect(() => {
    if (!urlHydratedOnce.current) return;

    const slugs = compareSlugKey ? compareSlugKey.split("|") : [];
    const encoded = encodeSlugs(slugs);

    if (encoded === lastUrlSlugs.current) return;
    lastUrlSlugs.current = encoded;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        if (slugs.length < 2) {
          next.delete(QS_KEY);
          return next;
        }

        next.set(QS_KEY, encoded);
        return next;
      },
      { replace: true }
    );
  }, [compareSlugKey, setSearchParams]);

  /* =====================================================
     (3) Load DTOs from compare state
  ===================================================== */
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        const slugs = compareSlugKey ? compareSlugKey.split("|") : [];
        if (slugs.length < 2) {
          setDtos([]);
          setVehicleType(undefined);
          setLoading(false);
          return;
        }

        const settled = await Promise.allSettled(slugs.map((slug) => getPublicVehicleBySlug(slug)));

        const ok: VehicleWithDetailsDto[] = [];
        const failedSlugs: string[] = [];

        settled.forEach((r, idx) => {
          if (r.status === "fulfilled") ok.push(r.value);
          else failedSlugs.push(slugs[idx]);
        });

        const publishable: VehicleWithDetailsDto[] = [];
        const publishableSlugs = new Set<string>();
        let lockedType: CompareVehicleType | undefined;

        for (const dto of ok) {
          const mapped = mapToComparisonVehicle(dto);
          if (!mapped.ok) continue;

          const t = toCompareType(mapped.value.vehicleType);
          if (!t) continue;

          if (!lockedType) lockedType = t;
          if (t !== lockedType) continue;

          publishable.push(dto);
          publishableSlugs.add(mapped.value.slug);
        }

        if (cancelled) return;

        setDtos(publishable);
        setVehicleType(lockedType);
        setLoading(false);

        const shouldSanitize = failedSlugs.length > 0 || publishable.length !== ok.length;

        if (shouldSanitize) {
          const prev = loadCompare();
          const next = sanitizeStateFromSlugs(prev, publishableSlugs, lockedType);

          const idBySlug = new Map<string, number>();
          for (const d of publishable) {
            if (typeof d.slug === "string" && typeof d.id === "number") {
              idBySlug.set(d.slug, d.id);
            }
          }

          next.items = next.items.map((it) => {
            const s = typeof it.slug === "string" ? it.slug : "";
            const id = idBySlug.get(s);
            return id ? { ...it, id } : it;
          });

          saveCompare(next);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load comparison");
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [compareSlugKey]);

  const rows = useMemo(() => {
    if (!vehicleType) return [];

    // ✅ convert app compare type ("bike"|"car") -> contract type ("Bike"|"Car")
    const contractType = toContractType(vehicleType);
    const base = getComparisonRowsForType(contractType);

    return base
      .map((r, idx) => ({ r, idx }))
      .sort((a, b) => {
        const sa = decisionRowScore(a.r.label);
        const sb = decisionRowScore(b.r.label);
        if (sa !== sb) return sa - sb;
        return a.idx - b.idx;
      })
      .map((x) => x.r);
  }, [vehicleType]);

  const mappedVehicles = useMemo((): ComparisonVehicle[] => {
    const out: ComparisonVehicle[] = [];
    for (const d of dtos) {
      const r = mapToComparisonVehicle(d);
      if (r.ok) out.push(r.value);
    }
    return out;
  }, [dtos]);

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
            <button className="public-btn public-btn--ghost" onClick={handleAddMore}>
              Add vehicles
            </button>
            <button className="public-btn public-btn--danger" onClick={handleClearAll}>
              Clear
            </button>
          </div>
        </div>

        <div className="no-results">
          Your compare list is empty (or has only 1 publishable vehicle).
        </div>

        <div style={{ marginTop: 12 }}>
          <Link className="public-btn public-btn--primary" to={browseTo}>
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
            Comparing {mappedVehicles.length} {labelPlural(vehicleType)}
            {overLimit ? " (showing first 4)" : ""}
          </p>

          {overLimit && (
            <div className="compare-limit-hint">
              You have more than 4 vehicles selected. Compare supports max 4.
              <button
                type="button"
                className="public-btn public-btn--ghost compare-limit-btn"
                onClick={handleTrimTo4}
              >
                Trim to 4
              </button>
            </div>
          )}
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
        <table className="compare-table compare-table--sticky-spec">
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
                        width={180}
                        height={120}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";
                        }}
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

      <div style={{ marginTop: 12 }}>
        <div className="public-subtitle">Type locked: {labelSingular(vehicleType)}</div>
      </div>
    </div>
  );
}
