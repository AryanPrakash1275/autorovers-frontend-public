import type { VehicleWithDetailsDto, VehicleType } from "./types";
import {
  type ComparisonMapResult,
  type ComparisonBike,
  type ComparisonCar,
  inferTypeFromCategory,
  isVehicleType,
  requiredNum,
  requiredStr,
} from "./comparisonContract";

function resolveVehicleType(dto: VehicleWithDetailsDto): VehicleType {
  const raw = dto.vehicleType;
  if (isVehicleType(raw)) return raw;

  const inferred = inferTypeFromCategory(dto.category ?? null);
  if (inferred) return inferred;
  return "Bike";
}

function safeVariant(dto: VehicleWithDetailsDto): string {
  const v = (dto.variant ?? "").toString().trim();
  return v.length ? v : "Standard";
}

function softNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function softStr(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim().length ? v.trim() : fallback;
}

/**
 * Powertrain: do NOT fail compare for missing engine.fuelType.
 * Default to Petrol unless EV is explicitly present.
 */
function normalizePowertrain(dto: VehicleWithDetailsDto): "Petrol" | "Diesel" | "EV" | "Hybrid" {
  if (dto.details?.ev) return "EV";

  const ft = (dto.details?.engine?.fuelType ?? "").toString().trim().toLowerCase();
  if (!ft) return "Petrol";

  if (ft.includes("petrol") || ft.includes("gasoline")) return "Petrol";
  if (ft.includes("diesel")) return "Diesel";
  if (ft.includes("hybrid")) return "Hybrid";
  if (ft.includes("electric") || ft === "ev") return "EV";

  return "Petrol";
}

export function mapToComparisonVehicle(dto: VehicleWithDetailsDto): ComparisonMapResult {
  try {
    const vehicleType = resolveVehicleType(dto);

    const id = requiredNum(dto.id, "id");
    const slug = requiredStr(dto.slug, "slug");
    const brand = requiredStr(dto.brand, "brand");
    const model = requiredStr(dto.model, "model");
    const variant = safeVariant(dto);
    const year = requiredNum(dto.year, "year");
    const category = requiredStr(dto.category, "category");
    const imageUrl = requiredStr(dto.imageUrl, "imageUrl");
    const transmission = requiredStr(dto.transmission, "transmission");

    // soft decision fields (so compare always renders even with {} details)
    const price = softNum(dto.price);
    const powertrain = normalizePowertrain(dto);

    const mileageOrRange =
      powertrain === "EV"
        ? softNum(dto.details?.ev?.range ?? dto.details?.engine?.range)
        : softNum(dto.details?.engine?.mileage);

    const power =
      powertrain === "EV"
        ? softNum(dto.details?.ev?.motorPower ?? dto.details?.engine?.power)
        : softNum(dto.details?.engine?.power);

    const torque =
      powertrain === "EV"
        ? softNum(dto.details?.ev?.motorTorque ?? dto.details?.engine?.torque)
        : softNum(dto.details?.engine?.torque);

    // soft extras
    const warrantyYears = softNum(dto.details?.warrantyYears);
    const serviceIntervalKm = softNum(dto.details?.serviceIntervalKm);

    const base = {
      id,
      slug,
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
      const kerbWeightKg = softNum(dto.details?.dimensions?.weight);
      const fuelTankCapacityL = softNum(dto.details?.bike?.tankSize);

      const bike: ComparisonBike = {
        vehicleType: "Bike",
        ...base,
        kerbWeightKg,
        fuelTankCapacityL,
      };
      return { ok: true, value: bike };
    }

    const bodyType = softStr(dto.category, "Car");
    const bootSpaceL = softNum(dto.details?.car?.bootSpace);

    const car: ComparisonCar = {
      vehicleType: "Car",
      ...base,
      bodyType,
      bootSpaceL,
    };
    return { ok: true, value: car };
  } catch (e: unknown) {
    return { ok: false, reason: e instanceof Error ? e.message : "Not publishable" };
  }
}
