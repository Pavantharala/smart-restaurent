// ============================================================
// SMART CAFE - MENU CONTEXT
// ============================================================
//
// Central source of truth for menu data.
//
// Responsibilities:
// - Load menu from localStorage
// - Migrate older menu data
// - Normalize and validate menu items
// - Add menu items
// - Update menu items
// - Delete menu items
// - Toggle availability
//
// Future:
// localStorage can later be replaced by:
//
// Backend API
//     ↓
// Database
//
// Customer, Staff and Admin pages will continue using
// the same useMenu() interface.
//
// ============================================================

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { initialMenu } from "../data/menu";

import type {
  FoodType,
  MenuCategory,
  MenuCustomization,
  MenuItem,
} from "../types/Menu";

// ============================================================
// LOCAL STORAGE
// ============================================================

const MENU_STORAGE_KEY = "smart-cafe-menu";

const MENU_VERSION_STORAGE_KEY =
  "smart-cafe-menu-version";

// ============================================================
// MENU DATA VERSION
// ============================================================
//
// Version 3 introduced:
//
// - Optional foodType
// - Category-aware food type handling
// - Safer menu normalization
//
// ============================================================

const MENU_DATA_VERSION = 3;

// ============================================================
// ADMIN MENU INPUT
// ============================================================
//
// ID is intentionally excluded.
//
// The MenuContext generates the ID so that Admin pages
// cannot accidentally create duplicate or invalid IDs.
//
// ============================================================

export type CreateMenuItemInput = Omit<
  MenuItem,
  "id"
>;

// ============================================================
// CONTEXT VALUE
// ============================================================

interface MenuContextValue {
  // ----------------------------------------------------------
  // Complete menu
  // ----------------------------------------------------------

  menuItems: MenuItem[];

  // ----------------------------------------------------------
  // Customer / General helpers
  // ----------------------------------------------------------

  getItemsByCategory: (
    category: MenuCategory,
  ) => MenuItem[];

  getItemById: (
    id: string,
  ) => MenuItem | undefined;

  // ----------------------------------------------------------
  // Admin management
  // ----------------------------------------------------------

  addMenuItem: (
    item: CreateMenuItemInput,
  ) => MenuItem;

  updateMenuItem: (
    id: string,
    updates: Partial<MenuItem>,
  ) => void;

  deleteMenuItem: (
    id: string,
  ) => void;

  toggleMenuItemAvailability: (
    id: string,
  ) => void;
}

// ============================================================
// CONTEXT
// ============================================================

const MenuContext =
  createContext<MenuContextValue | undefined>(
    undefined,
  );

// ============================================================
// PROVIDER PROPS
// ============================================================

interface MenuProviderProps {
  children: ReactNode;
}

// ============================================================
// CATEGORY CHECK
// ============================================================
//
// This protects the application from invalid category values
// coming from localStorage or future API data.
//
// ============================================================

function isValidCategory(
  category: unknown,
): category is MenuCategory {
  return (
    category === "food" ||
    category === "drinks" ||
    category === "snacks" ||
    category === "desserts" ||
    category === "specials"
  );
}

// ============================================================
// FOOD TYPE CHECK
// ============================================================

function isValidFoodType(
  foodType: unknown,
): foodType is FoodType {
  return (
    foodType === "veg" ||
    foodType === "non-veg"
  );
}

// ============================================================
// ID GENERATOR
// ============================================================
//
// crypto.randomUUID() gives us a strong unique ID in modern
// browsers.
//
// A fallback is included for older environments.
//
// ============================================================

function generateMenuItemId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `menu-${crypto.randomUUID()}`;
  }

  return `menu-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// ============================================================
// CUSTOMIZATION ID GENERATOR
// ============================================================

function generateCustomizationId(): string {
  return `custom-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// ============================================================
// CUSTOMIZATION NORMALIZATION
// ============================================================
//
// Customizations are cleaned before being stored.
//
// Example:
//
// "Extra Cheese" → "Extra Cheese"
// -10 price     → 0
//
// Empty customization names are removed later.
//
// ============================================================

function normalizeCustomization(
  customization: MenuCustomization,
): MenuCustomization {
  const id =
    typeof customization.id === "string" &&
    customization.id.trim()
      ? customization.id.trim()
      : generateCustomizationId();

  const name =
    typeof customization.name === "string"
      ? customization.name.trim()
      : "";

  const price =
    typeof customization.price === "number" &&
    Number.isFinite(customization.price)
      ? Math.max(0, customization.price)
      : undefined;

  return {
    id,
    name,
    ...(price !== undefined
      ? { price }
      : {}),
  };
}

// ============================================================
// MENU ITEM NORMALIZATION
// ============================================================
//
// This function protects menu data before it enters
// application state or localStorage.
//
// Business rules:
//
// Food:
//   Veg / Non-Veg allowed
//
// Snacks:
//   Veg / Non-Veg allowed
//
// Drinks:
//   foodType removed
//
// Desserts:
//   foodType removed
//
// Specials:
//   foodType optional
//
// ============================================================

function normalizeMenuItem(
  item: MenuItem,
): MenuItem {
  const category = isValidCategory(
    item.category,
  )
    ? item.category
    : "food";

  const normalized: MenuItem = {
    ...item,

    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    id:
      typeof item.id === "string" &&
      item.id.trim()
        ? item.id.trim()
        : generateMenuItemId(),

    // --------------------------------------------------------
    // Basic text
    // --------------------------------------------------------

    name:
      typeof item.name === "string"
        ? item.name.trim()
        : "",

    category,

    // --------------------------------------------------------
    // Price
    // --------------------------------------------------------

    price:
      typeof item.price === "number" &&
      Number.isFinite(item.price)
        ? Math.max(0, item.price)
        : 0,

    // --------------------------------------------------------
    // Availability
    // --------------------------------------------------------

    isAvailable:
      typeof item.isAvailable === "boolean"
        ? item.isAvailable
        : true,

    // --------------------------------------------------------
    // Optional description
    // --------------------------------------------------------

    ...(typeof item.description === "string"
      ? {
          description:
            item.description.trim(),
        }
      : {}),

    // --------------------------------------------------------
    // Optional details
    // --------------------------------------------------------

    ...(typeof item.details === "string"
      ? {
          details: item.details.trim(),
        }
      : {}),

    // --------------------------------------------------------
    // Original price
    // --------------------------------------------------------

    ...(typeof item.originalPrice ===
      "number" &&
    Number.isFinite(item.originalPrice)
      ? {
          originalPrice: Math.max(
            0,
            item.originalPrice,
          ),
        }
      : {}),

    // --------------------------------------------------------
    // Image
    // --------------------------------------------------------

    ...(typeof item.image === "string"
      ? {
          image: item.image.trim(),
        }
      : {}),

    // --------------------------------------------------------
    // Preparation time
    // --------------------------------------------------------

    ...(typeof item.preparationTime ===
      "number" &&
    Number.isFinite(item.preparationTime)
      ? {
          preparationTime: Math.max(
            0,
            item.preparationTime,
          ),
        }
      : {}),

    // --------------------------------------------------------
    // Tags
    // --------------------------------------------------------
    //
    // Duplicate tags are removed.
    //
    // Example:
    // ["Spicy", "spicy", " Bestseller "]
    //
    // becomes:
    // ["Spicy", "Bestseller"]
    //
    // --------------------------------------------------------

    ...(Array.isArray(item.tags)
      ? {
          tags: Array.from(
            new Map(
              item.tags
                .filter(
                  (
                    tag,
                  ): tag is string =>
                    typeof tag === "string",
                )
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => [
                  tag.toLowerCase(),
                  tag,
                ]),
            ).values(),
          ),
        }
      : {}),

    // --------------------------------------------------------
    // Customizations
    // --------------------------------------------------------

    ...(Array.isArray(
      item.customizations,
    )
      ? {
          customizations:
            item.customizations
              .filter(
                (
                  customization,
                ): customization is MenuCustomization =>
                  Boolean(
                    customization,
                  ) &&
                  typeof customization ===
                    "object",
              )
              .map(
                normalizeCustomization,
              )
              .filter(
                (customization) =>
                  customization.name
                    .length > 0,
              ),
        }
      : {}),
  };

  // ==========================================================
  // FOOD TYPE BUSINESS RULE
  // ==========================================================

  if (
    category === "drinks" ||
    category === "desserts"
  ) {
    // Drinks and desserts do not use
    // Veg / Non-Veg classification.

    delete normalized.foodType;
  } else if (
    isValidFoodType(item.foodType)
  ) {
    // Food, snacks and specials can use
    // Veg / Non-Veg classification.

    normalized.foodType = item.foodType;
  } else {
    // Missing or invalid food type.

    delete normalized.foodType;
  }

  return normalized;
}

// ============================================================
// MENU VALIDATION
// ============================================================
//
// This is the final safety check before menu data is saved.
//
// ============================================================

function validateMenuItem(
  item: MenuItem,
): string {
  // ----------------------------------------------------------
  // ID
  // ----------------------------------------------------------

  if (!item.id.trim()) {
    return "Menu item ID is required.";
  }

  // ----------------------------------------------------------
  // Name
  // ----------------------------------------------------------

  if (!item.name.trim()) {
    return "Menu item name is required.";
  }

  // ----------------------------------------------------------
  // Category
  // ----------------------------------------------------------

  if (!isValidCategory(item.category)) {
    return "Menu item category is invalid.";
  }

  // ----------------------------------------------------------
  // Selling price
  // ----------------------------------------------------------

  if (
    !Number.isFinite(item.price) ||
    item.price < 0
  ) {
    return (
      "Menu item price must be zero or greater."
    );
  }

  // ----------------------------------------------------------
  // Original price
  // ----------------------------------------------------------

  if (
    item.originalPrice !== undefined &&
    (!Number.isFinite(
      item.originalPrice,
    ) ||
      item.originalPrice < 0)
  ) {
    return (
      "Original price must be zero or greater."
    );
  }

  // ----------------------------------------------------------
  // Original price should not be lower than
  // the actual selling price.
  // ----------------------------------------------------------

  if (
    item.originalPrice !== undefined &&
    item.originalPrice < item.price
  ) {
    return (
      "Original price cannot be lower than the selling price."
    );
  }

  // ----------------------------------------------------------
  // Preparation time
  // ----------------------------------------------------------

  if (
    item.preparationTime !== undefined &&
    (!Number.isFinite(
      item.preparationTime,
    ) ||
      item.preparationTime < 0)
  ) {
    return (
      "Preparation time must be zero or greater."
    );
  }

  // ----------------------------------------------------------
  // Food type
  // ----------------------------------------------------------

  if (
    item.category === "drinks" ||
    item.category === "desserts"
  ) {
    // Drinks and desserts must not contain
    // Veg / Non-Veg classification.

    if (item.foodType !== undefined) {
      return (
        "Drinks and desserts cannot have a food type."
      );
    }
  }

  // ----------------------------------------------------------
  // If foodType exists, it must be valid.
  // ----------------------------------------------------------

  if (
    item.foodType !== undefined &&
    !isValidFoodType(item.foodType)
  ) {
    return "Food type is invalid.";
  }

  // ----------------------------------------------------------
  // Customizations
  // ----------------------------------------------------------

  if (
    item.customizations !== undefined
  ) {
    for (const customization of
      item.customizations) {
      if (!customization.id.trim()) {
        return (
          "Customization ID is required."
        );
      }

      if (!customization.name.trim()) {
        return (
          "Customization name is required."
        );
      }

      if (
        customization.price !== undefined &&
        (!Number.isFinite(
          customization.price,
        ) ||
          customization.price < 0)
      ) {
        return (
          "Customization price must be zero or greater."
        );
      }
    }
  }

  // ----------------------------------------------------------
  // Everything is valid.
  // ----------------------------------------------------------

  return "";
}

// ============================================================
// MIGRATE MENU ITEM
// ============================================================

function migrateMenuItem(
  item: MenuItem,
): MenuItem {
  // Normalize old and new items using the
  // current business rules.

  return normalizeMenuItem(item);
}

// ============================================================
// MIGRATE COMPLETE MENU
// ============================================================

function migrateMenu(
  menu: MenuItem[],
): MenuItem[] {
  return menu
    .filter(
      (item): item is MenuItem =>
        Boolean(item) &&
        typeof item === "object",
    )
    .map(migrateMenuItem)
    .filter(
      (item) =>
        validateMenuItem(item) === "",
    );
}

// ============================================================
// LOAD DEFAULT MENU
// ============================================================
//
// Used whenever localStorage is missing or invalid.
//
// ============================================================

function getDefaultMenu(): MenuItem[] {
  return migrateMenu(initialMenu);
}

// ============================================================
// MENU PROVIDER
// ============================================================

export function MenuProvider({
  children,
}: MenuProviderProps) {
  // ==========================================================
  // LOAD MENU
  // ==========================================================

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>(() => {
      try {
        // ----------------------------------------------------
        // Read saved menu.
        // ----------------------------------------------------

        const savedMenu =
          localStorage.getItem(
            MENU_STORAGE_KEY,
          );

        // ----------------------------------------------------
        // No saved menu exists.
        // ----------------------------------------------------

        if (!savedMenu) {
          const defaultMenu =
            getDefaultMenu();

          localStorage.setItem(
            MENU_STORAGE_KEY,
            JSON.stringify(defaultMenu),
          );

          localStorage.setItem(
            MENU_VERSION_STORAGE_KEY,
            String(MENU_DATA_VERSION),
          );

          return defaultMenu;
        }

        // ----------------------------------------------------
        // Parse saved JSON.
        // ----------------------------------------------------

        const parsedMenu =
          JSON.parse(savedMenu);

        // ----------------------------------------------------
        // Saved data must be an array.
        // ----------------------------------------------------

        if (!Array.isArray(parsedMenu)) {
          const defaultMenu =
            getDefaultMenu();

          localStorage.setItem(
            MENU_STORAGE_KEY,
            JSON.stringify(defaultMenu),
          );

          localStorage.setItem(
            MENU_VERSION_STORAGE_KEY,
            String(MENU_DATA_VERSION),
          );

          return defaultMenu;
        }

        // ----------------------------------------------------
        // Read saved version.
        // ----------------------------------------------------

        const storedVersion =
          Number(
            localStorage.getItem(
              MENU_VERSION_STORAGE_KEY,
            ),
          ) || 1;

        // ----------------------------------------------------
        // Migration information.
        // ----------------------------------------------------

        if (
          storedVersion <
          MENU_DATA_VERSION
        ) {
          console.info(
            `Migrating Smart Cafe menu from version ${storedVersion} to version ${MENU_DATA_VERSION}.`,
          );
        }

        // ----------------------------------------------------
        // Normalize and validate saved menu.
        // ----------------------------------------------------

        const migratedMenu =
          migrateMenu(parsedMenu);

        // ----------------------------------------------------
        // Save the cleaned menu back to storage.
        // ----------------------------------------------------

        localStorage.setItem(
          MENU_STORAGE_KEY,
          JSON.stringify(migratedMenu),
        );

        localStorage.setItem(
          MENU_VERSION_STORAGE_KEY,
          String(MENU_DATA_VERSION),
        );

        return migratedMenu;
      } catch (error) {
        // ----------------------------------------------------
        // If localStorage or JSON parsing fails,
        // safely fall back to the default menu.
        // ----------------------------------------------------

        console.error(
          "Failed to load saved menu:",
          error,
        );

        return getDefaultMenu();
      }
    });

  // ==========================================================
  // SAVE MENU
  // ==========================================================
  //
  // All menu modifications should pass through this function.
  //
  // This keeps React state and localStorage synchronized.
  //
  // ==========================================================

  const saveMenu = (
    updatedMenu: MenuItem[],
  ) => {
    setMenuItems(updatedMenu);

    try {
      localStorage.setItem(
        MENU_STORAGE_KEY,
        JSON.stringify(updatedMenu),
      );

      localStorage.setItem(
        MENU_VERSION_STORAGE_KEY,
        String(MENU_DATA_VERSION),
      );
    } catch (error) {
      console.error(
        "Failed to save menu:",
        error,
      );
    }
  };

  // ==========================================================
  // GET ITEMS BY CATEGORY
  // ==========================================================

  const getItemsByCategory = (
    category: MenuCategory,
  ): MenuItem[] => {
    return menuItems.filter(
      (item) =>
        item.category === category,
    );
  };

  // ==========================================================
  // GET ITEM BY ID
  // ==========================================================

  const getItemById = (
    id: string,
  ): MenuItem | undefined => {
    return menuItems.find(
      (item) => item.id === id,
    );
  };

  // ==========================================================
  // ADD MENU ITEM
  // ==========================================================

  const addMenuItem = (
    item: CreateMenuItemInput,
  ): MenuItem => {
    // --------------------------------------------------------
    // Generate a new ID.
    // --------------------------------------------------------

    const newItem =
      normalizeMenuItem({
        ...item,
        id: generateMenuItemId(),
      });

    // --------------------------------------------------------
    // Validate before saving.
    // --------------------------------------------------------

    const validationError =
      validateMenuItem(newItem);

    if (validationError) {
      throw new Error(
        validationError,
      );
    }

    // --------------------------------------------------------
    // Protect against an extremely unlikely duplicate ID.
    // --------------------------------------------------------

    if (
      menuItems.some(
        (existingItem) =>
          existingItem.id ===
          newItem.id,
      )
    ) {
      throw new Error(
        "A menu item with the generated ID already exists. Please try again.",
      );
    }

    // --------------------------------------------------------
    // Add item to the existing menu.
    // --------------------------------------------------------

    const updatedMenu = [
      ...menuItems,
      newItem,
    ];

    // --------------------------------------------------------
    // Save state + localStorage.
    // --------------------------------------------------------

    saveMenu(updatedMenu);

    // --------------------------------------------------------
    // Return the newly created item.
    // Useful for Admin pages after creation.
    // --------------------------------------------------------

    return newItem;
  };

  // ==========================================================
  // UPDATE MENU ITEM
  // ==========================================================

  const updateMenuItem = (
    id: string,
    updates: Partial<MenuItem>,
  ) => {
    // --------------------------------------------------------
    // Find existing item.
    // --------------------------------------------------------

    const existingItem =
      menuItems.find(
        (item) => item.id === id,
      );

    // --------------------------------------------------------
    // Stop if item does not exist.
    // --------------------------------------------------------

    if (!existingItem) {
      throw new Error(
        `Menu item "${id}" was not found.`,
      );
    }

    // --------------------------------------------------------
    // Merge old data with new data.
    //
    // ID is always protected.
    //
    // Even if an Admin page sends another ID,
    // the original ID remains unchanged.
    // --------------------------------------------------------

    const updatedItem =
      normalizeMenuItem({
        ...existingItem,
        ...updates,
        id: existingItem.id,
      });

    // --------------------------------------------------------
    // Validate updated item.
    // --------------------------------------------------------

    const validationError =
      validateMenuItem(
        updatedItem,
      );

    if (validationError) {
      throw new Error(
        validationError,
      );
    }

    // --------------------------------------------------------
    // Replace only the matching item.
    // --------------------------------------------------------

    const updatedMenu =
      menuItems.map((item) =>
        item.id === id
          ? updatedItem
          : item,
      );

    // --------------------------------------------------------
    // Save.
    // --------------------------------------------------------

    saveMenu(updatedMenu);
  };

  // ==========================================================
  // DELETE MENU ITEM
  // ==========================================================

  const deleteMenuItem = (
    id: string,
  ) => {
    // --------------------------------------------------------
    // Check whether the item exists.
    // --------------------------------------------------------

    const itemExists =
      menuItems.some(
        (item) => item.id === id,
      );

    // --------------------------------------------------------
    // Nothing to delete.
    // --------------------------------------------------------

    if (!itemExists) {
      return;
    }

    // --------------------------------------------------------
    // Remove matching item.
    // --------------------------------------------------------

    const updatedMenu =
      menuItems.filter(
        (item) => item.id !== id,
      );

    // --------------------------------------------------------
    // Save.
    // --------------------------------------------------------

    saveMenu(updatedMenu);
  };

  // ==========================================================
  // TOGGLE MENU ITEM AVAILABILITY
  // ==========================================================
  //
  // Example:
  //
  // Available → Disabled
  // Disabled  → Available
  //
  // This allows staff/admin to temporarily hide an item
  // without deleting it.
  //
  // ==========================================================

  const toggleMenuItemAvailability = (
    id: string,
  ) => {
    const existingItem =
      menuItems.find(
        (item) => item.id === id,
      );

    // --------------------------------------------------------
    // Item not found.
    // --------------------------------------------------------

    if (!existingItem) {
      return;
    }

    // --------------------------------------------------------
    // Toggle availability.
    // --------------------------------------------------------

    const updatedMenu =
      menuItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          isAvailable:
            !item.isAvailable,
        };
      });

    // --------------------------------------------------------
    // Save.
    // --------------------------------------------------------

    saveMenu(updatedMenu);
  };

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================
  //
  // useMemo prevents unnecessary recreation of the context
  // object when menu data has not changed.
  //
  // ==========================================================

  const value =
    useMemo<MenuContextValue>(() => {
      return {
        menuItems,
        getItemsByCategory,
        getItemById,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuItemAvailability,
      };
    }, [menuItems]);

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

// ============================================================
// USE MENU HOOK
// ============================================================
//
// Any Customer, Staff or Admin component can use:
//
// const { menuItems } = useMenu();
//
// ============================================================

export function useMenu() {
  const context =
    useContext(MenuContext);

  if (!context) {
    throw new Error(
      "useMenu must be used inside a MenuProvider",
    );
  }

  return context;
}