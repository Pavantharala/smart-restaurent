
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useOrder } from "./OrderContext";
import { useSettings } from "./SettingsContext";
import type {
  LuckyDrawConfig,
  LuckyDrawEntry,
  LuckyDrawEntryResult,
  LuckyDrawPrize,
} from "../types/LuckyDraw";
import type { OrderType } from "../types/Order";

const ENTRIES_STORAGE_KEY = "smart-cafe-lucky-draw-entries";
const CONFIG_STORAGE_KEY = "smart-cafe-lucky-draw-config";
const PRIZES_STORAGE_KEY = "smart-cafe-lucky-draw-prizes";

const ELIGIBLE_ORDER_TYPES: OrderType[] = [
  "dine-in",
  "waiting-lounge",
  "takeaway",
];

export const DEFAULT_LUCKY_DRAW_CONFIG: LuckyDrawConfig = {
  ticketsPerEntry: 1,
  minimumSubtotal: 500,
  maximumSubtotal: 100000,
  minimumItemPrice: 0,
  maximumItemPrice: 100000,
  startDate: "",
  endDate: "",
};

// Read browser storage safely so invalid saved data won't crash the page.
function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch (error) {
    console.error(`Smart Cafe: Could not read ${key}.`, error);
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Smart Cafe: Could not save ${key}.`, error);
    return false;
  }
}

function loadConfig(): LuckyDrawConfig {
  const saved = readStorage<Partial<LuckyDrawConfig>>(
    CONFIG_STORAGE_KEY,
    {},
  );

  const merged = { ...DEFAULT_LUCKY_DRAW_CONFIG, ...saved };

  return {
    ticketsPerEntry: Math.min(
      100,
      Math.max(1, Math.floor(Number(merged.ticketsPerEntry) || 1)),
    ),
    minimumSubtotal: Math.max(0, Number(merged.minimumSubtotal) || 0),
    maximumSubtotal: Math.max(0, Number(merged.maximumSubtotal) || 0),
    minimumItemPrice: Math.max(0, Number(merged.minimumItemPrice) || 0),
    maximumItemPrice: Math.max(0, Number(merged.maximumItemPrice) || 0),
    startDate: merged.startDate || "",
    endDate: merged.endDate || "",
  };
}

function loadEntries(): LuckyDrawEntry[] {
  const saved = readStorage<unknown>(ENTRIES_STORAGE_KEY, []);

  if (!Array.isArray(saved)) return [];

  return saved
    .filter(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.orderId === "string" &&
        typeof entry.orderType === "string" &&
        typeof entry.subtotal === "number" &&
        typeof entry.customerName === "string" &&
        typeof entry.enteredAt === "string",
    )
    .map((entry) => ({
      ...entry,
      tickets: Math.max(1, Math.floor(Number(entry.tickets) || 1)),
    })) as LuckyDrawEntry[];
}

// Migrate older prizes by adding a prize type if they don't have one.
function loadPrizes(): LuckyDrawPrize[] {
  const saved = readStorage<unknown>(PRIZES_STORAGE_KEY, []);

  if (!Array.isArray(saved)) return [];

  return saved
    .filter(
      (prize) =>
        prize &&
        typeof prize.id === "string" &&
        typeof prize.name === "string",
    )
    .map((prize) => ({
      ...prize,
      prizeType:
        prize.prizeType === "menu-product" ? "menu-product" : "custom",
      description:
        typeof prize.description === "string" ? prize.description : "",
      value: Math.max(0, Number(prize.value) || 0),
      quantity: Math.max(1, Math.floor(Number(prize.quantity) || 1)),
      imageUrl: typeof prize.imageUrl === "string" ? prize.imageUrl : "",
      active: typeof prize.active === "boolean" ? prize.active : true,
      ...(typeof prize.menuItemId === "string"
        ? { menuItemId: prize.menuItemId }
        : {}),
    })) as LuckyDrawPrize[];
}

interface LuckyDrawContextType {
  entries: LuckyDrawEntry[];
  config: LuckyDrawConfig;
  prizes: LuckyDrawPrize[];
  enterLuckyDraw: (orderId: string) => LuckyDrawEntryResult;
  hasEntered: (orderId: string) => boolean;
  updateConfig: (nextConfig: LuckyDrawConfig) => boolean;
  addPrize: (prize: Omit<LuckyDrawPrize, "id">) => boolean;
  updatePrize: (prize: LuckyDrawPrize) => boolean;
  deletePrize: (prizeId: string) => boolean;
}

const LuckyDrawContext = createContext<LuckyDrawContextType | undefined>(
  undefined,
);

export function LuckyDrawProvider({ children }: { children: ReactNode }) {
  const { getOrderById } = useOrder();
  const { settings } = useSettings();

  const [entries, setEntries] = useState<LuckyDrawEntry[]>(loadEntries);
  const [config, setConfig] = useState<LuckyDrawConfig>(loadConfig);
  const [prizes, setPrizes] = useState<LuckyDrawPrize[]>(loadPrizes);

  const hasEntered = useCallback(
    (orderId: string) => {
      const id = orderId.trim();
      return Boolean(id) && entries.some((entry) => entry.orderId === id);
    },
    [entries],
  );

  const updateConfig = useCallback((next: LuckyDrawConfig): boolean => {
    const normalized: LuckyDrawConfig = {
      ticketsPerEntry: Math.min(
        100,
        Math.max(1, Math.floor(Number(next.ticketsPerEntry) || 1)),
      ),
      minimumSubtotal: Number(next.minimumSubtotal),
      maximumSubtotal: Number(next.maximumSubtotal),
      minimumItemPrice: Number(next.minimumItemPrice),
      maximumItemPrice: Number(next.maximumItemPrice),
      startDate: next.startDate,
      endDate: next.endDate,
    };

    const numbers = [
      normalized.minimumSubtotal,
      normalized.maximumSubtotal,
      normalized.minimumItemPrice,
      normalized.maximumItemPrice,
    ];

    if (
      numbers.some((number) => !Number.isFinite(number) || number < 0) ||
      normalized.maximumSubtotal < normalized.minimumSubtotal ||
      normalized.maximumItemPrice < normalized.minimumItemPrice
    ) {
      return false;
    }

    if (
      normalized.startDate &&
      normalized.endDate &&
      normalized.endDate < normalized.startDate
    ) {
      return false;
    }

    if (!writeStorage(CONFIG_STORAGE_KEY, normalized)) return false;

    setConfig(normalized);
    return true;
  }, []);

  const addPrize = useCallback(
    (prize: Omit<LuckyDrawPrize, "id">): boolean => {
      const name = prize.name.trim();

      if (!name || !Number.isFinite(prize.quantity) || prize.quantity < 1) {
        return false;
      }

      const newPrize: LuckyDrawPrize = {
        ...prize,
        id: `prize-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        description: prize.description.trim(),
        value: Math.max(0, Number(prize.value) || 0),
        quantity: Math.floor(prize.quantity),
        imageUrl: prize.imageUrl.trim(),
      };

      const updated = [...prizes, newPrize];

      if (!writeStorage(PRIZES_STORAGE_KEY, updated)) return false;

      setPrizes(updated);
      return true;
    },
    [prizes],
  );

  const updatePrize = useCallback(
    (prize: LuckyDrawPrize): boolean => {
      if (
        !prize.name.trim() ||
        !Number.isFinite(prize.quantity) ||
        prize.quantity < 1
      ) {
        return false;
      }

      const updated = prizes.map((existing) =>
        existing.id === prize.id
          ? {
              ...prize,
              name: prize.name.trim(),
              description: prize.description.trim(),
              value: Math.max(0, Number(prize.value) || 0),
              quantity: Math.floor(prize.quantity),
              imageUrl: prize.imageUrl.trim(),
            }
          : existing,
      );

      if (!writeStorage(PRIZES_STORAGE_KEY, updated)) return false;

      setPrizes(updated);
      return true;
    },
    [prizes],
  );

  const deletePrize = useCallback(
    (prizeId: string): boolean => {
      const updated = prizes.filter((prize) => prize.id !== prizeId);

      if (updated.length === prizes.length) return false;
      if (!writeStorage(PRIZES_STORAGE_KEY, updated)) return false;

      setPrizes(updated);
      return true;
    },
    [prizes],
  );

  const enterLuckyDraw = useCallback(
    (orderId: string): LuckyDrawEntryResult => {
      if (!settings.luckyDrawEnabled) {
        return { success: false, message: "Lucky Draw is currently disabled." };
      }

      const normalizedId = orderId.trim();

      if (!normalizedId) {
        return { success: false, message: "Please enter your order ID." };
      }

      const order = getOrderById(normalizedId);

      if (!order) {
        return {
          success: false,
          message: "Order not found. Please check the order ID.",
        };
      }

      if (!ELIGIBLE_ORDER_TYPES.includes(order.type)) {
        return { success: false, message: "This order type is not eligible." };
      }

      if (order.status !== "completed") {
        return {
          success: false,
          message: "Your order must be completed before entering.",
        };
      }

      // Build today's local date explicitly in YYYY-MM-DD format.
      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      if (config.startDate && today < config.startDate) {
        return {
          success: false,
          message: `The Lucky Draw starts on ${config.startDate}.`,
        };
      }

      if (config.endDate && today > config.endDate) {
        return {
          success: false,
          message: "The Lucky Draw campaign has ended.",
        };
      }

      const subtotal = Number(order.subtotal);

      if (
        !Number.isFinite(subtotal) ||
        subtotal < config.minimumSubtotal ||
        subtotal > config.maximumSubtotal
      ) {
        return {
          success: false,
          message: `Order subtotal must be between ₹${config.minimumSubtotal} and ₹${config.maximumSubtotal}.`,
        };
      }

      // Use the prices saved on the order, not today's menu prices.
      const hasQualifyingItem = order.items.some((item) => {
        const price = Number(item.unitPrice);
        return (
          Number.isFinite(price) &&
          price >= config.minimumItemPrice &&
          price <= config.maximumItemPrice
        );
      });

      if (!hasQualifyingItem) {
        return {
          success: false,
          message: `At least one item must be priced between ₹${config.minimumItemPrice} and ₹${config.maximumItemPrice}.`,
        };
      }

      if (entries.some((entry) => entry.orderId === order.id)) {
        return {
          success: false,
          message: "This order has already entered the Lucky Draw.",
        };
      }

      const newEntry: LuckyDrawEntry = {
        id: order.id,
        orderId: order.id,
        orderType: order.type,
        subtotal,
        customerName: order.customer.name,
        enteredAt: new Date().toISOString(),
        tickets: config.ticketsPerEntry,
      };

      const updated = [...entries, newEntry];

      if (!writeStorage(ENTRIES_STORAGE_KEY, updated)) {
        return {
          success: false,
          message: "The entry could not be saved. Please try again.",
        };
      }

      setEntries(updated);

      return {
        success: true,
        message: `Entry recorded successfully! You received ${newEntry.tickets} ticket(s).`,
      };
    },
    [config, entries, getOrderById, settings.luckyDrawEnabled],
  );

  const value = useMemo(
    () => ({
      entries,
      config,
      prizes,
      enterLuckyDraw,
      hasEntered,
      updateConfig,
      addPrize,
      updatePrize,
      deletePrize,
    }),
    [
      entries,
      config,
      prizes,
      enterLuckyDraw,
      hasEntered,
      updateConfig,
      addPrize,
      updatePrize,
      deletePrize,
    ],
  );

  return (
    <LuckyDrawContext.Provider value={value}>
      {children}
    </LuckyDrawContext.Provider>
  );
}

export function useLuckyDraw(): LuckyDrawContextType {
  const context = useContext(LuckyDrawContext);

  if (!context) {
    throw new Error("useLuckyDraw must be used inside LuckyDrawProvider.");
  }

  return context;
}
