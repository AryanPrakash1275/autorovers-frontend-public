import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import type {
  Vehicle,
  VehicleListItem,
  VehicleDetailsDto,
  VehicleWithDetailsDto,
  VehicleVariantDto,
} from "./types";

const ADMIN_VEHICLES_PATH = "/api/AdminVehicles";
const PUBLIC_VEHICLES_PATH = "/api/Vehicles";

// ✅ matches backend CreateVehicleRequest (only what we need now)
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
    fuelType?: string | null; // 🔥 REQUIRED for powertrain derive (ICE)
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

// ===== ADMIN LIST =====
export async function getVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(ADMIN_VEHICLES_PATH);
}

// ===== ADMIN SINGLE =====
export async function getVehicle(id: number): Promise<Vehicle> {
  return apiGet<Vehicle>(`${ADMIN_VEHICLES_PATH}/${id}`);
}

// ✅ create expects CreateVehicleRequest (not Vehicle)
export async function createVehicle(payload: CreateVehicleRequest): Promise<{ id: number }> {
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

export function updateVehicleDetails(id: number, payload: VehicleDetailsDto): Promise<void> {
  return apiPut<VehicleDetailsDto, void>(`${ADMIN_VEHICLES_PATH}/${id}/details`, payload);
}

// ===== PUBLIC LIST =====
export async function getPublicVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(PUBLIC_VEHICLES_PATH);
}

// ===== PUBLIC DETAILS =====
export async function getPublicVehicleBySlug(slug: string): Promise<VehicleWithDetailsDto> {
  return apiGet<VehicleWithDetailsDto>(
    `${PUBLIC_VEHICLES_PATH}/slug/${encodeURIComponent(slug)}`
  );
}

// Variants...
export async function getAdminVariants(vehicleId: number): Promise<VehicleVariantDto[]> {
  return apiGet<VehicleVariantDto[]>(`/api/Admin/Vehicles/${vehicleId}/variants`);
}

export async function updateAdminVariant(
  variantId: number,
  payload: { exShowroomPrice?: number; isDefault?: boolean; isActive?: boolean }
): Promise<void> {
  return apiPut<typeof payload, void>(`/api/Admin/Variants/${variantId}`, payload);
}
