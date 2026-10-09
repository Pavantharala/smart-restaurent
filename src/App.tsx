
//
// =========================================================
// SMART CAFE - APPLICATION ROUTER
// =========================================================
//
// Central routing configuration.
//
// CUSTOMER
// /
// /menu
// /menu/:itemId
// /cart
// /orders
// /orders/:orderId
// /checkout
// /order-success/:orderId
// /waiting-lounge
// /games
// /games/single
// /games/multiplayer
// /reserve-table
// /reservation-success/:reservationId
// /reservations
//
// STAFF
// /staff
// /staff/kitchen
// /staff/tables
// /staff/queue
// /staff/reservations
//
// ADMIN
// /admin
// /admin/menu
// /admin/menu/add
// /admin/menu/edit/:itemId
// /admin/orders
// /admin/orders/:orderId
// /admin/tables
// /admin/reservations
// /admin/gaming
// /admin/queue
// /admin/customers
// /admin/settings
//
// Authentication/authorization will be added later.
//
// =========================================================

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


// =========================================================
// LAYOUTS
// =========================================================

import CustomerLayout from "./layouts/CustomerLayout";
import StaffLayout from "./layouts/StaffLayout";
import AdminLayout from "./layouts/AdminLayout";


// =========================================================
// CUSTOMER PAGES
// =========================================================

import HomePage from "./pages/customer/HomePage";
import MenuPage from "./pages/customer/MenuPage";
import CartPage from "./pages/customer/CartPage";
import OrdersPage from "./pages/customer/OrdersPage";
import ProductDetailsPage from "./pages/customer/ProductDetailsPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderSuccessPage from "./pages/customer/OrderSuccessPage";
import OrderDetailsPage from "./pages/customer/OrderDetailsPage";
import WaitingLoungePage from "./pages/customer/WaitingLoungePage";
import GamingPage from "./pages/customer/GamingPage";


// =========================================================
// GAMING PAGES
// =========================================================
//
// Phase 19.1
//
// These pages validate the gaming session before allowing
// access to the individual game areas.
//
// =========================================================

import SinglePlayerGamePage from "./pages/customer/SinglePlayerGamePage";
import MultiplayerGamePage from "./pages/customer/MultiplayerGamePage";


// =========================================================
// RESERVATION CUSTOMER PAGES
// =========================================================

import TableReservationPage from "./pages/customer/TableReservationPage";
import ReservationSuccessPage from "./pages/customer/ReservationSuccessPage";
import MyReservationsPage from "./pages/customer/MyReservationsPage";


// =========================================================
// STAFF PAGES
// =========================================================

import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import KitchenPage from "./pages/staff/KitchenPage";
import TablesPage from "./pages/staff/TablesPage";
import QueueManagementPage from "./pages/staff/QueueManagementPage";


// ---------------------------------------------------------
// STAFF RESERVATION MANAGEMENT
// ---------------------------------------------------------
//
// Phase 14.5.3
//
// Staff can:
//
// - View reservations
// - Check in customers
// - Send customers to Waiting Lounge when the table
//   is not physically ready
// - Cancel reservations
//
// ---------------------------------------------------------

import StaffReservationsPage from "./pages/staff/StaffReservationsPage";


// =========================================================
// ADMIN PAGES
// =========================================================

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMenuPage from "./pages/admin/AdminMenuPage";
import AddMenuItemPage from "./pages/admin/AddMenuItemPage";
import EditMenuItemPage from "./pages/admin/EditMenuItemPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailsPage from "./pages/admin/AdminOrderDetailsPage";
import AdminTablesPage from "./pages/admin/AdminTablesPage";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage";
import AdminGamingPage from "./pages/admin/AdminGamingPage";
import AdminQueuePage from "./pages/admin/AdminQueuePage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";


// =========================================================
// GLOBAL STYLES
// =========================================================

import "./App.css";


// =========================================================
// APPLICATION
// =========================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            CUSTOMER ROUTES
        ================================================== */}

        <Route element={<CustomerLayout />}>

          {/* ==================================================
              HOME
          ================================================== */}

          <Route
            path="/"
            element={<HomePage />}
          />


          {/* ==================================================
              MENU
          ================================================== */}

          <Route
            path="/menu"
            element={<MenuPage />}
          />


          {/* ==================================================
              MENU ITEM DETAILS
          ================================================== */}

          <Route
            path="/menu/:itemId"
            element={<ProductDetailsPage />}
          />


          {/* ==================================================
              CART
          ================================================== */}

          <Route
            path="/cart"
            element={<CartPage />}
          />


          {/* ==================================================
              ORDERS
          ================================================== */}

          <Route
            path="/orders"
            element={<OrdersPage />}
          />


          {/* ==================================================
              ORDER DETAILS
          ================================================== */}

          <Route
            path="/orders/:orderId"
            element={<OrderDetailsPage />}
          />


          {/* ==================================================
              CHECKOUT
          ================================================== */}

          <Route
            path="/checkout"
            element={<CheckoutPage />}
          />


          {/* ==================================================
              ORDER SUCCESS
          ================================================== */}

          <Route
            path="/order-success/:orderId"
            element={<OrderSuccessPage />}
          />


          {/* ==================================================
              WAITING LOUNGE
          ================================================== */}

          <Route
            path="/waiting-lounge"
            element={<WaitingLoungePage />}
          />


          {/* ==================================================
              GAMING ZONE
          ================================================== */}

          <Route
            path="/games"
            element={<GamingPage />}
          />


          {/* ==================================================
              SINGLE PLAYER GAME
          ==================================================
          
          Phase 19.1
          
          Access format:
          
          /games/single?session=GAMING_SESSION_ID
          
          The page validates:
          
          - Gaming session
          - Related order
          - Session/order relationship
          - Order type
          - Session status
          
          ================================================== */}

          <Route
            path="/games/single"
            element={<SinglePlayerGamePage />}
          />


          {/* ==================================================
              MULTIPLAYER GAME
          ==================================================
          
          Phase 19.1
          
          Access format:
          
          /games/multiplayer?session=GAMING_SESSION_ID
          
          The page validates:
          
          - Gaming session
          - Related order
          - Session/order relationship
          - Order type
          - Session status
          
          ================================================== */}

          <Route
            path="/games/multiplayer"
            element={<MultiplayerGamePage />}
          />


          {/* ==================================================
              TABLE RESERVATION
          ================================================== */}

          {/*
          
          Customer can:
          
          - Select date
          - Select custom start time
          - Select reservation duration
          - Select party size
          - Select available table
          - Enter customer contact information
          - Choose reservation payment option
          
          Reservation availability is controlled by
          ReservationContext.
          
          Example:
          
          /reserve-table
          
          ==================================================
          */}

          <Route
            path="/reserve-table"
            element={<TableReservationPage />}
          />


          {/* ==================================================
              RESERVATION SUCCESS
          ================================================== */}

          {/*
          
          Example:
          
          /reservation-success/reservation-id
          
          The reservation ID is taken from the URL and used
          to load the correct reservation from
          ReservationContext.
          
          ==================================================
          */}

          <Route
            path="/reservation-success/:reservationId"
            element={<ReservationSuccessPage />}
          />


          {/* ==================================================
              MY RESERVATIONS
          ================================================== */}

          {/*
          
          Displays reservations created in this browser.
          
          Authentication/customer accounts will be added
          later.
          
          ==================================================
          */}

          <Route
            path="/reservations"
            element={<MyReservationsPage />}
          />

        </Route>


        {/* ==================================================
            STAFF ROUTES
        ================================================== */}

        <Route
          path="/staff"
          element={<StaffLayout />}
        >

          {/* ==================================================
              STAFF DASHBOARD
          ================================================== */}

          <Route
            index
            element={<StaffDashboardPage />}
          />


          {/* ==================================================
              KITCHEN
          ================================================== */}

          <Route
            path="kitchen"
            element={<KitchenPage />}
          />


          {/* ==================================================
              TABLES
          ================================================== */}

          <Route
            path="tables"
            element={<TablesPage />}
          />


          {/* ==================================================
              WAITING QUEUE
          ================================================== */}

          <Route
            path="queue"
            element={<QueueManagementPage />}
          />


          {/* ==================================================
              STAFF RESERVATIONS
          ==================================================
          
          Phase 14.5.3
          
          Staff can:
          
          - View reservations
          - Check in customers
          - Mark a customer as waiting
          - Cancel reservations
          
          Check-in flow:
          
          Customer arrives
                  ↓
          Is table physically ready?
             /           \
           YES            NO
            ↓              ↓
        Check In      Send to Waiting
            ↓
        Table Occupied
          
          ==================================================
          */}

          <Route
            path="reservations"
            element={<StaffReservationsPage />}
          />

        </Route>


        {/* ==================================================
            ADMIN ROUTES
        ================================================== */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          {/* ==================================================
              ADMIN DASHBOARD
          ================================================== */}

          <Route
            index
            element={<AdminDashboardPage />}
          />


          {/* ==================================================
              MENU MANAGEMENT
          ================================================== */}

          <Route
            path="menu"
            element={<AdminMenuPage />}
          />


          {/* ==================================================
              ADD MENU ITEM
          ================================================== */}

          <Route
            path="menu/add"
            element={<AddMenuItemPage />}
          />


          {/* ==================================================
              EDIT MENU ITEM
          ================================================== */}

          <Route
            path="menu/edit/:itemId"
            element={<EditMenuItemPage />}
          />


          {/* ==================================================
              ORDER MANAGEMENT
          ================================================== */}

          <Route
            path="orders"
            element={<AdminOrdersPage />}
          />


          {/* ==================================================
              ADMIN ORDER DETAILS
          ================================================== */}

          <Route
            path="orders/:orderId"
            element={<AdminOrderDetailsPage />}
          />


          {/* ==================================================
              TABLE MANAGEMENT
          ================================================== */}

          <Route
            path="tables"
            element={<AdminTablesPage />}
          />


          {/* ==================================================
              RESERVATION MANAGEMENT
          ==================================================
          
          Admin can:
          
          - View reservations
          - Confirm reservations
          - Cancel reservations
          - Filter reservations
          - View reservation date
          - View reservation time
          - View customer contact
          - View payment status
          - View payment amount
          - View physical table status
          
          IMPORTANT:
          
          Reservation status and physical table status
          are separate systems.
          
          ==================================================
          */}

          <Route
            path="reservations"
            element={<AdminReservationsPage />}
          />


          {/* ==================================================
              GAMING MANAGEMENT
          ================================================== */}

          <Route
            path="gaming"
            element={<AdminGamingPage />}
          />


          {/* ==================================================
              QUEUE MANAGEMENT
          ================================================== */}

          <Route
            path="queue"
            element={<AdminQueuePage />}
          />


          {/* ==================================================
              CUSTOMER MANAGEMENT
          ================================================== */}

          <Route
            path="customers"
            element={<AdminCustomersPage />}
          />


          {/* ==================================================
              SETTINGS
          ================================================== */}

          <Route
            path="settings"
            element={<AdminSettingsPage />}
          />

        </Route>


        {/* ==================================================
            UNKNOWN URL
        ==================================================
        
        Any unknown URL is redirected to the customer home
        page.
        
        Example:
        
        /something-that-does-not-exist
                    ↓
        /
        
        ==================================================
        */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;

