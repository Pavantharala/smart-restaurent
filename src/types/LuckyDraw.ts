
import type { OrderType } from "./Order";

// One completed order can enter once and receive multiple tickets.
export interface LuckyDrawEntry {
  id: string;
  orderId: string;
  orderType: OrderType;
  subtotal: number;
  customerName: string;
  enteredAt: string;
  tickets: number;
}

export interface LuckyDrawEntryResult {
  success: boolean;
  message: string;
}

export interface LuckyDrawConfig {
  ticketsPerEntry: number;
  minimumSubtotal: number;
  maximumSubtotal: number;
  minimumItemPrice: number;
  maximumItemPrice: number;
  startDate: string;
  endDate: string;
}

// Menu products and custom rewards can both be Lucky Draw prizes.
export type LuckyDrawPrizeType = "menu-product" | "custom";

export interface LuckyDrawPrize {
  id: string;
  prizeType: LuckyDrawPrizeType;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl: string;
  active: boolean;

  // Optional link to the menu product this prize represents.
  menuItemId?: string;
}
