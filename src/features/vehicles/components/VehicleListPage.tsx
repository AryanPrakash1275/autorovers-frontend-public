// src/features/vehicles/components/VehicleListPage.tsx
// FULL FILE — Filters upgraded (price min/max + hasSlug + hasImage) + Compare CTA

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "../hooks/useVehicles";
import type { Vehicle, VehicleListItem } from "../types";

import { VehicleTable } from "./VehicleTable";
import { VehicleForm } from "./VehicleForm";

import {
  createVehicle,
  updateVehicle,
  deleteVehicleById,
  getVehicleWithDetails,
  updateVehicleDetails,
  type CreateVehicleRequest,
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
import { loadCompare, toggleCompare } from "../compareState";

/* =========================
   Helpers
   ========================= */

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function sOrNull(v?: string) {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

function nOrNull(v?: number) {
  return typeof v === "number" && Number.isFinite(v) && v !== 0 ? v : null;
}

function hasSlug(row: VehicleListItem): boolean {
  return typeof row.slug === "string" && row.slug.trim().length > 0;
}

function hasImage(row: VehicleListItem): boolean {
  return typeof row.imageUrl === "string" && row.imageUrl.trim().length > 0;
}

function parseNumOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function buildCreateReq(data: Vehicle): CreateVehicleRequest {
  return {
    brand: data.brand,
    model: data.model,
    variant: sOrNull(data.variant),
    year: data.year,
    price: data.price,
    description: sOrNull(data.description),

    category: data.category,
    transmission: data.transmission,
    slug: sOrNull(data.slug),
    imageUrl: sOrNull(data.imageUrl),
    vehicleType: sOrNull(String(data.vehicleType ?? "")),

    engine: {
      engineType: sOrNull(data.engineType),
      engineDisplacement: nOrNull(data.engineDisplacement),
      inductionType: sOrNull(data.inductionType),
      emission: sOrNull(data.emission),
      power: nOrNull(data.power),
      powerRpm: nOrNull(data.powerRpm),
      torque: nOrNull(data.torque),
      torqueRpm: nOrNull(data.torqueRpm),
      mileage: nOrNull(data.mileage),
      range: nOrNull(data.range),
      fuelType: sOrNull(data.fuelType),
    },

    dimensions: {
      length: nOrNull(data.length),
      width: nOrNull(data.width),
      height: nOrNull(data.height),
      wheelBase: nOrNull(data.wheelBase),
      groundClearance: nOrNull(data.groundClearance),
      weight: nOrNull(data.weight),
    },

    dynamics: {
      frontType: sOrNull(data.frontType),
      backType: sOrNull(data.backType),
      frontBrake: sOrNull(data.frontBrake),
      backBrake: sOrNull(data.backBrake),
      tyreSizeFront: sOrNull(data.tyreSizeFront),
      tyreSizeBack: sOrNull(data.tyreSizeBack),
      tyreType: sOrNull(data.tyreType),
      wheelMaterial: sOrNull(data.wheelMaterial),
    },

    bike: { tankSize: nOrNull(data.tankSize) },

    car: {
      personCapacity: nOrNull(data.personCapacity),
      rows: nOrNull(data.rows),
      doors: nOrNull(data.doors),
      bootSpace: nOrNull(data.bootSpace),
    },

    colorsAvailableJson: sOrNull(data.colorsAvailableJson),
    warrantyYears: nOrNull(data.warrantyYears),
    serviceIntervalKm: nOrNull(data.serviceIntervalKm),
  };
}

/* =========================
   Component
   ========================= */

export function VehicleListPage() {
  const navigate = useNavigate();
  const { vehicles, loading, error, reload } = useVehicles();

  const [query, setQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [transFilter, setTransFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  // ✅ NEW filters
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [onlyHasSlug, setOnlyHasSlug] = useState(false);
  const [onlyHasImage, setOnlyHasImage] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ✅ Compare state
  const [compare, setCompare] = useState(loadCompare());

  const handleSortChange = (key: SortKey) => {
    setSortBy((prevSortBy) => {
      setSortDir((prevSortDir) => {
        if (prevSortBy === key) return prevSortDir === "asc" ? "desc" : "asc";
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

  const priceBounds = useMemo(() => {
    const prices = vehicles
      .map((v) => (typeof v.price === "number" ? v.price : 0))
      .filter((p) => Number.isFinite(p) && p > 0)
      .sort((a, b) => a - b);

    return {
      min: prices.length ? prices[0] : 0,
      max: prices.length ? prices[prices.length - 1] : 0,
    };
  }, [vehicles]);

  const visibleVehicles = useMemo(() => {
    const base = applyFilters(vehicles, {
      query,
      typeFilter,
      brandFilter,
      transFilter,
      yearFilter,
    });

    const min = parseNumOrNull(minPrice);
    const max = parseNumOrNull(maxPrice);

    const after = base.filter((v) => {
      if (onlyHasSlug && !hasSlug(v)) return false;
      if (onlyHasImage && !hasImage(v)) return false;

      const p =
        typeof v.price === "number" && Number.isFinite(v.price) ? v.price : 0;
      if (min !== null && p < min) return false;
      if (max !== null && p > max) return false;

      return true;
    });

    return applySort(after, sortBy, sortDir);
  }, [
    vehicles,
    query,
    typeFilter,
    brandFilter,
    transFilter,
    yearFilter,
    minPrice,
    maxPrice,
    onlyHasSlug,
    onlyHasImage,
    sortBy,
    sortDir,
  ]);

  const baseHasFilters = hasAnyFilters({
    query,
    typeFilter,
    brandFilter,
    transFilter,
    yearFilter,
  });

  const extraHasFilters =
    minPrice.trim().length > 0 ||
    maxPrice.trim().length > 0 ||
    onlyHasSlug ||
    onlyHasImage;

  const hasFilters = baseHasFilters || extraHasFilters;

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setBrandFilter("all");
    setTransFilter("all");
    setYearFilter("all");

    setMinPrice("");
    setMaxPrice("");
    setOnlyHasSlug(false);
    setOnlyHasImage(false);
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

  function onToggleCompare(row: VehicleListItem) {
    const alreadySelected = compare.items.some((x) => x.id === row.id);
    if (alreadySelected) {
      const next = toggleCompare(compare, row);
      setActionError(null);
      setCompare(next);
      return;
    }

    if (!hasSlug(row)) {
      setActionError("This vehicle cannot be compared (missing slug).");
      return;
    }

    const next = toggleCompare(compare, row);

    if (next.items.length === compare.items.length) {
      setActionError(
        "Cannot add to compare (type mismatch or unable to infer type from category)."
      );
      return;
    }

    setActionError(null);
    setCompare(next);
  }

  async function handleSubmit(data: Vehicle) {
    try {
      setActionError(null);

      if (mode === "create") {
        if (!data.fuelType || data.fuelType.trim().length === 0) {
          setActionError(
            "Fuel type is required (e.g., Petrol / Diesel / Electric)."
          );
          return;
        }

        await createVehicle(buildCreateReq(data));
      } else if (mode === "edit" && editing?.id) {
        await updateVehicle(editing.id, data);

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

          bike: { tankSize: data.tankSize },

          car: {
            personCapacity: data.personCapacity,
            rows: data.rows,
            doors: data.doors,
            bootSpace: data.bootSpace,
          },
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
  if (error)
    return (
      <p style={{ padding: "2rem", color: "red" }}>
        Error: {error}
      </p>
    );

  return (
    <div className="admin-main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="page-subtitle">
            Search, sort and manage Autorovers vehicle catalog.
          </p>
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
        </div>

        {/* ✅ NEW FILTER ROW */}
        <div className="admin-filters-row" style={{ marginTop: 10 }}>
          <input
            type="number"
            className="search-input"
            style={{ width: 160 }}
            placeholder={priceBounds.min ? `Min ₹ (eg ${priceBounds.min})` : "Min ₹"}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            className="search-input"
            style={{ width: 160 }}
            placeholder={priceBounds.max ? `Max ₹ (eg ${priceBounds.max})` : "Max ₹"}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <label
            className="muted"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              type="checkbox"
              checked={onlyHasSlug}
              onChange={(e) => setOnlyHasSlug(e.target.checked)}
            />
            Has slug
          </label>

          <label
            className="muted"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              type="checkbox"
              checked={onlyHasImage}
              onChange={(e) => setOnlyHasImage(e.target.checked)}
            />
            Has image
          </label>

          {hasFilters && (
            <button className="btn btn-ghost" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      {/* ✅ Compare CTA bar */}
      {compare.items.length >= 2 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            marginBottom: 12,
            borderRadius: 10,
            background: "#0f172a",
            color: "white",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {compare.items.length} vehicles selected for comparison
          </div>

          <button
            className="btn"
            style={{
              background: "white",
              color: "#0f172a",
              fontWeight: 700,
            }}
            onClick={() => navigate("/compare")}
          >
            Compare →
          </button>
        </div>
      )}

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
          compare={compare}
          onToggleCompare={onToggleCompare}
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
