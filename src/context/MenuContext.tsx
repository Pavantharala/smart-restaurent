
 // ============================================================
// SMART CAFE - MENU CONTEXT
// ============================================================
//
// Phase 22.2: Advanced menu add-on validation.
//
// Preserves:
// - Existing menu and localStorage data
// - Menu migration
// - Legacy flat customizations
// - Add, update, delete and availability functions
// - Grouped add-ons with single/multiple selection
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
  MenuCustomizationGroup,
  MenuCustomizationOption,
  MenuItem,
} from "../types/Menu";

// ============================================================
// LOCAL STORAGE
// ============================================================

const MENU_STORAGE_KEY = "smart-cafe-menu";

const MENU_VERSION_STORAGE_KEY =
  "smart-cafe-menu-version";

// Version 4 introduces grouped add-ons.
const MENU_DATA_VERSION = 4;

// ============================================================
// ADMIN MENU INPUT
// ============================================================

export type CreateMenuItemInput = Omit<
  MenuItem,
  "id"
>;

// ============================================================
// CONTEXT VALUE
// ============================================================

interface MenuContextValue {
  menuItems: MenuItem[];

  getItemsByCategory: (
    category: MenuCategory,
  ) => MenuItem[];

  getItemById: (
    id: string,
  ) => MenuItem | undefined;

  addMenuItem: (
    item: CreateMenuItemInput,
  ) => MenuItem;

  updateMenuItem: (
    id: string,
    updates: Partial<MenuItem>,
  ) => void;

  deleteMenuItem: (id: string) => void;

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

interface MenuProviderProps {
  children: ReactNode;
}

// ============================================================
// BASIC VALIDATION HELPERS
// ============================================================

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

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

function isValidFoodType(
  foodType: unknown,
): foodType is FoodType {
  return (
    foodType === "veg" ||
    foodType === "non-veg"
  );
}

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

function generateCustomizationId(): string {
  return `custom-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function generateGroupId(): string {
  return `group-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function generateOptionId(): string {
  return `option-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// ============================================================
// LEGACY CUSTOMIZATION NORMALIZATION
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
    ...(price !== undefined ? { price } : {}),
  };
}

// ============================================================
// ADD-ON OPTION NORMALIZATION
// ============================================================

function normalizeCustomizationOption(
  rawOption: unknown,
): MenuCustomizationOption | null {
  if (!isRecord(rawOption)) {
    return null;
  }

  const name =
    typeof rawOption.name === "string"
      ? rawOption.name.trim()
      : "";

  if (!name) {
    return null;
  }

  const id =
    typeof rawOption.id === "string" &&
    rawOption.id.trim()
      ? rawOption.id.trim()
      : generateOptionId();

  const rawPrice = Number(rawOption.price);

  const price =
    Number.isFinite(rawPrice)
      ? Math.max(0, rawPrice)
      : 0;

  return {
    id,
    name,
    price,
    ...(typeof rawOption.isAvailable === "boolean"
      ? { isAvailable: rawOption.isAvailable }
      : {}),
  };
}

// ============================================================
// ADD-ON GROUP NORMALIZATION
// ============================================================

function normalizeCustomizationGroup(
  rawGroup: unknown,
): MenuCustomizationGroup | null {
  if (!isRecord(rawGroup)) {
    return null;
  }

  const name =
    typeof rawGroup.name === "string"
      ? rawGroup.name.trim()
      : "";

  if (!name) {
    return null;
  }

  const id =
    typeof rawGroup.id === "string" &&
    rawGroup.id.trim()
      ? rawGroup.id.trim()
      : generateGroupId();

  const selectionType =
    rawGroup.selectionType === "multiple"
      ? "multiple"
      : "single";

  const required =
    typeof rawGroup.required === "boolean"
      ? rawGroup.required
      : false;

  const rawOptions = Array.isArray(rawGroup.options)
    ? rawGroup.options
    : [];

  const options = rawOptions
    .map(normalizeCustomizationOption)
    .filter(
      (
        option,
      ): option is MenuCustomizationOption =>
        option !== null,
    );

  const rawMin = rawGroup.minSelections;
  const rawMax = rawGroup.maxSelections;

  const minSelections =
    typeof rawMin === "number" &&
    Number.isInteger(rawMin) &&
    rawMin >= 0
      ? rawMin
      : undefined;

  const maxSelections =
    typeof rawMax === "number" &&
    Number.isInteger(rawMax) &&
    rawMax >= 0
      ? rawMax
      : undefined;

  return {
    id,
    name,
    selectionType,
    required,
    ...(minSelections !== undefined
      ? { minSelections }
      : {}),
    ...(maxSelections !== undefined
      ? { maxSelections }
      : {}),
    options,
  };
}

// ============================================================
// ADD-ON GROUP VALIDATION
// ============================================================

function validateCustomizationGroup(
  group: MenuCustomizationGroup,
): string {
  if (!group.id.trim()) {
    return "Add-on group ID is required.";
  }

  if (!group.name.trim()) {
    return "Add-on group name is required.";
  }

  if (
    group.selectionType !== "single" &&
    group.selectionType !== "multiple"
  ) {
    return `Selection type is invalid in "${group.name}".`;
  }

  if (typeof group.required !== "boolean") {
    return `Required setting is invalid in "${group.name}".`;
  }

  if (!Array.isArray(group.options) || group.options.length === 0) {
    return `Add-on group "${group.name}" must have at least one option.`;
  }

  const optionIds = new Set<string>();

  for (const option of group.options) {
    if (!option.id.trim()) {
      return `An option in "${group.name}" has no ID.`;
    }

    if (optionIds.has(option.id)) {
      return `Duplicate option ID in "${group.name}".`;
    }

    optionIds.add(option.id);

    if (!option.name.trim()) {
      return `An option in "${group.name}" needs a name.`;
    }

    if (
      !Number.isFinite(option.price) ||
      option.price < 0
    ) {
      return `Option prices in "${group.name}" must be zero or greater.`;
    }

    if (
      option.isAvailable !== undefined &&
      typeof option.isAvailable !== "boolean"
    ) {
      return `Option availability is invalid in "${group.name}".`;
    }
  }

  const minSelections =
    group.minSelections ??
    (group.required ? 1 : 0);

  const maxSelections =
    group.maxSelections ??
    (group.selectionType === "single"
      ? 1
      : group.options.length);

  if (
    group.minSelections !== undefined &&
    (!Number.isInteger(group.minSelections) ||
      group.minSelections < 0)
  ) {
    return `Minimum selections in "${group.name}" must be a non-negative whole number.`;
  }

  if (
    group.maxSelections !== undefined &&
    (!Number.isInteger(group.maxSelections) ||
      group.maxSelections < 0)
  ) {
    return `Maximum selections in "${group.name}" must be a non-negative whole number.`;
  }

  if (group.required && minSelections < 1) {
    return `Required group "${group.name}" must require at least one selection.`;
  }

  if (minSelections > maxSelections) {
    return `Minimum selections cannot exceed maximum selections in "${group.name}".`;
  }

  if (maxSelections > group.options.length) {
    return `Maximum selections exceed the available options in "${group.name}".`;
  }

  if (
    group.selectionType === "single" &&
    (minSelections > 1 || maxSelections > 1)
  ) {
    return `Single-selection group "${group.name}" can allow at most one selection.`;
  }

  return "";
}

// ============================================================
// MENU ITEM NORMALIZATION
// ============================================================

function normalizeMenuItem(
  item: MenuItem,
): MenuItem {
  const category = isValidCategory(item.category)
    ? item.category
    : "food";

  const normalized: MenuItem = {
    ...item,

    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : generateMenuItemId(),

    name:
      typeof item.name === "string"
        ? item.name.trim()
        : "",

    category,

    price:
      typeof item.price === "number" &&
      Number.isFinite(item.price)
        ? Math.max(0, item.price)
        : 0,

    isAvailable:
      typeof item.isAvailable === "boolean"
        ? item.isAvailable
        : true,

    ...(typeof item.description === "string"
      ? { description: item.description.trim() }
      : {}),

    ...(typeof item.details === "string"
      ? { details: item.details.trim() }
      : {}),

    ...(typeof item.originalPrice === "number" &&
    Number.isFinite(item.originalPrice)
      ? { originalPrice: Math.max(0, item.originalPrice) }
      : {}),

    ...(typeof item.image === "string"
      ? { image: item.image.trim() }
      : {}),

    ...(typeof item.preparationTime === "number" &&
    Number.isFinite(item.preparationTime)
      ? {
          preparationTime: Math.max(
            0,
            item.preparationTime,
          ),
        }
      : {}),

    ...(Array.isArray(item.tags)
      ? {
          tags: Array.from(
            new Map(
              item.tags
                .filter(
                  (tag): tag is string =>
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

    ...(Array.isArray(item.customizations)
      ? {
          customizations: item.customizations
            .filter(
              (
                customization,
              ): customization is MenuCustomization =>
                isRecord(customization),
            )
            .map(normalizeCustomization)
            .filter(
              (customization) =>
                customization.name.length > 0,
            ),
        }
      : {}),

    ...(Array.isArray(item.customizationGroups)
      ? {
          customizationGroups: item.customizationGroups
            .map(normalizeCustomizationGroup)
            .filter(
              (
                group,
              ): group is MenuCustomizationGroup =>
                group !== null,
            ),
        }
      : {}),
  };

  // Food type business rules.
  if (
    category === "drinks" ||
    category === "desserts"
  ) {
    delete normalized.foodType;
  } else if (isValidFoodType(item.foodType)) {
    normalized.foodType = item.foodType;
  } else {
    delete normalized.foodType;
  }

  return normalized;
}

// ============================================================
// MENU ITEM VALIDATION
// ============================================================

function validateMenuItem(
  item: MenuItem,
): string {
  if (!item.id.trim()) {
    return "Menu item ID is required.";
  }

  if (!item.name.trim()) {
    return "Menu item name is required.";
  }

  if (!isValidCategory(item.category)) {
    return "Menu item category is invalid.";
  }

  if (!Number.isFinite(item.price) || item.price < 0) {
    return "Menu item price must be zero or greater.";
  }

  if (
    item.originalPrice !== undefined &&
    (!Number.isFinite(item.originalPrice) ||
      item.originalPrice < 0)
  ) {
    return "Original price must be zero or greater.";
  }

  if (
    item.originalPrice !== undefined &&
    item.originalPrice < item.price
  ) {
    return "Original price cannot be lower than the selling price.";
  }

  if (
    item.preparationTime !== undefined &&
    (!Number.isFinite(item.preparationTime) ||
      item.preparationTime < 0)
  ) {
    return "Preparation time must be zero or greater.";
  }

  if (
    (item.category === "drinks" ||
      item.category === "desserts") &&
    item.foodType !== undefined
  ) {
    return "Drinks and desserts cannot have a food type.";
  }

  if (
    item.foodType !== undefined &&
    !isValidFoodType(item.foodType)
  ) {
    return "Food type is invalid.";
  }

  // Legacy flat customizations.
  if (item.customizations !== undefined) {
    if (!Array.isArray(item.customizations)) {
      return "Customizations must be a list.";
    }

    const customizationIds = new Set<string>();

    for (const customization of item.customizations) {
      if (!customization.id.trim()) {
        return "Customization ID is required.";
      }

      if (customizationIds.has(customization.id)) {
        return "Duplicate customization ID.";
      }

      customizationIds.add(customization.id);

      if (!customization.name.trim()) {
        return "Customization name is required.";
      }

      if (
        customization.price !== undefined &&
        (!Number.isFinite(customization.price) ||
          customization.price < 0)
      ) {
        return "Customization price must be zero or greater.";
      }
    }
  }

  // New grouped add-ons.
  if (item.customizationGroups !== undefined) {
    if (!Array.isArray(item.customizationGroups)) {
      return "Add-on groups must be a list.";
    }

    const groupIds = new Set<string>();

    for (const group of item.customizationGroups) {
      if (groupIds.has(group.id)) {
        return "Duplicate add-on group ID.";
      }

      groupIds.add(group.id);

      const groupError =
        validateCustomizationGroup(group);

      if (groupError) {
        return groupError;
      }
    }
  }

  return "";
}

// ============================================================
// MIGRATION
// ============================================================

// Existing valid menu items are retained even if an old or
// malformed grouped add-on needs to be removed.

function migrateMenuItem(
  item: MenuItem,
): MenuItem {
  const normalized = normalizeMenuItem(item);

  normalized.customizationGroups =
    normalized.customizationGroups?.filter(
      (group) =>
        validateCustomizationGroup(group) === "",
    );

  if (!normalized.customizationGroups?.length) {
    delete normalized.customizationGroups;
  }

  return normalized;
}

function migrateMenu(
  menu: unknown,
): MenuItem[] {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu
    .filter(isRecord)
    .map(
      (item) =>
        migrateMenuItem(item as unknown as MenuItem),
    )
    .filter(
      (item) => validateMenuItem(item) === "",
    );
}

function getDefaultMenu(): MenuItem[] {
  return migrateMenu(initialMenu);
}

// ============================================================
// MENU PROVIDER
// ============================================================

export function MenuProvider({
  children,
}: MenuProviderProps) {
  const [menuItems, setMenuItems] =
    useState<MenuItem[]>(() => {
      try {
        const savedMenu =
          localStorage.getItem(MENU_STORAGE_KEY);

        if (!savedMenu) {
          const defaultMenu = getDefaultMenu();

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

        const parsedMenu: unknown = JSON.parse(savedMenu);

        if (!Array.isArray(parsedMenu)) {
          const defaultMenu = getDefaultMenu();

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

        const storedVersion =
          Number(
            localStorage.getItem(
              MENU_VERSION_STORAGE_KEY,
            ),
          ) || 1;

        if (storedVersion < MENU_DATA_VERSION) {
          console.info(
            `Migrating Smart Cafe menu from version ${storedVersion} to version ${MENU_DATA_VERSION}.`,
          );
        }

        const migratedMenu = migrateMenu(parsedMenu);

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

  const saveMenu = (updatedMenu: MenuItem[]) => {
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
  // GET MENU ITEMS
  // ==========================================================

  const getItemsByCategory = (
    category: MenuCategory,
  ): MenuItem[] =>
    menuItems.filter((item) => item.category === category);

  const getItemById = (
    id: string,
  ): MenuItem | undefined =>
    menuItems.find((item) => item.id === id);

  // ==========================================================
  // ADD MENU ITEM
  // ==========================================================

  const addMenuItem = (
    item: CreateMenuItemInput,
  ): MenuItem => {
    const newItem = normalizeMenuItem({
      ...item,
      id: generateMenuItemId(),
    });

    const validationError = validateMenuItem(newItem);

    if (validationError) {
      throw new Error(validationError);
    }

    if (
      menuItems.some(
        (existingItem) => existingItem.id === newItem.id,
      )
    ) {
      throw new Error(
        "A menu item with the generated ID already exists. Please try again.",
      );
    }

    saveMenu([...menuItems, newItem]);

    return newItem;
  };

  // ==========================================================
  // UPDATE MENU ITEM
  // ==========================================================

  const updateMenuItem = (
    id: string,
    updates: Partial<MenuItem>,
  ) => {
    const existingItem =
      menuItems.find((item) => item.id === id);

    if (!existingItem) {
      throw new Error(`Menu item "${id}" was not found.`);
    }

    const updatedItem = normalizeMenuItem({
      ...existingItem,
      ...updates,
      id: existingItem.id,
    });

    const validationError = validateMenuItem(updatedItem);

    if (validationError) {
      throw new Error(validationError);
    }

    const updatedMenu = menuItems.map((item) =>
      item.id === id ? updatedItem : item,
    );

    saveMenu(updatedMenu);
  };

  // ==========================================================
  // DELETE MENU ITEM
  // ==========================================================

  const deleteMenuItem = (id: string) => {
    if (!menuItems.some((item) => item.id === id)) {
      return;
    }

    saveMenu(
      menuItems.filter((item) => item.id !== id),
    );
  };

  // ==========================================================
  // TOGGLE AVAILABILITY
  // ==========================================================

  const toggleMenuItemAvailability = (id: string) => {
    const existingItem =
      menuItems.find((item) => item.id === id);

    if (!existingItem) {
      return;
    }

    saveMenu(
      menuItems.map((item) =>
        item.id === id
          ? {
              ...item,
              isAvailable: !item.isAvailable,
            }
          : item,
      ),
    );
  };

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo<MenuContextValue>(
    () => ({
      menuItems,
      getItemsByCategory,
      getItemById,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      toggleMenuItemAvailability,
    }),
    [menuItems],
  );

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

// ============================================================
// USE MENU HOOK
// ============================================================

export function useMenu() {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error(
      "useMenu must be used inside a MenuProvider",
    );
  }

  return context;
}
