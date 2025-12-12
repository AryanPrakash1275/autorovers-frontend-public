import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import type {
  Vehicle,
  VehicleListItem,
  VehicleDetailsDto,
  VehicleWithDetailsDto,
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
  return apiPut<Vehicle>(`${ADMIN_VEHICLES_PATH}/${id}`, payload);
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
  return apiPut<VehicleDetailsDto, void>(
    `${ADMIN_VEHICLES_PATH}/${id}/details`,
    payload
  );
}

// ===== PUBLIC LIST =====
export async function getPublicVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(PUBLIC_VEHICLES_PATH);
}

// ===== PUBLIC DETAILS =====
export async function getPublicVehicleBySlug(slug: string): Promise<Vehicle> {
  const full = await apiGet<VehicleWithDetailsDto>(
    `${PUBLIC_VEHICLES_PATH}/slug/${encodeURIComponent(slug)}`
  );

  const d = full.details ?? {};

  return {
    id: full.id,
    vehicleType: full.vehicleType ?? "",
    brand: full.brand ?? "",
    model: full.model ?? "",
    variant: full.variant ?? "",
    year: full.year ?? new Date().getFullYear(),
    price: full.price ?? 0,
    category: full.category ?? "",
    transmission: full.transmission ?? "",
    slug: full.slug ?? "",
    imageUrl: full.imageUrl ?? "",

    engineType: d.engineType ?? "",
    specification: d.specification ?? "",
    inductionType: d.inductionType ?? "",
    power: d.power ?? 0,
    powerRpm: d.powerRpm ?? 0,
    torque: d.torque ?? 0,
    torqueRpm: d.torqueRpm ?? 0,
    emission: d.emission ?? "",
    mileage: d.mileage ?? 0,
    autoStartStop: d.autoStartStop ?? "",
    range: d.range ?? 0,

    length: d.length ?? 0,
    width: d.width ?? 0,
    height: d.height ?? 0,
    weight: d.weight ?? 0,
    groundClearance: d.groundClearance ?? 0,
    wheelBase: d.wheelBase ?? 0,

    personCapacity: d.personCapacity ?? 0,
    rows: d.rows ?? 0,
    doors: d.doors ?? 0,
    bootSpace: d.bootSpace ?? 0,
    tankSize: d.tankSize ?? 0,

    frontType: d.frontType ?? "",
    backType: d.backType ?? "",
    frontBrake: d.frontBrake ?? "",
    backBrake: d.backBrake ?? "",
    poweredSteering: d.poweredSteering ?? "",
    tyreSizeFront: d.tyreSizeFront ?? "",
    tyreSizeBack: d.tyreSizeBack ?? "",
    tyreType: d.tyreType ?? "",
    wheelMaterial: d.wheelMaterial ?? "",
    spare: d.spare ?? "",
  };
}
