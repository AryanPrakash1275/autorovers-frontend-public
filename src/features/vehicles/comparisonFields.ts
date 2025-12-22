// src/features/vehicles/comparisonFields.ts

export type ComparisonField =
  | "price"
  | "power"
  | "torque"
  | "mileage"
  | "range"
  | "transmission"
  | "warrantyYears"
  | "serviceIntervalKm"
  | "weight"
  | "tankSize"
  | "bootSpace";

export const COMMON_FIELDS = [
  "price",
  "power",
  "torque",
  "mileage",
  "range",
  "transmission",
  "warrantyYears",
  "serviceIntervalKm",
] as const;

export const BIKE_FIELDS = [
  "weight",
  "tankSize",
] as const;

export const CAR_FIELDS = [
  "bootSpace",
] as const;
