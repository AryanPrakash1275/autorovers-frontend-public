import { Footer } from "../../../public/Footer";
import type { VehicleListItem } from "../types";
import type { SortDir, SortKey } from "./vehicleListUtils.ts";

interface VehicleTableProps {
  vehicles: VehicleListItem[];
  sortBy: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
  onEdit: (vehicle: VehicleListItem) => void;
  onDelete: (id: number) => void;
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

export function VehicleTable({
  vehicles,
  sortBy,
  sortDir,
  onSortChange,
  onEdit,
  onDelete,
}: VehicleTableProps) {
  if (vehicles.length === 0) {
    return <p className="muted">No vehicles found.</p>;
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
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
          {vehicles.map((v) => (
            <tr key={v.id}>
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
          ))}
        </tbody>
      </table>

      <Footer />
    </div>
  );
}
