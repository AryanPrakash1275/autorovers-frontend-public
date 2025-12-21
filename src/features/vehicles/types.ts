// src/features/vehicles/types.ts

export type VehicleType = "Bike" | "Car" | "";

/**
 * Nested details DTO coming from backend.
 * Keep it partial because backend can omit fields depending on vehicle kind.
 */
export type VehicleDetailsDto = Partial<{
  // About / meta
  description: string;
  colorsAvailableJson: string;

  // Ownership / maintenance
  warrantyYears: number;
  serviceIntervalKm: number;

  // Engine & performance
  engineType: string;
  specification: string;
  inductionType: string;
  power: number;
  powerRpm: number;
  torque: number;
  torqueRpm: number;
  emission: string;
  mileage: number;
  autoStartStop: string;
  range: number;

  // Dimensions & weight
  length: number;
  width: number;
  height: number;
  weight: number;
  groundClearance: number;
  wheelBase: number;

  // Capacity
  personCapacity: number;
  rows: number;
  doors: number;
  bootSpace: number;
  tankSize: number;

  // Tyres, brakes & steering
  frontType: string;
  backType: string;
  frontBrake: string;
  backBrake: string;
  poweredSteering: string;
  tyreSizeFront: string;
  tyreSizeBack: string;
  tyreType: string;
  wheelMaterial: string;
  spare: string;
}>;

/**
 * Backend response for /api/Vehicles/slug/{slug}
 * (core vehicle + nested `details`)
 */
export type VehicleWithDetailsDto = {
  id: number;

  vehicleType?: VehicleType | string;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  price?: number;

  category?: string;
  transmission?: string;
  slug?: string;
  imageUrl?: string;

  details?: VehicleDetailsDto;
};

/**
 * Flattened shape used by Admin UI forms.
 * This is NOT the backend shape for public details.
 * It's your "form model".
 */
export type Vehicle = {
  id: number;

  vehicleType: VehicleType | string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  price: number;

  category: string;
  transmission: string;
  slug?: string;
  imageUrl?: string;

  // flattened optional specs
  description?: string;
  colorsAvailableJson?: string;

  warrantyYears?: number;
  serviceIntervalKm?: number;

  engineType?: string;
  specification?: string;
  inductionType?: string;
  power?: number;
  powerRpm?: number;
  torque?: number;
  torqueRpm?: number;
  emission?: string;
  mileage?: number;
  autoStartStop?: string;
  range?: number;

  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  groundClearance?: number;
  wheelBase?: number;

  personCapacity?: number;
  rows?: number;
  doors?: number;
  bootSpace?: number;
  tankSize?: number;

  frontType?: string;
  backType?: string;
  frontBrake?: string;
  backBrake?: string;
  poweredSteering?: string;
  tyreSizeFront?: string;
  tyreSizeBack?: string;
  tyreType?: string;
  wheelMaterial?: string;
  spare?: string;
};

/**
 * Public list cards (what your VehiclesPage uses).
 * Keep this lightweight. Add only what the list endpoint returns.
 */
export type VehicleListItem = {
  id: number;
  vehicleType?: VehicleType | string;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  price?: number;
  category?: string;
  transmission?: string;
  slug?: string;
  imageUrl?: string;

  // optional highlights if list endpoint includes them
  power?: number;
  torque?: number;
};
