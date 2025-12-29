// src/features/vehicles/comparisonFields.ts

import type { VehicleType } from "./types";

export type ComparisonField = {
  key: string;
  label: string;
  unit?: string;
};

const COMMON_FIELDS: readonly ComparisonField[] = [
  { key: "price", label: "Price", unit: "₹" },
  { key: "mileageOrRange", label: "Mileage / Range" },
  { key: "power", label: "Power" },
  { key: "torque", label: "Torque" },
  { key: "transmission", label: "Transmission" },
  { key: "powertrain", label: "Fuel / Powertrain" },
  { key: "warrantyYears", label: "Warranty", unit: "yrs" },
  { key: "serviceIntervalKm", label: "Service Interval", unit: "km" },
];

const BIKE_ONLY: readonly ComparisonField[] = [
  { key: "kerbWeightKg", label: "Kerb Weight", unit: "kg" },
  { key: "fuelTankCapacityL", label: "Fuel Tank Capacity", unit: "L" },
];

const CAR_ONLY: readonly ComparisonField[] = [
  { key: "bodyType", label: "Body Type" },
  { key: "bootSpaceL", label: "Boot Space", unit: "L" },
];

/**
 * Returns the frozen 12 fields used for compare.
 * Canonical type: "bike" | "car"
 */
export function getComparisonFields(vehicleType: VehicleType): ComparisonField[] {
  if (vehicleType === "bike") return [...COMMON_FIELDS, ...BIKE_ONLY];
  return [...COMMON_FIELDS, ...CAR_ONLY];
}
