import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { VehicleListItem } from "../../features/vehicles/types";
import { getPublicVehicles } from "../../features/vehicles/api";
import {
  loadCompare,
  toggleCompare,
  clearCompare,
  onCompareChanged,
} from "../../features/vehicles/compareState";
import { Footer } from "../../shared/ui/Footer";

const BIKE_CATEGORIES = new Set([
  "Sport",
  "Commuter",
  "Cruiser",
  "Tourer",
  "Off-road",
  "Scooter",
  "EV Bike",
]);

const CAR_CATEGORIES = new Set([
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "Coupe",
  "EV Car",
]);

type CategoryFilter = "all" | "bike" | "car";
type SortBy = "priceAsc" | "priceDesc" | "yearAsc" | "yearDesc";

type MaybeError = { message?: string };

const HERO_IMG =
  "https://images.pexels.com/photos/100654/pexels-photo-100654.jpeg?auto=compress&cs=tinysrgb&w=1600";
const FALLBACK_IMG =
  "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function safeNum(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function VehiclesPage() {
  const nav = useNavigate();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("priceAsc");

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

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getPublicVehicles();
        if (alive) setVehicles(data);
      } catch (err: unknown) {
        const maybe = err as MaybeError;
        if (alive) setError(maybe?.message ?? "Failed to load vehicles");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter((v) => {
        const brand = safeStr(v.brand).toLowerCase();
        const model = safeStr(v.model).toLowerCase();
        const variant = safeStr(v.variant).toLowerCase();
        return brand.includes(s) || model.includes(s) || variant.includes(s);
      });
    }

    if (category === "bike") {
      list = list.filter((v) => !!v.category && BIKE_CATEGORIES.has(v.category));
    } else if (category === "car") {
      list = list.filter((v) => !!v.category && CAR_CATEGORIES.has(v.category));
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      const ap = safeNum(a.price);
      const bp = safeNum(b.price);
      const ay = safeNum(a.year);
      const by = safeNum(b.year);

      switch (sortBy) {
        case "priceAsc":
          return ap - bp;
        case "priceDesc":
          return bp - ap;
        case "yearAsc":
          return ay - by;
        case "yearDesc":
          return by - ay;
        default:
          return 0;
      }
    });

    return sorted;
  }, [vehicles, search, category, sortBy]);

  const compareCount = compare.items.length;

  function isCompared(id: number) {
    return compare.items.some((x) => x.id === id);
  }

  function onToggleCompare(e: React.MouseEvent, v: VehicleListItem) {
    e.preventDefault();
    e.stopPropagation();

    const next = toggleCompare(loadCompare(), v);
    setCompare(next);
  }

  function onClearCompare() {
    const next = clearCompare();
    setCompare(next);
  }

  function goCompare() {
    nav("/compare");
  }

  if (loading) return <div className="public-page">Loading vehicles…</div>;
  if (error) return <div className="public-page error">{error}</div>;

  return (
    <div
      className={`public-page ${compareCount ? "has-comparebar" : ""}`}
    >
      <section className="hero hero-with-image">
        <div className="hero-bg">
          <img src={HERO_IMG} alt="Autorovers hero" className="hero-bg-image" />
          <div className="hero-bg-overlay" />
        </div>

        <div className="hero-layer">
          <div className="hero-copy">
            <h1 className="hero-title">
              A clean, specs-first catalog for bikes and cars.
            </h1>
            <p className="hero-tagline">
              Structured data. Real variants. Fast comparisons.
            </p>
            <p className="hero-subtext">
              Designed for clarity, consistency, and usability across devices.
            </p>
          </div>
        </div>
      </section>

      <section className="catalog-section catalog-section--spaced">
        <div className="catalog-controls">
          <input
            type="text"
            placeholder="Search by brand, model, variant..."
            className="catalog-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="catalog-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          >
            <option value="all">All vehicles</option>
            <option value="bike">Bikes</option>
            <option value="car">Cars</option>
          </select>

          <select
            className="catalog-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="yearAsc">Year: Old to New</option>
            <option value="yearDesc">Year: New to Old</option>
          </select>
        </div>
      </section>

      <section className="catalog-section">
        <div className="vehicle-grid">
          {filteredVehicles.length === 0 && (
            <div className="no-results">No vehicles match your filters.</div>
          )}

          {filteredVehicles.map((v) => {
            const slug = safeStr(v.slug);
            const to =
              slug.trim().length > 0
                ? `/vehicles/${encodeURIComponent(slug)}`
                : "/vehicles";

            const priceText =
              typeof v.price === "number" && v.price > 0
                ? `Starting from ₹ ${v.price.toLocaleString("en-IN")}`
                : "Price unavailable";

            const title =
              `${safeStr(v.brand)} ${safeStr(v.model)}`.trim() || "Vehicle";

            const selected = isCompared(v.id);
            const canCompare = typeof v.slug === "string" && v.slug.trim().length > 0;

            return (
              <Link key={v.id} to={to} className="vehicle-card">
                <div className="vehicle-card-image-wrapper">
                  <img
                    src={safeStr(v.imageUrl) || FALLBACK_IMG}
                    alt={title}
                    className="vehicle-card-image"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                </div>

                <div className="vehicle-card-header">
                  <h2 className="vehicle-card-title">{title}</h2>
                  <p className="vehicle-card-variant">
                    {safeStr(v.variant) || "—"}
                  </p>
                </div>

                <div className="vehicle-card-specs">
                  <span className="vehicle-card-price">{priceText}</span>
                </div>

                <div className="vehicle-card-footer">
                  <span className="vehicle-card-tag">{v.year ?? "—"}</span>
                  <span className="vehicle-card-tag">{v.category ?? "—"}</span>
                  <span className="vehicle-card-tag">
                    {v.transmission ?? "—"}
                  </span>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    className={`public-btn ${
                      selected ? "public-btn--danger" : "public-btn--primary"
                    }`}
                    style={{ width: "100%" }}
                    disabled={!canCompare}
                    onClick={(e) => onToggleCompare(e, v)}
                    title={
                      canCompare
                        ? selected
                          ? "Remove from compare"
                          : "Add to compare"
                        : "Missing slug (cannot compare)"
                    }
                  >
                    {selected ? "Remove from Compare" : "Add to Compare"}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {compareCount > 0 && (
        <div className="compare-bar">
          <div className="compare-bar-left">
            <div className="compare-bar-title">Compare: {compareCount}/4</div>
            <div className="compare-bar-subtitle">
              {compare.vehicleType ? `Locked to ${compare.vehicleType}` : "Pick one type"}
            </div>
          </div>

          <div className="compare-bar-actions">
            <button className="public-btn public-btn--ghost" onClick={onClearCompare}>
              Clear
            </button>
            <button
              className="public-btn public-btn--primary"
              onClick={goCompare}
              disabled={compareCount < 2}
            >
              Compare
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
