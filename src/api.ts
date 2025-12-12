import { apiGet } from "./api/client";

export interface VehicleListItem {
  id: number;            
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  category: string;
  transmission: string;
  slug: string;
  imageUrl: string;      
}

const VEHICLES_PATH = "/api/AdminVehicles";

export async function fetchVehicles(): Promise<VehicleListItem[]> {
  return apiGet<VehicleListItem[]>(VEHICLES_PATH);
}
