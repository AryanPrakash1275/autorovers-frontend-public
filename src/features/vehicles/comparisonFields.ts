// src/features/vehicles/comparisonFields.ts

import type { VehicleWithDetailsDto } from "./types";

export type VehicleKind = "Bike" | "Car";

export type ComparisonKey =
  // Core identity
  | "brand"
  | "model"
  | "variant"
  | "price"
  | "year"
  | "category"
  | "transmission"
  | "powertrain"
  // Decision essentials
  | "mileage_or_range"
  | "range_km"
  | "warrantyYears"
  | "serviceIntervalKm"
  // Bike specifics
  | "engineType"
  | "engineDisplacement"
  | "inductionType"
  | "power"
  | "powerRpm"
  | "torque"
  | "torqueRpm"
  | "emission"
  | "weight"
  | "seatHeight"
  | "groundClearance"
  | "tankSize"
  | "frontBrake"
  | "backBrake"
  | "abs"
  | "tractionControl"
  | "frontSuspension"
  | "rearSuspension"
  | "tyreSizeFront"
  | "tyreSizeBack"
  // Car specifics
  | "driveType"
  | "personCapacity"
  | "bootSpace"
  | "airbags"
  | "rearViewCamera"
  | "parkingSensors";

export type ComparisonField = {
  key: ComparisonKey;
  label: string;
  get: (dto: VehicleWithDetailsDto) => unknown;
  format?: (v: unknown) => string;
};

const dash = "—";
const tick = "✓";

const fmtBool = (v: unknown) => (v === true ? tick : dash);
const fmtNum = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? String(v) : dash;
const fmtNumNZ = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v !== 0 ? String(v) : dash;
const fmtStr = (v: unknown) =>
  typeof v === "string" && v.trim().length ? v.trim() : dash;

const fmtMoney = (v: unknown) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return dash;
  // keep it simple; no Intl formatting to avoid locale surprises
  return `₹${v}`;
};

const fmtKm = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} km` : dash);
const fmtL = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} L` : dash);
const fmtCc = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} cc` : dash);
const fmtKg = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} kg` : dash);
const fmtMm = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} mm` : dash);
const fmtBhp = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} bhp` : dash);
const fmtNm = (v: unknown) => (typeof v === "number" && v > 0 ? `${v} Nm` : dash);

/** Heuristic: show engine mileage if present, else EV range */
function mileageOrRange(d: VehicleWithDetailsDto): unknown {
  const m = d.details?.engine?.mileage;
  if (typeof m === "number" && Number.isFinite(m) && m > 0) return m;

  const r = d.details?.ev?.range ?? d.details?.engine?.range;
  return r;
}

/** Heuristic: fuel/powertrain label */
function powertrainLabel(d: VehicleWithDetailsDto): string {
  const fuel = d.details?.engine?.fuelType;
  const hasEv = !!d.details?.ev;

  if (hasEv) return "EV";
  if (typeof fuel === "string" && fuel.trim().length) return fuel.trim();
  return dash;
}

export const COMMON_FIELDS: ComparisonField[] = [
  // Identity
  { key: "brand", label: "Brand", get: (d) => d.brand, format: fmtStr },
  { key: "model", label: "Model", get: (d) => d.model, format: fmtStr },
  { key: "variant", label: "Variant", get: (d) => d.variant, format: fmtStr },

  // Core decision
  { key: "price", label: "Price", get: (d) => d.price, format: fmtMoney },
  { key: "year", label: "Year", get: (d) => d.year, format: fmtNum },
  { key: "category", label: "Category", get: (d) => d.category, format: fmtStr },
  {
    key: "transmission",
    label: "Transmission",
    get: (d) => d.transmission,
    format: fmtStr,
  },
  {
    key: "powertrain",
    label: "Fuel / Powertrain",
    get: (d) => powertrainLabel(d),
    format: fmtStr,
  },

  // Mileage / Range (single line humans care about)
  {
    key: "mileage_or_range",
    label: "Mileage / Range",
    get: (d) => mileageOrRange(d),
    format: (v) => {
      // We don't know if it's mileage or range; best-effort:
      // if EV exists -> km, else mileage number (km/l)
      // We infer based on presence of d.details.ev via closure is hard here; keep generic:
      return typeof v === "number" && v > 0 ? String(v) : dash;
    },
  },
  {
    key: "range_km",
    label: "Range (km)",
    get: (d) => d.details?.ev?.range ?? d.details?.engine?.range,
    format: fmtKm,
  },

  { key: "warrantyYears", label: "Warranty (years)", get: (d) => d.details?.warrantyYears, format: fmtNumNZ },
  {
    key: "serviceIntervalKm",
    label: "Service interval (km)",
    get: (d) => d.details?.serviceIntervalKm,
    format: (v) =>
      typeof v === "number" && Number.isFinite(v) && v > 0 ? `${v} km` : dash,
  },
];

export const BIKE_FIELDS: ComparisonField[] = [
  // Engine & performance
  { key: "engineType", label: "Engine type", get: (d) => d.details?.engine?.engineType, format: fmtStr },
  { key: "engineDisplacement", label: "Displacement", get: (d) => d.details?.engine?.engineDisplacement, format: fmtCc },
  { key: "inductionType", label: "Induction", get: (d) => d.details?.engine?.inductionType, format: fmtStr },
  { key: "power", label: "Power", get: (d) => d.details?.engine?.power, format: fmtBhp },
  { key: "powerRpm", label: "Power RPM", get: (d) => d.details?.engine?.powerRpm, format: fmtNumNZ },
  { key: "torque", label: "Torque", get: (d) => d.details?.engine?.torque, format: fmtNm },
  { key: "torqueRpm", label: "Torque RPM", get: (d) => d.details?.engine?.torqueRpm, format: fmtNumNZ },
  { key: "emission", label: "Emission", get: (d) => d.details?.engine?.emission, format: fmtStr },

  // Dimensions & chassis
  { key: "weight", label: "Kerb weight", get: (d) => d.details?.dimensions?.weight, format: fmtKg },
  // seatHeight is not in your DimensionsSpecsDto currently; keep it only if backend adds it later.
  { key: "groundClearance", label: "Ground clearance", get: (d) => d.details?.dimensions?.groundClearance, format: fmtMm },

  { key: "tankSize", label: "Fuel tank", get: (d) => d.details?.bike?.tankSize, format: fmtL },

  // Brakes, suspension, tyres
  { key: "frontBrake", label: "Front brake", get: (d) => d.details?.dynamics?.frontBrake, format: fmtStr },
  { key: "backBrake", label: "Rear brake", get: (d) => d.details?.dynamics?.backBrake, format: fmtStr },
  { key: "abs", label: "ABS", get: (d) => d.details?.bike?.abs, format: fmtBool },
  { key: "tractionControl", label: "Traction control", get: (d) => d.details?.bike?.tractionControl, format: fmtBool },
  { key: "frontSuspension", label: "Front suspension", get: (d) => d.details?.dynamics?.frontSuspension, format: fmtStr },
  { key: "rearSuspension", label: "Rear suspension", get: (d) => d.details?.dynamics?.rearSuspension, format: fmtStr },
  { key: "tyreSizeFront", label: "Tyre (front)", get: (d) => d.details?.dynamics?.tyreSizeFront, format: fmtStr },
  { key: "tyreSizeBack", label: "Tyre (rear)", get: (d) => d.details?.dynamics?.tyreSizeBack, format: fmtStr },
];

export const CAR_FIELDS: ComparisonField[] = [
  { key: "driveType", label: "Drivetrain", get: (d) => d.details?.car?.driveType, format: fmtStr },
  { key: "personCapacity", label: "Seating capacity", get: (d) => d.details?.car?.personCapacity, format: fmtNumNZ },
  { key: "bootSpace", label: "Boot space", get: (d) => d.details?.car?.bootSpace, format: (v) => (typeof v === "number" && v > 0 ? `${v} L` : dash) },

  { key: "airbags", label: "Airbags", get: (d) => d.details?.car?.airbags, format: fmtNumNZ },
  { key: "rearViewCamera", label: "Rear view camera", get: (d) => d.details?.car?.rearViewCamera, format: fmtBool },
  { key: "parkingSensors", label: "Parking sensors", get: (d) => d.details?.car?.parkingSensors, format: fmtBool },
];
