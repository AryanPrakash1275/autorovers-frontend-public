import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPublicVehicleBySlug, getPublicVariantBySlug } from "../../features/vehicles/api";
import type { VehicleVariantDto, VehicleWithDetailsDto } from "../../features/vehicles/types";

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function formatINR(n?: number | null): string {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "—";
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function safeNumber(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function normText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function VariantDetailsPage() {
  const navigate = useNavigate();
  const { slug, variantSlug } = useParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState<VehicleWithDetailsDto | null>(null);
  const [variant, setVariant] = useState<VehicleVariantDto | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Missing vehicle slug.");
      setLoading(false);
      return;
    }
    if (!variantSlug) {
      setError("Missing variant slug.");
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [veh, vr] = await Promise.all([
          getPublicVehicleBySlug(slug),
          getPublicVariantBySlug(slug, variantSlug),
        ]);

        if (!alive) return;

        setVehicle(veh);
        setVariant(vr);
      } catch (e: unknown) {
        if (!alive) return;
        setError(toMessage(e, "Failed to load variant."));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug, variantSlug]);

  const vehicleTitle = useMemo(() => {
    const b = vehicle?.brand?.trim() ?? "";
    const m = vehicle?.model?.trim() ?? "";
    const head = [b, m].filter(Boolean).join(" ");
    return head || "Vehicle";
  }, [vehicle]);

  const pricing = useMemo(() => {
    const base = safeNumber(variant?.price);
    const addons = Array.isArray(variant?.addons) ? variant.addons : [];
    const addonsTotal = addons.reduce((sum, a) => sum + safeNumber(a.price), 0);
    const finalPrice = base > 0 ? base + addonsTotal : 0;
    return { base, addons, addonsTotal, finalPrice };
  }, [variant]);

  if (loading) return <div style={{ padding: "1.25rem" }}>Loading…</div>;
  if (error) return <div style={{ padding: "1.25rem", color: "crimson" }}>{error}</div>;
  if (!slug) return <div style={{ padding: "1.25rem" }}>Not found.</div>;

  if (!vehicle) {
    return <div style={{ padding: "1.25rem" }}>Vehicle not found.</div>;
  }

  if (!variant) {
    return (
      <div style={{ padding: "1.25rem", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 12, fontWeight: 900, fontSize: 18 }}>{vehicleTitle}</div>
        <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" }}>
          Variant not found.
        </div>
        <div style={{ marginTop: 12 }}>
          <Link to={`/vehicles/${encodeURIComponent(slug)}/variants`}>← Back to variants</Link>
        </div>
      </div>
    );
  }

  const variantName = normText(variant.name) || "Variant";
  const fuel = normText(variant.fuelType);
  const transmission = normText(variant.transmission);

  return (
    <div style={{ padding: "1.25rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10,
            padding: "8px 10px",
            background: "white",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{variantName}</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>{vehicleTitle}</div>
        </div>

        <Link
          to={`/vehicles/${encodeURIComponent(slug)}/variants`}
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10,
            padding: "8px 10px",
            background: "white",
            textDecoration: "none",
            color: "inherit",
            fontWeight: 800,
          }}
        >
          Variants →
        </Link>
      </div>

      <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 16, padding: 16, background: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Base (ex-showroom)</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{formatINR(pricing.base)}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, opacity: 0.85 }}>
              {fuel ? <span>Fuel: <strong>{fuel}</strong></span> : null}
              {transmission ? <span>Transmission: <strong>{transmission}</strong></span> : null}
            </div>
          </div>

          {variant.isDefault ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "rgba(0,0,0,0.03)",
                height: "fit-content",
              }}
            >
              Default variant
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Add-ons</div>

          {pricing.addons.length > 0 ? (
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {pricing.addons.map((a, idx) => {
                const name = normText(a.name) || "Addon";
                const key = a.id != null ? String(a.id) : `${name}-${idx}`;
                const price = safeNumber(a.price);

                return (
                  <div
                    key={key}
                    style={{
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{name}</div>
                    <div style={{ opacity: 0.75, marginTop: 6 }}>{formatINR(price)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>No add-ons for this variant.</div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid rgba(0,0,0,0.08)",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Add-ons total</div>
            <div style={{ fontWeight: 900 }}>{formatINR(pricing.addonsTotal)}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Final price (base + add-ons)</div>
            <div style={{ fontSize: 22, fontWeight: 1000 }}>{formatINR(pricing.finalPrice)}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            to={`/vehicles/${encodeURIComponent(slug)}`}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 12,
              padding: "10px 12px",
              background: "white",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 900,
            }}
          >
            Vehicle page →
          </Link>

          <Link
            to={`/vehicles/${encodeURIComponent(slug)}/variants`}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 12,
              padding: "10px 12px",
              background: "white",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 900,
            }}
          >
            All variants →
          </Link>
        </div>
      </div>
    </div>
  );
}
