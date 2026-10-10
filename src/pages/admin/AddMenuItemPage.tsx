
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  useMenu,
  type CreateMenuItemInput,
} from "../../context/MenuContext";

import type {
  FoodType,
  MenuCategory,
  MenuCustomization,
  MenuCustomizationGroup,
  MenuCustomizationOption,
} from "../../types/Menu";

// ============================================================
// SMART CAFE - ADMIN ADD MENU ITEM
//
// PHASE 16.4 + 16.9 + PHASE 22.3
//
// IMPORTANT INPUT DESIGN:
//
// Number inputs are stored temporarily as strings while the
// administrator is typing.
//
// Example:
//
// Input → "100"
// Delete → "10"
// Delete → "1"
// Delete → ""
// Type → "12"
//
// We convert these strings to numbers ONLY when saving.
//
// This prevents React from interfering while the user edits
// a number field.
//
// PHASE 22.3:
// Added grouped customizations with:
// - Single or multiple selection
// - Required or optional groups
// - Minimum and maximum selections
// - Individual option prices
// - Option availability
// ============================================================

// ============================================================
// CATEGORY OPTIONS
// ============================================================

const CATEGORY_OPTIONS: {
  value: MenuCategory;
  label: string;
}[] = [
  { value: "food", label: "Food" },
  { value: "drinks", label: "Drinks" },
  { value: "snacks", label: "Snacks" },
  { value: "desserts", label: "Desserts" },
  { value: "specials", label: "Specials" },
];

// ============================================================
// INITIAL FORM
// ============================================================

const INITIAL_FORM: CreateMenuItemInput = {
  name: "",
  category: "food",
  foodType: "veg",
  description: "",
  details: "",
  price: 0,
  originalPrice: undefined,
  image: "",
  isAvailable: true,
  preparationTime: 10,
  tags: [],
  customizations: [],
  customizationGroups: [],
};

// ============================================================
// TEMPORARY OPTION TYPE
//
// Option prices remain strings until the option is added.
// ============================================================

interface DraftOption {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

function createOptionId(): string {
  return `option-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createGroupId(): string {
  return `group-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function AddMenuItemPage() {
  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = useNavigate();

  // ==========================================================
  // MENU CONTEXT
  // ==========================================================

  const { addMenuItem } = useMenu();

  // ==========================================================
  // MAIN FORM STATE
  //
  // Text values and non-editing values stay here.
  // Number fields are handled separately below.
  // ==========================================================

  const [form, setForm] =
    useState<CreateMenuItemInput>(INITIAL_FORM);

  // ==========================================================
  // TEMPORARY NUMBER INPUT STATE
  //
  // These MUST be strings.
  // ==========================================================

  const [numberInputs, setNumberInputs] = useState({
    price: "",
    originalPrice: "",
    preparationTime: "10",
    customizationPrice: "",
  });

  // ==========================================================
  // OTHER FORM STATE
  // ==========================================================

  const [tagsText, setTagsText] = useState("");

  const [customizationName, setCustomizationName] =
    useState("");

  const [error, setError] = useState("");

  // ==========================================================
  // PHASE 22.3 - GROUP BUILDER STATE
  //
  // We build a group and its options first.
  // The group is added to the menu item only when complete.
  // ==========================================================

  const [groupName, setGroupName] = useState("");

  const [groupSelectionType, setGroupSelectionType] =
    useState<"single" | "multiple">("single");

  const [groupRequired, setGroupRequired] = useState(false);

  const [groupMinSelections, setGroupMinSelections] =
    useState("0");

  const [groupMaxSelections, setGroupMaxSelections] =
    useState("1");

  const [optionName, setOptionName] = useState("");

  const [optionPrice, setOptionPrice] = useState("");

  const [optionAvailable, setOptionAvailable] =
    useState(true);

  const [draftOptions, setDraftOptions] =
    useState<DraftOption[]>([]);

  // ==========================================================
  // GENERIC FORM FIELD UPDATE
  // ==========================================================

  const updateField = <
    K extends keyof CreateMenuItemInput,
  >(
    field: K,
    value: CreateMenuItemInput[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================================
  // NUMBER INPUT HANDLER
  //
  // IMPORTANT:
  // We do NOT convert to Number() here.
  //
  // We keep exactly what the user typed.
  // ==========================================================

  const updateNumberInput = (
    field:
      | "price"
      | "originalPrice"
      | "preparationTime"
      | "customizationPrice",
    value: string,
  ) => {
    // Allow an empty input while editing.
    if (value === "") {
      setNumberInputs((previous) => ({
        ...previous,
        [field]: "",
      }));

      return;
    }

    // Allow positive integer/decimal-style numbers.
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setNumberInputs((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================================
  // CATEGORY CHANGE
  // ==========================================================

  const handleCategoryChange = (category: MenuCategory) => {
    setForm((previous) => ({
      ...previous,
      category,

      // Drinks and desserts don't use Veg / Non-Veg.
      foodType:
        category === "drinks" || category === "desserts"
          ? undefined
          : previous.foodType ?? "veg",
    }));
  };

  // ==========================================================
  // ADD LEGACY CUSTOMIZATION
  //
  // Kept for compatibility with the existing menu system.
  // Use grouped customizations for new configurable choices.
  // ==========================================================

  const handleAddCustomization = () => {
    setError("");

    const name = customizationName.trim();
    const priceText = numberInputs.customizationPrice.trim();

    if (!name) {
      setError("Customization name is required.");
      return;
    }

    const price = priceText === "" ? 0 : Number(priceText);

    if (!Number.isFinite(price) || price < 0) {
      setError("Customization price must be 0 or greater.");
      return;
    }

    const customization: MenuCustomization = {
      id: `custom-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      name,
      price,
    };

    setForm((previous) => ({
      ...previous,
      customizations: [
        ...(previous.customizations ?? []),
        customization,
      ],
    }));

    setCustomizationName("");

    setNumberInputs((previous) => ({
      ...previous,
      customizationPrice: "",
    }));
  };

  // ==========================================================
  // REMOVE LEGACY CUSTOMIZATION
  // ==========================================================

  const handleRemoveCustomization = (id: string) => {
    setForm((previous) => ({
      ...previous,
      customizations:
        previous.customizations?.filter(
          (customization) => customization.id !== id,
        ) ?? [],
    }));
  };

  // ==========================================================
  // PHASE 22.3 - GROUP SELECTION TYPE CHANGE
  //
  // Single selection permits at most one selected option.
  // Multiple selection can permit several selected options.
  // ==========================================================

  const handleGroupSelectionTypeChange = (
    selectionType: "single" | "multiple",
  ) => {
    setGroupSelectionType(selectionType);

    if (selectionType === "single") {
      setGroupMinSelections(groupRequired ? "1" : "0");
      setGroupMaxSelections("1");
    } else {
      setGroupMinSelections(groupRequired ? "1" : "0");
      setGroupMaxSelections(
        String(Math.max(draftOptions.length, 1)),
      );
    }
  };

  // ==========================================================
  // PHASE 22.3 - REQUIRED GROUP CHANGE
  // ==========================================================

  const handleGroupRequiredChange = (required: boolean) => {
    setGroupRequired(required);

    // A required group must have at least one selection.
    if (required) {
      setGroupMinSelections("1");
    } else if (groupMinSelections === "1") {
      setGroupMinSelections("0");
    }
  };

  // ==========================================================
  // PHASE 22.3 - ADD OPTION TO DRAFT GROUP
  // ==========================================================

  const handleAddDraftOption = () => {
    setError("");

    const name = optionName.trim();
    const priceText = optionPrice.trim();
    const price = priceText === "" ? 0 : Number(priceText);

    if (!name) {
      setError("Enter an option name before adding it.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Option price must be 0 or greater.");
      return;
    }

    if (
      draftOptions.some(
        (option) =>
          option.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("This option already exists in the current group.");
      return;
    }

    const option: DraftOption = {
      id: createOptionId(),
      name,
      price: String(price),
      isAvailable: optionAvailable,
    };

    setDraftOptions((previous) => [...previous, option]);

    setOptionName("");
    setOptionPrice("");
    setOptionAvailable(true);
  };

  // ==========================================================
  // PHASE 22.3 - EDIT A DRAFT OPTION
  //
  // Options remain editable until the group is added.
  // ==========================================================

  const updateDraftOption = (
    id: string,
    field: "name" | "price" | "isAvailable",
    value: string | boolean,
  ) => {
    setDraftOptions((previous) =>
      previous.map((option) => {
        if (option.id !== id) {
          return option;
        }

        if (field === "name") {
          return {
            ...option,
            name: String(value),
          };
        }

        if (field === "price") {
          const priceText = String(value);

          if (
            priceText !== "" &&
            !/^\d*\.?\d*$/.test(priceText)
          ) {
            return option;
          }

          return {
            ...option,
            price: priceText,
          };
        }

        return {
          ...option,
          isAvailable: Boolean(value),
        };
      }),
    );
  };

  // ==========================================================
  // PHASE 22.3 - REMOVE A DRAFT OPTION
  // ==========================================================

  const handleRemoveDraftOption = (id: string) => {
    setDraftOptions((previous) =>
      previous.filter((option) => option.id !== id),
    );
  };

  // ==========================================================
  // PHASE 22.3 - ADD COMPLETED GROUP TO MENU ITEM
  // ==========================================================

  const handleAddCustomizationGroup = () => {
    setError("");

    const name = groupName.trim();

    if (!name) {
      setError("Enter a name for the customization group.");
      return;
    }

    if (
      (form.customizationGroups ?? []).some(
        (group) => group.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("A customization group with this name already exists.");
      return;
    }

    if (draftOptions.length === 0) {
      setError("Add at least one option to the group.");
      return;
    }

    const options: MenuCustomizationOption[] = [];

    for (const option of draftOptions) {
      const cleanName = option.name.trim();
      const priceText = option.price.trim();
      const price = priceText === "" ? 0 : Number(priceText);

      if (!cleanName) {
        setError("Every option must have a name.");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        setError(`Enter a valid price for "${cleanName}".`);
        return;
      }

      options.push({
        id: option.id,
        name: cleanName,
        price,
        isAvailable: option.isAvailable,
      });
    }

    const minSelections =
      groupMinSelections.trim() === ""
        ? 0
        : Number(groupMinSelections);

    const maxSelections =
      groupMaxSelections.trim() === ""
        ? groupSelectionType === "single"
          ? 1
          : options.length
        : Number(groupMaxSelections);

    if (
      !Number.isInteger(minSelections) ||
      !Number.isInteger(maxSelections) ||
      minSelections < 0 ||
      maxSelections < 1
    ) {
      setError("Selection limits must be valid whole numbers.");
      return;
    }

    if (minSelections > maxSelections) {
      setError("Minimum selections cannot exceed maximum selections.");
      return;
    }

    if (maxSelections > options.length) {
      setError(
        `Maximum selections cannot exceed the ${options.length} options in this group.`,
      );
      return;
    }

    if (groupRequired && minSelections < 1) {
      setError("A required group must have a minimum of one selection.");
      return;
    }

    if (groupSelectionType === "single" && maxSelections !== 1) {
      setError("A single-selection group must have a maximum of one.");
      return;
    }

    if (groupSelectionType === "single" && minSelections > 1) {
      setError("A single-selection group cannot require multiple options.");
      return;
    }

    const group: MenuCustomizationGroup = {
      id: createGroupId(),
      name,
      selectionType: groupSelectionType,
      required: groupRequired,
      minSelections,
      maxSelections,
      options,
    };

    setForm((previous) => ({
      ...previous,
      customizationGroups: [
        ...(previous.customizationGroups ?? []),
        group,
      ],
    }));

    // Reset the builder for the next group.
    setGroupName("");
    setGroupSelectionType("single");
    setGroupRequired(false);
    setGroupMinSelections("0");
    setGroupMaxSelections("1");
    setDraftOptions([]);
    setOptionName("");
    setOptionPrice("");
    setOptionAvailable(true);
  };

  // ==========================================================
  // PHASE 22.3 - REMOVE A COMPLETED GROUP
  // ==========================================================

  const handleRemoveCustomizationGroup = (id: string) => {
    setForm((previous) => ({
      ...previous,
      customizationGroups:
        previous.customizationGroups?.filter(
          (group) => group.id !== id,
        ) ?? [],
    }));
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    // ========================================================
    // CLEAN BASIC TEXT
    // ========================================================

    const name = form.name.trim();

    if (!name) {
      setError("Menu item name is required.");
      return;
    }

    // ========================================================
    // CONVERT PRICE STRING → NUMBER
    // ========================================================

    const priceText = numberInputs.price.trim();
    const price = priceText === "" ? NaN : Number(priceText);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    // ========================================================
    // ORIGINAL PRICE
    // ========================================================

    const originalPriceText = numberInputs.originalPrice.trim();

    const originalPrice =
      originalPriceText === ""
        ? undefined
        : Number(originalPriceText);

    if (
      originalPrice !== undefined &&
      (!Number.isFinite(originalPrice) || originalPrice < 0)
    ) {
      setError("Original price must be 0 or greater.");
      return;
    }

    if (
      originalPrice !== undefined &&
      originalPrice < price
    ) {
      setError(
        "Original price cannot be lower than selling price.",
      );
      return;
    }

    // ========================================================
    // PREPARATION TIME
    // ========================================================

    const preparationTimeText =
      numberInputs.preparationTime.trim();

    const preparationTime =
      preparationTimeText === ""
        ? NaN
        : Number(preparationTimeText);

    if (
      !Number.isFinite(preparationTime) ||
      preparationTime < 0
    ) {
      setError("Preparation time must be 0 or greater.");
      return;
    }

    // ========================================================
    // TAGS
    // ========================================================

    const tags = Array.from(
      new Set(
        tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );

    // ========================================================
    // FINAL DATA
    //
    // At this point all number strings have been safely
    // converted into numbers.
    // ========================================================

    const menuItem: CreateMenuItemInput = {
      name,
      category: form.category,

      // Drinks and desserts don't store foodType.
      foodType:
        form.category === "drinks" ||
        form.category === "desserts"
          ? undefined
          : form.foodType ?? "veg",

      description: form.description?.trim() || "",
      details: form.details?.trim() || "",
      price,
      originalPrice,
      image: form.image?.trim() || "",
      isAvailable: form.isAvailable,
      preparationTime,
      tags,

      // Keep the existing customization system working.
      customizations: form.customizations ?? [],

      // Phase 22.3: save the new grouped customization data.
      customizationGroups: form.customizationGroups ?? [],
    };

    // ========================================================
    // SAVE TO MENU CONTEXT
    // ========================================================

    addMenuItem(menuItem);

    // ========================================================
    // RETURN TO ADMIN MENU
    // ========================================================

    navigate("/admin/menu");
  };

  // ==========================================================
  // REUSABLE INPUT STYLE
  // ==========================================================

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px",
    marginTop: "6px",
  };

  const sectionStyle = {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "12px",
  };

  const labelStyle = {
    display: "block",
    marginTop: "16px",
    fontWeight: 600 as const,
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      style={{
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div style={{ marginBottom: "24px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            opacity: 0.65,
          }}
        >
          ADMIN MENU
        </p>

        <h1 style={{ margin: "6px 0 0" }}>
          Add Menu Item
        </h1>

        <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
          Add a new item to the Smart Cafe menu.
        </p>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* ====================================================
          FORM
      ==================================================== */}

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "20px" }}
      >
        {/* ==================================================
            BASIC INFORMATION
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Basic Information</h2>

          <label style={labelStyle}>Item Name</label>

          <input
            type="text"
            required
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            placeholder="Example: Chicken Burger"
            style={inputStyle}
          />

          <label style={labelStyle}>Category</label>

          <select
            value={form.category}
            onChange={(event) =>
              handleCategoryChange(
                event.target.value as MenuCategory,
              )
            }
            style={inputStyle}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {form.category !== "drinks" &&
            form.category !== "desserts" && (
              <>
                <label style={labelStyle}>Food Type</label>

                <select
                  value={form.foodType ?? "veg"}
                  onChange={(event) =>
                    updateField(
                      "foodType",
                      event.target.value as FoodType,
                    )
                  }
                  style={inputStyle}
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
              </>
            )}

          <label style={labelStyle}>Short Description</label>

          <textarea
            value={form.description ?? ""}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            rows={3}
            placeholder="Short description..."
            style={inputStyle}
          />

          <label style={labelStyle}>Details</label>

          <textarea
            value={form.details ?? ""}
            onChange={(event) =>
              updateField("details", event.target.value)
            }
            rows={4}
            placeholder="Detailed information..."
            style={inputStyle}
          />
        </div>

        {/* ==================================================
            PRICING
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Pricing</h2>

          <label style={labelStyle}>Selling Price (₹)</label>

          <input
            type="text"
            inputMode="decimal"
            required
            value={numberInputs.price}
            onChange={(event) =>
              updateNumberInput("price", event.target.value)
            }
            placeholder="Example: 149"
            style={inputStyle}
          />

          <label style={labelStyle}>Original Price (₹)</label>

          <input
            type="text"
            inputMode="decimal"
            value={numberInputs.originalPrice}
            onChange={(event) =>
              updateNumberInput(
                "originalPrice",
                event.target.value,
              )
            }
            placeholder="Optional"
            style={inputStyle}
          />
        </div>

        {/* ==================================================
            IMAGE
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Image</h2>

          <label style={labelStyle}>Image Path / URL</label>

          <input
            type="text"
            value={form.image ?? ""}
            onChange={(event) =>
              updateField("image", event.target.value)
            }
            placeholder="/images/food/burger.jpg"
            style={inputStyle}
          />

          {form.image && (
            <img
              src={form.image}
              alt="Menu item preview"
              style={{
                width: "220px",
                height: "160px",
                objectFit: "cover",
                marginTop: "14px",
                borderRadius: "10px",
              }}
            />
          )}
        </div>

        {/* ==================================================
            PREPARATION
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Preparation</h2>

          <label style={labelStyle}>
            Preparation Time (minutes)
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={numberInputs.preparationTime}
            onChange={(event) =>
              updateNumberInput(
                "preparationTime",
                event.target.value,
              )
            }
            placeholder="Example: 10"
            style={inputStyle}
          />
        </div>

        {/* ==================================================
            TAGS
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Tags</h2>

          <p style={{ opacity: 0.7 }}>
            Separate tags using commas.
          </p>

          <input
            type="text"
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            placeholder="popular, spicy, bestseller"
            style={inputStyle}
          />
        </div>

        {/* ==================================================
            LEGACY CUSTOMIZATIONS
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Simple Customizations</h2>

          <p style={{ opacity: 0.7 }}>
            Existing customization format, retained for compatibility.
            For selection rules and groups, use Advanced Customization Groups below.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr auto",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <input
              type="text"
              value={customizationName}
              onChange={(event) =>
                setCustomizationName(event.target.value)
              }
              placeholder="Example: Extra Cheese"
              aria-label="Simple customization name"
            />

            <input
              type="text"
              inputMode="decimal"
              value={numberInputs.customizationPrice}
              onChange={(event) =>
                updateNumberInput(
                  "customizationPrice",
                  event.target.value,
                )
              }
              placeholder="Price"
              aria-label="Simple customization price"
            />

            <button type="button" onClick={handleAddCustomization}>
              Add
            </button>
          </div>

          {(form.customizations ?? []).map((customization) => (
            <div
              key={customization.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                marginTop: "8px",
                border: "1px solid #eee",
                borderRadius: "8px",
              }}
            >
              <span>
                {customization.name} — ₹{customization.price ?? 0}
              </span>

              <button
                type="button"
                onClick={() =>
                  handleRemoveCustomization(customization.id)
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* ==================================================
            PHASE 22.3 - ADVANCED CUSTOMIZATION GROUP BUILDER
        ================================================== */}

        <div style={sectionStyle}>
          <h2>Advanced Customization Groups</h2>

          <p style={{ opacity: 0.75 }}>
            Example: create a "Choose Size" group with Small,
            Medium, and Large options. Then create another group
            for extra toppings.
          </p>

          {/* GROUP NAME */}

          <label style={labelStyle}>Group Name</label>

          <input
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Example: Choose Size"
            style={inputStyle}
          />

          {/* SELECTION TYPE */}

          <label style={labelStyle}>Selection Type</label>

          <select
            value={groupSelectionType}
            onChange={(event) =>
              handleGroupSelectionTypeChange(
                event.target.value as "single" | "multiple",
              )
            }
            style={inputStyle}
          >
            <option value="single">
              Single selection — choose one option
            </option>

            <option value="multiple">
              Multiple selection — choose several options
            </option>
          </select>

          {/* REQUIRED */}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={groupRequired}
              onChange={(event) =>
                handleGroupRequiredChange(event.target.checked)
              }
            />

            Customer must select from this group
          </label>

          {/* SELECTION LIMITS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <div>
              <label style={{ fontWeight: 600 }}>
                Minimum selections
              </label>

              <input
                type="number"
                min={groupRequired ? 1 : 0}
                max={draftOptions.length}
                value={groupMinSelections}
                onChange={(event) =>
                  setGroupMinSelections(event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>
                Maximum selections
              </label>

              <input
                type="number"
                min={1}
                max={draftOptions.length || undefined}
                disabled={groupSelectionType === "single"}
                value={
                  groupSelectionType === "single"
                    ? "1"
                    : groupMaxSelections
                }
                onChange={(event) =>
                  setGroupMaxSelections(event.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* ADD AN OPTION */}

          <h3 style={{ marginTop: "24px" }}>
            Group Options
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label style={{ fontWeight: 600 }}>Option Name</label>

              <input
                type="text"
                value={optionName}
                onChange={(event) => setOptionName(event.target.value)}
                placeholder="Example: Large"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>
                Extra Price (₹)
              </label>

              <input
                type="text"
                inputMode="decimal"
                value={optionPrice}
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setOptionPrice(value);
                  }
                }}
                placeholder="0"
                style={inputStyle}
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={optionAvailable}
              onChange={(event) =>
                setOptionAvailable(event.target.checked)
              }
            />

            Option available to customers
          </label>

          <button
            type="button"
            onClick={handleAddDraftOption}
            style={{ marginTop: "12px", padding: "10px 14px" }}
          >
            Add Option
          </button>

          {/* DRAFT OPTIONS */}

          {draftOptions.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {draftOptions.map((option) => (
                <div
                  key={option.id}
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr auto",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      value={option.name}
                      aria-label="Edit option name"
                      onChange={(event) =>
                        updateDraftOption(
                          option.id,
                          "name",
                          event.target.value,
                        )
                      }
                    />

                    <input
                      type="text"
                      inputMode="decimal"
                      value={option.price}
                      aria-label="Edit option price"
                      onChange={(event) =>
                        updateDraftOption(
                          option.id,
                          "price",
                          event.target.value,
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveDraftOption(option.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={option.isAvailable}
                      onChange={(event) =>
                        updateDraftOption(
                          option.id,
                          "isAvailable",
                          event.target.checked,
                        )
                      }
                    />

                    Available
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ADD GROUP */}

          <button
            type="button"
            onClick={handleAddCustomizationGroup}
            style={{
              display: "block",
              marginTop: "20px",
              padding: "12px 16px",
              fontWeight: 700,
            }}
          >
            Add Group to Menu Item
          </button>

          {/* COMPLETED GROUPS */}

          <h3 style={{ marginTop: "28px" }}>
            Groups Added to This Item
          </h3>

          {(form.customizationGroups ?? []).length === 0 ? (
            <p style={{ opacity: 0.7 }}>
              No advanced groups added yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {(form.customizationGroups ?? []).map((group) => (
                <div
                  key={group.id}
                  style={{
                    padding: "14px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <strong>{group.name}</strong>

                      <p style={{ margin: "6px 0", opacity: 0.75 }}>
                        {group.selectionType === "single"
                          ? "Single selection"
                          : "Multiple selection"}
                        {" · "}
                        {group.required ? "Required" : "Optional"}
                      </p>

                      <p style={{ margin: "6px 0", fontSize: "13px" }}>
                        Select {group.minSelections ?? 0}–{group.maxSelections ?? group.options.length}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveCustomizationGroup(group.id)
                      }
                    >
                      Remove Group
                    </button>
                  </div>

                  <ul style={{ paddingLeft: "20px" }}>
                    {group.options.map((option) => (
                      <li key={option.id} style={{ marginTop: "6px" }}>
                        {option.name} — ₹{option.price}
                        {!option.isAvailable && " (Unavailable)"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================
            AVAILABILITY
        ================================================== */}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(event) =>
              updateField("isAvailable", event.target.checked)
            }
          />

          Available for customers
        </label>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            style={{
              padding: "12px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save Menu Item
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/menu")}
            style={{
              padding: "12px 18px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
