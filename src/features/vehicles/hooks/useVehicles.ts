import { useCallback, useEffect, useRef, useState } from "react";
import type { VehicleListItem } from "../types";
import { getVehicles } from "../api";

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);


  const load = useCallback(async () => {
    try {
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      const data = await getVehicles(); 

      if (isMounted.current) {
        setVehicles(data);
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(toMessage(err, "Failed to load vehicles"));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    vehicles,
    loading,
    error,
    reload: load,
  };
}
