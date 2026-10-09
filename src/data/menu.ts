// ============================================================
// SMART CAFE - INITIAL MENU DATA
// ============================================================
// Temporary development data.
//
// IMPORTANT:
// This is NOT our final database.
//
// We are using local/static data while building the
// application. Later, Admin + Backend + Database will
// replace this with persistent menu management.
//
// FOOD TYPE RULE:
//
// Food:
//   - Veg
//   - Non-Veg
//
// Snacks:
//   - Veg
//   - Non-Veg
//
// Drinks:
//   - No Veg / Non-Veg classification
//
// Desserts:
//   - No Veg / Non-Veg classification
//
// Specials:
//   - Can be classified later when required.
//
// The data below supports:
// - Product details
// - Food type classification
// - Preparation time
// - Customizations
// - Search tags
// - Availability
// ============================================================

import type { MenuItem } from "../types/Menu";

export const initialMenu: MenuItem[] = [
  // ==========================================================
  // BURGER - NON-VEG
  // ==========================================================

  {
    id: "food-burger-001",

    name: "Classic Chicken Burger",

    category: "food",

    // Chicken burger = Non-Veg.
    foodType: "non-veg",

    description:
      "Crispy chicken burger with fresh vegetables and sauce.",

    details:
      "A crispy chicken burger served with fresh vegetables and our signature cafe sauce.",

    price: 149,

    image: "/images/food/chicken-burger.jpg",

    isAvailable: true,

    preparationTime: 12,

    tags: [
      "popular",
      "burger",
      "chicken",
      "food",
    ],

    // Customer can customize the burger.
    customizations: [
      {
        id: "burger-extra-cheese",
        name: "Extra Cheese",
        price: 30,
      },

      {
        id: "burger-extra-patty",
        name: "Extra Patty",
        price: 60,
      },
    ],
  },

  // ==========================================================
  // FRIES - VEG
  // ==========================================================

  {
    id: "food-fries-001",

    name: "Loaded French Fries",

    category: "snacks",

    // French fries = Veg.
    foodType: "veg",

    description:
      "Crispy fries served with our special cafe sauce.",

    details:
      "Golden crispy French fries served with our special cafe sauce.",

    price: 99,

    image: "/images/snacks/fries.jpg",

    isAvailable: true,

    preparationTime: 7,

    tags: [
      "popular",
      "fries",
      "snacks",
    ],

    customizations: [
      {
        id: "fries-extra-cheese",
        name: "Extra Cheese",
        price: 25,
      },

      {
        id: "fries-spicy",
        name: "Spicy Seasoning",
        price: 10,
      },
    ],
  },

  // ==========================================================
  // COKE
  // ==========================================================
  //
  // IMPORTANT:
  // No foodType here.
  //
  // Drinks are not part of the Veg / Non-Veg filter.
  // ==========================================================

  {
    id: "drink-coke-001",
    name: "Chilled Coke",

    category: "drinks",

    description:
      "Refreshing chilled soft drink.",

    details:
      "A refreshing chilled soft drink, perfect with burgers and snacks.",

    price: 60,

    image: "/images/drinks/coke.jpg",

    isAvailable: true,

    preparationTime: 2,

    tags: [
      "cold",
      "drink",
      "refreshing",
    ],
  },

  // ==========================================================
  // MILKSHAKE
  // ==========================================================
  //
  // IMPORTANT:
  // No foodType here.
  //
  // Drinks are not part of the Veg / Non-Veg filter.
  // ==========================================================

  {
    id: "drink-milkshake-001",

    name: "Chocolate Milkshake",

    category: "drinks",

    description:
      "Rich chocolate milkshake served chilled.",

    details:
      "A rich and creamy chocolate milkshake served chilled.",

    price: 129,

    image: "/images/drinks/milkshake.jpg",

    isAvailable: true,

    preparationTime: 5,

    tags: [
      "milkshake",
      "chocolate",
      "drink",
    ],

    customizations: [
      {
        id: "milkshake-extra-chocolate",
        name: "Extra Chocolate",
        price: 20,
      },

      {
        id: "milkshake-whipped-cream",
        name: "Whipped Cream",
        price: 15,
      },
    ],
  },

  // ==========================================================
  // ICE CREAM
  // ==========================================================
  //
  // IMPORTANT:
  // No foodType here.
  //
  // Desserts are not part of the Veg / Non-Veg filter.
  // ==========================================================

  {
    id: "dessert-icecream-001",

    name: "Chocolate Ice Cream",

    category: "desserts",

    description:
      "Creamy chocolate ice cream.",

    details:
      "Creamy chocolate ice cream served as a refreshing dessert.",

    price: 89,

    image: "/images/desserts/ice-cream.jpg",

    isAvailable: true,

    preparationTime: 2,

    tags: [
      "dessert",
      "chocolate",
      "ice cream",
    ],

    customizations: [
      {
        id: "icecream-chocolate-syrup",
        name: "Extra Chocolate Syrup",
        price: 15,
      },
    ],
  },
];
