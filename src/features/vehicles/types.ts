// src/features/vehicles/types.ts

export type VehicleType = "Bike" | "Car";

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
  addons: VariantAddonDto[];
};

/**
 * Nested specs (matches backend DTO shape)
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

export type EvSpecsDto = Partial<{
  batteryCapacity: number;
  chargingTimeFast: number;
  chargingTimeNormal: number;
  motorPower: number;
  motorTorque: number;

  fastChargingPort: boolean;
  range: number;
}>;

export type DimensionsSpecsDto = Partial<{
  length: number;
  width: number;
  height: number;
  wheelBase: number;
  groundClearance: number;
  weight: number;
  turningRadius: number;
}>;

export type DynamicsSpecsDto = Partial<{
  frontType: string;
  backType: string;

  frontBrake: string;
  backBrake: string;

  frontSuspension: string;
  rearSuspension: string;

  tyreSizeFront: string;
  tyreSizeBack: string;
  tyreType: string;

  wheelMaterial: string;
}>;

export type BikeSpecsDto = Partial<{
  numberOfGears: number;
  tankSize: number;

  abs: boolean;
  tractionControl: boolean;

  displaySize: number;
  bluetooth: boolean;
  navigation: boolean;
  smartConnectivity: boolean;
}>;

export type CarSpecsDto = Partial<{
  driveType: string;
  zeroToHundred: number;
  topSpeed: number;

  personCapacity: number;
  rows: number;
  doors: number;
  bootSpace: number;

  poweredSteering: boolean;
  steeringType: string;

  hasSpareWheel: boolean;

  airbags: number;
  hillAssist: boolean;
  rearViewCamera: boolean;
  parkingSensors: boolean;
  cruiseControl: boolean;

  displaySize: number;
  bluetooth: boolean;
  navigation: boolean;
  smartConnectivity: boolean;
}>;

/**
 * Backend nested details DTO (PUBLIC contract)
 * NOTE: no legacy flat fields like autoStartStop, spare, etc.
 */
export type VehicleDetailsDto = {
  // ===== stable fields =====
  description?: string;
  colorsAvailableJson?: string;
  warrantyYears?: number;
  serviceIntervalKm?: number;

  // ===== nested (primary contract) =====
  engine?: EngineSpecsDto | null;
  ev?: EvSpecsDto | null;
  dimensions?: DimensionsSpecsDto | null;
  dynamics?: DynamicsSpecsDto | null;
  bike?: BikeSpecsDto | null;
  car?: CarSpecsDto | null;

  // ===== legacy flat mirrors (READ-ONLY SUPPORT) =====
  engineType?: string;
  inductionType?: string;
  emission?: string;
  fuelType?: string;

  power?: number;
  powerRpm?: number;
  torque?: number;
  torqueRpm?: number;
  mileage?: number;
  range?: number;

  length?: number;
  width?: number;
  height?: number;
  wheelBase?: number;
  groundClearance?: number;
  weight?: number;

  personCapacity?: number;
  rows?: number;
  doors?: number;
  bootSpace?: number;
  tankSize?: number;

  frontType?: string;
  backType?: string;
  frontBrake?: string;
  backBrake?: string;
  tyreType?: string;
  wheelMaterial?: string;

  specification?: string;
  spare?: string | boolean;
};

/**
 * Backend response for /api/Vehicles/slug/{slug}
 * (core vehicle + nested details + variants)
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
 * Public list cards
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
};

/**
 * Admin/UI "form model" (LEGACY FLAT)
 * VehicleListPage / VehicleForm / VehicleMapper rely on this.
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

  description?: string;
  colorsAvailableJson?: string;

  warrantyYears?: number;
  serviceIntervalKm?: number;

  engineType?: string;
  engineDisplacement?: number;
  fuelType?: string;
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
  wheelBase?: number;
  groundClearance?: number;
  weight?: number;
  turningRadius?: number;

  frontType?: string;
  backType?: string;
  frontBrake?: string;
  backBrake?: string;
  frontSuspension?: string;
  rearSuspension?: string;
  tyreSizeFront?: string;
  tyreSizeBack?: string;
  tyreType?: string;
  wheelMaterial?: string;

  tankSize?: number;
  numberOfGears?: number;

  personCapacity?: number;
  rows?: number;
  doors?: number;
  bootSpace?: number;

  poweredSteering?: string | boolean;
  steeringType?: string;
  spare?: string | boolean;

  airbags?: number;
  hillAssist?: boolean;
  rearViewCamera?: boolean;
  parkingSensors?: boolean;
  cruiseControl?: boolean;

  displaySize?: number;
  bluetooth?: boolean;
  navigation?: boolean;
  smartConnectivity?: boolean;
};
