// src/features/vehicles/mapToComparisonVehicle.ts

import type { VehicleWithDetailsDto, VehicleType } from "./types";
import {
  type ComparisonMapResult,
  type ComparisonVehicle,
  inferTypeFromCategory,
  isVehicleType,
  required,
  requiredNum,
  requiredStr,
} from "./comparisonContract";

/**
 * Normalizes raw fuel strings into the locked Powertrain set.
 */
function normalizePowertrain(
  dto: VehicleWithDetailsDto
): "Petrol" | "Diesel" | "EV" | "Hybrid" {
  const ev = dto.details?.ev;
  if (ev) return "EV";

  const ft = (dto.details?.engine?.fuelType ?? "").toString().trim().toLowerCase();
  if (!ft) throw new Error("Missing engine.fuelType");

  if (ft.includes("petrol") || ft.includes("gasoline")) return "Petrol";
  if (ft.includes("diesel")) return "Diesel";
  if (ft.includes("hybrid")) return "Hybrid";

  // if backend uses "electric" but under engine, still treat as EV
  if (ft.includes("electric") || ft === "ev") return "EV";

  // hard fail to keep contract strict
  throw new Error("Unknown fuelType (expected Petrol/Diesel/EV/Hybrid)");
}

function pickMileageOrRange(dto: VehicleWithDetailsDto, powertrain: string): number {
  if (powertrain === "EV") {
    // prefer EV range from details.ev.range, fallback to details.engine.range (if older data)
    const r1 = dto.details?.ev?.range;
    const r2 = dto.details?.engine?.range;
    const r = typeof r1 === "number" && r1 > 0 ? r1 : r2;
    return requiredNum(r, "range");
  }

  // ICE: mileage only
  return requiredNum(dto.details?.engine?.mileage, "mileage");
}

function pickPower(dto: VehicleWithDetailsDto, powertrain: string): number {
  if (powertrain === "EV") {
    const p = dto.details?.ev?.motorPower ?? dto.details?.engine?.power;
    return requiredNum(p, "power");
  }
  return requiredNum(dto.details?.engine?.power, "power");
}

function pickTorque(dto: VehicleWithDetailsDto, powertrain: string): number {
  if (powertrain === "EV") {
    const t = dto.details?.ev?.motorTorque ?? dto.details?.engine?.torque;
    return requiredNum(t, "torque");
  }
  return requiredNum(dto.details?.engine?.torque, "torque");
}

function resolveVehicleType(dto: VehicleWithDetailsDto): VehicleType {
  const raw = dto.vehicleType;
  if (isVehicleType(raw)) return raw;

  const inferred = inferTypeFromCategory(dto.category ?? null);
  if (inferred) return inferred;

  throw new Error("Unable to infer vehicle type");
}

export function mapToComparisonVehicle(dto: VehicleWithDetailsDto): ComparisonMapResult {
  try {
    const vehicleType = resolveVehicleType(dto);

    const id = requiredNum(dto.id, "id");
    const slug = requiredStr(dto.slug, "slug");

    const brand = requiredStr(dto.brand, "brand");
    const model = requiredStr(dto.model, "model");
    const variant = requiredStr(dto.variant ?? "", "variant");
    const year = requiredNum(dto.year, "year");
    const category = requiredStr(dto.category, "category");
    const imageUrl = requiredStr(dto.imageUrl, "imageUrl");

    const transmission = requiredStr(dto.transmission, "transmission");

    const details = required(dto.details, "details");

    const price = requiredNum(dto.price, "price");
    const warrantyYears = requiredNum(details.warrantyYears, "warrantyYears");
    const serviceIntervalKm = requiredNum(details.serviceIntervalKm, "serviceIntervalKm");

    const powertrain = normalizePowertrain(dto);

    const mileageOrRange = pickMileageOrRange(dto, powertrain);
    const power = pickPower(dto, powertrain);
    const torque = pickTorque(dto, powertrain);

    const base: ComparisonVehicle = {
      id,
      slug,
      vehicleType,

      brand,
      model,
      variant,
      year,
      category,
      imageUrl,

      price,
      mileageOrRange,
      power,
      torque,
      transmission,
      powertrain,
      warrantyYears,
      serviceIntervalKm,
    };

    if (vehicleType === "Bike") {
      // Bike-only: kerb weight (dimensions.weight) + fuel tank capacity (bike.tankSize)
      const kerbWeightKg = requiredNum(details.dimensions?.weight, "dimensions.weight");
      const fuelTankCapacityL = requiredNum(details.bike?.tankSize, "bike.tankSize");

      return { ok: true, value: { ...base, kerbWeightKg, fuelTankCapacityL } };
    }

    // Car-only: body type + boot space
    const bodyType = requiredStr(dto.category, "category"); // deterministic: use category string
    const bootSpaceL = requiredNum(details.car?.bootSpace, "car.bootSpace");

    return { ok: true, value: { ...base, bodyType, bootSpaceL } };
  } catch (e: unknown) {
    return { ok: false, reason: e instanceof Error ? e.message : "Not publishable" };
  }
}
