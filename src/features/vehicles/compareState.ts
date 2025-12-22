// src/features/vehicles/compareState.ts

import type { VehicleListItem } from "./types";

const KEY = "autorovers_compare_v1";

export type CompareState = {
  vehicleType?: string; // "Bike" | "Car"
  items: VehicleListItem[];
};

type Obj = Record<string, unknown>;

function readString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length ? v : undefined;
}

// Category-based inference (because Admin list API doesn't return vehicleType)
const CAR_CATEGORIES = new Set([
  "SUV",
  "Hatchback",
  "Sedan",
  "Coupe",
  "Convertible",
  "Wagon",
  "MUV",
  "MPV",
  "Crossover",
  "Pickup",
  "Truck",
  "Van",
]);

const BIKE_CATEGORIES = new Set([
  "Naked",
  "Classic",
  "Roadster",
  "Cruiser",
  "Sports",
  "Sport",
  "Adventure",
  "Scooter",
  "Commuter",
  "Tourer",
  "Cafe Racer",
  "Scrambler",
  "Off-road",
]);

function inferTypeFromCategory(category?: string): string | undefined {
  const c = (category ?? "").trim();
  if (!c) return undefined;

  if (CAR_CATEGORIES.has(c)) return "Car";
  if (BIKE_CATEGORIES.has(c)) return "Bike";

  // fallback heuristic (optional): if it looks like a car category keyword
  const lc = c.toLowerCase();
  if (lc.includes("suv") || lc.includes("hatch") || lc.includes("sedan")) return "Car";
  if (lc.includes("bike") || lc.includes("scooter") || lc.includes("cruiser")) return "Bike";

  return undefined;
}

// Exported so VehicleTable / ListPage can use the SAME logic
export function getCompareVehicleType(row: VehicleListItem): string | undefined {
  const o = row as unknown as Obj;

  // preferred keys
  const vt = readString(o["vehicleType"]);
  if (vt) return vt;

  // fallbacks if backend ever used these
  const kind = readString(o["kind"]);
  if (kind) return kind;

  const type = readString(o["type"]);
  if (type) return type;

  // infer from category (your current reality)
  const cat = readString(o["category"]);
  return inferTypeFromCategory(cat);
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

    return {
      vehicleType: inferredType,
      items: parsed.items,
    };
  } catch {
    return { items: [] };
  }
}

export function saveCompare(state: CompareState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function toggleCompare(state: CompareState, vehicle: VehicleListItem): CompareState {
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

  // If list row can't be typed even after inference, block.
  if (!incomingType) return state;

  // if empty, lock to incoming type
  if (state.items.length === 0) {
    const next: CompareState = { vehicleType: incomingType, items: [vehicle] };
    saveCompare(next);
    return next;
  }

  // otherwise enforce locked type
  const lockedType =
    state.vehicleType ?? (state.items[0] ? getCompareVehicleType(state.items[0]) : undefined);

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
