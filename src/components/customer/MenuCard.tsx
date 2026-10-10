
// SMART RESTAURANT - CUSTOMER MENU CARD
// ============================================================
// Displays one restaurant menu item.
//
// FEATURES:
// - Product image
// - Product details link
// - Availability status
// - Veg / Non-Veg classification
// - Price and original price
// - Grouped customer customizations
// - Required, minimum and maximum selection validation
// - Add-on price calculation
// - Add to cart
//
// FOOD TYPE RULE:
// - Food     -> Veg / Non-Veg
// - Snacks   -> Veg / Non-Veg
// - Drinks   -> No Veg / Non-Veg
// - Desserts -> No Veg / Non-Veg
// - Specials -> No Veg / Non-Veg
// ============================================================

import {
  Check,
  Plus,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import type {
  MenuCustomization,
  MenuItem,
} from "../../types/Menu";

import {
  useCart,
} from "../../context/CartContext";

import {
  formatCurrency,
} from "../../utils/formatCurrency";

interface MenuCardProps {
  item: MenuItem;
}

export default function MenuCard({
  item,
}: MenuCardProps) {
  // ==========================================================
  // CART
  // ==========================================================

  const { addItem } = useCart();

  // ==========================================================
  // CUSTOMER CUSTOMIZATION STATE
  //
  // Each group stores the IDs of its selected options.
  // Single-selection groups contain at most one option.
  // Multiple-selection groups can contain several options.
  // ==========================================================

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string[]>>({});

  const [validationError, setValidationError] =
    useState("");

  const customizationGroups =
    item.customizationGroups ?? [];

  // ==========================================================
  // HANDLE OPTION SELECTION
  // ==========================================================

  function handleOptionChange(
    groupId: string,
    optionId: string,
    selectionType: "single" | "multiple",
    checked: boolean,
    maxSelections?: number,
  ) {
    setValidationError("");

    setSelectedOptions((current) => {
      const currentSelections =
        current[groupId] ?? [];

      // Single-choice group: replace the previous option.
      if (selectionType === "single") {
        return {
          ...current,
          [groupId]: checked ? [optionId] : [],
        };
      }

      // Remove an option when it is unchecked.
      if (!checked) {
        return {
          ...current,
          [groupId]: currentSelections.filter(
            (id) => id !== optionId,
          ),
        };
      }

      // Do not select the same option twice.
      if (currentSelections.includes(optionId)) {
        return current;
      }

      // Enforce the maximum number of selections.
      if (
        maxSelections !== undefined &&
        currentSelections.length >= maxSelections
      ) {
        return current;
      }

      return {
        ...current,
        [groupId]: [
          ...currentSelections,
          optionId,
        ],
      };
    });
  }

  // ==========================================================
  // CALCULATE SELECTED ADD-ON PRICE
  // ==========================================================

  const selectedCustomizationTotal =
    customizationGroups.reduce(
      (groupTotal, group) => {
        const selectedIds =
          selectedOptions[group.id] ?? [];

        const optionsTotal = group.options.reduce(
          (total, option) => {
            if (
              selectedIds.includes(option.id) &&
              option.isAvailable !== false
            ) {
              return total + option.price;
            }

            return total;
          },
          0,
        );

        return groupTotal + optionsTotal;
      },
      0,
    );

  // ==========================================================
  // ADD ITEM TO CART
  // ==========================================================

  function handleAddToCart() {
    setValidationError("");

    // Preserve existing one-click behavior for ordinary items.
    if (customizationGroups.length === 0) {
      addItem(item);
      return;
    }

    // Validate every customization group.
    for (const group of customizationGroups) {
      const selectedIds =
        selectedOptions[group.id] ?? [];

      const minSelections =
        group.minSelections ??
        (group.required ? 1 : 0);

      const maxSelections =
        group.maxSelections;

      if (selectedIds.length < minSelections) {
        setValidationError(
          `Please select at least ${minSelections} option(s) for ${group.name}.`,
        );
        return;
      }

      if (
        maxSelections !== undefined &&
        selectedIds.length > maxSelections
      ) {
        setValidationError(
          `Select no more than ${maxSelections} option(s) for ${group.name}.`,
        );
        return;
      }

      // Prevent unavailable options from being added.
      const unavailableSelection =
        group.options.some(
          (option) =>
            selectedIds.includes(option.id) &&
            option.isAvailable === false,
        );

      if (unavailableSelection) {
        setValidationError(
          `One or more selected options in ${group.name} are unavailable.`,
        );
        return;
      }
    }

    // Convert grouped options to the existing cart format.
    //
    // Prefix IDs with group IDs so options from different
    // groups cannot accidentally be treated as identical.
    const cartCustomizations: MenuCustomization[] =
      customizationGroups.flatMap((group) => {
        const selectedIds =
          selectedOptions[group.id] ?? [];

        return group.options
          .filter(
            (option) =>
              selectedIds.includes(option.id) &&
              option.isAvailable !== false,
          )
          .map((option) => ({
            id: `${group.id}::${option.id}`,
            name: `${group.name}: ${option.name}`,
            price: option.price,
          }));
      });

    // CartContext calculates the final unit price and
    // saves a snapshot of the selected customization prices.
    addItem(item, 1, cartCustomizations);

    // Reset selections after adding the configured item.
    setSelectedOptions({});
    setValidationError("");
  }

  // ==========================================================
  // FOOD TYPE SUPPORT
  //
  // Only Food and Snacks can have Veg / Non-Veg.
  // ==========================================================

  const supportsFoodType =
    item.category === "food" ||
    item.category === "snacks";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <article className="menu-card">

      {/* ====================================================
          PRODUCT IMAGE
      ==================================================== */}

      <Link
        to={`/menu/${item.id}`}
        className="menu-card-image-link"
      >
        <div className="menu-card-image">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
            />
          ) : (
            <div className="menu-card-image-placeholder">
              🍽️
            </div>
          )}
        </div>
      </Link>

      {/* ====================================================
          PRODUCT INFORMATION
      ==================================================== */}

      <div className="menu-card-content">

        {/* PRODUCT HEADER */}

        <div className="menu-card-top">
          <Link
            to={`/menu/${item.id}`}
            className="menu-card-title-link"
          >
            <h3>{item.name}</h3>
          </Link>

          {item.isAvailable ? (
            <span className="availability available">
              <Check size={14} />
              Available
            </span>
          ) : (
            <span className="availability unavailable">
              <X size={14} />
              Unavailable
            </span>
          )}
        </div>

        {/* DESCRIPTION */}

        {item.description && (
          <p className="menu-card-description">
            {item.description}
          </p>
        )}

        {/* VEG / NON-VEG BADGE */}

        {supportsFoodType && item.foodType && (
          <div className="menu-card-food-type">
            {item.foodType === "veg" ? (
              <span className="menu-food-type veg">
                🟢 Veg
              </span>
            ) : (
              <span className="menu-food-type non-veg">
                🔴 Non-Veg
              </span>
            )}
          </div>
        )}

        {/* ==================================================
            GROUPED CUSTOMIZATIONS
        ================================================== */}

        {item.isAvailable &&
          customizationGroups.length > 0 && (
            <div className="menu-customization-section">
              <h4>Customize your item</h4>

              {customizationGroups.map((group) => {
                const selectedIds =
                  selectedOptions[group.id] ?? [];

                const minSelections =
                  group.minSelections ??
                  (group.required ? 1 : 0);

                const maxReached =
                  group.selectionType === "multiple" &&
                  group.maxSelections !== undefined &&
                  selectedIds.length >= group.maxSelections;

                return (
                  <fieldset
                    key={group.id}
                    className="menu-customization-group"
                  >
                    <legend>
                      {group.name}

                      {group.required && (
                        <span> (Required)</span>
                      )}

                      {group.selectionType === "multiple" && (
                        <span>
                          {" "}
                          — Select{" "}
                          {minSelections > 0
                            ? `at least ${minSelections}`
                            : "any"}
                          {group.maxSelections !== undefined
                            ? `, up to ${group.maxSelections}`
                            : ""}
                        </span>
                      )}
                    </legend>

                    {group.options.map((option) => {
                      const isSelected =
                        selectedIds.includes(option.id);

                      const isUnavailable =
                        option.isAvailable === false;

                      const isBlockedByMaximum =
                        maxReached && !isSelected;

                      const inputType =
                        group.selectionType === "single"
                          ? "radio"
                          : "checkbox";

                      return (
                        <label
                          key={option.id}
                          className="menu-customization-option"
                        >
                          <input
                            type={inputType}
                            name={`customization-${item.id}-${group.id}`}
                            checked={isSelected}
                            disabled={
                              isUnavailable ||
                              isBlockedByMaximum
                            }
                            onChange={(event) =>
                              handleOptionChange(
                                group.id,
                                option.id,
                                group.selectionType,
                                event.target.checked,
                                group.maxSelections,
                              )
                            }
                          />

                          <span>{option.name}</span>

                          {option.price > 0 && (
                            <span>
                              {" "}
                              +{formatCurrency(option.price)}
                            </span>
                          )}

                          {isUnavailable && (
                            <span> (Unavailable)</span>
                          )}
                        </label>
                      );
                    })}
                  </fieldset>
                );
              })}

              {selectedCustomizationTotal > 0 && (
                <p className="menu-customization-total">
                  Add-ons:{" "}
                  {formatCurrency(
                    selectedCustomizationTotal,
                  )}
                </p>
              )}

              {validationError && (
                <p
                  className="menu-customization-error"
                  role="alert"
                >
                  {validationError}
                </p>
              )}
            </div>
          )}

        {/* ==================================================
            PRICE + ADD TO CART
        ================================================== */}

        <div className="menu-card-bottom">

          {/* PRICE */}

          <div className="menu-card-price">
            {formatCurrency(item.price)}

            {item.originalPrice &&
              item.originalPrice > item.price && (
                <span className="menu-card-original-price">
                  {formatCurrency(item.originalPrice)}
                </span>
              )}

            {selectedCustomizationTotal > 0 && (
              <span className="menu-customized-price">
                <br />
                Total:{" "}
                {formatCurrency(
                  item.price + selectedCustomizationTotal,
                )}
              </span>
            )}
          </div>

          {/* ADD BUTTON */}

          <button
            type="button"
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
          >
            <Plus size={18} />

            {item.isAvailable
              ? "Add"
              : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}
