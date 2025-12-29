// src/features/vehicles/comparisonContract.ts

import type { VehicleType } from "./types";

/* =========================
   Core Types (DISCRIMINATED UNION)
========================= */

type ContractVehicleType = "Bike" | "Car";

type ComparisonBase = {
  id: number;
  slug: string;

  // header display
  brand: string;
  model: string;
  variant: string;
  year: number;
  category: string;
  imageUrl: string;

  // =========================
  //  Frozen shared 8 fields
  // =========================
  price: number; // ex-showroom
  mileageOrRange: number; // ICE mileage OR EV range
  power: number;
  torque: number;
  transmission: string;
  powertrain: "Petrol" | "Diesel" | "EV" | "Hybrid";
  warrantyYears: number;
  serviceIntervalKm: number;
};

export type ComparisonBike = ComparisonBase & {
  vehicleType: "Bike";
  kerbWeightKg: number;
  fuelTankCapacityL: number;
};

export type ComparisonCar = ComparisonBase & {
  vehicleType: "Car";
  bodyType: string;
  bootSpaceL: number;
};

export type ComparisonVehicle = ComparisonBike | ComparisonCar;

/* =========================
   Row rendering contract
========================= */

export type ComparisonFieldKey =
  | "price"
  | "mileageOrRange"
  | "power"
  | "torque"
  | "transmission"
  | "powertrain"
  | "warrantyYears"
  | "serviceIntervalKm"
  | "kerbWeightKg"
  | "fuelTankCapacityL"
  | "bodyType"
  | "bootSpaceL";

export type ComparisonFieldRow = {
  key: ComparisonFieldKey;
  label: string;
  get: (v: ComparisonVehicle) => string;
};

/* =========================
   Formatters
========================= */

function fmtMoneyINR(n: number): string {
  return `₹ ${Math.round(n).toLocaleString("en-IN")}`;
}

function fmtNum(n: number): string {
  return `${Math.round(n).toLocaleString("en-IN")}`;
}

function fmtOneDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/* =========================
   Shared + Type-specific rows
========================= */

export const COMPARISON_FIELDS_SHARED: readonly ComparisonFieldRow[] = [
  { key: "price", label: "Price (ex-showroom)", get: (v) => fmtMoneyINR(v.price) },
  {
    key: "mileageOrRange",
    label: "Mileage / Range",
    get: (v) =>
      v.powertrain === "EV"
        ? `${fmtNum(v.mileageOrRange)} km`
        : `${fmtOneDecimal(v.mileageOrRange)} km/l`,
  },
  { key: "power", label: "Power", get: (v) => `${fmtOneDecimal(v.power)} PS` },
  { key: "torque", label: "Torque", get: (v) => `${fmtOneDecimal(v.torque)} Nm` },
  { key: "transmission", label: "Transmission", get: (v) => v.transmission },
  { key: "powertrain", label: "Fuel / Powertrain", get: (v) => v.powertrain },
  { key: "warrantyYears", label: "Warranty", get: (v) => `${fmtNum(v.warrantyYears)} yrs` },
  {
    key: "serviceIntervalKm",
    label: "Service Interval",
    get: (v) => `${fmtNum(v.serviceIntervalKm)} km`,
  },
];

export const COMPARISON_FIELDS_BIKE: readonly ComparisonFieldRow[] = [
  {
    key: "kerbWeightKg",
    label: "Kerb Weight",
    get: (v) => (v.vehicleType === "Bike" ? `${fmtNum(v.kerbWeightKg)} kg` : "—"),
  },
  {
    key: "fuelTankCapacityL",
    label: "Fuel Tank Capacity",
    get: (v) =>
      v.vehicleType === "Bike" ? `${fmtOneDecimal(v.fuelTankCapacityL)} L` : "—",
  },
];

export const COMPARISON_FIELDS_CAR: readonly ComparisonFieldRow[] = [
  {
    key: "bodyType",
    label: "Body Type",
    get: (v) => (v.vehicleType === "Car" ? v.bodyType : "—"),
  },
  {
    key: "bootSpaceL",
    label: "Boot Space",
    get: (v) => (v.vehicleType === "Car" ? `${fmtNum(v.bootSpaceL)} L` : "—"),
  },
];

/* =========================
   Canonical type adapter
========================= */

/**
 * Accepts:
 * - public canonical: "bike" | "car"
 * - internal legacy:  "Bike" | "Car"
 *
 * Returns strict contract type only.
 */
function toContractType(
  v: VehicleType | ContractVehicleType
): ContractVehicleType {
  if (v === "Bike" || v === "Car") return v;
  return v === "bike" ? "Bike" : "Car";
}

/* =========================
   Public API
========================= */

/**
 * Exactly 12 rows.
 * Shared rows first.
 * Type-specific rows appended.
 */
export function getComparisonRowsForType(
  vehicleType: VehicleType | ContractVehicleType
): ComparisonFieldRow[] {
  const t = toContractType(vehicleType);

  if (t === "Bike") {
    return [...COMPARISON_FIELDS_SHARED, ...COMPARISON_FIELDS_BIKE];
  }
  return [...COMPARISON_FIELDS_SHARED, ...COMPARISON_FIELDS_CAR];
}

/* =========================
   Mapping helpers
========================= */

export type ComparisonMapResult =
  | { ok: true; value: ComparisonVehicle }
  | { ok: false; reason: string };

export function isVehicleType(v: unknown): v is ContractVehicleType {
  return v === "Bike" || v === "Car";
}

export function inferTypeFromCategory(
  category?: string | null
): ContractVehicleType | undefined {
  const raw = (category ?? "").trim().toLowerCase();
  if (!raw) return undefined;

  const car = new Set([
    "suv",
    "hatchback",
    "sedan",
    "coupe",
    "convertible",
    "wagon",
    "muv",
    "mpv",
    "crossover",
    "pickup",
    "truck",
    "van",
  ]);

  const bike = new Set([
    "naked",
    "classic",
    "roadster",
    "cruiser",
    "sports",
    "sport",
    "adventure",
    "scooter",
    "commuter",
    "tourer",
    "cafe racer",
    "scrambler",
    "off-road",
    "off road",
  ]);

  if (car.has(raw)) return "Car";
  if (bike.has(raw)) return "Bike";

  if (raw.includes("suv") || raw.includes("hatch") || raw.includes("sedan")) return "Car";
  if (raw.includes("scooter") || raw.includes("cruiser") || raw.includes("bike")) return "Bike";

  return undefined;
}

export function required<T>(v: T | null | undefined, field: string): T {
  if (v === null || v === undefined) throw new Error(`Missing ${field}`);
  return v;
}

export function requiredStr(v: unknown, field: string): string {
  if (typeof v !== "string") throw new Error(`Missing ${field}`);
  const t = v.trim();
  if (!t) throw new Error(`Missing ${field}`);
  return t;
}

export function requiredNum(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
    throw new Error(`Missing ${field}`);
  }
  return v;
}
