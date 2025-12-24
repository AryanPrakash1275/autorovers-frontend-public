import React, { useEffect, useMemo, useRef, useState } from "react";
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
type BundleKey = "none" | "budget" | "newest" | "ev" | "suv" | "commuter";
type FeaturedTab = "trending" | "popular" | "electric" | "upcoming";
type BrowseTab = "brand" | "budget" | "body";
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatINR(n: number) {
  return `₹ ${Math.round(n).toLocaleString("en-IN")}`;
}

function computePercentile(values: number[], p: number) {
  const v = values
    .filter((x) => Number.isFinite(x) && x > 0)
    .sort((a, b) => a - b);
  if (v.length === 0) return 0;
  const idx = clamp(Math.floor((v.length - 1) * p), 0, v.length - 1);
  return v[idx];
}

function roundToNearest(n: number, step: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n / step) * step;
}

function isBikeCategory(catRaw: unknown) {
  const cat = safeStr(catRaw).trim();
  return cat.length > 0 && BIKE_CATEGORIES.has(cat);
}

function isCarCategory(catRaw: unknown) {
  const cat = safeStr(catRaw).trim();
  return cat.length > 0 && CAR_CATEGORIES.has(cat);
}

function isEvVehicle(v: VehicleListItem) {
  const cat = safeStr(v.category).toLowerCase();
  return cat.startsWith("ev") || cat.includes("ev ");
}

export function VehiclesPage() {
  const nav = useNavigate();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("priceAsc");
  const [bundle, setBundle] = useState<BundleKey>("none");

  const [featuredTab, setFeaturedTab] = useState<FeaturedTab>("trending");
  const [browseTab, setBrowseTab] = useState<BrowseTab>("brand");

  const [compare, setCompare] = useState(loadCompare());

  // ===== Featured row carousel state =====
  const featuredRowRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = featuredRowRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < maxScrollLeft - 2);
  }

  function scrollFeatured(dir: "left" | "right") {
    const el = featuredRowRef.current;
    if (!el) return;

    // scroll by ~one viewport width (but not insane)
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

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

  const bundleMeta = useMemo(() => {
    const prices = vehicles.map((v) => safeNum(v.price)).filter((x) => x > 0);
    const years = vehicles.map((v) => safeNum(v.year)).filter((x) => x > 0);

    const p30 = computePercentile(prices, 0.3);
    const budgetUnderRaw = p30 > 0 ? p30 : 150000;
    const budgetUnder = roundToNearest(budgetUnderRaw, 10000) || 150000;

    const maxYear = years.length ? Math.max(...years) : 0;
    const newestYearFloor = maxYear > 0 ? maxYear - 1 : 0;

    return { budgetUnder, maxYear, newestYearFloor };
  }, [vehicles]);

  function goGrid() {
    setTimeout(() => {
      document.querySelector(".catalog-controls")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function applyPreset(next: BundleKey) {
    setBundle(next);
    goGrid();
  }

  const bundlePredicate = useMemo(() => {
    switch (bundle) {
      case "budget":
        return (v: VehicleListItem) => {
          const p = safeNum(v.price);
          return p > 0 && p <= bundleMeta.budgetUnder;
        };
      case "newest":
        return (v: VehicleListItem) => {
          const y = safeNum(v.year);
          return y > 0 && y >= bundleMeta.newestYearFloor;
        };
      case "ev":
        return (v: VehicleListItem) => isEvVehicle(v);
      case "suv":
        return (v: VehicleListItem) =>
          safeStr(v.category).trim().toLowerCase() === "suv";
      case "commuter":
        return (v: VehicleListItem) =>
          safeStr(v.category).trim().toLowerCase() === "commuter";
      default:
        return () => true;
    }
  }, [bundle, bundleMeta.budgetUnder, bundleMeta.newestYearFloor]);

  const filteredVehicles = useMemo(() => {
    let list = vehicles.filter(bundlePredicate);

    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter((v) => {
        const brand = safeStr(v.brand).toLowerCase();
        const model = safeStr(v.model).toLowerCase();
        const variant = safeStr(v.variant).toLowerCase();
        const cat = safeStr(v.category).toLowerCase();
        return (
          brand.includes(s) ||
          model.includes(s) ||
          variant.includes(s) ||
          cat.includes(s)
        );
      });
    }

    if (category === "bike") {
      list = list.filter((v) => !!v.category && isBikeCategory(v.category));
    } else if (category === "car") {
      list = list.filter((v) => !!v.category && isCarCategory(v.category));
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
  }, [vehicles, bundlePredicate, search, category, sortBy]);

  /* =========================
     Featured section (BikeWale-style)
     ========================= */
  const featuredList = useMemo(() => {
    const base = vehicles.filter(
      (v) => safeNum(v.price) > 0 && safeNum(v.year) > 0
    );

    const newest = [...base].sort((a, b) => safeNum(b.year) - safeNum(a.year));
    const cheapestRecent = [...base]
      .filter((v) => safeNum(v.year) >= bundleMeta.maxYear - 3)
      .sort((a, b) => safeNum(a.price) - safeNum(b.price));

    const maxYear = bundleMeta.maxYear;

    switch (featuredTab) {
      case "trending":
        return newest.slice(0, 12);
      case "popular":
        return cheapestRecent.slice(0, 12);
      case "electric":
        return base.filter(isEvVehicle).slice(0, 12);
      case "upcoming":
        return base.filter((v) => safeNum(v.year) === maxYear).slice(0, 12);
      default:
        return newest.slice(0, 12);
    }
  }, [vehicles, featuredTab, bundleMeta.maxYear]);

  // keep arrows accurate when list/tab changes
  useEffect(() => {
    setTimeout(() => updateArrows(), 0);
  }, [featuredTab, featuredList.length]);

  useEffect(() => {
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const topBrands = useMemo(() => {
    const brands = vehicles.map((v) => safeStr(v.brand).trim()).filter(Boolean);
    const map = new Map<string, number>();
    for (const b of brands) map.set(b, (map.get(b) ?? 0) + 1);

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([b]) => b);
  }, [vehicles]);

  const compareCount = compare.items.length;

  function isCompared(id: number) {
    return compare.items.some((x) => x.id === id);
  }

  function onToggleCompare(e: React.MouseEvent, v: VehicleListItem) {
    e.preventDefault();
    e.stopPropagation();

    const next = toggleCompare(loadCompare(), v);
    setCompare(next);

    if (compare.items.length === 0) {
      setTimeout(() => {
        document.querySelector(".compare-bar")?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 0);
    }
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
    <div className={`public-page ${compareCount ? "has-comparebar" : ""}`}>
      {/* ================= HERO ================= */}
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

      {/* ================= HOMEPAGE BUNDLES ================= */}
      <section className="catalog-section catalog-section--spaced">
        <div className="bundle-head">
          <div>
            <h2 className="bundle-title">Featured Vehicles</h2>
            <div className="bundle-tabs">
              <button
                className={`bundle-tab ${featuredTab === "trending" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("trending")}
              >
                Trending
              </button>
              <button
                className={`bundle-tab ${featuredTab === "popular" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("popular")}
              >
                Popular
              </button>
              <button
                className={`bundle-tab ${featuredTab === "electric" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("electric")}
              >
                Electric
              </button>
              <button
                className={`bundle-tab ${featuredTab === "upcoming" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("upcoming")}
                disabled={bundleMeta.maxYear === 0}
              >
                Upcoming
              </button>
            </div>
          </div>

          <button
            className="bundle-viewall"
            onClick={() => {
              if (featuredTab === "electric") applyPreset("ev");
              else if (featuredTab === "popular") applyPreset("budget");
              else applyPreset("newest");
            }}
          >
            View all
          </button>
        </div>

        {/* ✅ FEATURED CAROUSEL WITH ARROWS */}
        <div className="bundle-row-wrap">
          <button
            className="bundle-arrow"
            onClick={() => scrollFeatured("left")}
            disabled={!canLeft}
            aria-label="Scroll left"
            title="Scroll left"
          >
            ‹
          </button>

          <div
            className="bundle-row bundle-row--carousel"
            ref={featuredRowRef}
            onScroll={updateArrows}
          >
            {featuredList.map((v) => {
              const slug = safeStr(v.slug);
              const to =
                slug.trim().length > 0
                  ? `/vehicles/${encodeURIComponent(slug)}`
                  : "/vehicles";

              const title =
                `${safeStr(v.brand)} ${safeStr(v.model)}`.trim() || "Vehicle";

              const priceText =
                typeof v.price === "number" && v.price > 0
                  ? `₹ ${v.price.toLocaleString("en-IN")}`
                  : "—";

              return (
                <Link key={`feat-${v.id}`} to={to} className="bundle-card vehicle-card">
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

                  <div className="bundle-price">{priceText} onwards</div>
                </Link>
              );
            })}
          </div>

          <button
            className="bundle-arrow"
            onClick={() => scrollFeatured("right")}
            disabled={!canRight}
            aria-label="Scroll right"
            title="Scroll right"
          >
            ›
          </button>
        </div>

        <div className="bundle-block">
          <div className="bundle-head">
            <div>
              <h2 className="bundle-title">Browse Vehicles By</h2>
              <div className="bundle-tabs">
                <button
                  className={`bundle-tab ${browseTab === "brand" ? "is-active" : ""}`}
                  onClick={() => setBrowseTab("brand")}
                >
                  Brand
                </button>
                <button
                  className={`bundle-tab ${browseTab === "budget" ? "is-active" : ""}`}
                  onClick={() => setBrowseTab("budget")}
                >
                  Budget
                </button>
                <button
                  className={`bundle-tab ${browseTab === "body" ? "is-active" : ""}`}
                  onClick={() => setBrowseTab("body")}
                >
                  Body style
                </button>
              </div>
            </div>
          </div>

          {browseTab === "brand" && (
            <div className="browse-grid">
              {topBrands.map((b) => (
                <button
                  key={b}
                  className="browse-pill"
                  onClick={() => {
                    setBundle("none");
                    setSearch(b);
                    goGrid();
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {browseTab === "budget" && (
            <div className="browse-grid">
              <button className="browse-pill" onClick={() => applyPreset("budget")}>
                Under {formatINR(bundleMeta.budgetUnder)}
              </button>
              <button className="browse-pill" onClick={() => applyPreset("newest")}>
                Newest launches
              </button>
              <button className="browse-pill" onClick={() => applyPreset("ev")}>
                EVs
              </button>
              <button className="browse-pill" onClick={() => applyPreset("suv")}>
                SUVs
              </button>
              <button className="browse-pill" onClick={() => applyPreset("commuter")}>
                Commuters
              </button>
            </div>
          )}

          {browseTab === "body" && (
            <div className="browse-grid">
              <button className="browse-pill" onClick={() => applyPreset("suv")}>
                SUVs
              </button>
              <button className="browse-pill" onClick={() => applyPreset("commuter")}>
                Commuters
              </button>
              <button
                className="browse-pill"
                onClick={() => {
                  setBundle("none");
                  setSearch("Sedan");
                  setCategory("car");
                  goGrid();
                }}
              >
                Sedans
              </button>
              <button
                className="browse-pill"
                onClick={() => {
                  setBundle("none");
                  setSearch("Hatchback");
                  setCategory("car");
                  goGrid();
                }}
              >
                Hatchbacks
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= CONTROLS ================= */}
      <section className="catalog-section catalog-section--spaced">
        <h2 style={{ marginBottom: 12 }}>All Vehicles</h2>

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

      {/* ================= GRID ================= */}
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
            const canCompare =
              typeof v.slug === "string" && v.slug.trim().length > 0;

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
                  <p className="vehicle-card-variant">{safeStr(v.variant) || "—"}</p>
                </div>

                <div className="vehicle-card-specs">
                  <span className="vehicle-card-price">{priceText}</span>
                </div>

                <div className="vehicle-card-footer">
                  <span className="vehicle-card-tag">{v.year ?? "—"}</span>
                  <span className="vehicle-card-tag">{v.category ?? "—"}</span>
                  <span className="vehicle-card-tag">{v.transmission ?? "—"}</span>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    className={`public-btn ${
                      selected ? "public-btn--danger" : "public-btn--primary"
                    }`}
                    style={{ width: "100%" }}
                    disabled={!canCompare}
                    onClick={(e) => {
                      if (!canCompare) return;
                      onToggleCompare(e, v);
                    }}
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

      {/* ================= COMPARE BAR ================= */}
      {compareCount > 0 && (
        <div className="compare-bar">
          <div>
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
