// src/features/vehicles/api.ts

import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import type {
  Vehicle,
  VehicleListItem,
  VehicleDetailsDto,
  VehicleWithDetailsDto,
  VehicleVariantDto,
  FuelType,
  PagedResult,
  PublicVehiclesQuery,
} from "./types";

const ADMIN_VEHICLES_PATH = "/api/AdminVehicles";
const PUBLIC_VEHICLES_PATH = "/api/Vehicles";

export type CreateVehicleRequest = {
  brand: string;
  model: string;
  variant?: string | null;
  year: number;
  price: number;
  description?: string | null;

  category: string;
  transmission: string;
  slug?: string | null;
  imageUrl?: string | null;

  vehicleType?: string | null;
  fuelType?: FuelType | string | null;

  engine?: {
    engineType?: string | null;
    engineDisplacement?: number | null;
    inductionType?: string | null;
    emission?: string | null;
    power?: number | null;
    powerRpm?: number | null;
    torque?: number | null;
    torqueRpm?: number | null;
    mileage?: number | null;
    range?: number | null;
    fuelType?: FuelType | string | null;
  };

  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    wheelBase?: number | null;
    groundClearance?: number | null;
    weight?: number | null;
  };

  dynamics?: {
    frontType?: string | null;
    backType?: string | null;
    frontBrake?: string | null;
    backBrake?: string | null;
    tyreSizeFront?: string | null;
    tyreSizeBack?: string | null;
    tyreType?: string | null;
    wheelMaterial?: string | null;
  };

  bike?: {
    tankSize?: number | null;
  };

  car?: {
    personCapacity?: number | null;
    rows?: number | null;
    doors?: number | null;
    bootSpace?: number | null;
  };

  colorsAvailableJson?: string | null;
  warrantyYears?: number | null;
  serviceIntervalKm?: number | null;
};

function toQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;

    if (typeof v === "string") {
      const t = v.trim();
      if (!t) continue;
      qs.set(k, t);
      continue;
    }

    if (typeof v === "number") {
      if (!Number.isFinite(v)) continue;
      qs.set(k, String(v));
      continue;
    }

    if (typeof v === "boolean") {
      qs.set(k, v ? "true" : "false");
      continue;
    }

    qs.set(k, String(v));
  }

  const s = qs.toString();
  return s ? `?${s}` : "";
}

function isPagedVehicleList(x: unknown): x is PagedResult<VehicleListItem> {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    Array.isArray(o.items) &&
    typeof o.page === "number" &&
    typeof o.pageSize === "number" &&
    typeof o.totalCount === "number"
  );
}

// ===== ADMIN LIST =====
export async function getVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(ADMIN_VEHICLES_PATH);
}

// ===== ADMIN SINGLE =====
export async function getVehicle(id: number): Promise<Vehicle> {
  return apiGet<Vehicle>(`${ADMIN_VEHICLES_PATH}/${id}`);
}

export async function createVehicle(
  payload: CreateVehicleRequest
): Promise<{ id: number }> {
  return apiPost<CreateVehicleRequest, { id: number }>(ADMIN_VEHICLES_PATH, payload);
}

export async function updateVehicle(id: number, payload: Vehicle): Promise<void> {
  return apiPut<Vehicle, void>(`${ADMIN_VEHICLES_PATH}/${id}`, payload);
}

export async function deleteVehicleById(id: number): Promise<void> {
  return apiDelete<void>(`${ADMIN_VEHICLES_PATH}/${id}`);
}

// ===== ADMIN DETAILS =====
export function getVehicleWithDetails(id: number): Promise<VehicleWithDetailsDto> {
  return apiGet<VehicleWithDetailsDto>(`${ADMIN_VEHICLES_PATH}/${id}/details`);
}

export function updateVehicleDetails(
  id: number,
  payload: VehicleDetailsDto
): Promise<void> {
  return apiPut<VehicleDetailsDto, void>(`${ADMIN_VEHICLES_PATH}/${id}/details`, payload);
}

// ===== PUBLIC LIST (PAGED) =====
export async function getPublicVehicles(
  query?: PublicVehiclesQuery
): Promise<PagedResult<VehicleListItem>> {
  const q = query ?? {};

  const qs = toQueryString({
    type: q.type,
    q: q.q,
    brand: q.brand,
    category: q.category,
    fuelType: q.fuelType,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    sort: q.sort,
    page: q.page,
    pageSize: q.pageSize,
  });

  const raw = await apiGet<unknown>(`${PUBLIC_VEHICLES_PATH}${qs}`);

  // backward-compat: if API returns array
  if (Array.isArray(raw)) {
    const items = raw as VehicleListItem[];
    const page = q.page && q.page > 0 ? q.page : 1;
    const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : items.length || 24;
    return { items, page, pageSize, totalCount: items.length };
  }

  if (isPagedVehicleList(raw)) return raw;

  // last resort
  return { items: [], page: 1, pageSize: q.pageSize ?? 24, totalCount: 0 };
}

// ===== PUBLIC DETAILS =====
export async function getPublicVehicleBySlug(slug: string): Promise<VehicleWithDetailsDto> {
  return apiGet<VehicleWithDetailsDto>(
    `${PUBLIC_VEHICLES_PATH}/slug/${encodeURIComponent(slug)}`
  );
}

// ===== Variants (Admin) =====
export async function getAdminVariants(vehicleId: number): Promise<VehicleVariantDto[]> {
  return apiGet<VehicleVariantDto[]>(`/api/Admin/Vehicles/${vehicleId}/variants`);
}

export async function updateAdminVariant(
  variantId: number,
  payload: { exShowroomPrice?: number; isDefault?: boolean; isActive?: boolean }
): Promise<void> {
  return apiPut<typeof payload, void>(`/api/Admin/Variants/${variantId}`, payload);
}
