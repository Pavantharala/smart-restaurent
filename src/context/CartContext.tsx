// =========================================================
// SMART CAFE - CART CONTEXT
// =========================================================
// Handles:
// - Adding menu items to cart
// - Quantity changes
// - Customizations with their prices
// - Special instructions
// - Correct subtotal calculation
// - Cart persistence using localStorage
//
// IMPORTANT:
// Cart stores a snapshot of customization prices.
// This prevents an existing cart from changing unexpectedly
// if the admin later changes a menu price.
// =========================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MenuCustomization, MenuItem } from "../types/Menu";

// =========================================================
// CART ITEM
// =========================================================

export interface CartItem {
  cartItemId: string;

  menuItemId: string;
  name: string;

  // Original menu price before customizations.
  basePrice: number;

  // Final customization objects with their prices.
  customizations: MenuCustomization[];

  // Extra instructions from customer.
  specialInstructions?: string;

  // Final price for one unit.
  unitPrice: number;

  quantity: number;

  image?: string;
}

// =========================================================
// CONTEXT TYPE
// =========================================================

interface CartContextType {
  items: CartItem[];

  itemCount: number;

  subtotal: number;

  addItem: (
    menuItem: MenuItem,
    quantity?: number,
    customizations?: MenuCustomization[],
    specialInstructions?: string,
  ) => void;

  updateQuantity: (cartItemId: string, quantity: number) => void;

  removeItem: (cartItemId: string) => void;

  clearCart: () => void;
}

// =========================================================
// STORAGE KEY
// =========================================================

const CART_STORAGE_KEY = "smart-cafe-cart";

// =========================================================
// HELPER
// =========================================================

function calculateCustomizationTotal(
  customizations: MenuCustomization[],
): number {
  return customizations.reduce(
    (total, customization) => total + (customization.price ?? 0),
    0,
  );
}

// =========================================================
// PROVIDER
// =========================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (!savedCart) {
        return [];
      }

      return JSON.parse(savedCart) as CartItem[];
    } catch {
      return [];
    }
  });

  // =======================================================
  // SAVE CART
  // =======================================================

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // =======================================================
  // ADD ITEM
  // =======================================================

  function addItem(
    menuItem: MenuItem,
    quantity = 1,
    customizations: MenuCustomization[] = [],
    specialInstructions = "",
  ) {
    const customizationTotal =
      calculateCustomizationTotal(customizations);

    const unitPrice = menuItem.price + customizationTotal;

    // Create a stable ID for this exact configuration.
    //
    // Example:
    // Burger + Cheese + "No onion"
    //
    // is different from:
    // Burger + Cheese + "Extra spicy"
    const customizationKey = customizations
      .map((item) => item.id)
      .sort()
      .join("-");

    const cartItemId = [
      menuItem.id,
      customizationKey,
      specialInstructions.trim().toLowerCase(),
    ].join("__");

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.cartItemId === cartItemId,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      }

      const newItem: CartItem = {
        cartItemId,

        menuItemId: menuItem.id,
        name: menuItem.name,

        basePrice: menuItem.price,

        customizations: customizations.map((customization) => ({
          ...customization,
        })),

        specialInstructions:
          specialInstructions.trim() || undefined,

        unitPrice,

        quantity,

        image: menuItem.image,
      };

      return [...currentItems, newItem];
    });
  }

  // =======================================================
  // UPDATE QUANTITY
  // =======================================================

  function updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  // =======================================================
  // REMOVE ITEM
  // =======================================================

  function removeItem(cartItemId: string) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.cartItemId !== cartItemId,
      ),
    );
  }

  // =======================================================
  // CLEAR CART
  // =======================================================

  function clearCart() {
    setItems([]);
  }

  // =======================================================
  // TOTAL ITEM COUNT
  // =======================================================

  const itemCount = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
  }, [items]);

  // =======================================================
  // SUBTOTAL
  // =======================================================

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.unitPrice * item.quantity,
      0,
    );
  }, [items]);

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, itemCount, subtotal],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// =========================================================
// CONTEXT
// =========================================================

const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

// =========================================================
// HOOK
// =========================================================

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}