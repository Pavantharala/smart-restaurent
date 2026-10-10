
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
  MenuCustomizationGroup,
  MenuCustomizationOption,
  MenuItem,
} from "../../types/Menu";

// ============================================================
// SMART CAFE - ADMIN EDIT MENU ITEM
//
// Numeric inputs remain strings while the administrator types.
// They are converted to numbers only when Save is clicked.
//
// CUSTOMIZATION GROUPS:
// - Supports single-choice and multiple-choice groups.
// - Supports required selections and selection limits.
// - Supports option prices and option availability.
// - Existing menu item customizations are preserved and editable.
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

const sectionStyle = {
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "12px",
} as const;

const labelStyle = {
  display: "block",
  marginTop: "16px",
  fontWeight: 600,
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  marginTop: "6px",
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

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

  // New customization group form.
  const [groupName, setGroupName] = useState("");
  const [groupSelectionType, setGroupSelectionType] = useState<
    "single" | "multiple"
  >("single");
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMinSelections, setGroupMinSelections] = useState("0");
  const [groupMaxSelections, setGroupMaxSelections] = useState("1");

  const [groupOptionName, setGroupOptionName] = useState("");
  const [groupOptionPrice, setGroupOptionPrice] = useState("");
  const [draftOptions, setDraftOptions] = useState<
    MenuCustomizationOption[]
  >([]);

  // Temporary option input for each existing group.
  const [existingGroupOptionInputs, setExistingGroupOptionInputs] =
    useState<
      Record<string, { name: string; price: string }>
    >({});

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
      customizationGroups: (item.customizationGroups ?? []).map(
        (group) => ({
          ...group,
          options: group.options.map((option) => ({ ...option })),
        }),
      ),
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
    setExistingGroupOptionInputs({});
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
      id: createId("custom"),
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

  // Update an existing customization group's settings.
  const handleUpdateGroup = (
    groupId: string,
    changes: Partial<MenuCustomizationGroup>,
  ) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizationGroups: (
          previous.customizationGroups ?? []
        ).map((group) =>
          group.id === groupId
            ? { ...group, ...changes }
            : group,
        ),
      };
    });
  };

  // Update an option inside an existing customization group.
  const handleUpdateGroupOption = (
    groupId: string,
    optionId: string,
    changes: Partial<MenuCustomizationOption>,
  ) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizationGroups: (
          previous.customizationGroups ?? []
        ).map((group) =>
          group.id === groupId
            ? {
                ...group,
                options: group.options.map((option) =>
                  option.id === optionId
                    ? { ...option, ...changes }
                    : option,
                ),
              }
            : group,
        ),
      };
    });
  };

  // Remove a group option.
  const handleRemoveGroupOption = (
    groupId: string,
    optionId: string,
  ) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizationGroups: (
          previous.customizationGroups ?? []
        ).map((group) => {
          if (group.id !== groupId) {
            return group;
          }

          const options = group.options.filter(
            (option) => option.id !== optionId,
          );

          const maxSelections =
            group.selectionType === "single"
              ? 1
              : group.maxSelections === undefined
                ? undefined
                : Math.min(group.maxSelections, options.length);

          const minSelections = Math.min(
            group.minSelections ?? (group.required ? 1 : 0),
            options.length,
          );

          return {
            ...group,
            options,
            minSelections,
            maxSelections,
          };
        }),
      };
    });
  };

  // Add an option to an existing customization group.
  const handleAddOptionToExistingGroup = (groupId: string) => {
    setError("");

    const inputs = existingGroupOptionInputs[groupId] ?? {
      name: "",
      price: "",
    };

    const name = inputs.name.trim();
    const priceText = inputs.price.trim();
    const price = priceText === "" ? 0 : Number(priceText);

    if (!name) {
      setError("Enter an option name before adding it.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Option price must be 0 or greater.");
      return;
    }

    const option: MenuCustomizationOption = {
      id: createId("option"),
      name,
      price,
      isAvailable: true,
    };

    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizationGroups: (
          previous.customizationGroups ?? []
        ).map((group) => {
          if (group.id !== groupId) {
            return group;
          }

          const options = [...group.options, option];

          return {
            ...group,
            options,
            maxSelections:
              group.selectionType === "single"
                ? 1
                : group.maxSelections === undefined
                  ? undefined
                  : Math.min(
                      Math.max(group.maxSelections, 1),
                      options.length,
                    ),
          };
        }),
      };
    });

    setExistingGroupOptionInputs((previous) => ({
      ...previous,
      [groupId]: { name: "", price: "" },
    }));
  };

  // Change the selection type for an existing group.
  const handleExistingGroupSelectionTypeChange = (
    group: MenuCustomizationGroup,
    selectionType: "single" | "multiple",
  ) => {
    handleUpdateGroup(group.id, {
      selectionType,
      minSelections: group.required
        ? 1
        : Math.min(group.minSelections ?? 0, 1),
      maxSelections:
        selectionType === "single"
          ? 1
          : Math.max(
              group.maxSelections ?? group.options.length,
              1,
            ),
    });
  };

  // Remove an entire customization group.
  const handleRemoveGroup = (groupId: string) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizationGroups: (
          previous.customizationGroups ?? []
        ).filter((group) => group.id !== groupId),
      };
    });

    setExistingGroupOptionInputs((previous) => {
      const next = { ...previous };
      delete next[groupId];
      return next;
    });
  };

  // Add an option to the new group being created.
  const handleAddDraftOption = () => {
    setError("");

    const name = groupOptionName.trim();
    const priceText = groupOptionPrice.trim();
    const price = priceText === "" ? 0 : Number(priceText);

    if (!name) {
      setError("Enter an option name for the new group.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Option price must be 0 or greater.");
      return;
    }

    if (
      draftOptions.some(
        (option) =>
          option.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("This option already exists in the new group.");
      return;
    }

    setDraftOptions((previous) => [
      ...previous,
      {
        id: createId("option"),
        name,
        price,
        isAvailable: true,
      },
    ]);

    setGroupOptionName("");
    setGroupOptionPrice("");
  };

  // Remove an option from the new group before saving it.
  const handleRemoveDraftOption = (optionId: string) => {
    setDraftOptions((previous) =>
      previous.filter((option) => option.id !== optionId),
    );
  };

  // Keep required selection rules consistent in the new group form.
  const handleNewGroupRequiredChange = (required: boolean) => {
    setGroupRequired(required);

    if (required) {
      setGroupMinSelections((previous) =>
        Math.max(Number(previous) || 0, 1).toString(),
      );
    } else {
      setGroupMinSelections("0");
    }
  };

  // Keep the selection limit sensible when the new group type changes.
  const handleNewGroupSelectionTypeChange = (
    selectionType: "single" | "multiple",
  ) => {
    setGroupSelectionType(selectionType);

    if (selectionType === "single") {
      setGroupMaxSelections("1");
      setGroupMinSelections(groupRequired ? "1" : "0");
    } else {
      setGroupMaxSelections(
        Math.max(draftOptions.length, 1).toString(),
      );
      setGroupMinSelections(groupRequired ? "1" : "0");
    }
  };

  // Add the finished group to the menu item.
  const handleAddCustomizationGroup = () => {
    setError("");

    if (!form) {
      setError("The menu item has not loaded yet.");
      return;
    }

    const name = groupName.trim();

    if (!name) {
      setError("Customization group name is required.");
      return;
    }

    if (
      (form.customizationGroups ?? []).some(
        (group) =>
          group.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("A customization group with this name already exists.");
      return;
    }

    if (draftOptions.length === 0) {
      setError("Add at least one option to the customization group.");
      return;
    }

    const minSelections = Number(groupMinSelections);
    const maxSelections = Number(groupMaxSelections);

    if (
      !Number.isInteger(minSelections) ||
      minSelections < 0
    ) {
      setError("Minimum selections must be a whole number of 0 or greater.");
      return;
    }

    if (
      !Number.isInteger(maxSelections) ||
      maxSelections < 1
    ) {
      setError("Maximum selections must be a whole number greater than 0.");
      return;
    }

    if (groupRequired && minSelections < 1) {
      setError("A required group must have at least one minimum selection.");
      return;
    }

    if (
      groupSelectionType === "single" &&
      (minSelections > 1 || maxSelections !== 1)
    ) {
      setError("A single-choice group can have a maximum of one selection.");
      return;
    }

    if (
      groupSelectionType === "multiple" &&
      maxSelections > draftOptions.length
    ) {
      setError("Maximum selections cannot exceed the number of options.");
      return;
    }

    if (minSelections > maxSelections) {
      setError("Minimum selections cannot exceed maximum selections.");
      return;
    }

    const newGroup: MenuCustomizationGroup = {
      id: createId("group"),
      name,
      selectionType: groupSelectionType,
      required: groupRequired,
      minSelections,
      maxSelections,
      options: draftOptions.map((option) => ({ ...option })),
    };

    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        customizationGroups: [
          ...(previous.customizationGroups ?? []),
          newGroup,
        ],
      };
    });

    setGroupName("");
    setGroupSelectionType("single");
    setGroupRequired(false);
    setGroupMinSelections("0");
    setGroupMaxSelections("1");
    setGroupOptionName("");
    setGroupOptionPrice("");
    setDraftOptions([]);
  };

  // Validate existing customization groups before saving.
  const validateCustomizationGroups = (
    groups: MenuCustomizationGroup[],
  ): string | null => {
    const seenNames = new Set<string>();

    for (const group of groups) {
      const groupNameValue = group.name.trim();

      if (!groupNameValue) {
        return "Every customization group must have a name.";
      }

      const normalizedName = groupNameValue.toLowerCase();

      if (seenNames.has(normalizedName)) {
        return `The customization group "${groupNameValue}" is duplicated.`;
      }

      seenNames.add(normalizedName);

      if (group.options.length === 0) {
        return `Add at least one option to "${groupNameValue}".`;
      }

      const seenOptionNames = new Set<string>();

      for (const option of group.options) {
        const optionName = option.name.trim();

        if (!optionName) {
          return `Every option in "${groupNameValue}" must have a name.`;
        }

        const normalizedOptionName = optionName.toLowerCase();

        if (seenOptionNames.has(normalizedOptionName)) {
          return `The option "${optionName}" is duplicated in "${groupNameValue}".`;
        }

        seenOptionNames.add(normalizedOptionName);

        if (!Number.isFinite(option.price) || option.price < 0) {
          return `The price for "${optionName}" must be 0 or greater.`;
        }
      }

      const minSelections =
        group.minSelections ?? (group.required ? 1 : 0);

      const maxSelections =
        group.selectionType === "single"
          ? 1
          : group.maxSelections ?? group.options.length;

      if (
        !Number.isInteger(minSelections) ||
        minSelections < 0
      ) {
        return `Minimum selections for "${groupNameValue}" must be a whole number of 0 or greater.`;
      }

      if (
        !Number.isInteger(maxSelections) ||
        maxSelections < 1 ||
        maxSelections > group.options.length
      ) {
        return `Maximum selections for "${groupNameValue}" must be between 1 and the number of options.`;
      }

      if (group.required && minSelections < 1) {
        return `"${groupNameValue}" is required, so its minimum selections must be at least 1.`;
      }

      if (minSelections > maxSelections) {
        return `Minimum selections cannot exceed maximum selections for "${groupNameValue}".`;
      }

      if (
        group.selectionType === "single" &&
        (minSelections > 1 || maxSelections !== 1)
      ) {
        return `"${groupNameValue}" is a single-choice group and can allow only one selection.`;
      }
    }

    return null;
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

    const groups = (form.customizationGroups ?? []).map(
      (group) => ({
        ...group,
        name: group.name.trim(),
        minSelections:
          group.minSelections ?? (group.required ? 1 : 0),
        maxSelections:
          group.selectionType === "single"
            ? 1
            : group.maxSelections,
        options: group.options.map((option) => ({
          ...option,
          name: option.name.trim(),
          price: Number(option.price),
        })),
      }),
    );

    const groupValidationError =
      validateCustomizationGroups(groups);

    if (groupValidationError) {
      setError(groupValidationError);
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
      customizations: (form.customizations ?? []).map(
        (customization) => ({
          ...customization,
          name: customization.name.trim(),
          price: Number(customization.price ?? 0),
        }),
      ),
      customizationGroups: groups,
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
        <div style={sectionStyle}>
          <h2>Basic Information</h2>

          <label htmlFor="menu-name" style={labelStyle}>
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
            style={inputStyle}
          />

          <label htmlFor="menu-category" style={labelStyle}>
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
                <label htmlFor="menu-food-type" style={labelStyle}>
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
                  style={inputStyle}
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
              </>
            )}

          <label htmlFor="menu-description" style={labelStyle}>
            Short Description
          </label>

          <textarea
            id="menu-description"
            value={form.description ?? ""}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            rows={3}
            style={inputStyle}
          />

          <label htmlFor="menu-details" style={labelStyle}>
            Details
          </label>

          <textarea
            id="menu-details"
            value={form.details ?? ""}
            onChange={(event) =>
              updateField("details", event.target.value)
            }
            rows={4}
            style={inputStyle}
          />
        </div>

        {/* PRICING */}
        <div style={sectionStyle}>
          <h2>Pricing</h2>

          <label htmlFor="menu-price" style={labelStyle}>
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
            style={inputStyle}
          />

          <label htmlFor="menu-original-price" style={labelStyle}>
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
            style={inputStyle}
          />
        </div>

        {/* IMAGE */}
        <div style={sectionStyle}>
          <h2>Image</h2>

          <label htmlFor="menu-image" style={labelStyle}>
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
            style={inputStyle}
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
        <div style={sectionStyle}>
          <h2>Preparation</h2>

          <label
            htmlFor="menu-preparation-time"
            style={labelStyle}
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
            style={inputStyle}
          />
        </div>

        {/* TAGS */}
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

        {/* CUSTOMIZATIONS */}
        <div style={sectionStyle}>
          <h2>Customizations</h2>

          <p style={{ opacity: 0.7 }}>
            Use these for simple optional extras, such as Extra
            Cheese or Extra Sauce. Use Customization Groups below
            for choices such as Size or Toppings.
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
              {(form.customizations ?? []).map((customization) => (
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

        {/* CUSTOMIZATION GROUPS */}
        <div style={sectionStyle}>
          <h2>Customization Groups</h2>

          <p style={{ opacity: 0.7 }}>
            Edit existing groups or create groups such as Choose
            Size, Select Toppings, or Choose a Drink. Group options
            can have their own prices and availability.
          </p>

          {/* EXISTING GROUPS */}
          {(form.customizationGroups ?? []).length === 0 ? (
            <p style={{ opacity: 0.7 }}>
              No customization groups have been added to this item.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              {(form.customizationGroups ?? []).map((group) => {
                const optionInput =
                  existingGroupOptionInputs[group.id] ?? {
                    name: "",
                    price: "",
                  };

                return (
                  <div
                    key={group.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>
                        {group.name}
                      </h3>

                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(group.id)}
                      >
                        Remove Group
                      </button>
                    </div>

                    <label
                      htmlFor={`group-name-${group.id}`}
                      style={labelStyle}
                    >
                      Group Name
                    </label>

                    <input
                      id={`group-name-${group.id}`}
                      type="text"
                      value={group.name}
                      onChange={(event) =>
                        handleUpdateGroup(group.id, {
                          name: event.target.value,
                        })
                      }
                      style={inputStyle}
                    />

                    <label
                      htmlFor={`group-type-${group.id}`}
                      style={labelStyle}
                    >
                      Selection Type
                    </label>

                    <select
                      id={`group-type-${group.id}`}
                      value={group.selectionType}
                      onChange={(event) =>
                        handleExistingGroupSelectionTypeChange(
                          group,
                          event.target.value as
                            | "single"
                            | "multiple",
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="single">
                        Single choice
                      </option>
                      <option value="multiple">
                        Multiple choices
                      </option>
                    </select>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "14px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={group.required}
                        onChange={(event) => {
                          const required = event.target.checked;

                          handleUpdateGroup(group.id, {
                            required,
                            minSelections: required
                              ? Math.max(
                                  group.minSelections ?? 0,
                                  1,
                                )
                              : 0,
                          });
                        }}
                      />
                      Customer must make a selection
                    </label>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginTop: "14px",
                      }}
                    >
                      <div>
                        <label
                          htmlFor={`group-min-${group.id}`}
                          style={{ fontWeight: 600 }}
                        >
                          Minimum selections
                        </label>

                        <input
                          id={`group-min-${group.id}`}
                          type="number"
                          min={group.required ? 1 : 0}
                          max={
                            group.selectionType === "single"
                              ? 1
                              : group.options.length
                          }
                          value={
                            group.minSelections ??
                            (group.required ? 1 : 0)
                          }
                          onChange={(event) =>
                            handleUpdateGroup(group.id, {
                              minSelections:
                                event.target.value === ""
                                  ? 0
                                  : Number(event.target.value),
                            })
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`group-max-${group.id}`}
                          style={{ fontWeight: 600 }}
                        >
                          Maximum selections
                        </label>

                        <input
                          id={`group-max-${group.id}`}
                          type="number"
                          min={1}
                          max={group.options.length}
                          disabled={
                            group.selectionType === "single"
                          }
                          value={
                            group.selectionType === "single"
                              ? 1
                              : group.maxSelections ??
                                group.options.length
                          }
                          onChange={(event) =>
                            handleUpdateGroup(group.id, {
                              maxSelections:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <h4 style={{ marginBottom: "8px" }}>
                      Options
                    </h4>

                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      {group.options.map((option) => (
                        <div
                          key={option.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(120px, 2fr) minmax(90px, 1fr) auto",
                            gap: "8px",
                            alignItems: "center",
                            padding: "10px",
                            border: "1px solid #eee",
                            borderRadius: "8px",
                          }}
                        >
                          <input
                            type="text"
                            aria-label={`${option.name} option name`}
                            value={option.name}
                            onChange={(event) =>
                              handleUpdateGroupOption(
                                group.id,
                                option.id,
                                { name: event.target.value },
                              )
                            }
                            style={{
                              ...inputStyle,
                              marginTop: 0,
                            }}
                          />

                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            aria-label={`${option.name} option price`}
                            value={option.price}
                            onChange={(event) =>
                              handleUpdateGroupOption(
                                group.id,
                                option.id,
                                {
                                  price:
                                    event.target.value === ""
                                      ? 0
                                      : Number(event.target.value),
                                },
                              )
                            }
                            style={{
                              ...inputStyle,
                              marginTop: 0,
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveGroupOption(
                                group.id,
                                option.id,
                              )
                            }
                          >
                            Remove
                          </button>

                          <label
                            style={{
                              gridColumn: "1 / -1",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={option.isAvailable !== false}
                              onChange={(event) =>
                                handleUpdateGroupOption(
                                  group.id,
                                  option.id,
                                  {
                                    isAvailable:
                                      event.target.checked,
                                  },
                                )
                              }
                            />
                            Available to customers
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* ADD AN OPTION TO THIS EXISTING GROUP */}
                    <h4 style={{ marginBottom: "8px" }}>
                      Add Option
                    </h4>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(120px, 2fr) minmax(90px, 1fr) auto",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        value={optionInput.name}
                        onChange={(event) =>
                          setExistingGroupOptionInputs((previous) => ({
                            ...previous,
                            [group.id]: {
                              ...optionInput,
                              name: event.target.value,
                            },
                          }))
                        }
                        placeholder="Option name"
                        aria-label={`New option name for ${group.name}`}
                      />

                      <input
                        type="text"
                        inputMode="decimal"
                        value={optionInput.price}
                        onChange={(event) => {
                          const value = event.target.value;

                          if (
                            value !== "" &&
                            !/^\d*\.?\d*$/.test(value)
                          ) {
                            return;
                          }

                          setExistingGroupOptionInputs((previous) => ({
                            ...previous,
                            [group.id]: {
                              ...optionInput,
                              price: value,
                            },
                          }));
                        }}
                        placeholder="Price"
                        aria-label={`New option price for ${group.name}`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleAddOptionToExistingGroup(group.id)
                        }
                      >
                        Add Option
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CREATE A NEW GROUP */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              border: "1px dashed #aaa",
              borderRadius: "10px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Add New Customization Group
            </h3>

            <label htmlFor="new-group-name" style={labelStyle}>
              Group Name
            </label>

            <input
              id="new-group-name"
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Example: Choose Size"
              style={inputStyle}
            />

            <label htmlFor="new-group-type" style={labelStyle}>
              Selection Type
            </label>

            <select
              id="new-group-type"
              value={groupSelectionType}
              onChange={(event) =>
                handleNewGroupSelectionTypeChange(
                  event.target.value as "single" | "multiple",
                )
              }
              style={inputStyle}
            >
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choices</option>
            </select>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={groupRequired}
                onChange={(event) =>
                  handleNewGroupRequiredChange(event.target.checked)
                }
              />
              Customer must make a selection
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "14px",
              }}
            >
              <div>
                <label
                  htmlFor="new-group-min"
                  style={{ fontWeight: 600 }}
                >
                  Minimum selections
                </label>

                <input
                  id="new-group-min"
                  type="number"
                  min={groupRequired ? 1 : 0}
                  max={
                    groupSelectionType === "single"
                      ? 1
                      : draftOptions.length
                  }
                  value={groupMinSelections}
                  onChange={(event) =>
                    setGroupMinSelections(event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="new-group-max"
                  style={{ fontWeight: 600 }}
                >
                  Maximum selections
                </label>

                <input
                  id="new-group-max"
                  type="number"
                  min={1}
                  max={draftOptions.length || 1}
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

            <h4>Add Group Options</h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(120px, 2fr) minmax(90px, 1fr) auto",
                gap: "8px",
              }}
            >
              <input
                type="text"
                value={groupOptionName}
                onChange={(event) =>
                  setGroupOptionName(event.target.value)
                }
                placeholder="Option name"
                aria-label="New group option name"
              />

              <input
                type="text"
                inputMode="decimal"
                value={groupOptionPrice}
                onChange={(event) => {
                  const value = event.target.value;

                  if (
                    value !== "" &&
                    !/^\d*\.?\d*$/.test(value)
                  ) {
                    return;
                  }

                  setGroupOptionPrice(value);
                }}
                placeholder="Extra price"
                aria-label="New group option price"
              />

              <button
                type="button"
                onClick={handleAddDraftOption}
              >
                Add Option
              </button>
            </div>

            {draftOptions.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  marginTop: "14px",
                }}
              >
                {draftOptions.map((option) => (
                  <div
                    key={option.id}
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
                      {option.name} — ₹{option.price}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveDraftOption(option.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddCustomizationGroup}
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Add Customization Group
            </button>
          </div>
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
