// src/features/vehicles/components/VehicleTable.tsx

import React from "react";
import { Footer } from "../../../shared/ui/Footer";
import type { VehicleListItem } from "../types";
import type { SortDir, SortKey } from "./vehicleListUtils";
import type { CompareState } from "../compareState";
import { getCompareVehicleType } from "../compareState";

interface VehicleTableProps {
  vehicles: VehicleListItem[];
  sortBy: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
  onEdit: (vehicle: VehicleListItem) => void;
  onDelete: (id: number) => void;

  // ✅ comparison wiring
  compare: CompareState;
  onToggleCompare: (v: VehicleListItem) => void;
}

const Th: React.FC<
  React.PropsWithChildren<{
    sortKey?: SortKey;
    activeSortKey: SortKey;
    sortDir: SortDir;
    onSortChange?: (key: SortKey) => void;
  }>
> = ({ children, sortKey, activeSortKey, sortDir, onSortChange }) => {
  const isActive = !!sortKey && sortKey === activeSortKey;

  const handleClick = () => {
    if (sortKey && onSortChange) onSortChange(sortKey);
  };

  return (
    <th
      onClick={handleClick}
      className="table-th"
      style={{ cursor: sortKey ? "pointer" : "default" }}
    >
      {children}
      {isActive && (
        <span className="sort-indicator">{sortDir === "asc" ? "▲" : "▼"}</span>
      )}
    </th>
  );
};

const Td: React.FC<React.PropsWithChildren> = ({ children }) => (
  <td className="table-td">{children}</td>
);

function formatPrice(value: number | null | undefined) {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return `₹${n.toLocaleString()}`;
}

function hasSlug(v: VehicleListItem): boolean {
  return typeof v.slug === "string" && v.slug.trim().length > 0;
}

export function VehicleTable({
  vehicles,
  sortBy,
  sortDir,
  onSortChange,
  onEdit,
  onDelete,
  compare,
  onToggleCompare,
}: VehicleTableProps) {
  if (vehicles.length === 0) {
    return <p className="muted">No vehicles found.</p>;
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {/* ✅ Compare column */}
            <Th activeSortKey={sortBy} sortDir={sortDir}>
              Compare
            </Th>

            <Th activeSortKey={sortBy} sortDir={sortDir}>
              Id
            </Th>

            <Th
              sortKey="brand"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Brand
            </Th>

            <Th
              sortKey="model"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Model
            </Th>

            <Th
              sortKey="variant"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Variant
            </Th>

            <Th
              sortKey="year"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Year
            </Th>

            <Th
              sortKey="price"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Price
            </Th>

            <Th
              sortKey="category"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Category
            </Th>

            <Th
              sortKey="transmission"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Transmission
            </Th>

            <Th
              sortKey="slug"
              activeSortKey={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            >
              Slug
            </Th>

            <Th activeSortKey={sortBy} sortDir={sortDir}>
              Actions
            </Th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map((v) => {
            const selected = compare.items.some((x) => x.id === v.id);

            const lockedType = compare.vehicleType;
            const incomingType = getCompareVehicleType(v);

            const typeMismatch =
              Boolean(lockedType) &&
              Boolean(incomingType) &&
              incomingType !== lockedType;

            // ✅ hard rule: compare requires slug (ComparePage loads by slug)
            const missingSlug = !hasSlug(v);

            // ✅ if already selected, allow removing even if other rules would block
            const disabled =
              !selected && (missingSlug || !incomingType || compare.items.length >= 4 || typeMismatch);

            const title = selected
              ? "Remove from compare"
              : missingSlug
              ? "Cannot compare (missing slug)"
              : !incomingType
              ? "Cannot compare (unknown vehicle type)"
              : compare.items.length >= 4
              ? "Max 4 vehicles"
              : typeMismatch
              ? "Only same vehicle type allowed"
              : "Add to compare";

            return (
              <tr key={v.id}>
                {/* ✅ Compare toggle */}
                <Td>
                  <button
                    className={`btn btn-sm ${selected ? "" : "btn-ghost"}`}
                    disabled={disabled}
                    onClick={() => onToggleCompare(v)}
                    title={title}
                    aria-disabled={disabled}
                  >
                    {selected ? "✓" : "+"}
                  </button>
                </Td>

                <Td>{v.id}</Td>
                <Td>{v.brand ?? ""}</Td>
                <Td>{v.model ?? ""}</Td>
                <Td>{v.variant ?? ""}</Td>
                <Td>{v.year ?? ""}</Td>
                <Td>{formatPrice(v.price)}</Td>
                <Td>{v.category ?? ""}</Td>
                <Td>{v.transmission ?? ""}</Td>

                {/* long slug safe */}
                <Td>
                  <span className="break-anywhere" title={v.slug ?? ""}>
                    {v.slug ?? ""}
                  </span>
                </Td>

                <Td>
                  <button className="btn btn-sm" onClick={() => onEdit(v)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(v.id)}
                    style={{ marginLeft: "0.4rem" }}
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Footer />
    </div>
  );
}
