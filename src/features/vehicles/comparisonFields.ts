// src/features/vehicles/comparisonFields.ts

import type { VehicleWithDetailsDto } from "./types";

export type VehicleKind = "Bike" | "Car";

export type ComparisonField = {
  key: string;
  label: string;
  get: (dto: VehicleWithDetailsDto) => unknown;
  format?: (v: unknown) => string;
};

const dash = "—";
const tick = "✓";

const fmtBool = (v: unknown) => (v === true ? tick : dash);
const fmtNum = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v !== 0 ? String(v) : dash;
const fmtStr = (v: unknown) =>
  typeof v === "string" && v.trim().length ? v : dash;

export const COMMON_FIELDS: ComparisonField[] = [
  {
    key: "price",
    label: "Price (₹)",
    get: (d) => d.price,
    format: (v) => (typeof v === "number" && v > 0 ? String(v) : dash),
  },
  { key: "power", label: "Power", get: (d) => d.details?.engine?.power, format: fmtNum },
  { key: "torque", label: "Torque", get: (d) => d.details?.engine?.torque, format: fmtNum },
  { key: "mileage", label: "Mileage", get: (d) => d.details?.engine?.mileage, format: fmtNum },
  {
    key: "range",
    label: "Range",
    get: (d) => d.details?.engine?.range ?? d.details?.ev?.range,
    format: fmtNum,
  },
  { key: "transmission", label: "Transmission", get: (d) => d.transmission, format: fmtStr },
  {
    key: "warrantyYears",
    label: "Warranty (years)",
    get: (d) => d.details?.warrantyYears,
    format: fmtNum,
  },
  {
    key: "serviceIntervalKm",
    label: "Service interval (km)",
    get: (d) => d.details?.serviceIntervalKm,
    format: fmtNum,
  },
];

export const BIKE_FIELDS: ComparisonField[] = [
  { key: "weight", label: "Kerb weight", get: (d) => d.details?.dimensions?.weight, format: fmtNum },
  { key: "tankSize", label: "Tank size", get: (d) => d.details?.bike?.tankSize, format: fmtNum },
  { key: "abs", label: "ABS", get: (d) => d.details?.bike?.abs, format: fmtBool },
  { key: "tractionControl", label: "Traction control", get: (d) => d.details?.bike?.tractionControl, format: fmtBool },
];

export const CAR_FIELDS: ComparisonField[] = [
  { key: "bootSpace", label: "Boot space", get: (d) => d.details?.car?.bootSpace, format: fmtNum },
  { key: "airbags", label: "Airbags", get: (d) => d.details?.car?.airbags, format: fmtNum },
  { key: "rearViewCamera", label: "Rear view camera", get: (d) => d.details?.car?.rearViewCamera, format: fmtBool },
  { key: "parkingSensors", label: "Parking sensors", get: (d) => d.details?.car?.parkingSensors, format: fmtBool },
];
