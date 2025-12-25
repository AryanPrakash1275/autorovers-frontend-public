import type { VehicleListItem } from "../types";
import { BIKE_CATEGORIES, CAR_CATEGORIES } from "./vehicleFormOptions";

export type SortKey =
  | "brand"
  | "model"
  | "variant"
  | "year"
  | "price"
  | "category"
  | "transmission"
  | "slug";

export type SortDir = "asc" | "desc";
export type VehicleTypeFilter = "all" | "Bike" | "Car";

function normStr(v: string | null | undefined) {
  return (v ?? "").trim();
}

function uniqSorted(list: string[]) {
  return Array.from(new Set(list.map((x) => x.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b)
  );
}

// normalize category sets to lowercase
const BIKE_CATEGORY_SET = new Set(
  (BIKE_CATEGORIES as readonly string[]).map((x) => String(x).trim().toLowerCase())
);
const CAR_CATEGORY_SET = new Set(
  (CAR_CATEGORIES as readonly string[]).map((x) => String(x).trim().toLowerCase())
);

/**
 * If vehicleType is missing, infer it from category where possible.
 * Keeps list filtering resilient to partial backend rows.
 */
export function getEffectiveVehicleType(v: VehicleListItem): "Bike" | "Car" | "" {
  const raw = normStr(v.vehicleType);
  if (raw === "Bike" || raw === "Car") return raw;

  const catRaw = normStr(v.category);
  if (!catRaw) return "";

  const cat = catRaw.toLowerCase();

  if (BIKE_CATEGORY_SET.has(cat)) return "Bike";
  if (CAR_CATEGORY_SET.has(cat)) return "Car";

  // fallback heuristic (safe)
  if (cat.includes("suv") || cat.includes("hatch") || cat.includes("sedan")) return "Car";
  if (cat.includes("bike") || cat.includes("scooter") || cat.includes("cruiser")) return "Bike";

  return "";
}

export function buildBrandOptions(list: VehicleListItem[]) {
  return uniqSorted(list.map((v) => normStr(v.brand)));
}

export function buildTransmissionOptions(list: VehicleListItem[]) {
  return uniqSorted(list.map((v) => normStr(v.transmission)));
}

export function buildYearOptions(list: VehicleListItem[]) {
  const years = Array.from(
    new Set(
      list
        .map((v) => v.year)
        .filter((y): y is number => typeof y === "number" && !Number.isNaN(y))
    )
  ).sort((a, b) => b - a);

  return years.map(String);
}

export function hasAnyFilters(f: {
  query: string;
  typeFilter: VehicleTypeFilter;
  brandFilter: string;
  transFilter: string;
  yearFilter: string;
}) {
  return (
    f.query.trim() ||
    f.typeFilter !== "all" ||
    f.brandFilter !== "all" ||
    f.transFilter !== "all" ||
    f.yearFilter !== "all"
  );
}

export function applyFilters(
  list: VehicleListItem[],
  f: {
    query: string;
    typeFilter: VehicleTypeFilter;
    brandFilter: string;
    transFilter: string;
    yearFilter: string;
  }
): VehicleListItem[] {
  const q = f.query.trim().toLowerCase();
  let filtered = list;

  if (f.typeFilter !== "all") {
    filtered = filtered.filter((v) => getEffectiveVehicleType(v) === f.typeFilter);
  }

  if (f.brandFilter !== "all") {
    filtered = filtered.filter((v) => normStr(v.brand) === f.brandFilter);
  }

  if (f.transFilter !== "all") {
    filtered = filtered.filter((v) => normStr(v.transmission) === f.transFilter);
  }

  if (f.yearFilter !== "all") {
    filtered = filtered.filter((v) => String(v.year ?? "") === f.yearFilter);
  }

  if (q) {
    filtered = filtered.filter((v) => {
      const brand = normStr(v.brand).toLowerCase();
      const model = normStr(v.model).toLowerCase();
      const variant = normStr(v.variant).toLowerCase();
      const slug = normStr(v.slug).toLowerCase();

      return brand.includes(q) || model.includes(q) || variant.includes(q) || slug.includes(q);
    });
  }

  return filtered;
}

export function applySort(
  list: VehicleListItem[],
  sortBy: SortKey,
  sortDir: SortDir
): VehicleListItem[] {
  const dir = sortDir === "asc" ? 1 : -1;

  const getNum = (n: number | null | undefined) =>
    typeof n === "number" && !Number.isNaN(n) ? n : 0;

  const getVal = (v: VehicleListItem): string | number => {
    switch (sortBy) {
      case "brand":
        return normStr(v.brand);
      case "model":
        return normStr(v.model);
      case "variant":
        return normStr(v.variant);
      case "year":
        return getNum(v.year);
      case "price":
        return getNum(v.price);
      case "category":
        return normStr(v.category);
      case "transmission":
        return normStr(v.transmission);
      case "slug":
        return normStr(v.slug);
      default:
        return "";
    }
  };

  return [...list].sort((a, b) => {
    const av = getVal(a);
    const bv = getVal(b);

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }

    return String(av).localeCompare(String(bv)) * dir;
  });
}
