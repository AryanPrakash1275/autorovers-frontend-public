import type { Vehicle } from "../types";
import {
  BIKE_CATEGORIES,
  CAR_CATEGORIES,
  CAR_TRANSMISSIONS,
  BIKE_TRANSMISSIONS,
  POPULAR_BRANDS,
} from "./vehicleFormOptions";

export type VehicleType = "Bike" | "Car" | "";

// -------------------------------
// Internal Sets (fast lookups)
// -------------------------------
const BIKE_CATEGORY_SET = new Set<string>(BIKE_CATEGORIES);
const CAR_CATEGORY_SET = new Set<string>(CAR_CATEGORIES);
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

export function inferVehicleTypeFromCategory(
  initial: Vehicle | null | undefined
): VehicleType {
  if (!initial) return "";

  if (initial.vehicleType === "Bike" || initial.vehicleType === "Car") {
    return initial.vehicleType;
  }

  if (
    initial.doors ||
    initial.bootSpace ||
    initial.personCapacity ||
    initial.rows
  ) {
    return "Car";
  }

  if (initial.tankSize && !initial.doors) {
    return "Bike";
  }

  const cat = initial.category ?? "";
  if (!cat) return "";

  if (BIKE_CATEGORY_SET.has(cat)) return "Bike";
  if (CAR_CATEGORY_SET.has(cat)) return "Car";

  return "";
}

export function normalizeVehicleType(
  value?: string | null
): VehicleType {
  if (value === "Bike" || value === "Car") return value;
  return "";
}

// -------------------------------
// Category options
// -------------------------------
export function getCategoryOptions(
  vehicleType: VehicleType
): readonly string[] {
  if (vehicleType === "Bike") return BIKE_CATEGORIES;
  if (vehicleType === "Car") return CAR_CATEGORIES;
  return [];
}

// -------------------------------
// Transmission options
// -------------------------------
export function getTransmissionOptions(
  vehicleType: VehicleType
): readonly string[] {
  if (vehicleType === "Car") return CAR_TRANSMISSIONS;
  if (vehicleType === "Bike") return BIKE_TRANSMISSIONS;
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

export function getFinalBrand(
  selectedBrand: string,
  customBrand: string
) {
  return (selectedBrand === "Other"
    ? customBrand.trim()
    : selectedBrand
  ).trim();
}
