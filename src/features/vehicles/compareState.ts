// src/features/vehicles/compareState.ts

import type { VehicleListItem } from "./types";

const KEY = "autorovers_compare_v1";
const EVENT_NAME = "autorovers:compare_changed";

export type CompareState = {
  vehicleType?: string; // "Bike" | "Car"
  items: VehicleListItem[];
};

type Obj = Record<string, unknown>;

function readString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length ? v.trim() : undefined;
}

/* =========================
   Category → Type inference
   ========================= */

const CAR_CATEGORIES = new Set(
  [
    "suv",
    "hatchback",
    "sedan",
    "coupe",
    "convertible",
    "wagon",
    "muv",
    "mpv",
    "crossover",
    "pickup",
    "truck",
    "van",
  ].map((x) => x.toLowerCase())
);

const BIKE_CATEGORIES = new Set(
  [
    "naked",
    "classic",
    "roadster",
    "cruiser",
    "sports",
    "sport",
    "adventure",
    "scooter",
    "commuter",
    "tourer",
    "cafe racer",
    "scrambler",
    "off-road",
    "off road",
  ].map((x) => x.toLowerCase())
);

function inferTypeFromCategory(category?: string): string | undefined {
  const raw = (category ?? "").trim();
  if (!raw) return undefined;

  const lc = raw.toLowerCase();

  if (CAR_CATEGORIES.has(lc)) return "Car";
  if (BIKE_CATEGORIES.has(lc)) return "Bike";

  // fallback heuristic
  if (lc.includes("suv") || lc.includes("hatch") || lc.includes("sedan")) return "Car";
  if (lc.includes("bike") || lc.includes("scooter") || lc.includes("cruiser")) return "Bike";

  return undefined;
}

/* =========================
   Public helpers
   ========================= */

export function getCompareVehicleType(row: VehicleListItem): string | undefined {
  const o = row as unknown as Obj;

  const vt = readString(o["vehicleType"]);
  if (vt) return vt;

  const kind = readString(o["kind"]);
  if (kind) return kind;

  const type = readString(o["type"]);
  if (type) return type;

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

  // ✅ same-tab reactivity
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: state })
  );
}

export function onCompareChanged(
  cb: (state: CompareState) => void
): () => void {
  const handler = (e: Event) => {
    const ce = e as CustomEvent<CompareState>;
    cb(ce.detail ?? loadCompare());
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
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
  if (!incomingType) return state;

  if (state.items.length === 0) {
    const next: CompareState = { vehicleType: incomingType, items: [vehicle] };
    saveCompare(next);
    return next;
  }

  const lockedType =
    state.vehicleType ?? getCompareVehicleType(state.items[0]);

  if (!lockedType || incomingType !== lockedType) return state;

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
