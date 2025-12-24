// src/features/vehicles/vehicleTypeStorage.ts
export type VehicleType = "bike" | "car";

const KEY = "autorovers_vehicle_type_v1";

export function isVehicleType(v: unknown): v is VehicleType {
  return v === "bike" || v === "car";
}

export function getSelectedVehicleType(): VehicleType | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return isVehicleType(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
}

export function setSelectedVehicleType(type: VehicleType): void {
  try {
    localStorage.setItem(KEY, type);
  } catch {
    // ignore storage failures
  }
}

export function clearSelectedVehicleType(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
