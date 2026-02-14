// src/features/vehicles/components/VehicleVariantsEditor.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FuelType, VehicleVariantDto } from "../types";
import { createAdminVariant, getAdminVariants, updateAdminVariant } from "../api";

type Props = {
  vehicleId: number;
};

type AdminVariantRow = {
  id: number;
  name: string;
  slug?: string | null;
  price?: number | null; // UI-friendly price
  fuelType?: FuelType | string | null;
  transmission?: string | null;
  isDefault: boolean;
  isActive: boolean;
  dirty: boolean;
};

// tolerate backend returning legacy fields (if any) without breaking TS
type VariantWire = Partial<VehicleVariantDto> & {
  exShowroomPrice?: number | null;
};

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function safeMoney(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.trunc(n);
}

function normalizeRows(raw: unknown[]): AdminVariantRow[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((v) => {
    const r = (v ?? {}) as VariantWire;

    // Response DTO has `price` (per your types.ts).
    // If backend ever returns `exShowroomPrice`, we also accept it.
    const price =
      typeof r.price === "number"
        ? r.price
        : typeof r.exShowroomPrice === "number"
        ? r.exShowroomPrice
        : null;

    return {
      id: Number(r.id ?? 0),
      name: String(r.name ?? ""),
      slug: typeof r.slug === "string" ? r.slug : null,
      price,
      fuelType: r.fuelType ?? null,
      transmission: r.transmission ?? null,
      isDefault: !!r.isDefault,
      isActive: r.isActive === undefined ? true : !!r.isActive,
      dirty: false,
    };
  });
}

export function VehicleVariantsEditor({ vehicleId }: Props) {
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminVariantRow[]>([]);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [newIsActive, setNewIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminVariants(vehicleId);
      setRows(normalizeRows(res as unknown[]));
    } catch (e: unknown) {
      setError(toMessage(e, "Failed to load variants."));
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirtyCount = useMemo(() => rows.filter((r) => r.dirty).length, [rows]);

  function setRow(id: number, patch: Partial<AdminVariantRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, ...patch, dirty: true };
      })
    );
  }

  async function saveRow(r: AdminVariantRow) {
    if (savingIds.has(r.id)) return;

    setSavingIds((prev) => new Set(prev).add(r.id));
    setError(null);

    try {
      await updateAdminVariant(r.id, {
        name: r.name.trim(),
        exShowroomPrice: safeMoney(r.price ?? 0),
        isDefault: !!r.isDefault,
        isActive: !!r.isActive,
      });

      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, dirty: false } : x)));
    } catch (e: unknown) {
      setError(toMessage(e, "Failed to save variant."));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(r.id);
        return next;
      });
    }
  }

  async function addVariant() {
    const name = newName.trim();
    if (!name) {
      setError("Variant name is required.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createAdminVariant(vehicleId, {
        name,
        exShowroomPrice: safeMoney(newPrice),
        isDefault: newIsDefault,
        isActive: newIsActive,
      });

      setNewName("");
      setNewPrice(0);
      setNewIsDefault(false);
      setNewIsActive(true);

      await load();
    } catch (e: unknown) {
      setError(toMessage(e, "Failed to create variant."));
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="muted">Loading variants…</div>;

  return (
    <div className="admin-variants">
      <div className="admin-variants-head">
        <div>
          <div style={{ fontWeight: 800 }}>Variants</div>
          <div className="muted" style={{ marginTop: 2 }}>
            Manage price / default / active. {dirtyCount > 0 ? `${dirtyCount} unsaved` : ""}
          </div>
        </div>

        <button className="btn btn-ghost" type="button" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "1.4fr 1fr 0.7fr 0.7fr",
            alignItems: "end",
          }}
        >
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Variant name
            </div>
            <input
              className="search-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. VXi AT"
            />
          </div>

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Ex-showroom (₹)
            </div>
            <input
              className="search-input"
              type="number"
              min={0}
              value={safeMoney(newPrice)}
              onChange={(e) => setNewPrice(Number(e.target.value))}
            />
          </div>

          <label className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={newIsDefault} onChange={(e) => setNewIsDefault(e.target.checked)} />
            Default
          </label>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={newIsActive} onChange={(e) => setNewIsActive(e.target.checked)} />
              Active
            </label>

            <button type="button" className="btn" onClick={addVariant} disabled={creating}>
              {creating ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      <div className="variants-table">
        <div className="variants-row variants-head">
          <div>Name</div>
          <div>Price (₹)</div>
          <div className="variants-center">Default</div>
          <div className="variants-center">Actions</div>
        </div>

        {rows.length === 0 ? (
          <div className="variants-row">
            <div className="muted" style={{ gridColumn: "1 / -1" }}>
              No variants yet. Add one above.
            </div>
          </div>
        ) : (
          rows.map((r) => {
            const isSaving = savingIds.has(r.id);

            return (
              <div key={r.id} className={`variants-row ${r.dirty ? "is-dirty" : ""}`}>
                <div className="variants-name">
                  <input
                    className="variants-input"
                    value={r.name}
                    onChange={(e) => setRow(r.id, { name: e.target.value })}
                    placeholder="Variant name"
                  />
                  <div className="muted" style={{ marginTop: 4 }}>
                    {r.slug ? `slug: ${r.slug}` : ""}
                    {r.fuelType ? ` • fuel: ${String(r.fuelType)}` : ""}
                    {r.transmission ? ` • trans: ${String(r.transmission)}` : ""}
                    {!r.isActive ? " • inactive" : ""}
                  </div>
                </div>

                <div>
                  <input
                    className="variants-input"
                    type="number"
                    min={0}
                    value={safeMoney(r.price ?? 0)}
                    onChange={(e) => setRow(r.id, { price: Number(e.target.value) })}
                  />
                </div>

                <div className="variants-center">
                  <input
                    type="checkbox"
                    checked={!!r.isDefault}
                    onChange={(e) => setRow(r.id, { isDefault: e.target.checked })}
                  />
                </div>

                <div className="variants-center" style={{ gap: 10 }}>
                  <label
                    className="muted"
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                    title="Active on public site"
                  >
                    <input
                      type="checkbox"
                      checked={!!r.isActive}
                      onChange={(e) => setRow(r.id, { isActive: e.target.checked })}
                    />
                    Active
                  </label>

                  <button type="button" className="btn btn-sm" onClick={() => saveRow(r)} disabled={!r.dirty || isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
