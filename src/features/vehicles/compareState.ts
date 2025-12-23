// src/features/vehicles/compareState.ts

import type { VehicleListItem } from "./types";

const KEY = "autorovers_compare_v1";

export type CompareState = {
  vehicleType?: string; // "Bike" | "Car"
  items: VehicleListItem[];
};

function readString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length ? v : undefined;
}

function readVehicleType(row: unknown): string | undefined {
  if (!row || typeof row !== "object") return undefined;
  if (!("vehicleType" in row)) return undefined;

  const v = (row as { vehicleType?: unknown }).vehicleType;
  return readString(v);
}

export function getCompareVehicleType(row: VehicleListItem): string | undefined {
  return readVehicleType(row);
}

export function loadCompare(): CompareState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [] };

    const parsed = JSON.parse(raw) as CompareState;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };

    const inferredType = parsed.items[0]
      ? getCompareVehicleType(parsed.items[0])
      : undefined;

    return { vehicleType: inferredType, items: parsed.items };
  } catch {
    return { items: [] };
  }
}

export function saveCompare(state: CompareState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function toggleCompare(
  state: CompareState,
  vehicle: VehicleListItem
): CompareState {
  const exists = state.items.some((v) => v.id === vehicle.id);

  // remove
  if (exists) {
    const items = state.items.filter((v) => v.id !== vehicle.id);
    const next: CompareState = {
      vehicleType: items[0] ? getCompareVehicleType(items[0]) : undefined,
      items,
    };
    saveCompare(next);
    return next;
  }

  // add — max 4
  if (state.items.length >= 4) return state;

  const incomingType = getCompareVehicleType(vehicle);

  // If row can't be typed, block.
  if (!incomingType) return state;

  // If empty, lock to incoming type
  if (state.items.length === 0) {
    const next: CompareState = { vehicleType: incomingType, items: [vehicle] };
    saveCompare(next);
    return next;
  }

  // Otherwise enforce locked type
  const lockedType =
    state.vehicleType ??
    (state.items[0] ? getCompareVehicleType(state.items[0]) : undefined);

  if (!lockedType) return state;
  if (incomingType !== lockedType) return state;

  const next: CompareState = {
    vehicleType: lockedType,
    items: [...state.items, vehicle],
  };

  saveCompare(next);
  return next;
}

export function clearCompare(): CompareState {
  const next: CompareState = { items: [] };
  saveCompare(next);
  return next;
}
