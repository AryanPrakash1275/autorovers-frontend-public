// src/pages/public/VehiclesPage.tsx

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import type { FuelType, PublicVehiclesQuery, VehicleListItem } from "../../features/vehicles/types";
import { getPublicVehicles } from "../../features/vehicles/api";
import {
  loadCompare,
  toggleCompareWithResult,
  clearCompare,
  onCompareChanged,
} from "../../features/vehicles/compareState";
import { Footer } from "../../shared/ui/Footer";
import {
  getSelectedVehicleType,
  setSelectedVehicleType,
  isVehicleType,
  type VehicleType,
} from "../../features/vehicles/vehicleTypeStorage";

const BIKE_CATEGORIES = new Set(
  ["Sport", "Commuter", "Cruiser", "Tourer", "Off-road", "Scooter", "EV Bike"].map((x) =>
    x.toLowerCase()
  )
);

const CAR_CATEGORIES = new Set(
  ["Hatchback", "Sedan", "SUV", "MUV", "Coupe", "EV Car"].map((x) => x.toLowerCase())
);

type SortBy = "priceAsc" | "priceDesc" | "yearAsc" | "yearDesc";
type BundleKey = "none" | "budget" | "newest" | "ev" | "suv" | "commuter";
type FeaturedTab = "trending" | "popular" | "electric" | "upcoming";
type BrowseTab = "brand" | "budget" | "body";
type MaybeError = { message?: string };

const HERO_IMG =
  "https://images.pexels.com/photos/100654/pexels-photo-100654.jpeg?auto=compress&cs=tinysrgb&w=1600";
const FALLBACK_IMG = "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";

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
  if (BIKE_CATEGORIES.has(c)) return "bike";
  if (CAR_CATEGORIES.has(c)) return "car";
  return undefined;
}

function getSelectedTypeForRow(v: VehicleListItem): VehicleType | undefined {
  return toSelectedTypeFromVehicleType(v.vehicleType) ?? inferSelectedTypeFromCategory(v.category);
}

function isEvVehicle(v: VehicleListItem) {
  const c = norm(v.category);
  const ft = norm(v.fuelType);
  return ft === "ev" || c.startsWith("ev") || c.includes(" ev") || c.includes("electric");
}

function isNewVehicle(v: VehicleListItem, maxYear: number) {
  const y = safeNum(v.year);
  return maxYear > 0 && y >= maxYear - 1;
}

function isPopularHeuristic(v: VehicleListItem) {
  const p = safeNum(v.price);
  return p > 0 && p <= 200000;
}

function getBadges(v: VehicleListItem, maxYear: number) {
  const badges: Array<{ kind: "ev" | "new" | "popular"; text: string }> = [];
  if (isEvVehicle(v)) badges.push({ kind: "ev", text: "EV" });
  if (isNewVehicle(v, maxYear)) badges.push({ kind: "new", text: "New" });
  if (isPopularHeuristic(v)) badges.push({ kind: "popular", text: "Popular" });
  return badges.slice(0, 2);
}

function readInt(sp: URLSearchParams, key: string, fallback: number): number {
  const raw = sp.get(key);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function readStr(sp: URLSearchParams, key: string): string {
  return (sp.get(key) ?? "").trim();
}

function setParam(next: URLSearchParams, key: string, value: unknown) {
  if (value === null || value === undefined) {
    next.delete(key);
    return;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) next.delete(key);
    else next.set(key, t);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) next.delete(key);
    else next.set(key, String(value));
    return;
  }
  next.set(key, String(value));
}

function normalizeFuelType(raw: string): FuelType | "" {
  const t = raw.trim();
  if (!t) return "";
  return t;
}

function computePagerPages(current: number, total: number) {
  const cur = Math.max(1, Math.min(total, current));
  const t = Math.max(1, total);

  // Always show: 1, total, and a window around current
  const windowSize = 5; // includes current
  const half = Math.floor(windowSize / 2);

  let start = Math.max(2, cur - half);
  let end = Math.min(t - 1, cur + half);

  const actualWindow = end - start + 1;
  if (actualWindow < windowSize) {
    const missing = windowSize - actualWindow;
    start = Math.max(2, start - missing);
    end = Math.min(t - 1, end + missing);
  }

  const pages: number[] = [1];
  for (let i = start; i <= end; i++) pages.push(i);
  if (t > 1) pages.push(t);

  const uniq = Array.from(new Set(pages)).sort((a, b) => a - b);

  const tokens: Array<number | "…"> = [];
  for (let i = 0; i < uniq.length; i++) {
    const p = uniq[i];
    const prev = uniq[i - 1];
    if (i > 0 && prev !== undefined && p - prev > 1) tokens.push("…");
    tokens.push(p);
  }

  return tokens;
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

const DEFAULT_PAGE_SIZE = 24;

export function VehiclesPage() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTypeRaw = searchParams.get("type");
  const urlType = isVehicleType(urlTypeRaw) ? urlTypeRaw : undefined;

  const [selectedType, setSelectedType] = useState<VehicleType | undefined>(() =>
    getSelectedVehicleType()
  );

  // Resolve type (URL wins, else storage, else go home)
  useEffect(() => {
    const stored = getSelectedVehicleType();

    if (urlType) {
      if (stored !== urlType) setSelectedVehicleType(urlType);
      setSelectedType(urlType);
      return;
    }

    if (stored) {
      setSelectedType(stored);
      nav(`/vehicles?type=${stored}`, { replace: true });
      return;
    }

    nav("/", { replace: true });
  }, [urlType, nav]);

  // Set title + meta description per type (no extra libs)
  useEffect(() => {
    if (!selectedType) return;

    const title =
      selectedType === "car"
        ? "Cars in India — Compare specs & variants | Autorovers"
        : "Bikes in India — Compare specs & variants | Autorovers";

    const desc =
      selectedType === "car"
        ? "Browse cars with clean specs, variants, and side-by-side comparisons. Filter by brand, price, fuel type, and year."
        : "Browse bikes with clean specs, variants, and side-by-side comparisons. Filter by brand, price, fuel type, and year.";

    document.title = title;
    upsertMeta("description", desc);
  }, [selectedType]);

  // Normalize paging params into URL once we have a type
  useEffect(() => {
    if (!urlType) return;

    const page = Math.max(1, readInt(searchParams, "page", 1));
    const pageSize = clamp(readInt(searchParams, "pageSize", DEFAULT_PAGE_SIZE), 6, 96);

    const hasPage = searchParams.has("page");
    const hasPageSize = searchParams.has("pageSize");

    if (hasPage && hasPageSize) return;

    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (!sp.has("page")) sp.set("page", String(page));
        if (!sp.has("pageSize")) sp.set("pageSize", String(pageSize));
        return sp;
      },
      { replace: true }
    );
  }, [urlType, searchParams, setSearchParams]);

  const urlQ = readStr(searchParams, "q");
  const urlBrand = readStr(searchParams, "brand");
  const urlCategory = readStr(searchParams, "category");
  const urlFuel = normalizeFuelType(readStr(searchParams, "fuelType"));
  const urlMinPrice = readInt(searchParams, "minPrice", 0);
  const urlMaxPrice = readInt(searchParams, "maxPrice", 0);
  const urlSort = (readStr(searchParams, "sort") as SortBy) || "priceAsc";
  const urlPage = Math.max(1, readInt(searchParams, "page", 1));
  const urlPageSize = clamp(readInt(searchParams, "pageSize", DEFAULT_PAGE_SIZE), 6, 96);

  const [featuredTab, setFeaturedTab] = useState<FeaturedTab>("trending");
  const [browseTab, setBrowseTab] = useState<BrowseTab>("brand");

  const [compare, setCompare] = useState(loadCompare());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paged, setPaged] = useState<{
    items: VehicleListItem[];
    page: number;
    pageSize: number;
    totalCount: number;
  }>({ items: [], page: 1, pageSize: urlPageSize, totalCount: 0 });

  function switchType(next: VehicleType) {
    if (selectedType === next) return;

    setSelectedVehicleType(next);

    const currentCompare = loadCompare();
    if (currentCompare.items.length > 0) {
      const cleared = clearCompare();
      setCompare(cleared);
    }

    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set("type", next);
      sp.set("page", "1");
      if (!sp.has("pageSize")) sp.set("pageSize", String(DEFAULT_PAGE_SIZE));
      return sp;
    });

    nav(`/vehicles?type=${next}`, { replace: true });
  }

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
        if (!selectedType) return;

        setLoading(true);
        setError(null);

        const query: PublicVehiclesQuery = {
          type: selectedType,
          q: urlQ || undefined,
          brand: urlBrand || undefined,
          category: urlCategory || undefined,
          fuelType: urlFuel || undefined,
          minPrice: urlMinPrice > 0 ? urlMinPrice : undefined,
          maxPrice: urlMaxPrice > 0 ? urlMaxPrice : undefined,
          sort: urlSort || "priceAsc",
          page: urlPage,
          pageSize: urlPageSize,
        };

        const res = await getPublicVehicles(query);
        if (!alive) return;

        const safePage = Math.max(1, res.page || 1);
        const safeSize = clamp(res.pageSize || urlPageSize, 6, 96);
        const safeTotal = Math.max(0, res.totalCount || 0);

        // hard guard: never show mixed types even if backend returns them
        const filtered = (res.items ?? []).filter((v) => getSelectedTypeForRow(v) === selectedType);

        setPaged({
          items: filtered,
          page: safePage,
          pageSize: safeSize,
          totalCount: safeTotal,
        });
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
  }, [
    selectedType,
    urlQ,
    urlBrand,
    urlCategory,
    urlFuel,
    urlMinPrice,
    urlMaxPrice,
    urlSort,
    urlPage,
    urlPageSize,
  ]);

  const vehicles = paged.items;

  const totalPages = useMemo(() => {
    if (paged.totalCount <= 0) return 1;
    return Math.max(1, Math.ceil(paged.totalCount / Math.max(1, paged.pageSize)));
  }, [paged.totalCount, paged.pageSize]);

  // If filters shrink the result set and current page becomes invalid, snap back
  useEffect(() => {
    if (!selectedType) return;
    if (urlPage <= totalPages) return;

    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("page", String(totalPages));
        return sp;
      },
      { replace: true }
    );
  }, [selectedType, urlPage, totalPages, setSearchParams]);

  const pagerTokens = useMemo(() => {
    return computePagerPages(paged.page, totalPages);
  }, [paged.page, totalPages]);

  const bundleMeta = useMemo(() => {
    const years = vehicles.map((v) => safeNum(v.year)).filter((x) => x > 0);
    const maxYear = years.length ? Math.max(...years) : 0;
    const newestYearFloor = maxYear > 0 ? maxYear - 1 : 0;
    const budgetUnder = selectedType === "car" ? 1200000 : 200000;
    return { budgetUnder, maxYear, newestYearFloor };
  }, [vehicles, selectedType]);

  function goGrid() {
    setTimeout(() => {
      document.querySelector(".catalog-controls")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function setUrl(updater: (sp: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      updater(sp);
      return sp;
    });
  }

  function setFilter(key: string, value: unknown) {
    setUrl((sp) => {
      setParam(sp, key, value);
      sp.set("page", "1");
      if (!sp.has("pageSize")) sp.set("pageSize", String(DEFAULT_PAGE_SIZE));
    });
  }

  function applyPreset(next: BundleKey) {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set("page", "1");
      if (!sp.has("pageSize")) sp.set("pageSize", String(DEFAULT_PAGE_SIZE));

      if (next === "none") return sp;

      if (next === "ev") {
        setParam(sp, "fuelType", "EV");
        return sp;
      }

      if (next === "suv") {
        setParam(sp, "category", "SUV");
        return sp;
      }

      if (next === "commuter") {
        setParam(sp, "category", "Commuter");
        return sp;
      }

      if (next === "newest") {
        setParam(sp, "sort", "yearDesc");
        return sp;
      }

      if (next === "budget") {
        if (selectedType === "car") {
          setParam(sp, "maxPrice", 1200000);
          setParam(sp, "minPrice", 0);
        } else {
          setParam(sp, "maxPrice", 200000);
          setParam(sp, "minPrice", 0);
        }
        return sp;
      }

      return sp;
    });

    goGrid();
  }

  function resetFilters() {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);

      const t = sp.get("type");
      sp.forEach((_v, k) => sp.delete(k));
      if (t) sp.set("type", t);

      sp.set("sort", "priceAsc");
      sp.set("page", "1");
      sp.set("pageSize", String(DEFAULT_PAGE_SIZE));
      return sp;
    });

    goGrid();
  }

  const featuredList = useMemo(() => {
    const base = vehicles.filter((v) => safeNum(v.price) > 0 && safeNum(v.year) > 0);

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

    const amount = Math.max(240, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

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

  const categoryOptions = useMemo(() => {
    const cats = vehicles.map((v) => safeStr(v.category).trim()).filter(Boolean);
    return Array.from(new Set(cats))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 30);
  }, [vehicles]);

  const fuelOptions = useMemo(() => {
    const fuels = vehicles.map((v) => safeStr(v.fuelType).trim()).filter(Boolean);
    const uniq = Array.from(new Set(fuels));
    const canon = ["Petrol", "Diesel", "EV", "Hybrid"];
    const ordered = [
      ...canon.filter((x) => uniq.includes(x)),
      ...uniq.filter((x) => !canon.includes(x)),
    ];
    return ordered.slice(0, 10);
  }, [vehicles]);

  function compareDisabledReason(v: VehicleListItem) {
    if (typeof v.slug !== "string" || v.slug.trim().length === 0) return "Missing slug";
    if (!selectedType) return "Type not selected";
    const rowType = getSelectedTypeForRow(v);
    if (rowType && rowType !== selectedType) return `Wrong type (${rowType})`;
    return undefined;
  }

  function onToggleCompare(e: MouseEvent, v: VehicleListItem) {
    e.preventDefault();
    e.stopPropagation();

    const cur = loadCompare();
    const res = toggleCompareWithResult(cur, v);

    setCompare(res.state);
    if (!res.ok) window.alert(res.reason);

    if (cur.items.length === 0 && res.ok && res.state.items.length > 0) {
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

  function setPage(nextPage: number) {
    setUrl((sp) => {
      sp.set("page", String(Math.max(1, nextPage)));
      if (!sp.has("pageSize")) sp.set("pageSize", String(DEFAULT_PAGE_SIZE));
    });
    goGrid();
  }

  const typeLabel = selectedType === "bike" ? "Bikes" : "Cars";
  const compareCount = compare.items.length;

  if (!selectedType) return <div className="public-page">Resolving catalog…</div>;
  if (loading) return <div className="public-page">Loading vehicles…</div>;
  if (error) return <div className="public-page error">{error}</div>;

  return (
    <div className={`public-page ${compareCount ? "has-comparebar" : ""}`}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div className="type-switch">
          <button
            className={`type-switch-btn ${selectedType === "bike" ? "is-active" : ""}`}
            onClick={() => switchType("bike")}
            type="button"
          >
            Bikes
          </button>
          <button
            className={`type-switch-btn ${selectedType === "car" ? "is-active" : ""}`}
            onClick={() => switchType("car")}
            type="button"
          >
            Cars
          </button>
        </div>
      </div>

      <section className="hero hero-with-image">
        <div className="hero-bg">
          <img src={HERO_IMG} alt="Autorovers hero" className="hero-bg-image" />
          <div className="hero-bg-overlay" />
        </div>

        <div className="hero-layer">
          <div className="hero-copy">
            <h1 className="hero-title">A clean, specs-first catalog for bikes and cars.</h1>
            <p className="hero-tagline">Structured data. Real variants. Fast comparisons.</p>
            <p className="hero-subtext">Designed for clarity, consistency, and usability across devices.</p>
          </div>
        </div>
      </section>

      <section className="catalog-section catalog-section--spaced">
        <div className="bundle-head">
          <div>
            <h2 className="bundle-title">Featured Vehicles</h2>
            <div className="bundle-tabs">
              <button
                className={`bundle-tab ${featuredTab === "trending" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("trending")}
                type="button"
              >
                Trending
              </button>
              <button
                className={`bundle-tab ${featuredTab === "popular" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("popular")}
                type="button"
              >
                Popular
              </button>
              <button
                className={`bundle-tab ${featuredTab === "electric" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("electric")}
                type="button"
              >
                Electric
              </button>
              <button
                className={`bundle-tab ${featuredTab === "upcoming" ? "is-active" : ""}`}
                onClick={() => setFeaturedTab("upcoming")}
                disabled={bundleMeta.maxYear === 0}
                type="button"
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
            type="button"
          >
            View all
          </button>
        </div>

        <div className="bundle-row-wrap">
          <button
            className="bundle-arrow"
            onClick={() => scrollFeatured("left")}
            disabled={!canLeft}
            aria-label="Scroll left"
            title="Scroll left"
            type="button"
          >
            ‹
          </button>

          <div className="bundle-row bundle-row--carousel" ref={featuredRowRef} onScroll={updateArrows}>
            {featuredList.map((v) => {
              const slug = safeStr(v.slug);
              const to = slug.trim().length > 0 ? `/vehicles/${encodeURIComponent(slug)}` : "/vehicles";

              const title = `${safeStr(v.brand)} ${safeStr(v.model)}`.trim() || "Vehicle";
              const year = safeNum(v.year) > 0 ? String(v.year) : "—";
              const cat = safeStr(v.category) || "—";
              const tr = safeStr(v.transmission) || "—";
              const priceNum = safeNum(v.price);
              const priceText = priceNum > 0 ? formatINR(priceNum) : "—";
              const badges = getBadges(v, bundleMeta.maxYear);

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
                    {badges.length > 0 && (
                      <div className="vehicle-card-badges">
                        {badges.map((b) => (
                          <span key={`${v.id}-${b.kind}`} className={`vehicle-badge vehicle-badge--${b.kind}`}>
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="vehicle-card-header">
                    <h2 className="vehicle-card-title">{title}</h2>
                    <p className="vehicle-card-variant">{safeStr(v.variant) || "—"}</p>
                  </div>

                  <div className="vehicle-card-price-row">
                    <div className="vehicle-card-price">{priceText}</div>
                    <div className="vehicle-card-price-suffix">onwards</div>
                  </div>

                  <div className="vehicle-card-meta">
                    <span className="vehicle-card-meta-item">{year}</span>
                    <span className="vehicle-card-meta-dot">•</span>
                    <span className="vehicle-card-meta-item">{cat}</span>
                    <span className="vehicle-card-meta-dot">•</span>
                    <span className="vehicle-card-meta-item">{tr}</span>
                  </div>
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
            type="button"
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
                  type="button"
                >
                  Brand
                </button>
                <button
                  className={`bundle-tab ${browseTab === "budget" ? "is-active" : ""}`}
                  onClick={() => setBrowseTab("budget")}
                  type="button"
                >
                  Budget
                </button>
                <button
                  className={`bundle-tab ${browseTab === "body" ? "is-active" : ""}`}
                  onClick={() => setBrowseTab("body")}
                  type="button"
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
                    setFilter("brand", b);
                    goGrid();
                  }}
                  type="button"
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {browseTab === "budget" && (
            <div className="browse-grid">
              <button className="browse-pill" onClick={() => applyPreset("budget")} type="button">
                Budget picks
              </button>
              <button className="browse-pill" onClick={() => applyPreset("newest")} type="button">
                Newest launches
              </button>
              <button className="browse-pill" onClick={() => applyPreset("ev")} type="button">
                EVs
              </button>

              {selectedType === "car" ? (
                <button className="browse-pill" onClick={() => applyPreset("suv")} type="button">
                  SUVs
                </button>
              ) : (
                <button className="browse-pill" onClick={() => applyPreset("commuter")} type="button">
                  Commuters
                </button>
              )}
            </div>
          )}

          {browseTab === "body" && (
            <div className="browse-grid">
              {selectedType === "car" ? (
                <>
                  <button className="browse-pill" onClick={() => applyPreset("suv")} type="button">
                    SUVs
                  </button>
                  <button className="browse-pill" onClick={() => setFilter("category", "Sedan")} type="button">
                    Sedans
                  </button>
                  <button className="browse-pill" onClick={() => setFilter("category", "Hatchback")} type="button">
                    Hatchbacks
                  </button>
                </>
              ) : (
                <>
                  <button className="browse-pill" onClick={() => applyPreset("commuter")} type="button">
                    Commuters
                  </button>
                  <button className="browse-pill" onClick={() => setFilter("category", "Sport")} type="button">
                    Sport
                  </button>
                  <button className="browse-pill" onClick={() => setFilter("category", "Cruiser")} type="button">
                    Cruisers
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="catalog-section catalog-section--spaced">
        <h2 style={{ marginBottom: 12 }}>
          All Vehicles <span style={{ opacity: 0.7, fontWeight: 400 }}>({typeLabel})</span>
        </h2>

        <div className="catalog-controls">
          <input
            type="text"
            placeholder="Search brand/model/variant..."
            className="catalog-search"
            value={urlQ}
            onChange={(e) => setFilter("q", e.target.value)}
          />

          <select className="catalog-select" value={urlBrand} onChange={(e) => setFilter("brand", e.target.value)}>
            <option value="">All brands</option>
            {topBrands.map((b) => (
              <option key={`brand-${b}`} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            className="catalog-select"
            value={urlCategory}
            onChange={(e) => setFilter("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={`cat-${c}`} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select className="catalog-select" value={urlFuel} onChange={(e) => setFilter("fuelType", e.target.value)}>
            <option value="">All fuel types</option>
            {fuelOptions.map((f) => (
              <option key={`fuel-${f}`} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            className="catalog-select"
            value={urlSort}
            onChange={(e) => setFilter("sort", e.target.value as SortBy)}
          >
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="yearAsc">Year: Old to New</option>
            <option value="yearDesc">Year: New to Old</option>
          </select>

          <select
            className="catalog-select"
            value={String(urlPageSize)}
            onChange={(e) => {
              const nextSize = clamp(Number(e.target.value), 6, 96);
              setUrl((sp) => {
                sp.set("pageSize", String(nextSize));
                sp.set("page", "1");
              });
            }}
          >
            <option value="12">12 / page</option>
            <option value="24">24 / page</option>
            <option value="36">36 / page</option>
            <option value="48">48 / page</option>
          </select>

          <button className="public-btn public-btn--ghost" onClick={resetFilters} type="button">
            Reset
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.8 }}>
          Showing {vehicles.length} of {paged.totalCount} • Page {paged.page} / {totalPages}
        </div>
      </section>

      <section className="catalog-section">
        <div className="vehicle-grid">
          {vehicles.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-title">No vehicles match your filters.</div>
              <div className="empty-state-subtitle">Try clearing filters or reset back to the full catalog.</div>
              <div className="empty-state-actions">
                <button className="public-btn public-btn--ghost" onClick={() => setFilter("q", "")} type="button">
                  Clear search
                </button>
                <button className="public-btn public-btn--primary" onClick={resetFilters} type="button">
                  Reset catalog
                </button>
              </div>
            </div>
          )}

          {vehicles.map((v) => {
            const slug = safeStr(v.slug);
            const to = slug.trim().length > 0 ? `/vehicles/${encodeURIComponent(slug)}` : "/vehicles";

            const title = `${safeStr(v.brand)} ${safeStr(v.model)}`.trim() || "Vehicle";
            const year = safeNum(v.year) > 0 ? String(v.year) : "—";
            const cat = safeStr(v.category) || "—";
            const tr = safeStr(v.transmission) || "—";

            const priceNum = safeNum(v.price);
            const priceText = priceNum > 0 ? formatINR(priceNum) : "—";
            const badges = getBadges(v, bundleMeta.maxYear);

            const selected = compare.items.some((x) => x.id === v.id);
            const disabledReason = compareDisabledReason(v);
            const canCompare = !disabledReason;

            const compareBtnTitle = canCompare
              ? selected
                ? "Remove from compare"
                : "Add to compare"
              : `Can't compare: ${disabledReason}`;

            const compareBtnText = selected ? "Remove" : "Add to Compare";

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

                  {badges.length > 0 && (
                    <div className="vehicle-card-badges">
                      {badges.map((b) => (
                        <span key={`${v.id}-${b.kind}`} className={`vehicle-badge vehicle-badge--${b.kind}`}>
                          {b.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="vehicle-card-header">
                  <h2 className="vehicle-card-title">{title}</h2>
                  <p className="vehicle-card-variant">{safeStr(v.variant) || "—"}</p>
                </div>

                <div className="vehicle-card-price-row">
                  <div className="vehicle-card-price">{priceText !== "—" ? priceText : "Price unavailable"}</div>
                  {priceText !== "—" && <div className="vehicle-card-price-suffix">onwards</div>}
                </div>

                <div className="vehicle-card-meta">
                  <span className="vehicle-card-meta-item">{year}</span>
                  <span className="vehicle-card-meta-dot">•</span>
                  <span className="vehicle-card-meta-item">{cat}</span>
                  <span className="vehicle-card-meta-dot">•</span>
                  <span className="vehicle-card-meta-item">{tr}</span>
                </div>

                <div className="vehicle-card-cta">
                  <button
                    className={`public-btn ${selected ? "public-btn--danger" : "public-btn--primary"}`}
                    style={{ width: "100%" }}
                    disabled={!canCompare}
                    onClick={(e) => {
                      if (!canCompare) return;
                      onToggleCompare(e, v);
                    }}
                    title={compareBtnTitle}
                    type="button"
                  >
                    {compareBtnText}
                  </button>

                  {!canCompare && <div className="vehicle-card-hint">Fix: {disabledReason}</div>}
                </div>
              </Link>
            );
          })}
        </div>

        {paged.totalCount > paged.pageSize && (
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              className="public-btn public-btn--ghost"
              disabled={paged.page <= 1}
              onClick={() => setPage(paged.page - 1)}
              type="button"
            >
              Prev
            </button>

            {pagerTokens.map((tkn, idx) => {
              if (tkn === "…") {
                return (
                  <span key={`ellipsis-${idx}`} style={{ padding: "8px 6px", opacity: 0.7 }}>
                    …
                  </span>
                );
              }

              const p = tkn;
              const active = p === paged.page;

              return (
                <button
                  key={`page-${p}`}
                  className={`public-btn public-btn--ghost ${active ? "is-active" : ""}`}
                  onClick={() => setPage(p)}
                  disabled={active}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  title={active ? `Page ${p}` : `Go to page ${p}`}
                >
                  {p}
                </button>
              );
            })}

            <button
              className="public-btn public-btn--ghost"
              disabled={paged.page >= totalPages}
              onClick={() => setPage(paged.page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {compareCount > 0 && (
        <div className="compare-bar">
          <div>
            <div className="compare-bar-title">Compare: {compareCount}/4</div>

            <div className="compare-bar-subtitle">
              {compareCount < 2 ? "Add 1 more to compare" : "Ready — compare specs side-by-side"}
            </div>
          </div>

          <div className="compare-bar-actions">
            <button className="public-btn public-btn--ghost" onClick={onClearCompare} type="button">
              Clear
            </button>
            <button
              className="public-btn public-btn--primary"
              onClick={goCompare}
              disabled={compareCount < 2}
              title={compareCount < 2 ? "Add at least 2 vehicles to compare" : "Open compare"}
              type="button"
            >
              {compareCount < 2 ? "Add one more" : "Compare now"}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
