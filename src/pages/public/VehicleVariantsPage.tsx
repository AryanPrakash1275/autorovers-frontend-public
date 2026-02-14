import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPublicVehicleBySlug } from "../../features/vehicles/api";
import type { VehicleVariantDto, VehicleWithDetailsDto } from "../../features/vehicles/types";

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function slugifyVariantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatINR(n?: number | null): string {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "—";
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function norm(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function uniqSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getFuelType(v: VehicleVariantDto): string {
  return norm(v.fuelType);
}

function getTransmission(v: VehicleVariantDto): string {
  return norm(v.transmission);
}

function getVariantSlug(v: VehicleVariantDto): string {
  const fromDto = typeof v.slug === "string" ? v.slug.trim() : "";
  if (fromDto) return fromDto;
  const name = v.name?.trim() || "";
  return slugifyVariantName(name);
}

export function VehicleVariantsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug ?? "";

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VehicleWithDetailsDto | null>(null);

  const [q, setQ] = useState("");
  const [onlyDefault, setOnlyDefault] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc" | "name_asc">("default");
  const [fuel, setFuel] = useState<string>("all");
  const [transmission, setTransmission] = useState<string>("all");

  useEffect(() => {
    if (!slug) {
      setError("Missing vehicle slug.");
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPublicVehicleBySlug(slug);
        if (!alive) return;
        setData(res);
      } catch (e: unknown) {
        if (!alive) return;
        setError(toMessage(e, "Failed to load variants."));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  const title = useMemo(() => {
    const b = data?.brand?.trim() ?? "";
    const m = data?.model?.trim() ?? "";
    const head = [b, m].filter(Boolean).join(" ");
    return head || "Vehicle";
  }, [data]);

  const variants = useMemo<VehicleVariantDto[]>(() => {
    const list = data?.variants ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const fuelOptions = useMemo(() => {
    const vals = variants.map(getFuelType).filter(Boolean);
    return uniqSorted(vals);
  }, [variants]);

  const transmissionOptions = useMemo(() => {
    const vals = variants.map(getTransmission).filter(Boolean);
    return uniqSorted(vals);
  }, [variants]);

  useEffect(() => {
    if (fuel !== "all" && fuelOptions.length > 0 && !fuelOptions.includes(norm(fuel))) setFuel("all");
  }, [fuel, fuelOptions]);

  useEffect(() => {
    if (
      transmission !== "all" &&
      transmissionOptions.length > 0 &&
      !transmissionOptions.includes(norm(transmission))
    ) {
      setTransmission("all");
    }
  }, [transmission, transmissionOptions]);

  const stats = useMemo(() => {
    const prices = variants
      .map((v) => (typeof v.price === "number" && Number.isFinite(v.price) ? v.price : 0))
      .filter((x) => x > 0);

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;

    return {
      count: variants.length,
      min,
      max,
      defaultCount: variants.filter((v) => !!v.isDefault).length,
    };
  }, [variants]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    const minN = Number(minPrice);
    const maxN = Number(maxPrice);

    const hasMin = minPrice.trim().length > 0 && Number.isFinite(minN) && minN > 0;
    const hasMax = maxPrice.trim().length > 0 && Number.isFinite(maxN) && maxN > 0;

    const fFuel = norm(fuel);
    const fTrans = norm(transmission);

    let list = variants.slice();

    if (qq) list = list.filter((v) => (v.name ?? "").toLowerCase().includes(qq));
    if (onlyDefault) list = list.filter((v) => !!v.isDefault);

    if (fFuel !== "all") list = list.filter((v) => getFuelType(v) === fFuel);
    if (fTrans !== "all") list = list.filter((v) => getTransmission(v) === fTrans);

    if (hasMin) {
      list = list.filter((v) => (typeof v.price === "number" && Number.isFinite(v.price) ? v.price : 0) >= minN);
    }

    if (hasMax) {
      list = list.filter((v) => {
        const p = typeof v.price === "number" && Number.isFinite(v.price) ? v.price : 0;
        if (p <= 0) return false;
        return p <= maxN;
      });
    }

    if (sort === "default") {
      list.sort((a, b) => {
        if (!!a.isDefault !== !!b.isDefault) return a.isDefault ? -1 : 1;
        const ap = typeof a.price === "number" && Number.isFinite(a.price) ? a.price : Number.MAX_SAFE_INTEGER;
        const bp = typeof b.price === "number" && Number.isFinite(b.price) ? b.price : Number.MAX_SAFE_INTEGER;
        if (ap !== bp) return ap - bp;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
    }

    if (sort === "price_asc") {
      list.sort((a, b) => {
        const ap = typeof a.price === "number" && Number.isFinite(a.price) ? a.price : Number.MAX_SAFE_INTEGER;
        const bp = typeof b.price === "number" && Number.isFinite(b.price) ? b.price : Number.MAX_SAFE_INTEGER;
        if (ap !== bp) return ap - bp;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
    }

    if (sort === "price_desc") {
      list.sort((a, b) => {
        const ap = typeof a.price === "number" && Number.isFinite(a.price) ? a.price : -1;
        const bp = typeof b.price === "number" && Number.isFinite(b.price) ? b.price : -1;
        if (ap !== bp) return bp - ap;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
    }

    if (sort === "name_asc") {
      list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }

    return list;
  }, [variants, q, onlyDefault, minPrice, maxPrice, sort, fuel, transmission]);

  if (loading) return <div style={{ padding: "1.25rem" }}>Loading…</div>;
  if (error) return <div style={{ padding: "1.25rem", color: "crimson" }}>{error}</div>;
  if (!data) return <div style={{ padding: "1.25rem" }}>Not found.</div>;

  const showFuel = fuelOptions.length > 0;
  const showTransmission = transmissionOptions.length > 0;

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
          <div style={{ fontSize: 22, fontWeight: 800 }}>{title}</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            {stats.count} variants {stats.min > 0 ? `• ${formatINR(stats.min)} – ${formatINR(stats.max)}` : ""}
          </div>
        </div>

        <Link
          to={`/vehicles/${encodeURIComponent(slug)}`}
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10,
            padding: "8px 10px",
            background: "white",
            textDecoration: "none",
            color: "inherit",
            fontWeight: 700,
          }}
        >
          Vehicle page →
        </Link>
      </div>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          padding: 14,
          background: "white",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Search</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search variant name…"
              style={{
                width: "100%",
                border: "1px solid rgba(0,0,0,0.14)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Price min</div>
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              inputMode="numeric"
              placeholder={stats.min > 0 ? `${stats.min}` : "e.g. 95000"}
              style={{
                width: "100%",
                border: "1px solid rgba(0,0,0,0.14)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Price max</div>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              inputMode="numeric"
              placeholder={stats.max > 0 ? `${stats.max}` : "e.g. 250000"}
              style={{
                width: "100%",
                border: "1px solid rgba(0,0,0,0.14)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Sort</div>
            <select
              value={sort}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "default" || v === "price_asc" || v === "price_desc" || v === "name_asc") setSort(v);
                else setSort("default");
              }}
              style={{
                width: "100%",
                border: "1px solid rgba(0,0,0,0.14)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
                background: "white",
              }}
            >
              <option value="default">Default (recommended)</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
              <option value="name_asc">Name: A → Z</option>
            </select>
          </div>

          {showFuel ? (
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Fuel</div>
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid rgba(0,0,0,0.14)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  outline: "none",
                  background: "white",
                }}
              >
                <option value="all">All</option>
                {fuelOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {showTransmission ? (
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Transmission</div>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid rgba(0,0,0,0.14)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  outline: "none",
                  background: "white",
                }}
              >
                <option value="all">All</option>
                {transmissionOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              <input type="checkbox" checked={onlyDefault} onChange={(e) => setOnlyDefault(e.target.checked)} />
              Default only
            </label>

            <button
              type="button"
              onClick={() => {
                setQ("");
                setOnlyDefault(false);
                setMinPrice("");
                setMaxPrice("");
                setSort("default");
                setFuel("all");
                setTransmission("all");
              }}
              style={{
                marginLeft: "auto",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                padding: "10px 12px",
                background: "white",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
          Showing <strong>{filtered.length}</strong> of {variants.length}
        </div>
      </div>

      {variants.length === 0 ? (
        <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" }}>
          No variants found for this vehicle.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" }}>
          No variants match your filters.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {filtered.map((v) => {
            const name = v.name?.trim() || "Variant";
            const vSlug = getVariantSlug(v);

            return (
              <Link
                key={v.id}
                to={`/vehicles/${encodeURIComponent(slug)}/variants/${encodeURIComponent(vSlug)}`}
                style={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 16,
                  padding: 14,
                  background: "white",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>{name}</div>
                  {v.isDefault ? (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "rgba(0,0,0,0.03)",
                        whiteSpace: "nowrap",
                        alignSelf: "flex-start",
                      }}
                    >
                      Default
                    </div>
                  ) : null}
                </div>

                <div style={{ marginTop: 10, opacity: 0.85, fontSize: 13 }}>
                  Price: <strong>{formatINR(v.price ?? null)}</strong>
                </div>

                <div style={{ marginTop: 10, fontWeight: 800 }}>Open →</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
