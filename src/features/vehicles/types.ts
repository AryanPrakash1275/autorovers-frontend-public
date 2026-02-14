export type VehicleType = "bike" | "car";

export type FuelType = "Petrol" | "Diesel" | "EV" | "Hybrid" | string;

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type PublicVehiclesQuery = {
  type: VehicleType;
  q?: string;
  brand?: string;
  category?: string;
  fuelType?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  sort?: "priceAsc" | "priceDesc" | "yearAsc" | "yearDesc" | (string & {});
  page?: number;
  pageSize?: number;
};

export type VariantAddonDto = {
  id: number;
  name: string;
  price: number;
};

export type VehicleVariantDto = {
  id: number;
  name: string;
  slug: string;
  price: number;
  isDefault: boolean;

  isActive?: boolean;

  transmission?: string;
  fuelType?: FuelType | string;

  addons: VariantAddonDto[];
};

export type EngineSpecsDto = Partial<{
  engineType: string;
  engineDisplacement: number;
  inductionType: string;
  emission: string;
  fuelType: FuelType;
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

export type VehicleDetailsDto = {
  description?: string;
  colorsAvailableJson?: string;
  warrantyYears?: number;
  serviceIntervalKm?: number;
  engine?: EngineSpecsDto | null;
  ev?: EvSpecsDto | null;
  dimensions?: DimensionsSpecsDto | null;
  dynamics?: DynamicsSpecsDto | null;
  bike?: BikeSpecsDto | null;
  car?: CarSpecsDto | null;
  engineType?: string;
  inductionType?: string;
  emission?: string;
  fuelType?: FuelType;
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

export type VehicleWithDetailsDto = {
  id: number;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  price?: number;
  category?: string;
  transmission?: string;
  slug?: string;
  imageUrl?: string;
  vehicleType?: VehicleType | string;
  fuelType?: FuelType;
  details?: VehicleDetailsDto | null;
  variants?: VehicleVariantDto[];
};

export type VehicleListItem = {
  id: number;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  price?: number;
  category?: string;
  transmission?: string;
  slug?: string;
  imageUrl?: string;
  vehicleType?: VehicleType | string;
  fuelType?: FuelType;
};

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
  fuelType?: FuelType;
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
