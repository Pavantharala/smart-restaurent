//
// SMART CAFE - MENU CATEGORIES
//
// Central location for customer-facing menu categories.
//
// Keeping these in one file means we can change the menu
// navigation without searching through multiple components.
//

import type { MenuCategory } from "../types/Menu";

export interface MenuCategoryInfo {
  id: MenuCategory;
  name: string;
  icon: string;
  description: string;
}

export const menuCategories: MenuCategoryInfo[] = [
  {
    id: "food",
    name: "Food",
    icon: "🍔",
    description: "Burgers, meals and filling dishes",
  },

  {
    id: "drinks",
    name: "Drinks",
    icon: "🥤",
    description: "Cool drinks, juices and shakes",
  },

  {
    id: "snacks",
    name: "Snacks",
    icon: "🍟",
    description: "Quick bites while you wait",
  },

  {
    id: "desserts",
    name: "Desserts",
    icon: "🍨",
    description: "Something sweet after your meal",
  },

  {
    id: "specials",
    name: "Specials",
    icon: "⭐",
    description: "Today's special cafe offers",
  },
];