
 // ============================================================
 // SMART CAFE - MENU TYPES
 // ============================================================

export type MenuCategory =
  | "food"
  | "drinks"
  | "snacks"
  | "desserts"
  | "specials";

export type FoodType = "veg" | "non-veg";

// ============================================================
// EXISTING CUSTOMIZATION
// Kept for backward compatibility.
// ============================================================

export interface MenuCustomization {
  id: string;
  name: string;
  price?: number;
}

// ============================================================
// ADVANCED ADD-ON OPTION
// Example: Extra Cheese (+₹30)
// ============================================================

export interface MenuCustomizationOption {
  id: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

// ============================================================
// ADVANCED ADD-ON GROUP
//
// Examples:
// - Choose your size: Small / Medium / Large
// - Extra toppings: Cheese / Olives / Jalapenos
//
// single   = customer selects one option
// multiple = customer may select multiple options
// required = customer must make a selection
// ============================================================

export interface MenuCustomizationGroup {
  id: string;
  name: string;

  selectionType: "single" | "multiple";

  required: boolean;

  minSelections?: number;
  maxSelections?: number;

  options: MenuCustomizationOption[];
}

// ============================================================
// MAIN MENU ITEM
// ============================================================

export interface MenuItem {
  id: string;

  name: string;

  category: MenuCategory;

  description?: string;

  details?: string;

  foodType?: FoodType;

  price: number;

  originalPrice?: number;

  image?: string;

  // Existing flat customizations remain supported.
  customizations?: MenuCustomization[];

  // New grouped add-on system.
  // Optional so existing menu records remain compatible.
  customizationGroups?: MenuCustomizationGroup[];

  isAvailable: boolean;

  preparationTime?: number;

  tags?: string[];
}
