// src/features/vehicles/compareState.ts

import type { VehicleListItem } from "./types";

const KEY = "autorovers_compare_v1";
const EVENT_NAME = "autorovers:compare_changed";

export type CompareVehicleType = "bike" | "car";

export type CompareState = {
  vehicleType?: CompareVehicleType;
  items: VehicleListItem[];
};

export type ToggleCompareResult =
  | { ok: true; state: CompareState }
  | { ok: false; reason: string; state: CompareState };

type Obj = Record<string, unknown>;

function readString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length ? v.trim() : undefined;
}

function normType(v: unknown): CompareVehicleType | undefined {
  const s = readString(v)?.toLowerCase();
  if (s === "bike") return "bike";
  if (s === "car") return "car";
  return undefined;
}

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
    "ev car",
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
    "ev bike",
  ].map((x) => x.toLowerCase())
);

function inferTypeFromCategory(category?: string): CompareVehicleType | undefined {
  const raw = (category ?? "").trim();
  if (!raw) return undefined;

  const lc = raw.toLowerCase();

  if (CAR_CATEGORIES.has(lc)) return "car";
  if (BIKE_CATEGORIES.has(lc)) return "bike";

  if (lc.includes("suv") || lc.includes("hatch") || lc.includes("sedan")) return "car";
  if (lc.includes("bike") || lc.includes("scooter") || lc.includes("cruiser")) return "bike";

  return undefined;
}

export function getCompareVehicleType(row: VehicleListItem): CompareVehicleType | undefined {
  const o = row as unknown as Obj;

  // current contract (list item now returns vehicleType: "bike"|"car")
  const vt = normType(o["vehicleType"]);
  if (vt) return vt;

  // legacy fallback keys
  const kind = normType(o["kind"]);
  if (kind) return kind;

  const type = normType(o["type"]);
  if (type) return type;

  // final fallback: infer from category
  const cat = readString(o["category"]);
  return inferTypeFromCategory(cat);
}

export function loadCompare(): CompareState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [] };

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { items: [] };

    const o = parsed as Obj;
    const items = Array.isArray(o.items) ? (o.items as VehicleListItem[]) : [];

    const inferredType = items[0] ? getCompareVehicleType(items[0]) : undefined;
    const storedType = normType(o["vehicleType"]);

    const vehicleType =
      inferredType && storedType && inferredType !== storedType
        ? inferredType
        : storedType ?? inferredType;

    return { vehicleType, items };
  } catch {
    return { items: [] };
  }
}

export function saveCompare(state: CompareState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
}

export function onCompareChanged(cb: (state: CompareState) => void): () => void {
  const handler = (e: Event) => {
    const ce = e as CustomEvent<CompareState>;
    cb(ce.detail ?? loadCompare());
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function toggleCompareWithResult(
  state: CompareState,
  vehicle: VehicleListItem
): ToggleCompareResult {
  const exists = state.items.some((v) => v.id === vehicle.id);

  if (exists) {
    const items = state.items.filter((v) => v.id !== vehicle.id);
    const next: CompareState = {
      vehicleType: items[0] ? getCompareVehicleType(items[0]) : undefined,
      items,
    };
    saveCompare(next);
    return { ok: true, state: next };
  }

  if (state.items.length >= 4) {
    return { ok: false, reason: "You can compare up to 4 vehicles.", state };
  }

  const incomingType = getCompareVehicleType(vehicle);
  if (!incomingType) {
    return { ok: false, reason: "Vehicle type missing.", state };
  }

  if (state.items.length === 0) {
    const next: CompareState = { vehicleType: incomingType, items: [vehicle] };
    saveCompare(next);
    return { ok: true, state: next };
  }

  const lockedType = state.vehicleType ?? getCompareVehicleType(state.items[0]);
  if (!lockedType) {
    return { ok: false, reason: "Compare session type missing.", state };
  }

  if (incomingType !== lockedType) {
    const label = lockedType === "bike" ? "Bikes" : "Cars";
    return {
      ok: false,
      reason: `You can only compare ${label} together.`,
      state,
    };
  }

  const next: CompareState = {
    vehicleType: lockedType,
    items: [...state.items, vehicle],
  };

  saveCompare(next);
  return { ok: true, state: next };
}

export function toggleCompare(state: CompareState, vehicle: VehicleListItem): CompareState {
  return toggleCompareWithResult(state, vehicle).state;
}

export function clearCompare(): CompareState {
  const next: CompareState = { items: [] };
  saveCompare(next);
  return next;
}
