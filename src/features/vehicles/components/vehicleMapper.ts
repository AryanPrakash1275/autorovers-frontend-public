import type { Vehicle, VehicleListItem, VehicleWithDetailsDto } from "../types";

function toNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function getFlat(details: unknown, key: string): unknown {
  if (!details || typeof details !== "object") return undefined;
  return (details as Record<string, unknown>)[key];
}

export function mapFullVehicleToForm(
  full: VehicleWithDetailsDto,
  rowFallback: VehicleListItem
): Vehicle {
  const d = full.details ?? {};

  const engine = d.engine ?? {};
  const dimensions = d.dimensions ?? {};
  const dynamics = d.dynamics ?? {};
  const bike = d.bike ?? {};
  const car = d.car ?? {};

  return {
    id: full.id ?? rowFallback.id,

    vehicleType: full.vehicleType ?? rowFallback.vehicleType ?? "",
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
    description: d.description ?? "",
    colorsAvailableJson: d.colorsAvailableJson ?? "",
    warrantyYears: d.warrantyYears ?? 0,
    serviceIntervalKm: d.serviceIntervalKm ?? 0,

    // Engine & performance (prefer nested)
    engineType: engine.engineType ?? d.engineType ?? "",
    engineDisplacement: toNum(
      engine.engineDisplacement ?? getFlat(d, "engineDisplacement"),
      0
    ),
    fuelType: toStr(engine.fuelType ?? getFlat(d, "fuelType"), ""),
    specification: d.specification ?? "",

    inductionType: engine.inductionType ?? d.inductionType ?? "",
    emission: engine.emission ?? d.emission ?? "",

    power: engine.power ?? d.power ?? 0,
    powerRpm: engine.powerRpm ?? d.powerRpm ?? 0,
    torque: engine.torque ?? d.torque ?? 0,
    torqueRpm: engine.torqueRpm ?? d.torqueRpm ?? 0,

    mileage: engine.mileage ?? d.mileage ?? 0,
    range: engine.range ?? d.range ?? 0,
    autoStartStop: d.autoStartStop ?? "",

    // Dimensions (prefer nested)
    length: dimensions.length ?? d.length ?? 0,
    width: dimensions.width ?? d.width ?? 0,
    height: dimensions.height ?? d.height ?? 0,
    weight: dimensions.weight ?? d.weight ?? 0,
    groundClearance: dimensions.groundClearance ?? d.groundClearance ?? 0,
    wheelBase: dimensions.wheelBase ?? d.wheelBase ?? 0,

    // Car capacity (prefer nested)
    personCapacity: car.personCapacity ?? d.personCapacity ?? 0,
    rows: car.rows ?? d.rows ?? 0,
    doors: car.doors ?? d.doors ?? 0,
    bootSpace: car.bootSpace ?? d.bootSpace ?? 0,

    // Bike capacity (prefer nested)
    tankSize: bike.tankSize ?? d.tankSize ?? 0,

    // Dynamics (prefer nested)
    frontType: dynamics.frontType ?? d.frontType ?? "",
    backType: dynamics.backType ?? d.backType ?? "",
    frontBrake: dynamics.frontBrake ?? d.frontBrake ?? "",
    backBrake: dynamics.backBrake ?? d.backBrake ?? "",
    tyreSizeFront: dynamics.tyreSizeFront ?? d.tyreSizeFront ?? "",
    tyreSizeBack: dynamics.tyreSizeBack ?? d.tyreSizeBack ?? "",
    tyreType: dynamics.tyreType ?? d.tyreType ?? "",
    wheelMaterial: dynamics.wheelMaterial ?? d.wheelMaterial ?? "",

    // Legacy-only
    poweredSteering: d.poweredSteering ?? "",
    spare: d.spare ?? "",
  };
}
