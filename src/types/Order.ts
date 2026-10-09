
// =========================================================
// SMART CAFE - ORDER TYPES
// =========================================================
//
// Defines the structure used by customer orders.
//
// IMPORTANT:
// OrderItem stores the price snapshot at the time the order
// is created. Future menu-price changes will not change
// old orders.
//
// Phase 7:
// - Customer phone is optional.
// - Table information can be attached to dine-in orders.
//
// Phase 17:
// - Reservation information can be attached to an order.
// - Kitchen workflow now includes an "accepted" status.
// =========================================================


// =========================================================
// ORDER CUSTOMIZATION
// =========================================================

export interface OrderCustomization {
  id: string;
  name: string;
  price: number;
}


// =========================================================
// ORDER ITEM
// =========================================================

export interface OrderItem {
  menuItemId: string;
  name: string;

  // Original menu price at the time the order was created.
  basePrice: number;

  // Selected customization details.
  customizations: OrderCustomization[];

  // Price of one item after customization.
  unitPrice: number;

  // Number of units ordered.
  quantity: number;

  // Customer's optional instructions for this item.
  specialInstructions?: string;

  // Optional product image.
  image?: string;
}


// =========================================================
// PAYMENT STATUS
// =========================================================

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";


// =========================================================
// ORDER STATUS
// =========================================================
//
// CUSTOMER + KITCHEN ORDER WORKFLOW:
//
// created
//    ↓
// payment-pending
//    ↓
// confirmed
//    ↓
// accepted
//    ↓
// preparing
//    ↓
// ready
//    ↓
// served
//    ↓
// completed
//
// CANCELLATION CAN HAPPEN AT THE APPROPRIATE
// POINTS ACCORDING TO orderStatus.ts.
//
// IMPORTANT:
//
// "confirmed" means the payment/order has been confirmed
// and the order is waiting for kitchen action.
//
// "accepted" means kitchen staff has accepted the order
// and confirms that the kitchen can prepare it.
//
// "preparing" means kitchen staff has started preparing it.
//
// "ready" means the food is ready for service.
//
// "served" means the food has been given to the customer.
//
// "completed" means the order lifecycle is finished.
// =========================================================

export type OrderStatus =
  | "created"
  | "payment-pending"
  | "confirmed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";


// =========================================================
// ORDER TYPE
// =========================================================

export type OrderType =
  | "dine-in"
  | "waiting-lounge"
  | "takeaway";


// =========================================================
// PAYMENT METHOD
// =========================================================

export type PaymentMethod =
  | "upi"
  | "card"
  | "counter";


// =========================================================
// ORDER CUSTOMER
// =========================================================
//
// Name is required.
//
// Phone is OPTIONAL because the customer should be able
// to place a dine-in order without providing a phone number.
//
// Email is also optional.
// =========================================================

export interface OrderCustomer {
  name: string;
  phone?: string;
  email?: string;
}


// =========================================================
// ORDER
// =========================================================

export interface Order {
  // =======================================================
  // BASIC ORDER INFORMATION
  // =======================================================

  // Unique order ID.
  id: string;

  // Optional customer/account ID.
  //
  // This can be connected to a real customer account
  // when authentication is added later.
  customerId?: string;

  // Customer information stored with the order.
  customer: OrderCustomer;


  // =======================================================
  // ORDER ITEMS
  // =======================================================

  // Items placed when the order was originally created.
  items: OrderItem[];

  // Used later when customers add drinks/snacks
  // to an existing order.
  additionalItems: OrderItem[];


  // =======================================================
  // ORDER TYPE
  // =======================================================

  type: OrderType;


  // =======================================================
  // ORDER STATUS
  // =======================================================

  // Controls the complete customer → kitchen →
  // service workflow.
  status: OrderStatus;


  // =======================================================
  // PAYMENT
  // =======================================================

  paymentStatus: PaymentStatus;

  paymentMethod: PaymentMethod;


  // =======================================================
  // PRICE SNAPSHOT
  // =======================================================

  // Price values are stored directly on the order so
  // future menu-price changes do not affect old orders.
  subtotal: number;

  taxAmount: number;

  totalAmount: number;


  // =======================================================
  // ORDER NOTES
  // =======================================================

  // Optional general instructions for the entire order.
  orderNotes?: string;


  // =======================================================
  // TABLE
  // =======================================================
  //
  // For dine-in orders this stores the physical table ID.
  //
  // Example:
  //
  // T-04
  //
  // The customer does NOT manually enter this.
  // It comes from the QR/table session.
  // =======================================================

  tableId?: string;


  // =======================================================
  // RESERVATION
  // =======================================================
  //
  // Connects an order to a table reservation.
  //
  // This is optional because not every order comes
  // from a reservation.
  //
  // Example:
  //
  // Reservation RES-123
  //        ↓
  // Order SC1005
  //
  // This relationship will be used for future
  // reservation + order integration.
  // =======================================================

  reservationId?: string;


  // =======================================================
  // QUEUE
  // =======================================================
  //
  // Connects the order to a Waiting Lounge queue entry
  // when applicable.
  // =======================================================

  queueEntryId?: string;


  // =======================================================
  // GAMING
  // =======================================================
  //
  // Connects the order to its gaming session when
  // the order is eligible for gaming.
  // =======================================================

  gamingSessionId?: string;


  // =======================================================
  // TIMESTAMPS
  // =======================================================

  // ISO timestamp when the order was created.
  createdAt: string;

  // ISO timestamp when the order was last updated.
  updatedAt: string;
}

