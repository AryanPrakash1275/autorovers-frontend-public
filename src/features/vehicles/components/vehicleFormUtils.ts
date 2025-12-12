import type { Vehicle } from "../types.ts";
import {
  BIKE_CATEGORIES,
  CAR_CATEGORIES,
  CAR_TRANSMISSIONS,
  BIKE_TRANSMISSIONS,
  POPULAR_BRANDS,
} from "./vehicleFormOptions.ts"

export type VehicleType = "Bike" | "Car" | "";

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

export function inferVehicleTypeFromCategory(initial: Vehicle | null | undefined): VehicleType {
  if (!initial) return "";
  if (initial.vehicleType === "Bike" || initial.vehicleType === "Car") return initial.vehicleType;

  const cat = initial.category ?? "";
  if (!cat) return "";

  if (BIKE_CATEGORIES.includes(cat as any)) return "Bike";
  if (CAR_CATEGORIES.includes(cat as any)) return "Car";
  return "";
}

export function getCategoryOptions(vehicleType: VehicleType): readonly string[] {
  if (vehicleType === "Bike") return BIKE_CATEGORIES;
  if (vehicleType === "Car") return CAR_CATEGORIES;
  return [];
}

export function getTransmissionOptions(vehicleType: VehicleType): readonly string[] {
  if (vehicleType === "Car") return CAR_TRANSMISSIONS;
  if (vehicleType === "Bike") return BIKE_TRANSMISSIONS;
  return [];
}

export function initBrandState(initialBrand?: string | null) {
  const brand = (initialBrand ?? "").trim();
  const isPopular = brand ? POPULAR_BRANDS.includes(brand as any) : false;

  return {
    selectedBrand: brand ? (isPopular ? brand : "Other") : "",
    customBrand: brand ? (isPopular ? "" : brand) : "",
  };
}

export function getFinalBrand(selectedBrand: string, customBrand: string) {
  return (selectedBrand === "Other" ? customBrand.trim() : selectedBrand).trim();
}
