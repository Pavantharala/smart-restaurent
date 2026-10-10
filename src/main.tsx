// =========================================================
// SMART CAFE - APPLICATION ENTRY
// =========================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";

import { TableProvider } from "./context/TableContext";
import { SettingsProvider } from "./context/SettingsContext";
import { MenuProvider } from "./context/MenuContext";
import { CartProvider } from "./context/CartContext";
import { GamingProvider } from "./context/GamingContext";
import { OrderProvider } from "./context/OrderContext";
import { ReservationProvider } from "./context/ReservationContext";
import { QueueProvider } from "./context/QueueContext";
import { LuckyDrawProvider } from "./context/LuckyDrawContext";

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
                    <LuckyDrawProvider>
                      <App />
                    </LuckyDrawProvider>
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