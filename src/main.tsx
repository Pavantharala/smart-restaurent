// =========================================================
// SMART CAFE - APPLICATION ENTRY
// =========================================================
//
// PROVIDER ORDER
//
// TableProvider
//     ↓
// MenuProvider
//     ↓
// CartProvider
//     ↓
// GamingProvider
//     ↓
// OrderProvider
//     ↓
// ReservationProvider
//     ↓
// QueueProvider
//     ↓
// App
//
// IMPORTANT:
//
// ReservationProvider uses TableContext.
//
// Therefore ReservationProvider MUST be rendered
// inside TableProvider.
//
// QueueProvider now uses ReservationContext.
//
// Therefore QueueProvider MUST be rendered
// inside ReservationProvider.
//
// ReservationProvider manages:
// - Table reservations
// - Reservation time slots
// - Reservation overlap checking
// - 10-minute turnover buffer
//
// QueueProvider manages:
// - Waiting Lounge queue
// - Queue tokens
// - Table assignment
// - Reservation protection when assigning tables
//
// ReservationProvider does NOT directly control
// physical table status.
//
// Staff/Admin still control:
// - Available
// - Reserved
// - Occupied
// - Cleaning
//
// =========================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";

import { TableProvider } from "./context/TableContext";
import { MenuProvider } from "./context/MenuContext";
import { CartProvider } from "./context/CartContext";
import { GamingProvider } from "./context/GamingContext";
import { OrderProvider } from "./context/OrderContext";
import { ReservationProvider } from "./context/ReservationContext";
import { QueueProvider } from "./context/QueueContext";
import { SettingsProvider } from "./context/SettingsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TableProvider>
      <SettingsProvider>
      <MenuProvider>
        <CartProvider>
          <GamingProvider>
            <OrderProvider>
              <ReservationProvider>
                <QueueProvider>
                  <App />
                </QueueProvider>
              </ReservationProvider>
            </OrderProvider>
          </GamingProvider>
        </CartProvider>
      </MenuProvider>
      </SettingsProvider>
    </TableProvider>
  </StrictMode>,
);