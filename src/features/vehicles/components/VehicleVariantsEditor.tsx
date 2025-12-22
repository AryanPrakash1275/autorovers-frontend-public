import { useEffect, useMemo, useState } from "react";
import type { VehicleVariantDto } from "../types";
import { getAdminVariants, updateAdminVariant } from "../api";

type Props = {
  vehicleId: number;
};

type Row = VehicleVariantDto & {
  dirty?: boolean;
};

function safeMoney(v: unknown): number {
  const n =
    typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : Number(v);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : Math.trunc(n);
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function VehicleVariantsEditor({ vehicleId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirtyCount = useMemo(() => rows.filter((r) => r.dirty).length, [rows]);

  // =========================
  // Load variants
  // =========================
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await getAdminVariants(vehicleId);
        if (!alive) return;

        setRows(list.map((v) => ({ ...v, dirty: false })));
      } catch (err: unknown) {
        if (alive) setError(toMessage(err, "Failed to load variants"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [vehicleId]);

  // =========================
  // Local mutations
  // =========================
  function setDefault(variantId: number) {
    setRows((prev) =>
      prev.map((r) => {
        const nextDefault = r.id === variantId;
        if (r.isDefault === nextDefault) return r;
        return { ...r, isDefault: nextDefault, dirty: true };
      })
    );
  }

  function setActive(variantId: number, active: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === variantId ? { ...r, isActive: active, dirty: true } : r))
    );
  }

  function setPrice(variantId: number, price: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === variantId ? { ...r, price: safeMoney(price), dirty: true } : r
      )
    );
  }

  // =========================
  // Save
  // =========================
  async function saveChanges() {
    const dirty = rows.filter((r) => r.dirty);
    if (dirty.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      for (const r of dirty) {
        await updateAdminVariant(r.id, {
          exShowroomPrice: safeMoney(r.price),
          isDefault: r.isDefault,
          isActive: !!r.isActive,
        });
      }

      // Reload to respect backend truth (single default, etc.)
      const fresh = await getAdminVariants(vehicleId);
      setRows(fresh.map((v) => ({ ...v, dirty: false })));
    } catch (err: unknown) {
      setError(toMessage(err, "Failed to save variants"));
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // Render
  // =========================
  return (
    <div className="admin-variants">
      <div className="admin-variants-head">
        <h3 className="form-section-title">Variants</h3>

        <button
          type="button"
          className="btn"
          disabled={saving || dirtyCount === 0}
          onClick={saveChanges}
        >
          {saving ? "Saving..." : dirtyCount === 0 ? "Saved" : `Save (${dirtyCount})`}
        </button>
      </div>

      {loading && <div className="muted">Loading variants…</div>}
      {error && <div className="field-error">{error}</div>}

      {!loading && rows.length === 0 && (
        <div className="muted">No variants found for this vehicle.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="table">
          <div className="table-row table-head">
            <div>Name</div>
            <div>Price (₹)</div>
            <div>Default</div>
            <div>Active</div>
          </div>

          {rows.map((r) => (
            <div key={r.id} className={`table-row ${r.dirty ? "is-dirty" : ""}`}>
              <div>{r.name}</div>

              <div>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={safeMoney(r.price)}
                  onChange={(e) => setPrice(r.id, Number(e.target.value))}
                />
              </div>

              <div>
                <input
                  type="radio"
                  name="defaultVariant"
                  checked={!!r.isDefault}
                  onChange={() => setDefault(r.id)}
                />
              </div>

              <div>
                <input
                  type="checkbox"
                  checked={!!r.isActive}
                  onChange={(e) => setActive(r.id, e.target.checked)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
