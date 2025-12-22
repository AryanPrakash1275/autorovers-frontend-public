import { useState, useMemo } from "react";
import { useVehicles } from "../hooks/useVehicles";
import { VehicleTable } from "./VehicleTable";
import type { Vehicle, VehicleListItem } from "../types";
import { VehicleForm } from "./VehicleForm";
import {
  createVehicle,
  updateVehicle,
  deleteVehicleById,
  getVehicleWithDetails,
  updateVehicleDetails,
} from "../api";

import {
  applyFilters,
  applySort,
  buildBrandOptions,
  buildTransmissionOptions,
  buildYearOptions,
  hasAnyFilters,
  type SortDir,
  type SortKey,
  type VehicleTypeFilter,
} from "./vehicleListUtils";

import { mapFullVehicleToForm } from "./vehicleMapper";

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function VehicleListPage() {
  const { vehicles, loading, error, reload } = useVehicles();

  const [query, setQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [transFilter, setTransFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleSortChange = (key: SortKey) => {
    setSortBy((prevSortBy) => {
      setSortDir((prevSortDir) => {
        if (prevSortBy === key) {
          return prevSortDir === "asc" ? "desc" : "asc";
        }
        return "asc";
      });

      return key;
    });
  };

  const brandOptions = useMemo(() => buildBrandOptions(vehicles), [vehicles]);

  const transmissionOptions = useMemo(
    () => buildTransmissionOptions(vehicles),
    [vehicles]
  );

  const yearOptions = useMemo(() => buildYearOptions(vehicles), [vehicles]);

  const visibleVehicles = useMemo(() => {
    const filtered = applyFilters(vehicles, {
      query,
      typeFilter,
      brandFilter,
      transFilter,
      yearFilter,
    });

    return applySort(filtered, sortBy, sortDir);
  }, [
    vehicles,
    query,
    typeFilter,
    brandFilter,
    transFilter,
    yearFilter,
    sortBy,
    sortDir,
  ]);

  const hasFilters = hasAnyFilters({
    query,
    typeFilter,
    brandFilter,
    transFilter,
    yearFilter,
  });

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setBrandFilter("all");
    setTransFilter("all");
    setYearFilter("all");
  }

  function openCreate() {
    setMode("create");
    setEditing(null);
    setIsPanelOpen(true);
    setActionError(null);
  }

  async function openEdit(row: VehicleListItem) {
    try {
      setMode("edit");
      setIsPanelOpen(true);
      setActionError(null);
      setEditLoading(true);

      const full = await getVehicleWithDetails(row.id);
      setEditing(mapFullVehicleToForm(full, row));
    } catch (err: unknown) {
      setActionError(toMessage(err, "Failed to load vehicle details"));
    } finally {
      setEditLoading(false);
    }
  }

  function closePanel() {
    setIsPanelOpen(false);
    setEditing(null);
  }

  async function handleSubmit(data: Vehicle) {
    try {
      setActionError(null);

      if (mode === "create") {
        await createVehicle(data);
      } else if (mode === "edit" && editing?.id) {
        await updateVehicle(editing.id, data);

        // ✅ NESTED DETAILS PAYLOAD (matches backend)
        await updateVehicleDetails(editing.id, {
          description: data.description,
          colorsAvailableJson: data.colorsAvailableJson,
          warrantyYears: data.warrantyYears,
          serviceIntervalKm: data.serviceIntervalKm,

          engine: {
            engineType: data.engineType,
            engineDisplacement: data.engineDisplacement,
            fuelType: data.fuelType,
            inductionType: data.inductionType,
            emission: data.emission,
            power: data.power,
            powerRpm: data.powerRpm,
            torque: data.torque,
            torqueRpm: data.torqueRpm,
            mileage: data.mileage,
            range: data.range,
          },

          dimensions: {
            length: data.length,
            width: data.width,
            height: data.height,
            weight: data.weight,
            groundClearance: data.groundClearance,
            wheelBase: data.wheelBase,
          },

          dynamics: {
            frontType: data.frontType,
            backType: data.backType,
            frontBrake: data.frontBrake,
            backBrake: data.backBrake,
            tyreSizeFront: data.tyreSizeFront,
            tyreSizeBack: data.tyreSizeBack,
            tyreType: data.tyreType,
            wheelMaterial: data.wheelMaterial,
          },

          bike: {
            tankSize: data.tankSize,
          },

          car: {
            personCapacity: data.personCapacity,
            rows: data.rows,
            doors: data.doors,
            bootSpace: data.bootSpace,
          },

          // optional legacy
          autoStartStop: data.autoStartStop,
          poweredSteering: data.poweredSteering,
          spare: data.spare,
          specification: data.specification,
        });
      }

      await reload();
      closePanel();
    } catch (err: unknown) {
      setActionError(toMessage(err, "Action failed"));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this vehicle?")) return;

    try {
      setActionError(null);
      await deleteVehicleById(id);
      await reload();
    } catch (err: unknown) {
      setActionError(toMessage(err, "Delete failed"));
    }
  }

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>Error: {error}</p>;

  return (
    <div className="admin-main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="page-subtitle">Search, sort and manage Autorovers vehicle catalog.</p>
        </div>
        <button className="btn" onClick={openCreate}>
          + Add Vehicle
        </button>
      </div>

      <div className="admin-filters">
        <div className="admin-filters-row">
          <input
            type="text"
            placeholder="Search by brand, model, variant, slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            style={{ flex: "1 1 280px" }}
          />

          <select
            className="search-input"
            style={{ width: 160 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as VehicleTypeFilter)}
          >
            <option value="all">All types</option>
            <option value="Bike">Bike</option>
            <option value="Car">Car</option>
          </select>

          <select
            className="search-input"
            style={{ width: 180 }}
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="all">All brands</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            className="search-input"
            style={{ width: 180 }}
            value={transFilter}
            onChange={(e) => setTransFilter(e.target.value)}
          >
            <option value="all">All transmissions</option>
            {transmissionOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="search-input"
            style={{ width: 140 }}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button className="btn btn-ghost" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      {visibleVehicles.length === 0 ? (
        <div
          className="alert"
          style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            No vehicles match your filters.
          </div>
          <div className="muted" style={{ marginBottom: 10 }}>
            Try clearing filters or changing your search.
          </div>
          {hasFilters && (
            <button className="btn btn-ghost" onClick={clearFilters}>
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <VehicleTable
          vehicles={visibleVehicles}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <div className={`slide-over ${isPanelOpen ? "is-open" : ""}`}>
        <div className="slide-over-backdrop" onClick={closePanel} />
        <div className="slide-over-panel">
          {editLoading && (
            <p className="muted" style={{ marginBottom: "0.5rem" }}>
              Loading full specs…
            </p>
          )}

          {isPanelOpen && (
            <VehicleForm
              initial={editing}
              mode={mode}
              onSubmit={handleSubmit}
              onCancel={closePanel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
