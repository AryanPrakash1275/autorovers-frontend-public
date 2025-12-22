import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import type {
  Vehicle,
  VehicleListItem,
  VehicleDetailsDto,
  VehicleWithDetailsDto,
  VehicleVariantDto,
} from "./types";

// ADMIN endpoints
const ADMIN_VEHICLES_PATH = "/api/AdminVehicles";

// PUBLIC endpoints
const PUBLIC_VEHICLES_PATH = "/api/Vehicles";

// ===== ADMIN LIST =====
export async function getVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(ADMIN_VEHICLES_PATH);
}

// ===== ADMIN SINGLE =====
export async function getVehicle(id: number): Promise<Vehicle> {
  return apiGet<Vehicle>(`${ADMIN_VEHICLES_PATH}/${id}`);
}

export async function createVehicle(payload: Vehicle): Promise<{ id: number }> {
  return apiPost<Vehicle, { id: number }>(ADMIN_VEHICLES_PATH, payload);
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

// ===== PUBLIC LIST =====
export async function getPublicVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(PUBLIC_VEHICLES_PATH);
}

// ===== PUBLIC DETAILS =====
export async function getPublicVehicleBySlug(
  slug: string
): Promise<VehicleWithDetailsDto> {
  return apiGet<VehicleWithDetailsDto>(
    `${PUBLIC_VEHICLES_PATH}/slug/${encodeURIComponent(slug)}`
  );
}

// ===============================
// Admin Variants API (uses same client wrappers)
// ===============================
export async function getAdminVariants(vehicleId: number): Promise<VehicleVariantDto[]> {
  return apiGet<VehicleVariantDto[]>(`/api/Admin/Vehicles/${vehicleId}/variants`);
}

export async function updateAdminVariant(
  variantId: number,
  payload: {
    exShowroomPrice?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }
): Promise<void> {
  return apiPut<typeof payload, void>(`/api/Admin/Variants/${variantId}`, payload);
}
