import type { Vehicle, VehicleListItem, VehicleWithDetailsDto } from "../types";

export function mapFullVehicleToForm(
  full: VehicleWithDetailsDto,
  rowFallback: VehicleListItem
): Vehicle {
  const d = full.details ?? {};

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

    // details (default-safe)
    engineType: d.engineType ?? "",
    specification: d.specification ?? "",
    inductionType: d.inductionType ?? "",
    power: d.power ?? 0,
    powerRpm: d.powerRpm ?? 0,
    torque: d.torque ?? 0,
    torqueRpm: d.torqueRpm ?? 0,
    emission: d.emission ?? "",
    mileage: d.mileage ?? 0,
    autoStartStop: d.autoStartStop ?? "",
    range: d.range ?? 0,

    length: d.length ?? 0,
    width: d.width ?? 0,
    height: d.height ?? 0,
    weight: d.weight ?? 0,
    groundClearance: d.groundClearance ?? 0,
    wheelBase: d.wheelBase ?? 0,

    personCapacity: d.personCapacity ?? 0,
    rows: d.rows ?? 0,
    doors: d.doors ?? 0,
    bootSpace: d.bootSpace ?? 0,
    tankSize: d.tankSize ?? 0,

    frontType: d.frontType ?? "",
    backType: d.backType ?? "",
    frontBrake: d.frontBrake ?? "",
    backBrake: d.backBrake ?? "",
    poweredSteering: d.poweredSteering ?? "",
    tyreSizeFront: d.tyreSizeFront ?? "",
    tyreSizeBack: d.tyreSizeBack ?? "",
    tyreType: d.tyreType ?? "",
    wheelMaterial: d.wheelMaterial ?? "",
    spare: d.spare ?? "",
  };
}
