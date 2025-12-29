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

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

function clampPage(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.floor(v);
}

function clampPageSize(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(v));
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
  query: PublicVehiclesQuery
): Promise<PagedResult<VehicleListItem>> {
  const type = query.type?.trim();
  if (!type) throw new Error("PublicVehiclesQuery.type is required");

  const page = clampPage(query.page);
  const pageSize = clampPageSize(query.pageSize);

  const qs = toQueryString({
    type,
    q: query.q,
    brand: query.brand,
    category: query.category,
    fuelType: query.fuelType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
    page,
    pageSize,
  });

  const raw = await apiGet<unknown>(`${PUBLIC_VEHICLES_PATH}${qs}`);

  // backward-compat: if API returns array
  if (Array.isArray(raw)) {
    const items = raw as VehicleListItem[];
    return { items, page, pageSize, totalCount: items.length };
  }

  if (isPagedVehicleList(raw)) return raw;

  return { items: [], page, pageSize, totalCount: 0 };
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
