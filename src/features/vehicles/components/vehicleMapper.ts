import type { Vehicle, VehicleListItem, VehicleWithDetailsDto } from "../types";

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return !!v && typeof v === "object";
}

function get(obj: unknown, key: string): unknown {
  if (!isObj(obj)) return undefined;
  return obj[key];
}

function toNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function pick(...vals: unknown[]): unknown {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined;
}

/* =========================
   VehicleType normalize + inference
========================= */

function norm(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function asVehicleType(v: unknown): "Bike" | "Car" | undefined {
  const t = norm(v);
  if (t === "bike") return "Bike";
  if (t === "car") return "Car";
  return undefined;
}

// keep in sync with your public inference (good enough for admin too)
const BIKE_CATEGORIES = new Set(
  ["Sport", "Commuter", "Cruiser", "Tourer", "Off-road", "Scooter", "EV Bike"].map((x) =>
    x.toLowerCase()
  )
);

const CAR_CATEGORIES = new Set(
  ["Hatchback", "Sedan", "SUV", "MUV", "Coupe", "EV Car"].map((x) => x.toLowerCase())
);

function inferTypeFromCategory(catRaw: unknown): "Bike" | "Car" | undefined {
  const c = norm(catRaw);
  if (!c) return undefined;
  if (BIKE_CATEGORIES.has(c)) return "Bike";
  if (CAR_CATEGORIES.has(c)) return "Car";
  return undefined;
}

function resolveVehicleType(full: VehicleWithDetailsDto, row: VehicleListItem): "Bike" | "Car" | "" {
  // 1) explicit vehicleType (normalized)
  const vt =
    asVehicleType(full.vehicleType) ??
    asVehicleType(row.vehicleType);

  if (vt) return vt;

  // 2) infer from category
  const inferred =
    inferTypeFromCategory(full.category) ??
    inferTypeFromCategory(row.category);

  return inferred ?? "";
}

export function mapFullVehicleToForm(
  full: VehicleWithDetailsDto,
  rowFallback: VehicleListItem
): Vehicle {
  const d = isObj(full.details) ? full.details : ({} as Obj);

  const engine = get(d, "engine");
  const dimensions = get(d, "dimensions");
  const dynamics = get(d, "dynamics");
  const bike = get(d, "bike");
  const car = get(d, "car");

  const vehicleType = resolveVehicleType(full, rowFallback);

  return {
    id: full.id ?? rowFallback.id,

    // ✅ FIXED: stable vehicleType for bikes/cars
    vehicleType,

    brand: full.brand ?? rowFallback.brand ?? "",
    model: full.model ?? rowFallback.model ?? "",
    variant: full.variant ?? rowFallback.variant ?? "",
    year: full.year ?? rowFallback.year ?? new Date().getFullYear(),
    price: full.price ?? rowFallback.price ?? 0,
    category: full.category ?? rowFallback.category ?? "",
    transmission: full.transmission ?? rowFallback.transmission ?? "",
    slug: full.slug ?? rowFallback.slug ?? "",
    imageUrl: full.imageUrl ?? rowFallback.imageUrl ?? "",

    // About / ownership
    description: toStr(get(d, "description"), ""),
    colorsAvailableJson: toStr(get(d, "colorsAvailableJson"), ""),
    warrantyYears: toNum(pick(get(d, "warrantyYears"), get(full, "warrantyYears")), 0),
    serviceIntervalKm: toNum(
      pick(get(d, "serviceIntervalKm"), get(full, "serviceIntervalKm")),
      0
    ),

    // Engine & performance (prefer nested)
    engineType: toStr(pick(get(engine, "engineType"), get(d, "engineType")), ""),
    engineDisplacement: toNum(
      pick(
        get(engine, "engineDisplacement"),
        get(d, "engineDisplacement"),
        get(full, "engineDisplacement")
      ),
      0
    ),
    fuelType: toStr(
      pick(get(engine, "fuelType"), get(d, "fuelType"), get(full, "fuelType")),
      ""
    ),
    specification: toStr(get(d, "specification"), ""),

    inductionType: toStr(pick(get(engine, "inductionType"), get(d, "inductionType")), ""),
    emission: toStr(pick(get(engine, "emission"), get(d, "emission")), ""),

    power: toNum(pick(get(engine, "power"), get(d, "power"), get(full, "power")), 0),
    powerRpm: toNum(
      pick(get(engine, "powerRpm"), get(d, "powerRpm"), get(full, "powerRpm")),
      0
    ),
    torque: toNum(pick(get(engine, "torque"), get(d, "torque"), get(full, "torque")), 0),
    torqueRpm: toNum(
      pick(get(engine, "torqueRpm"), get(d, "torqueRpm"), get(full, "torqueRpm")),
      0
    ),

    mileage: toNum(pick(get(engine, "mileage"), get(d, "mileage"), get(full, "mileage")), 0),
    range: toNum(pick(get(engine, "range"), get(d, "range"), get(full, "range")), 0),
    autoStartStop: toStr(get(d, "autoStartStop"), ""),

    // Dimensions (prefer nested)
    length: toNum(pick(get(dimensions, "length"), get(d, "length"), get(full, "length")), 0),
    width: toNum(pick(get(dimensions, "width"), get(d, "width"), get(full, "width")), 0),
    height: toNum(pick(get(dimensions, "height"), get(d, "height"), get(full, "height")), 0),
    weight: toNum(pick(get(dimensions, "weight"), get(d, "weight"), get(full, "weight")), 0),
    groundClearance: toNum(
      pick(
        get(dimensions, "groundClearance"),
        get(d, "groundClearance"),
        get(full, "groundClearance")
      ),
      0
    ),
    wheelBase: toNum(
      pick(get(dimensions, "wheelBase"), get(d, "wheelBase"), get(full, "wheelBase")),
      0
    ),

    // Car capacity (prefer nested)
    personCapacity: toNum(
      pick(get(car, "personCapacity"), get(d, "personCapacity"), get(full, "personCapacity")),
      0
    ),
    rows: toNum(pick(get(car, "rows"), get(d, "rows"), get(full, "rows")), 0),
    doors: toNum(pick(get(car, "doors"), get(d, "doors"), get(full, "doors")), 0),
    bootSpace: toNum(
      pick(get(car, "bootSpace"), get(d, "bootSpace"), get(full, "bootSpace")),
      0
    ),

    // Bike capacity (prefer nested)
    tankSize: toNum(pick(get(bike, "tankSize"), get(d, "tankSize"), get(full, "tankSize")), 0),

    // Dynamics (prefer nested)
    frontType: toStr(pick(get(dynamics, "frontType"), get(d, "frontType")), ""),
    backType: toStr(pick(get(dynamics, "backType"), get(d, "backType")), ""),
    frontBrake: toStr(pick(get(dynamics, "frontBrake"), get(d, "frontBrake")), ""),
    backBrake: toStr(pick(get(dynamics, "backBrake"), get(d, "backBrake")), ""),
    tyreSizeFront: toStr(pick(get(dynamics, "tyreSizeFront"), get(d, "tyreSizeFront")), ""),
    tyreSizeBack: toStr(pick(get(dynamics, "tyreSizeBack"), get(d, "tyreSizeBack")), ""),
    tyreType: toStr(pick(get(dynamics, "tyreType"), get(d, "tyreType")), ""),
    wheelMaterial: toStr(pick(get(dynamics, "wheelMaterial"), get(d, "wheelMaterial")), ""),

    // Legacy-only (keep safe)
    poweredSteering: toStr(get(d, "poweredSteering"), ""),
    spare: toStr(get(d, "spare"), ""),
  };
}
