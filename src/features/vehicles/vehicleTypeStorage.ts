// src/features/vehicles/vehicleTypeStorage.ts
export type VehicleType = "bike" | "car";

const KEY = "autorovers_vehicle_type_v1";
const EVENT_NAME = "autorovers:vehicle_type_changed";

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

function emit(type: VehicleType | undefined) {
  // ✅ same-tab reactivity
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: type }));

  // (optional) keep storage event behavior for other tabs handled by browser automatically
}

export function onVehicleTypeChanged(
  cb: (type: VehicleType | undefined) => void
): () => void {
  const handler = (e: Event) => {
    const ce = e as CustomEvent<VehicleType | undefined>;
    cb(ce.detail ?? getSelectedVehicleType());
  };

  window.addEventListener(EVENT_NAME, handler);

  // ✅ cross-tab reactivity
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb(getSelectedVehicleType());
  };
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSelectedVehicleType(type: VehicleType): void {
  try {
    localStorage.setItem(KEY, type);
  } catch {
    // ignore storage failures
  }
  emit(type);
}

export function clearSelectedVehicleType(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit(undefined);
}
