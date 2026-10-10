import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useTable } from "./TableContext";
import { useGaming } from "./GamingContext";

import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "../types/Order";

import { canChangeOrderStatus } from "../utils/orderStatus";

// ============================================================
// STORAGE AND LIFECYCLE
// ============================================================

const ORDERS_STORAGE_KEY = "smart-cafe-orders";
const NEXT_ORDER_NUMBER_STORAGE_KEY =
  "smart-cafe-next-order-number";

export const ORDER_LIFECYCLE_EVENT =
  "smart-cafe-order-lifecycle";

const TAX_RATE = 0.05;

// ============================================================
// CREATE ORDER INPUT
// ============================================================

export interface CreateOrderInput {
  customerId?: string;

  customer: {
    name: string;
    phone?: string;
    email?: string;
  };

  items: {
    cartItemId?: string;
    menuItemId: string;
    name: string;
    basePrice: number;
    customizations?: {
      id: string;
      name: string;
      price?: number;
    }[];
    unitPrice: number;
    quantity: number;
    specialInstructions?: string;
    image?: string;
  }[];

  type: OrderType;
  paymentMethod: PaymentMethod;
  orderNotes?: string;
  tableId?: string;
  reservationId?: string;
  queueEntryId?: string;
}

// ============================================================
// CONTEXT TYPE
// ============================================================

interface OrderContextType {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Order | null;
  getOrderById: (orderId: string) => Order | undefined;
  getCustomerOrders: (customerId?: string) => Order[];
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
  ) => boolean;
  cancelOrder: (orderId: string) => boolean;
  confirmPayment: (orderId: string) => boolean;
}

const OrderContext =
  createContext<OrderContextType | undefined>(undefined);

// ============================================================
// LOAD AND SAVE ORDERS
// ============================================================

function loadOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      console.warn(
        "Smart Cafe: Stored orders data is not an array.",
      );
      return [];
    }

    return parsed as Order[];
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to load orders:",
      error,
    );
    return [];
  }
}

function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to save orders:",
      error,
    );

    throw new Error(
      "The order could not be saved. Please try again.",
    );
  }
}

function getNextOrderNumber(): number {
  try {
    const stored = localStorage.getItem(
      NEXT_ORDER_NUMBER_STORAGE_KEY,
    );

    const currentNumber = stored ? Number(stored) : 1000;

    const nextNumber = Number.isFinite(currentNumber)
      ? currentNumber + 1
      : 1001;

    localStorage.setItem(
      NEXT_ORDER_NUMBER_STORAGE_KEY,
      String(nextNumber),
    );

    return nextNumber;
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to generate order number:",
      error,
    );

    return Date.now();
  }
}

// ============================================================
// CONVERT CART ITEM TO ORDER ITEM
// ============================================================

function convertCartItemToOrderItem(
  item: CreateOrderInput["items"][number],
): OrderItem {
  const basePrice = Number(item.basePrice);
  const unitPrice = Number(item.unitPrice);

  const customizations =
    item.customizations?.map((customization) => ({
      id: customization.id,
      name: customization.name,
      price: Number(customization.price ?? 0),
    })) ?? [];

  return {
    menuItemId: item.menuItemId,
    name: item.name,
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    customizations,
    unitPrice,
    quantity: Number(item.quantity),
    specialInstructions: item.specialInstructions,
    image: item.image,
  };
}

// ============================================================
// VALIDATE ORDER INPUT
// ============================================================

function validateOrderInput(
  input: CreateOrderInput,
): string | null {
  if (!input.customer) {
    return "Customer information is missing.";
  }

  if (typeof input.customer.name !== "string") {
    return "Customer name is invalid.";
  }

  const customerName = input.customer.name.trim();

  // Business rule:
  // Takeaway requires a name.
  // Dine-in and waiting-lounge do not require a name.
  if (
    input.type === "takeaway" &&
    customerName.length === 0
  ) {
    return "Customer name is required for takeaway orders.";
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return "Your cart is empty.";
  }

  for (const item of input.items) {
    if (
      !item.menuItemId ||
      typeof item.menuItemId !== "string"
    ) {
      return "A cart item is missing its menu item ID.";
    }

    if (!item.name || typeof item.name !== "string") {
      return "A cart item is missing its name.";
    }

    const basePrice = Number(item.basePrice);

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return `Invalid base price for "${item.name}".`;
    }

    const unitPrice = Number(item.unitPrice);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return `Invalid price for "${item.name}".`;
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return `Invalid quantity for "${item.name}".`;
    }

    if (item.customizations !== undefined) {
      if (!Array.isArray(item.customizations)) {
        return `Invalid customizations for "${item.name}".`;
      }

      for (const customization of item.customizations) {
        if (!customization.id || !customization.name) {
          return `Invalid customization for "${item.name}".`;
        }

        const customizationPrice = Number(
          customization.price ?? 0,
        );

        if (
          !Number.isFinite(customizationPrice) ||
          customizationPrice < 0
        ) {
          return `Invalid customization price for "${item.name}".`;
        }
      }
    }
  }

  const validOrderTypes: OrderType[] = [
    "dine-in",
    "waiting-lounge",
    "takeaway",
  ];

  if (!validOrderTypes.includes(input.type)) {
    return "Invalid order type.";
  }

  const validPaymentMethods: PaymentMethod[] = [
    "upi",
    "card",
    "counter",
  ];

  if (!validPaymentMethods.includes(input.paymentMethod)) {
    return "Invalid payment method.";
  }

  if (input.type === "dine-in" && !input.tableId) {
    return "Please select a table for dine-in.";
  }

  return null;
}

// ============================================================
// ORDER PROVIDER
// ============================================================

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    tables,
    setTableOrder,
    clearTableOrder,
    completeTableOrder,
    cancelTableOrder,
  } = useTable();

  const {
    startGamingSession,
    getGamingSessionById,
    getGamingSessionByOrderId,
    endGamingSession,
    updateGamingSessionStatus,
  } = useGaming();

  const [orders, setOrders] = useState<Order[]>(loadOrders);

  // ==========================================================
  // CREATE ORDER
  // ==========================================================

  function createOrder(
    input: CreateOrderInput,
  ): Order | null {
    const validationError = validateOrderInput(input);

    if (validationError) {
      throw new Error(validationError);
    }

    let staleOrderId: string | undefined;

    // --------------------------------------------------------
    // VALIDATE DINE-IN TABLE OWNERSHIP
    // --------------------------------------------------------

    if (input.type === "dine-in") {
      const selectedTable = tables.find(
        (table) => table.id === input.tableId,
      );

      if (!selectedTable) {
        throw new Error(
          "The selected table no longer exists. Please select another table.",
        );
      }

      if (selectedTable.orderId) {
        const existingOrder = orders.find(
          (order) => order.id === selectedTable.orderId,
        );

        const activeOrder =
          existingOrder !== undefined &&
          existingOrder.status !== "completed" &&
          existingOrder.status !== "cancelled";

        if (activeOrder) {
          throw new Error(
            `Table ${selectedTable.number} is already assigned to another active order. Please select another table.`,
          );
        }

        // Remember a stale link for cleanup by TableContext.
        // It does not grant permission to use an unavailable table.
        staleOrderId = selectedTable.orderId;
      }

      // Strict rule: only available tables can receive new orders.
      if (selectedTable.status !== "available") {
        throw new Error(
          `Table ${selectedTable.number} is no longer available. Please select another table.`,
        );
      }
    }

    // --------------------------------------------------------
    // CREATE ORDER AND CALCULATE TOTALS
    // --------------------------------------------------------

    const orderNumber = getNextOrderNumber();
    const orderId = `SC${orderNumber}`;
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = input.items.map(
      convertCartItemToOrderItem,
    );

    const subtotal = orderItems.reduce(
      (total, item) =>
        total + item.unitPrice * item.quantity,
      0,
    );

    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    // Payment is separate from kitchen preparation.
    const paymentStatus =
      input.paymentMethod === "counter" ? "pending" : "paid";

    // Existing business rule:
    // Only unpaid takeaway orders wait for payment confirmation.
    const orderStatus: OrderStatus =
      input.type === "takeaway" &&
      paymentStatus === "pending"
        ? "payment-pending"
        : "confirmed";

    const newOrder: Order = {
      id: orderId,
      customerId: input.customerId,
      customer: {
        name: input.customer.name.trim(),
        phone: input.customer.phone,
        email: input.customer.email,
      },
      items: orderItems,
      additionalItems: [],
      type: input.type,
      status: orderStatus,
      paymentStatus,
      paymentMethod: input.paymentMethod,
      subtotal,
      taxAmount,
      totalAmount,
      orderNotes: input.orderNotes,
      tableId: input.tableId,
      reservationId: input.reservationId,
      queueEntryId: input.queueEntryId,
      gamingSessionId: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // --------------------------------------------------------
    // ASSIGN TABLE BEFORE SAVING ORDER
    // --------------------------------------------------------

    let tableAssigned = false;

    if (input.type === "dine-in" && input.tableId) {
      tableAssigned = setTableOrder(
        input.tableId,
        newOrder.id,
        staleOrderId,
      );

      if (!tableAssigned) {
        throw new Error(
          "The selected table could not be assigned to this order. Please select another table.",
        );
      }
    }

    // --------------------------------------------------------
    // START GAMING FOR ELIGIBLE ORDER TYPES
    // --------------------------------------------------------

    const gamingEligible =
      input.type === "dine-in" ||
      input.type === "waiting-lounge";

    if (gamingEligible) {
      try {
        const gamingSession = startGamingSession({
          orderId: newOrder.id,
          mode: "single-player",
        });

        if (gamingSession) {
          newOrder.gamingSessionId = gamingSession.id;
        }
      } catch (error) {
        console.error(
          "Smart Cafe: Gaming session failed to start. Order creation will continue.",
          error,
        );
      }
    }

    // --------------------------------------------------------
    // SAVE ORDER WITH ROLLBACK ON FAILURE
    // --------------------------------------------------------

    try {
      const updatedOrders = [...orders, newOrder];

      saveOrders(updatedOrders);
      setOrders(updatedOrders);
    } catch (error) {
      // Undo the table assignment if saving the order fails.
      if (tableAssigned && input.tableId) {
        clearTableOrder(input.tableId, newOrder.id);
      }

      // Cancel the gaming session if the order was not saved.
      if (newOrder.gamingSessionId) {
        const gamingSession = getGamingSessionById(
          newOrder.gamingSessionId,
        );

        if (gamingSession) {
          updateGamingSessionStatus(
            gamingSession.id,
            "cancelled",
          );
        }
      }

      throw error;
    }

    console.log("SMART CAFE - ORDER CREATED:", newOrder);

    return newOrder;
  }

  // ==========================================================
  // ORDER LOOKUPS
  // ==========================================================

  function getOrderById(
    orderId: string,
  ): Order | undefined {
    return orders.find((order) => order.id === orderId);
  }

  function getCustomerOrders(
    customerId?: string,
  ): Order[] {
    if (!customerId) return orders;

    return orders.filter(
      (order) => order.customerId === customerId,
    );
  }

  // ==========================================================
  // CLEAN UP GAMING FOR TERMINAL ORDERS
  // ==========================================================

  function cleanupGamingForOrder(order: Order): void {
    if (
      order.type !== "dine-in" &&
      order.type !== "waiting-lounge"
    ) {
      return;
    }

    let gamingSession = order.gamingSessionId
      ? getGamingSessionById(order.gamingSessionId)
      : undefined;

    if (!gamingSession) {
      gamingSession = getGamingSessionByOrderId(order.id);
    }

    if (!gamingSession) return;

    if (
      gamingSession.status === "expired" ||
      gamingSession.status === "cancelled"
    ) {
      return;
    }

    endGamingSession(gamingSession.id);

    console.log(
      "SMART CAFE - GAMING SESSION CLEANED UP:",
      {
        orderId: order.id,
        gamingSessionId: gamingSession.id,
        orderStatus: order.status,
      },
    );
  }

  // ==========================================================
  // NOTIFY QUEUE OF ORDER LIFECYCLE CHANGES
  // ==========================================================

  function notifyOrderLifecycle(
    order: Order,
    status: OrderStatus,
  ): void {
    window.dispatchEvent(
      new CustomEvent(ORDER_LIFECYCLE_EVENT, {
        detail: {
          orderId: order.id,
          status,
          queueEntryId: order.queueEntryId,
        },
      }),
    );
  }

  // ==========================================================
  // UPDATE ORDER STATUS
  // ==========================================================

  function updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
  ): boolean {
    const currentOrder = orders.find(
      (order) => order.id === orderId,
    );

    if (!currentOrder) {
      console.error(
        "Smart Cafe: Order not found:",
        orderId,
      );
      return false;
    }

    if (
      !canChangeOrderStatus(
        currentOrder.status,
        nextStatus,
      )
    ) {
      console.error(
        `Smart Cafe: Invalid order status transition: ${currentOrder.status} → ${nextStatus}`,
      );
      return false;
    }

    const updatedOrder: Order = {
      ...currentOrder,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    const updatedOrders = orders.map((order) =>
      order.id === orderId ? updatedOrder : order,
    );

    // Persist the order status before running lifecycle side effects.
    saveOrders(updatedOrders);
    setOrders(updatedOrders);

    if (
      nextStatus === "completed" ||
      nextStatus === "cancelled"
    ) {
      // Isolate each operation. One failure should not prevent
      // the remaining cleanup operations from being attempted.
      try {
        cleanupGamingForOrder(updatedOrder);
      } catch (error) {
        console.error(
          "Smart Cafe: Gaming cleanup failed:",
          error,
        );
      }

      try {
        notifyOrderLifecycle(updatedOrder, nextStatus);
      } catch (error) {
        console.error(
          "Smart Cafe: Queue lifecycle notification failed:",
          error,
        );
      }

      // A dine-in table moves to cleaning only if this order
      // still owns it. Staff releases it after cleaning.
      if (
        updatedOrder.type === "dine-in" &&
        updatedOrder.tableId
      ) {
        try {
          const transitioned =
            nextStatus === "completed"
              ? completeTableOrder(
                  updatedOrder.tableId,
                  updatedOrder.id,
                )
              : cancelTableOrder(
                  updatedOrder.tableId,
                  updatedOrder.id,
                );

          if (!transitioned) {
            console.warn(
              "Smart Cafe: Table was not moved to cleaning because this order no longer owns it.",
              {
                tableId: updatedOrder.tableId,
                orderId: updatedOrder.id,
                nextStatus,
              },
            );
          }
        } catch (error) {
          console.error(
            "Smart Cafe: Table lifecycle cleanup failed:",
            error,
          );
        }
      }
    }

    return true;
  }

  // ==========================================================
  // CANCEL ORDER
  // ==========================================================

  function cancelOrder(orderId: string): boolean {
    const order = orders.find(
      (item) => item.id === orderId,
    );

    if (!order) return false;

    if (
      order.status === "completed" ||
      order.status === "cancelled"
    ) {
      return false;
    }

    return updateOrderStatus(orderId, "cancelled");
  }

  // ==========================================================
  // CONFIRM PAYMENT
  // ==========================================================

  function confirmPayment(orderId: string): boolean {
    const currentOrder = orders.find(
      (order) => order.id === orderId,
    );

    if (!currentOrder) {
      console.error(
        "Smart Cafe: Order not found:",
        orderId,
      );
      return false;
    }

    if (currentOrder.paymentStatus !== "pending") {
      return false;
    }

    // Counter payment for takeaway can move the order
    // from payment-pending to confirmed.
    if (
      currentOrder.type === "takeaway" &&
      currentOrder.status === "payment-pending" &&
      !canChangeOrderStatus(
        currentOrder.status,
        "confirmed",
      )
    ) {
      return false;
    }

    const updatedOrder: Order = {
      ...currentOrder,
      paymentStatus: "paid",
      ...(currentOrder.type === "takeaway" &&
      currentOrder.status === "payment-pending"
        ? { status: "confirmed" as OrderStatus }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    const updatedOrders = orders.map((order) =>
      order.id === orderId ? updatedOrder : order,
    );

    saveOrders(updatedOrders);
    setOrders(updatedOrders);

    return true;
  }

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo<OrderContextType>(
    () => ({
      orders,
      createOrder,
      getOrderById,
      getCustomerOrders,
      updateOrderStatus,
      cancelOrder,
      confirmPayment,
    }),
    [orders],
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

// ============================================================
// USE ORDER HOOK
// Required by customer pages and staff pages.
// ============================================================

export function useOrder(): OrderContextType {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrder must be used inside OrderProvider",
    );
  }

  return context;
}