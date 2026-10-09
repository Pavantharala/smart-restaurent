
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useMenu,
  type CreateMenuItemInput,
} from "../../context/MenuContext";

import type {
  FoodType,
  MenuCategory,
  MenuCustomization,
  MenuItem,
} from "../../types/Menu";

// ============================================================
// SMART CAFE - ADMIN EDIT MENU ITEM
//
// Numeric inputs remain strings while the administrator types.
// They are converted to numbers only when Save is clicked.
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

export default function EditMenuItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const { getItemById, updateMenuItem } = useMenu();

  const item = itemId ? getItemById(itemId) : undefined;

  const [form, setForm] = useState<CreateMenuItemInput | null>(
    null,
  );

  const [numberInputs, setNumberInputs] = useState({
    price: "",
    originalPrice: "",
    preparationTime: "",
    customizationPrice: "",
  });

  const [tagsText, setTagsText] = useState("");
  const [customizationName, setCustomizationName] = useState("");
  const [error, setError] = useState("");

  // Load the selected menu item into a separate editable form.
  useEffect(() => {
    if (!item) {
      setForm(null);
      return;
    }

    setForm({
      name: item.name,
      category: item.category,
      foodType: item.foodType,
      description: item.description ?? "",
      details: item.details ?? "",
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image ?? "",
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime ?? 0,
      tags: item.tags ?? [],
      customizations: item.customizations ?? [],
    });

    setNumberInputs({
      price: String(item.price),
      originalPrice:
        item.originalPrice !== undefined
          ? String(item.originalPrice)
          : "",
      preparationTime:
        item.preparationTime !== undefined
          ? String(item.preparationTime)
          : "",
      customizationPrice: "",
    });

    setTagsText((item.tags ?? []).join(", "));
    setError("");
  }, [item]);

  // Update a single form field without changing other fields.
  const updateField = <K extends keyof CreateMenuItemInput>(
    field: K,
    value: CreateMenuItemInput[K],
  ) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  // Keep numeric inputs as strings while the user types.
  const updateNumberInput = (
    field:
      | "price"
      | "originalPrice"
      | "preparationTime"
      | "customizationPrice",
    value: string,
  ) => {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setNumberInputs((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Adjust food type when the category changes.
  const handleCategoryChange = (category: MenuCategory) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        category,
        foodType:
          category === "drinks" || category === "desserts"
            ? undefined
            : previous.foodType ?? "veg",
      };
    });
  };

  // Add a customization option to the menu item.
  const handleAddCustomization = () => {
    setError("");

    if (!form) {
      setError("The menu item has not loaded yet.");
      return;
    }

    const name = customizationName.trim();

    if (!name) {
      setError("Customization name is required.");
      return;
    }

    const priceText = numberInputs.customizationPrice.trim();
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

    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizations: [
          ...(previous.customizations ?? []),
          customization,
        ],
      };
    });

    setCustomizationName("");

    setNumberInputs((previous) => ({
      ...previous,
      customizationPrice: "",
    }));
  };

  // Remove a customization option.
  const handleRemoveCustomization = (id: string) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizations:
          previous.customizations?.filter(
            (customization) => customization.id !== id,
          ) ?? [],
      };
    });
  };

  // Validate the form and save the updated menu item.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!itemId || !form || !item) {
      setError("Menu item could not be loaded.");
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Menu item name is required.");
      return;
    }

    const priceText = numberInputs.price.trim();
    const price = priceText === "" ? NaN : Number(priceText);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

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

    const tags = Array.from(
      new Set(
        tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );

    const cleanedData: Partial<Omit<MenuItem, "id">> = {
      name,
      category: form.category,

      foodType:
        form.category === "drinks" ||
        form.category === "desserts"
          ? undefined
          : form.foodType ?? ("veg" as FoodType),

      description: form.description?.trim() ?? "",
      details: form.details?.trim() ?? "",
      price,
      originalPrice,
      image: form.image?.trim() ?? "",
      isAvailable: form.isAvailable,
      preparationTime,
      tags,
      customizations: form.customizations ?? [],
    };

    updateMenuItem(itemId, cleanedData);
    navigate("/admin/menu");
  };

  // Show a message if the requested menu item does not exist.
  if (!item) {
    return (
      <section
        style={{
          padding: "24px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1>Menu item not found</h1>

        <p>
          The menu item may have been deleted or the ID is
          invalid.
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/menu")}
        >
          Back to Menu
        </button>
      </section>
    );
  }

  if (!form) {
    return (
      <section
        style={{
          padding: "24px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1>Loading menu item...</h1>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
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
          Edit Menu Item
        </h1>

        <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
          Update this menu item without editing code.
        </p>
      </header>

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

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        {/* BASIC INFORMATION */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Basic Information</h2>

          <label
            htmlFor="menu-name"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Item Name
          </label>

          <input
            id="menu-name"
            type="text"
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          <label
            htmlFor="menu-category"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Category
          </label>

          <select
            id="menu-category"
            value={form.category}
            onChange={(event) =>
              handleCategoryChange(
                event.target.value as MenuCategory,
              )
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
            }}
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
                <label
                  htmlFor="menu-food-type"
                  style={{
                    display: "block",
                    marginTop: "16px",
                    fontWeight: 600,
                  }}
                >
                  Food Type
                </label>

                <select
                  id="menu-food-type"
                  value={form.foodType ?? "veg"}
                  onChange={(event) =>
                    updateField(
                      "foodType",
                      event.target.value as FoodType,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                  }}
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
              </>
            )}

          <label
            htmlFor="menu-description"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Short Description
          </label>

          <textarea
            id="menu-description"
            value={form.description ?? ""}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          <label
            htmlFor="menu-details"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Details
          </label>

          <textarea
            id="menu-details"
            value={form.details ?? ""}
            onChange={(event) =>
              updateField("details", event.target.value)
            }
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* PRICING */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Pricing</h2>

          <label
            htmlFor="menu-price"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Selling Price (₹)
          </label>

          <input
            id="menu-price"
            type="text"
            inputMode="decimal"
            value={numberInputs.price}
            onChange={(event) =>
              updateNumberInput("price", event.target.value)
            }
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />

          <label
            htmlFor="menu-original-price"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Original Price (₹)
          </label>

          <input
            id="menu-original-price"
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
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* IMAGE */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Image</h2>

          <label
            htmlFor="menu-image"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Image Path / URL
          </label>

          <input
            id="menu-image"
            type="text"
            value={form.image ?? ""}
            onChange={(event) =>
              updateField("image", event.target.value)
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
              alt={form.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
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

        {/* PREPARATION */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Preparation</h2>

          <label
            htmlFor="menu-preparation-time"
            style={{
              display: "block",
              marginTop: "16px",
              fontWeight: 600,
            }}
          >
            Preparation Time (minutes)
          </label>

          <input
            id="menu-preparation-time"
            type="text"
            inputMode="numeric"
            value={numberInputs.preparationTime}
            onChange={(event) =>
              updateNumberInput(
                "preparationTime",
                event.target.value,
              )
            }
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* TAGS */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Tags</h2>

          <p style={{ opacity: 0.7 }}>
            Separate tags using commas.
          </p>

          <input
            type="text"
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            placeholder="popular, spicy, bestseller"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
            }}
          />
        </div>

        {/* CUSTOMIZATIONS */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Customizations</h2>

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
              aria-label="Customization name"
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
              aria-label="Customization price"
            />

            <button type="button" onClick={handleAddCustomization}>
              Add
            </button>
          </div>

          {(form.customizations ?? []).length > 0 && (
            <div
              style={{
                marginTop: "16px",
                display: "grid",
                gap: "8px",
              }}
            >
              {form.customizations!.map((customization) => (
                <div
                  key={customization.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    border: "1px solid #eee",
                    borderRadius: "8px",
                  }}
                >
                  <span>
                    {customization.name} — ₹
                    {customization.price ?? 0}
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
          )}
        </div>

        {/* AVAILABILITY */}
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

        {/* ACTIONS */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
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
            Save Changes
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

