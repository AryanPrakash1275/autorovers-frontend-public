//LIST ITEM returned by list endpoints (admin/public).
// //Trying to keep this shape tolerant: APIs often return nulls or omit fields.

export type VehicleListItem = {
  id: number;
  vehicleType?: string | null; // some rows may be missing, or casing may vary
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: number | null;
  price?: number | null;
  category?: string | null;
  transmission?: string | null;
  slug?: string | null;
  imageUrl?: string | null;

  // Optional fields for cards only (if present)
  power?: number | null;
  torque?: number | null;
};


//DETAILS DTO returned under `details` from backend.
//Partial because backend may omit fields depending on vehicle type.
 
export type VehicleDetailsDto = Partial<{
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


//Combined DTO returned by "vehicle with details" endpoints.
 
export type VehicleWithDetailsDto = VehicleListItem & {
  details?: VehicleDetailsDto;
};


//FULL VEHICLE used by UI forms/pages after mapping defaults.

export type Vehicle = {
  id: number;
  vehicleType: string; // "Bike" | "Car"
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  category: string;
  transmission: string;
  slug: string;
  imageUrl?: string | null;

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
};
