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
} from "../../types/Menu";

// ============================================================
// SMART CAFE - ADMIN ADD MENU ITEM
//
// PHASE 16.4 + 16.9
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
// ============================================================

// ============================================================
// CATEGORY OPTIONS
// ============================================================

const CATEGORY_OPTIONS: {
  value: MenuCategory;
  label: string;
}[] = [
  {
    value: "food",
    label: "Food",
  },
  {
    value: "drinks",
    label: "Drinks",
  },
  {
    value: "snacks",
    label: "Snacks",
  },
  {
    value: "desserts",
    label: "Desserts",
  },
  {
    value: "specials",
    label: "Specials",
  },
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
};

export default function AddMenuItemPage() {
  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = useNavigate();

  // ==========================================================
  // MENU CONTEXT
  // ==========================================================

  const {
    addMenuItem,
  } = useMenu();

  // ==========================================================
  // MAIN FORM STATE
  //
  // Text values and non-editing values stay here.
  // Number fields are handled separately below.
  // ==========================================================

  const [form, setForm] =
    useState<CreateMenuItemInput>(
      INITIAL_FORM,
    );

  // ==========================================================
  // TEMPORARY NUMBER INPUT STATE
  //
  // These MUST be strings.
  //
  // This allows the user to temporarily have:
  //
  // ""
  // "1"
  // "12"
  // "120"
  //
  // before we convert the value into a number.
  // ==========================================================

  const [numberInputs, setNumberInputs] =
    useState({
      price: "",
      originalPrice: "",
      preparationTime: "10",
      customizationPrice: "",
    });

  // ==========================================================
  // OTHER FORM STATE
  // ==========================================================

  const [tagsText, setTagsText] =
    useState("");

  const [
    customizationName,
    setCustomizationName,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // ==========================================================
  // GENERIC FORM FIELD UPDATE
  // ==========================================================

  const updateField = <
    K extends keyof CreateMenuItemInput
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
    // --------------------------------------------------------
    // Allow empty input.
    // --------------------------------------------------------

    if (value === "") {
      setNumberInputs((previous) => ({
        ...previous,
        [field]: "",
      }));

      return;
    }

    // --------------------------------------------------------
    // Only allow positive integer/decimal-style numbers.
    //
    // Examples allowed:
    // 1
    // 12
    // 100
    // 99.5
    //
    // This prevents letters from entering the field.
    // --------------------------------------------------------

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

  const handleCategoryChange = (
    category: MenuCategory,
  ) => {
    setForm((previous) => ({
      ...previous,
      category,

      // ------------------------------------------------------
      // Drinks and desserts don't use Veg / Non-Veg.
      // ------------------------------------------------------

      foodType:
        category === "drinks" ||
        category === "desserts"
          ? undefined
          : previous.foodType ?? "veg",
    }));
  };

  // ==========================================================
  // ADD CUSTOMIZATION
  // ==========================================================

  const handleAddCustomization = () => {
    setError("");

    const name =
      customizationName.trim();

    const priceText =
      numberInputs.customizationPrice.trim();

    if (!name) {
      setError(
        "Customization name is required.",
      );

      return;
    }

    // Empty customization price means ₹0.
    const price =
      priceText === ""
        ? 0
        : Number(priceText);

    if (!Number.isFinite(price) || price < 0) {
      setError(
        "Customization price must be 0 or greater.",
      );

      return;
    }

    // --------------------------------------------------------
    // Generate a unique ID.
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Clear customization inputs after adding.
    // --------------------------------------------------------

    setCustomizationName("");

    setNumberInputs((previous) => ({
      ...previous,
      customizationPrice: "",
    }));
  };

  // ==========================================================
  // REMOVE CUSTOMIZATION
  // ==========================================================

  const handleRemoveCustomization = (
    id: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      customizations:
        previous.customizations?.filter(
          (customization) =>
            customization.id !== id,
        ) ?? [],
    }));
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    // ========================================================
    // CLEAN BASIC TEXT
    // ========================================================

    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Menu item name is required.",
      );

      return;
    }

    // ========================================================
    // CONVERT PRICE STRING → NUMBER
    // ========================================================

    const priceText =
      numberInputs.price.trim();

    const price =
      priceText === ""
        ? NaN
        : Number(priceText);

    if (!Number.isFinite(price) || price <= 0) {
      setError(
        "Price must be greater than 0.",
      );

      return;
    }

    // ========================================================
    // ORIGINAL PRICE
    // ========================================================

    const originalPriceText =
      numberInputs.originalPrice.trim();

    const originalPrice =
      originalPriceText === ""
        ? undefined
        : Number(originalPriceText);

    if (
      originalPrice !== undefined &&
      (!Number.isFinite(originalPrice) ||
        originalPrice < 0)
    ) {
      setError(
        "Original price must be 0 or greater.",
      );

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
      !Number.isFinite(
        preparationTime,
      ) ||
      preparationTime < 0
    ) {
      setError(
        "Preparation time must be 0 or greater.",
      );

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

      description:
        form.description?.trim() || "",

      details:
        form.details?.trim() || "",

      price,

      originalPrice,

      image:
        form.image?.trim() || "",

      isAvailable:
        form.isAvailable,

      preparationTime,

      tags,

      customizations:
        form.customizations ?? [],
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

      <div
        style={{
          marginBottom: "24px",
        }}
      >
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

        <h1
          style={{
            margin:
              "6px 0 0",
          }}
        >
          Add Menu Item
        </h1>

        <p
          style={{
            margin:
              "8px 0 0",
            opacity: 0.7,
          }}
        >
          Add a new item to the Smart
          Cafe menu.
        </p>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border:
              "1px solid #fca5a5",
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
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        {/* ==================================================
            BASIC INFORMATION
        ================================================== */}

        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Basic Information</h2>

          {/* NAME */}

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Item Name
          </label>

          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              updateField(
                "name",
                event.target.value,
              )
            }
            placeholder="Example: Chicken Burger"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          {/* CATEGORY */}

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Category
          </label>

          <select
            value={form.category}
            onChange={(event) =>
              handleCategoryChange(
                event.target
                  .value as MenuCategory,
              )
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
            }}
          >
            {CATEGORY_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          {/* FOOD TYPE */}

          {form.category !==
            "drinks" &&
            form.category !==
              "desserts" && (
              <>
                <label
                  style={{
                    display: "block",
                    marginTop: "16px",
                    fontWeight: 600,
                  }}
                >
                  Food Type
                </label>

                <select
                  value={
                    form.foodType ??
                    "veg"
                  }
                  onChange={(event) =>
                    updateField(
                      "foodType",
                      event.target
                        .value as FoodType,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                  }}
                >
                  <option value="veg">
                    Veg
                  </option>

                  <option value="non-veg">
                    Non-Veg
                  </option>
                </select>
              </>
            )}

          {/* DESCRIPTION */}

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Short Description
          </label>

          <textarea
            value={
              form.description ??
              ""
            }
            onChange={(event) =>
              updateField(
                "description",
                event.target.value,
              )
            }
            rows={3}
            placeholder="Short description..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          {/* DETAILS */}

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Details
          </label>

          <textarea
            value={
              form.details ??
              ""
            }
            onChange={(event) =>
              updateField(
                "details",
                event.target.value,
              )
            }
            rows={4}
            placeholder="Detailed information..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* ==================================================
            PRICING
        ================================================== */}

        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Pricing</h2>

          {/* PRICE */}

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Selling Price
          </label>

          <input
            type="text"
            inputMode="decimal"
            value={
              numberInputs.price
            }
            onChange={(event) =>
              updateNumberInput(
                "price",
                event.target.value,
              )
            }
            placeholder="Example: 149"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          {/* ORIGINAL PRICE */}

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Original Price
          </label>

          <input
            type="text"
            inputMode="decimal"
            value={
              numberInputs.originalPrice
            }
            onChange={(event) =>
              updateNumberInput(
                "originalPrice",
                event.target.value,
              )
            }
            placeholder="Optional"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* ==================================================
            IMAGE
        ================================================== */}

        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Image</h2>

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Image Path / URL
          </label>

          <input
            type="text"
            value={
              form.image ?? ""
            }
            onChange={(event) =>
              updateField(
                "image",
                event.target.value,
              )
            }
            placeholder="/images/food/burger.jpg"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          {form.image && (
            <img
              src={form.image}
              alt="Preview"
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

        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Preparation</h2>

          <label
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Preparation Time
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={
              numberInputs.preparationTime
            }
            onChange={(event) =>
              updateNumberInput(
                "preparationTime",
                event.target.value,
              )
            }
            placeholder="Example: 10"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* ==================================================
            TAGS
        ================================================== */}

        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Tags</h2>

          <p
            style={{
              opacity: 0.7,
            }}
          >
            Separate tags using commas.
          </p>

          <input
            type="text"
            value={tagsText}
            onChange={(event) =>
              setTagsText(
                event.target.value,
              )
            }
            placeholder="popular, spicy, bestseller"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
            }}
          />
        </div>

        {/* ==================================================
            CUSTOMIZATIONS
        ================================================== */}

        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>
            Customizations
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1fr auto",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <input
              type="text"
              value={
                customizationName
              }
              onChange={(event) =>
                setCustomizationName(
                  event.target.value,
                )
              }
              placeholder="Example: Extra Cheese"
            />

            <input
              type="text"
              inputMode="decimal"
              value={
                numberInputs.customizationPrice
              }
              onChange={(event) =>
                updateNumberInput(
                  "customizationPrice",
                  event.target.value,
                )
              }
              placeholder="Price"
            />

            <button
              type="button"
              onClick={
                handleAddCustomization
              }
            >
              Add
            </button>
          </div>

          {form.customizations &&
            form.customizations.length >
              0 && (
              <div
                style={{
                  marginTop: "16px",
                  display: "grid",
                  gap: "8px",
                }}
              >
                {form.customizations.map(
                  (customization) => (
                    <div
                      key={
                        customization.id
                      }
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "10px",
                        padding:
                          "10px",
                        border:
                          "1px solid #eee",
                        borderRadius:
                          "8px",
                      }}
                    >
                      <span>
                        {
                          customization.name
                        }{" "}
                        — ₹
                        {
                          customization.price ??
                            0
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveCustomization(
                            customization.id,
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ),
                )}
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
            checked={
              form.isAvailable
            }
            onChange={(event) =>
              updateField(
                "isAvailable",
                event.target.checked,
              )
            }
          />

          Available for customers
        </label>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
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
            onClick={() =>
              navigate("/admin/menu")
            }
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