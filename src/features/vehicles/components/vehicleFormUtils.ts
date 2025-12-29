import type { Vehicle } from "../types";
import {
  BIKE_CATEGORIES,
  CAR_CATEGORIES,
  CAR_TRANSMISSIONS,
  BIKE_TRANSMISSIONS,
  POPULAR_BRANDS,
} from "./vehicleFormOptions";

export type VehicleType = "bike" | "car" | "";

// -------------------------------
// Internal Sets (fast lookups)
// -------------------------------
const BIKE_CATEGORY_SET = new Set<string>(BIKE_CATEGORIES.map((x) => x.trim().toLowerCase()));
const CAR_CATEGORY_SET = new Set<string>(CAR_CATEGORIES.map((x) => x.trim().toLowerCase()));
const POPULAR_BRAND_SET = new Set<string>(POPULAR_BRANDS);

// -------------------------------
// Numeric fields for form casting
// -------------------------------
export const NUMBER_FIELDS = new Set<keyof Vehicle>([
  "year",
  "price",
  "power",
  "powerRpm",
  "torque",
  "torqueRpm",
  "mileage",
  "range",
  "length",
  "width",
  "height",
  "weight",
  "groundClearance",
  "wheelBase",
  "personCapacity",
  "rows",
  "doors",
  "bootSpace",
  "tankSize",
]);

function normalizeVehicleTypeRaw(v?: string | null): VehicleType {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "bike") return "bike";
  if (s === "car") return "car";
  // legacy titlecase
  if (s === "Bike".toLowerCase()) return "bike";
  if (s === "Car".toLowerCase()) return "car";
  return "";
}

export function inferVehicleTypeFromCategory(initial: Vehicle | null | undefined): VehicleType {
  if (!initial) return "";

  const direct = normalizeVehicleTypeRaw(initial.vehicleType as unknown as string | null);
  if (direct) return direct;

  // heuristic fallbacks for legacy flat model
  if (initial.doors || initial.bootSpace || initial.personCapacity || initial.rows) {
    return "car";
  }

  if (initial.tankSize && !initial.doors) {
    return "bike";
  }

  const cat = (initial.category ?? "").trim();
  if (!cat) return "";

  const lc = cat.toLowerCase();
  if (BIKE_CATEGORY_SET.has(lc)) return "bike";
  if (CAR_CATEGORY_SET.has(lc)) return "car";

  return "";
}

export function normalizeVehicleType(value?: string | null): VehicleType {
  return normalizeVehicleTypeRaw(value);
}

// -------------------------------
// Category options
// -------------------------------
export function getCategoryOptions(vehicleType: VehicleType): readonly string[] {
  if (vehicleType === "bike") return BIKE_CATEGORIES;
  if (vehicleType === "car") return CAR_CATEGORIES;
  return [];
}

// -------------------------------
// Transmission options
// -------------------------------
export function getTransmissionOptions(vehicleType: VehicleType): readonly string[] {
  if (vehicleType === "car") return CAR_TRANSMISSIONS;
  if (vehicleType === "bike") return BIKE_TRANSMISSIONS;
  return [];
}

// -------------------------------
// Brand helpers
// -------------------------------
export function initBrandState(initialBrand?: string | null) {
  const brand = (initialBrand ?? "").trim();
  const isPopular = brand ? POPULAR_BRAND_SET.has(brand) : false;

  return {
    selectedBrand: brand ? (isPopular ? brand : "Other") : "",
    customBrand: brand ? (isPopular ? "" : brand) : "",
  };
}

export function getFinalBrand(selectedBrand: string, customBrand: string) {
  return (selectedBrand === "Other" ? customBrand.trim() : selectedBrand).trim();
}
