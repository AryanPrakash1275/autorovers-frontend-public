// Admin vehicle create/edit form.
// Splits required fields (Basics) from optional specs to keep data entry fast.
// Supports brand selection via curated list + “Other” for custom input.

import { useEffect, useMemo, useState } from "react";
import { POPULAR_BRANDS } from "./vehicleFormOptions";
import {
  NUMBER_FIELDS,
  getCategoryOptions,
  getTransmissionOptions,
  inferVehicleTypeFromCategory,
  initBrandState,
  getFinalBrand,
  type VehicleType,
} from "./vehicleFormUtils";

import type { Vehicle } from "../types";

type Props = {
  initial?: Vehicle | null;
  mode: "create" | "edit";
  onSubmit: (data: Vehicle) => Promise<void>;
  onCancel: () => void;
};

type Tab = "basics" | "specs";

type RequiredField =
  | "brand"
  | "model"
  | "year"
  | "price"
  | "category"
  | "transmission"
  | "vehicleType";

type FormErrors = Partial<Record<RequiredField | "imageUrl", string>>;

const FALLBACK_PREVIEW_IMG =
  "https://dummyimage.com/600x400/cccccc/000000&text=No+Image";

function isValidHttpUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function VehicleForm({ initial, mode, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<Vehicle>(() => ({
    id: initial?.id ?? 0,

    // core
    vehicleType: (initial?.vehicleType as VehicleType) ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    variant: initial?.variant ?? "",
    year: initial?.year ?? new Date().getFullYear(),
    price: initial?.price ?? 0,
    category: initial?.category ?? "",
    transmission: initial?.transmission ?? "",
    slug: initial?.slug ?? "",
    imageUrl: initial?.imageUrl ?? "",

    // details/meta
    description: initial?.description ?? "",
    colorsAvailableJson: initial?.colorsAvailableJson ?? "",
    warrantyYears: initial?.warrantyYears ?? 0,
    serviceIntervalKm: initial?.serviceIntervalKm ?? 0,

    // engine/performance
    engineType: initial?.engineType ?? "",
    specification: initial?.specification ?? "",
    inductionType: initial?.inductionType ?? "",
    power: initial?.power ?? 0,
    powerRpm: initial?.powerRpm ?? 0,
    torque: initial?.torque ?? 0,
    torqueRpm: initial?.torqueRpm ?? 0,
    emission: initial?.emission ?? "",
    mileage: initial?.mileage ?? 0,
    autoStartStop: initial?.autoStartStop ?? "",
    range: initial?.range ?? 0,

    // dimensions/weight
    length: initial?.length ?? 0,
    width: initial?.width ?? 0,
    height: initial?.height ?? 0,
    weight: initial?.weight ?? 0,
    groundClearance: initial?.groundClearance ?? 0,
    wheelBase: initial?.wheelBase ?? 0,

    // capacity/layout
    personCapacity: initial?.personCapacity ?? 0,
    rows: initial?.rows ?? 0,
    doors: initial?.doors ?? 0,
    bootSpace: initial?.bootSpace ?? 0,
    tankSize: initial?.tankSize ?? 0,

    // tyres/brakes/steering
    frontType: initial?.frontType ?? "",
    backType: initial?.backType ?? "",
    frontBrake: initial?.frontBrake ?? "",
    backBrake: initial?.backBrake ?? "",
    poweredSteering: initial?.poweredSteering ?? "",
    tyreSizeFront: initial?.tyreSizeFront ?? "",
    tyreSizeBack: initial?.tyreSizeBack ?? "",
    tyreType: initial?.tyreType ?? "",
    wheelMaterial: initial?.wheelMaterial ?? "",
    spare: initial?.spare ?? "",
  }));

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("basics");
  const [errors, setErrors] = useState<FormErrors>({});

  const initBrand = useMemo(
    () => initBrandState(initial?.brand),
    [initial?.brand]
  );
  const [selectedBrand, setSelectedBrand] = useState(initBrand.selectedBrand);
  const [customBrand, setCustomBrand] = useState(initBrand.customBrand);

  // When editing older records, vehicleType might be missing.
  // Infer it from category to keep the form usable without forcing a migration.
  useEffect(() => {
    if (!initial) return;

    const inferred = inferVehicleTypeFromCategory(initial);

    setForm((prev: Vehicle) => ({
      ...prev,
      ...initial,
      vehicleType:
        (inferred ||
          (initial.vehicleType as VehicleType) ||
          (prev.vehicleType as VehicleType) ||
          "") as VehicleType,
    }));

    const b = initBrandState(initial.brand);
    setSelectedBrand(b.selectedBrand);
    setCustomBrand(b.customBrand);
  }, [initial]);

  const vehicleType = (form.vehicleType ?? "") as VehicleType;
  const isBike = vehicleType === "Bike";
  const isCar = vehicleType === "Car";

  const categoryOptions = useMemo(
    () => getCategoryOptions(vehicleType),
    [vehicleType]
  );
  const transmissionOptions = useMemo(
    () => getTransmissionOptions(vehicleType),
    [vehicleType]
  );

  function clearFieldError(name: string) {
    if (!errors[name as keyof FormErrors]) return;
    const next = { ...errors };
    delete next[name as keyof FormErrors];
    setErrors(next);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev: Vehicle) => {
      const next: Vehicle = { ...prev };
      const key = name as keyof Vehicle;

      if (NUMBER_FIELDS.has(key)) {
        const num = value === "" ? 0 : Number(value);
        (next as unknown as Record<string, unknown>)[name] = Number.isFinite(num)
          ? num
          : 0;
      } else {
        (next as unknown as Record<string, unknown>)[name] = value;
      }

      return next;
    });

    clearFieldError(name);
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    const nowYear = new Date().getFullYear();

    const finalBrand = getFinalBrand(selectedBrand, customBrand);

    if (!vehicleType) nextErrors.vehicleType = "Required.";
    if (!finalBrand) nextErrors.brand = "Required.";
    if (!form.model.trim()) nextErrors.model = "Required.";
    if (!form.category.trim()) nextErrors.category = "Required.";

    // transmission rule: cars require it (bikes can be blank if you want)
    if (isCar && !form.transmission.trim()) {
      nextErrors.transmission = "Required for cars.";
    }

    const y = Number(form.year);
    if (!y || y < 1950 || y > nowYear + 1) {
      nextErrors.year = `Must be between 1950 and ${nowYear + 1}.`;
    }

    const p = Number(form.price);
    if (!p || p <= 0) nextErrors.price = "Must be greater than 0.";

    if (form.imageUrl && !isValidHttpUrl(form.imageUrl)) {
      nextErrors.imageUrl = "Invalid URL.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const ok = validate();
    if (!ok) {
      setActiveTab("basics");
      return;
    }

    const finalBrand = getFinalBrand(selectedBrand, customBrand);

    // Normalize a few numeric fields (avoid NaN, avoid negative garbage)
    const payload: Vehicle = {
      ...form,
      brand: finalBrand,
      year: clampInt(Number(form.year), 1950, new Date().getFullYear() + 1),
      price: Math.max(0, Number(form.price) || 0),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form slide-form" onSubmit={handleSubmit}>
      <div className="slide-form-header">
        <div className="slide-form-header-top">
          <h2 className="slide-form-title">
            {mode === "create" ? "Add Vehicle" : "Edit Vehicle"}
          </h2>

          <button type="button" className="icon-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="form-tabs">
          <button
            type="button"
            className={`form-tab ${activeTab === "basics" ? "is-active" : ""}`}
            onClick={() => setActiveTab("basics")}
          >
            Basics
          </button>

          <button
            type="button"
            className={`form-tab ${activeTab === "specs" ? "is-active" : ""}`}
            onClick={() => setActiveTab("specs")}
          >
            Specifications
          </button>
        </div>
      </div>

      <div className="slide-form-body">
        {activeTab === "basics" && (
          <BasicsTab
            form={form}
            errors={errors}
            isCar={isCar}
            categoryOptions={categoryOptions}
            transmissionOptions={transmissionOptions}
            selectedBrand={selectedBrand}
            customBrand={customBrand}
            setSelectedBrand={setSelectedBrand}
            setCustomBrand={setCustomBrand}
            setForm={setForm}
            handleChange={handleChange}
          />
        )}

        {activeTab === "specs" && (
          <SpecsTab
            form={form}
            isBike={isBike}
            isCar={isCar}
            handleChange={handleChange}
          />
        )}
      </div>

      <div className="slide-form-footer">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
        </button>

        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* =========================
   Subcomponents
   ========================= */

type BasicsTabProps = {
  form: Vehicle;
  errors: FormErrors;
  isCar: boolean;
  categoryOptions: readonly string[];
  transmissionOptions: readonly string[];
  selectedBrand: string;
  customBrand: string;
  setSelectedBrand: (v: string) => void;
  setCustomBrand: (v: string) => void;
  setForm: React.Dispatch<React.SetStateAction<Vehicle>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
};

function BasicsTab({
  form,
  errors,
  isCar,
  categoryOptions,
  transmissionOptions,
  selectedBrand,
  customBrand,
  setSelectedBrand,
  setCustomBrand,
  setForm,
  handleChange,
}: BasicsTabProps) {
  const vehicleType = (form.vehicleType ?? "") as VehicleType;

  return (
    <div className="form-grid">
      <div className={`field ${errors.vehicleType ? "has-error" : ""}`}>
        <label>Vehicle Type *</label>
        <select name="vehicleType" value={vehicleType} onChange={handleChange}>
          <option value="">Select type</option>
          <option value="Bike">Bike</option>
          <option value="Car">Car</option>
        </select>
        {errors.vehicleType && <div className="field-error">{errors.vehicleType}</div>}
      </div>

      <div className={`field ${errors.brand ? "has-error" : ""}`}>
        <label>Brand *</label>

        <select
          value={selectedBrand}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedBrand(value);

            if (value !== "Other") {
              setCustomBrand("");
              setForm((prev: Vehicle) => ({ ...prev, brand: value }));
            } else {
              setForm((prev: Vehicle) => ({ ...prev, brand: "" }));
            }
          }}
        >
          <option value="">Select brand</option>
          {POPULAR_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>

        {selectedBrand === "Other" && (
          <input
            type="text"
            placeholder="Enter custom brand"
            className="form-input"
            value={customBrand}
            onChange={(e) => {
              setCustomBrand(e.target.value);
              setForm((prev: Vehicle) => ({ ...prev, brand: e.target.value }));
            }}
            style={{ marginTop: "0.5rem" }}
          />
        )}

        {errors.brand && <div className="field-error">{errors.brand}</div>}
      </div>

      <div className={`field ${errors.model ? "has-error" : ""}`}>
        <label>Model *</label>
        <input name="model" value={form.model} onChange={handleChange} />
        {errors.model && <div className="field-error">{errors.model}</div>}
      </div>

      <div className="field">
        <label>Variant</label>
        <input name="variant" value={form.variant} onChange={handleChange} />
      </div>

      <div className={`field ${errors.year ? "has-error" : ""}`}>
        <label>Year *</label>
        <select name="year" value={form.year} onChange={handleChange}>
          <option value="">Select year</option>
          {Array.from({ length: 2050 - 1980 + 1 }, (_, i) => 1980 + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {errors.year && <div className="field-error">{errors.year}</div>}
      </div>

      <div className={`field ${errors.price ? "has-error" : ""}`}>
        <label>Price (₹) *</label>
        <input type="number" name="price" value={form.price} onChange={handleChange} />
        {errors.price && <div className="field-error">{errors.price}</div>}
      </div>

      {vehicleType && (
        <div className={`field ${errors.category ? "has-error" : ""}`}>
          <label>Category *</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">Select category</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <div className="field-error">{errors.category}</div>}
        </div>
      )}

      <div className={`field ${errors.transmission && isCar ? "has-error" : ""}`}>
        <label>Transmission {isCar && "*"}</label>
        <select
          name="transmission"
          value={form.transmission}
          onChange={handleChange}
          disabled={!vehicleType || transmissionOptions.length === 0}
        >
          <option value="">{vehicleType ? "Select" : "Select vehicle type first"}</option>
          {transmissionOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.transmission && isCar && (
          <div className="field-error">{errors.transmission}</div>
        )}
      </div>

      <div className={`field ${errors.imageUrl ? "has-error" : ""}`}>
        <label>Image URL</label>
        <input name="imageUrl" value={form.imageUrl ?? ""} onChange={handleChange} />
        {errors.imageUrl && <div className="field-error">{errors.imageUrl}</div>}
      </div>

      {form.imageUrl && (
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Preview</label>
          <div className="image-preview">
            <img
              src={form.imageUrl}
              alt="Preview"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_PREVIEW_IMG;
              }}
            />
          </div>
        </div>
      )}

      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label>Slug (optional)</label>
        <input
          name="slug"
          value={form.slug}
          onChange={handleChange}
          placeholder="Leave blank for auto"
        />
      </div>
    </div>
  );
}

type SpecsTabProps = {
  form: Vehicle;
  isBike: boolean;
  isCar: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
};

function SpecsTab({ form, isBike, isCar, handleChange }: SpecsTabProps) {
  return (
    <>
      <h3 className="form-section-title">About / Ownership</h3>
      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Description</label>
          <textarea
            name="description"
            value={form.description ?? ""}
            onChange={handleChange}
            rows={4}
            placeholder="Short description / highlights"
          />
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Colors (JSON array)</label>
          <input
            name="colorsAvailableJson"
            value={form.colorsAvailableJson ?? ""}
            onChange={handleChange}
            placeholder='Example: ["Red","Black"]'
          />
        </div>

        <div className="field">
          <label>Warranty (years)</label>
          <input
            type="number"
            name="warrantyYears"
            value={form.warrantyYears ?? 0}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Service interval (km)</label>
          <input
            type="number"
            name="serviceIntervalKm"
            value={form.serviceIntervalKm ?? 0}
            onChange={handleChange}
          />
        </div>
      </div>

      <h3 className="form-section-title">Engine & Performance</h3>
      <div className="form-grid">
        <div className="field">
          <label>Engine type</label>
          <input name="engineType" value={form.engineType ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Specification</label>
          <input
            name="specification"
            value={form.specification ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Induction</label>
          <input
            name="inductionType"
            value={form.inductionType ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Power (bhp)</label>
          <input type="number" name="power" value={form.power ?? 0} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Power RPM</label>
          <input
            type="number"
            name="powerRpm"
            value={form.powerRpm ?? 0}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Torque (Nm)</label>
          <input
            type="number"
            name="torque"
            value={form.torque ?? 0}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Torque RPM</label>
          <input
            type="number"
            name="torqueRpm"
            value={form.torqueRpm ?? 0}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Emission</label>
          <input name="emission" value={form.emission ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Mileage (kmpl)</label>
          <input
            type="number"
            name="mileage"
            value={form.mileage ?? 0}
            onChange={handleChange}
          />
        </div>

        {isBike && (
          <>
            <div className="field">
              <label>Auto Start/Stop</label>
              <input
                name="autoStartStop"
                value={form.autoStartStop ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Range (km)</label>
              <input
                type="number"
                name="range"
                value={form.range ?? 0}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {isCar && (
          <div className="field">
            <label>Range (km)</label>
            <input
              type="number"
              name="range"
              value={form.range ?? 0}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      <h3 className="form-section-title">Dimensions & Weight</h3>
      <div className="form-grid">
        <div className="field">
          <label>Length (mm)</label>
          <input type="number" name="length" value={form.length ?? 0} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Width (mm)</label>
          <input type="number" name="width" value={form.width ?? 0} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Height (mm)</label>
          <input type="number" name="height" value={form.height ?? 0} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Wheelbase (mm)</label>
          <input
            type="number"
            name="wheelBase"
            value={form.wheelBase ?? 0}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Ground clearance (mm)</label>
          <input
            type="number"
            name="groundClearance"
            value={form.groundClearance ?? 0}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Kerb weight (kg)</label>
          <input type="number" name="weight" value={form.weight ?? 0} onChange={handleChange} />
        </div>
      </div>

      {isCar && (
        <>
          <h3 className="form-section-title">Capacity & Layout</h3>
          <div className="form-grid">
            <div className="field">
              <label>Seating (persons)</label>
              <input
                type="number"
                name="personCapacity"
                value={form.personCapacity ?? 0}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Rows</label>
              <input type="number" name="rows" value={form.rows ?? 0} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Doors</label>
              <input type="number" name="doors" value={form.doors ?? 0} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Boot space (L)</label>
              <input
                type="number"
                name="bootSpace"
                value={form.bootSpace ?? 0}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Tank size (L)</label>
              <input
                type="number"
                name="tankSize"
                value={form.tankSize ?? 0}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Power steering</label>
              <input
                name="poweredSteering"
                value={form.poweredSteering ?? ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </>
      )}

      <h3 className="form-section-title">Tyres & Brakes</h3>
      <div className="form-grid">
        <div className="field">
          <label>Front type</label>
          <input name="frontType" value={form.frontType ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Rear / Back type</label>
          <input name="backType" value={form.backType ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Front tyre</label>
          <input
            name="tyreSizeFront"
            value={form.tyreSizeFront ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Rear tyre</label>
          <input
            name="tyreSizeBack"
            value={form.tyreSizeBack ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Tyre type</label>
          <input name="tyreType" value={form.tyreType ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Front brake</label>
          <input name="frontBrake" value={form.frontBrake ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Rear brake</label>
          <input name="backBrake" value={form.backBrake ?? ""} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Wheel material</label>
          <input
            name="wheelMaterial"
            value={form.wheelMaterial ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Spare</label>
          <input name="spare" value={form.spare ?? ""} onChange={handleChange} />
        </div>
      </div>
    </>
  );
}
