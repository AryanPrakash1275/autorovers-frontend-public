// src/features/vehicles/types.ts

export type VehicleType = "Bike" | "Car" | "";

/**
 * Variant + Addon DTOs (public read)
 */
export type VariantAddonDto = {
  id: number;
  name: string;
  price: number;
};

export type VehicleVariantDto = {
  id: number;
  name: string;
  price: number;
  isDefault: boolean;
  isActive?: boolean;
  addons: VariantAddonDto[];
};

/**
 * Nested specs (to support nested backend shape)
 */
export type EngineSpecsDto = Partial<{
  engineType: string;
  engineDisplacement: number;
  inductionType: string;
  emission: string;
  fuelType: string;

  power: number;
  powerRpm: number;
  torque: number;
  torqueRpm: number;

  mileage: number;
  range: number;
}>;

export type DimensionsSpecsDto = Partial<{
  length: number;
  width: number;
  height: number;
  wheelBase: number;
  groundClearance: number;
  weight: number;
}>;

export type DynamicsSpecsDto = Partial<{
  frontType: string;
  backType: string;

  frontBrake: string;
  backBrake: string;

  tyreSizeFront: string;
  tyreSizeBack: string;
  tyreType: string;

  wheelMaterial: string;
}>;

export type BikeSpecsDto = Partial<{
  tankSize: number;
}>;

export type CarSpecsDto = Partial<{
  personCapacity: number;
  rows: number;
  doors: number;
  bootSpace: number;
}>;

/**
 * Nested details DTO coming from backend.
 * Keep it partial because backend can omit fields depending on vehicle kind.
 * Supports BOTH:
 * - flat fields (engineType, power, length...)
 * - nested fields (engine.engineType, dimensions.length...)
 */
export type VehicleDetailsDto = Partial<{
  // About / meta
  description: string;
  colorsAvailableJson: string;

  // Ownership / maintenance
  warrantyYears: number;
  serviceIntervalKm: number;

  // ✅ nested (backend shape)
  engine: EngineSpecsDto;
  dimensions: DimensionsSpecsDto;
  dynamics: DynamicsSpecsDto;
  bike: BikeSpecsDto;
  car: CarSpecsDto;

  // Engine & performance (flat legacy)
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

  // Dimensions & weight (flat legacy)
  length: number;
  width: number;
  height: number;
  weight: number;
  groundClearance: number;
  wheelBase: number;

  // Capacity (flat legacy)
  personCapacity: number;
  rows: number;
  doors: number;
  bootSpace: number;
  tankSize: number;

  // Tyres, brakes & steering (flat legacy)
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
 * (core vehicle + nested `details` + variants)
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

  variants?: VehicleVariantDto[];
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
  engineDisplacement?: number; // ✅ NEW (for backend nested engine)
  fuelType?: string; // ✅ NEW (for backend nested engine)
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

  power?: number;
  torque?: number;
};
