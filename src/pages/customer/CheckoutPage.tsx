// =========================================================
// SMART CAFE - CUSTOMER CHECKOUT PAGE
// =========================================================
//
// Responsibilities:
//
// - Dine-in checkout
// - Waiting Lounge checkout
// - Takeaway checkout
// - Dine-in table selection
// - QR-selected table preference
// - Waiting Lounge party size
// - Waiting Queue integration
// - Payment method
// - Order notes
// - Order summary
// - Tax calculation
// - Order creation
// - Duplicate submission protection
// - Safe table availability handling
//
// =========================================================

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useOrder } from "../../context/OrderContext";
import { useTable } from "../../context/TableContext";
import { useQueue } from "../../context/QueueContext";

import type {
  OrderType,
  PaymentMethod,
} from "../../types/Order";

import { formatCurrency } from "../../utils/formatCurrency";

// =========================================================
// TAX
// =========================================================

const TAX_RATE = 0.05;

// =========================================================
// CURRENT QUEUE ENTRY
// =========================================================

const CURRENT_QUEUE_ENTRY_KEY =
  "smart-cafe-current-queue-entry";

// =========================================================
// CHECKOUT PAGE
// =========================================================

export default function CheckoutPage() {
  const navigate =
    useNavigate();

  // =======================================================
  // CART
  // =======================================================

  const {
    items,
    subtotal,
    clearCart,
  } = useCart();

  // =======================================================
  // ORDER
  // =======================================================

  const {
    createOrder,
  } = useOrder();

  // =======================================================
  // QUEUE
  // =======================================================

  const {
    addToQueue,
  } = useQueue();

  // =======================================================
  // TABLE
  // =======================================================

  const {
    selectedTable,
    tables,
  } = useTable();

  // =======================================================
  // CUSTOMER
  // =======================================================

  const [
    name,
    setName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  // =======================================================
  // ORDER TYPE
  // =======================================================

  const [
    orderType,
    setOrderType,
  ] =
    useState<OrderType>(
      "dine-in",
    );

  // =======================================================
  // WAITING PARTY
  // =======================================================

  const [
    partySize,
    setPartySize,
  ] = useState(2);

  // =======================================================
  // SELECTED TABLE
  // =======================================================

  const [
    selectedTableId,
    setSelectedTableId,
  ] =
    useState<
      string | undefined
    >(
      selectedTable?.id,
    );

  // =======================================================
  // PAYMENT
  // =======================================================

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod>(
      "upi",
    );

  // =======================================================
  // NOTES
  // =======================================================

  const [
    orderNotes,
    setOrderNotes,
  ] = useState("");

  // =======================================================
  // ERROR
  // =======================================================

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  // =======================================================
  // SUBMITTING
  // =======================================================

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  // =======================================================
  // SUITABLE TABLES
  // =======================================================
  //
  // IMPORTANT:
  //
  // A table is suitable only when:
  //
  // 1. physical status = available
  // 2. NO order owns it
  // 3. capacity is sufficient
  //
  // =======================================================

  const suitableTables =
    useMemo(() => {
      return tables.filter(
        (table) =>
          table.status ===
            "available" &&
          !table.orderId &&
          table.capacity >=
            partySize,
      );
    }, [
      tables,
      partySize,
    ]);

  // =======================================================
  // KEEP SELECTED TABLE VALID
  // =======================================================

  useEffect(() => {
    if (
      orderType !==
      "dine-in"
    ) {
      return;
    }

    // -----------------------------------------------------
    // Current selection still valid.
    // -----------------------------------------------------

    const selectedStillAvailable =
      suitableTables.some(
        (table) =>
          table.id ===
          selectedTableId,
      );

    if (
      selectedStillAvailable
    ) {
      return;
    }

    // -----------------------------------------------------
    // Prefer QR-selected table.
    // -----------------------------------------------------

    const qrTableIsSuitable =
      selectedTable &&
      suitableTables.some(
        (table) =>
          table.id ===
          selectedTable.id,
      );

    if (
      qrTableIsSuitable
    ) {
      setSelectedTableId(
        selectedTable.id,
      );

      return;
    }

    // -----------------------------------------------------
    // Otherwise choose first suitable table.
    // -----------------------------------------------------

    if (
      suitableTables.length >
      0
    ) {
      setSelectedTableId(
        suitableTables[0].id,
      );

      return;
    }

    // -----------------------------------------------------
    // Nothing available.
    // -----------------------------------------------------

    setSelectedTableId(
      undefined,
    );
  }, [
    suitableTables,
    selectedTableId,
    selectedTable,
    orderType,
  ]);

  // =======================================================
  // TAX
  // =======================================================

  const taxAmount =
    useMemo(
      () =>
        subtotal *
        TAX_RATE,
      [subtotal],
    );

  // =======================================================
  // TOTAL
  // =======================================================

  const totalAmount =
    subtotal +
    taxAmount;

  // =======================================================
  // SELECTED LIVE TABLE
  // =======================================================

  const selectedDineInTable =
    useMemo(() => {
      return suitableTables.find(
        (table) =>
          table.id ===
          selectedTableId,
      );
    }, [
      suitableTables,
      selectedTableId,
    ]);

  // =======================================================
  // EMPTY CART
  // =======================================================

  if (
    items.length === 0
  ) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <h1>
            Your Cart Is Empty
          </h1>

          <p>
            Add some food or drinks
            before proceeding to
            checkout.
          </p>

          <Link
            to="/menu"
            className="primary-button"
          >
            Browse Menu
          </Link>
        </div>
      </main>
    );
  }

  // =======================================================
  // SUBMIT
  // =======================================================

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    // =====================================================
    // TAKEAWAY VALIDATION
    // =====================================================

    if (
      orderType ===
        "takeaway" &&
      name.trim().length <
        2
    ) {
      setSubmitError(
        "Please enter your name for takeaway.",
      );

      setIsSubmitting(false);

      return;
    }

    // =====================================================
    // DINE-IN VALIDATION
    // =====================================================

    if (
      orderType ===
        "dine-in"
    ) {
      if (
        !selectedTableId
      ) {
        setSubmitError(
          "Please select an available table.",
        );

        setIsSubmitting(false);

        return;
      }

      // ---------------------------------------------------
      // IMPORTANT:
      //
      // Read the LIVE table again immediately before
      // creating the order.
      //
      // This prevents checkout from using an old table
      // selection after another customer takes the table.
      // ---------------------------------------------------

      const liveSelectedTable =
        tables.find(
          (table) =>
            table.id ===
            selectedTableId,
        );

      if (
        !liveSelectedTable
      ) {
        setSubmitError(
          "The selected table no longer exists. Please select another table.",
        );

        setIsSubmitting(false);

        return;
      }

      if (
        liveSelectedTable.status !==
          "available" ||
        liveSelectedTable.orderId
      ) {
        setSubmitError(
          `Table ${liveSelectedTable.number} is no longer available. Please select another table.`,
        );

        setIsSubmitting(false);

        return;
      }

      if (
        liveSelectedTable.capacity <
        partySize
      ) {
        setSubmitError(
          "The selected table is too small for your group.",
        );

        setIsSubmitting(false);

        return;
      }
    }

    // =====================================================
    // WAITING LOUNGE VALIDATION
    // =====================================================

    if (
      orderType ===
        "waiting-lounge" &&
      (
        !Number.isInteger(
          partySize,
        ) ||
        partySize < 1 ||
        partySize > 20
      )
    ) {
      setSubmitError(
        "Please enter a valid waiting party size between 1 and 20.",
      );

      setIsSubmitting(false);

      return;
    }

    // =====================================================
    // INTERNAL CUSTOMER NAME
    // =====================================================

    const customerName =
      orderType ===
        "takeaway"
        ? name.trim()
        : orderType ===
            "dine-in"
          ? "Dine-In Guest"
          : "Waiting Lounge Guest";

    // =====================================================
    // CREATE ORDER
    // =====================================================

    let order;

    try {
      order =
        createOrder({
          customer: {
            name:
              customerName,

            phone:
              orderType ===
                "takeaway"
                ? phone.trim() ||
                  undefined
                : undefined,

            email:
              orderType ===
                "takeaway"
                ? email.trim() ||
                  undefined
                : undefined,
          },

          items,

          type:
            orderType,

          paymentMethod,

          orderNotes:
            orderNotes.trim() ||
            undefined,

          tableId:
            orderType ===
              "dine-in"
              ? selectedTableId
              : undefined,
        });
    } catch (error) {
      console.error(
        "Smart Cafe: Order creation failed:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to place your order. Please try again.";

      setSubmitError(
        message,
      );

      setIsSubmitting(false);

      return;
    }

    // =====================================================
    // SAFETY
    // =====================================================

    if (!order) {
      setSubmitError(
        "The order could not be created. Please try again.",
      );

      setIsSubmitting(false);

      return;
    }

    // =====================================================
    // WAITING LOUNGE QUEUE
    // =====================================================

    if (
      orderType ===
      "waiting-lounge"
    ) {
      try {
        const queueEntry =
          addToQueue({
            customerId:
              `guest-${order.id}`,

            orderId:
              order.id,

            partySize,

            notifyWhenReady:
              true,
          });

        try {
          localStorage.setItem(
            CURRENT_QUEUE_ENTRY_KEY,
            queueEntry.id,
          );
        } catch (storageError) {
          console.error(
            "Smart Cafe: Unable to save current queue entry.",
            storageError,
          );
        }
      } catch (error) {
        console.error(
          "Smart Cafe: Unable to create waiting lounge queue entry.",
          error,
        );

        setSubmitError(
          "Your order was created, but we could not add you to the Waiting Lounge queue. Please contact staff.",
        );

        setIsSubmitting(false);

        return;
      }
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    clearCart();

    if (
      orderType ===
      "waiting-lounge"
    ) {
      navigate(
        "/waiting-lounge",
      );

      return;
    }

    navigate(
      `/order-success/${order.id}`,
    );
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <main className="page-container checkout-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="checkout-header">

        <Link
          to="/cart"
          className="back-link"
        >
          ← Back to Cart
        </Link>

        <h1>
          Checkout
        </h1>

        <p>
          Confirm your order details
          and place your order.
        </p>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {submitError && (
        <div
          className="checkout-section"
          role="alert"
        >
          <strong>
            Unable to place order
          </strong>

          <p>
            {submitError}
          </p>

          {orderType ===
            "dine-in" && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setSubmitError(
                  "",
                );

                setOrderType(
                  "waiting-lounge",
                );
              }}
            >
              Switch to Waiting Lounge
            </button>
          )}
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      <form
        className="checkout-layout"
        onSubmit={
          handleSubmit
        }
      >

        {/* =================================================
            TAKEAWAY CUSTOMER DETAILS
        ================================================= */}

        {orderType ===
          "takeaway" && (
          <section className="checkout-section">

            <h2>
              Customer Details
            </h2>

            <div className="checkout-form-group">

              <label htmlFor="customer-name">
                Name{" "}
                <span>
                  (Required)
                </span>
              </label>

              <input
                id="customer-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target
                      .value,
                  );

                  setSubmitError(
                    "",
                  );
                }}
                placeholder="Enter your name"
                required
              />

            </div>

            <div className="checkout-form-group">

              <label htmlFor="customer-phone">
                Phone Number{" "}
                <span>
                  (Optional)
                </span>
              </label>

              <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target
                      .value,
                  )
                }
                placeholder="Enter your phone number (Optional)"
              />

            </div>

            <div className="checkout-form-group">

              <label htmlFor="customer-email">
                Email{" "}
                <span>
                  (Optional)
                </span>
              </label>

              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                placeholder="Enter your email (Optional)"
              />

            </div>

          </section>
        )}

        {/* =================================================
            DINE-IN TABLE
        ================================================= */}

        {orderType ===
          "dine-in" && (
          <section className="checkout-section">

            <h2>
              Select Your Table
            </h2>

            <p>
              Choose an available table
              suitable for your group.
            </p>

            {suitableTables.length ===
            0 ? (
              <div className="waiting-lounge-suggestion">

                <strong>
                  No suitable table available
                </strong>

                <p>
                  There is currently no
                  available table with enough
                  capacity for your group.
                </p>

                <p>
                  You can join our Waiting
                  Lounge while we prepare a
                  suitable table.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setSubmitError(
                      "",
                    );

                    setOrderType(
                      "waiting-lounge",
                    );
                  }}
                >
                  Join Waiting Lounge
                </button>

              </div>
            ) : (
              <div className="checkout-options">

                {suitableTables.map(
                  (table) => (
                    <label
                      key={
                        table.id
                      }
                    >

                      <input
                        type="radio"
                        name="selectedTable"
                        value={
                          table.id
                        }
                        checked={
                          selectedTableId ===
                          table.id
                        }
                        onChange={() => {
                          setSelectedTableId(
                            table.id,
                          );

                          setSubmitError(
                            "",
                          );
                        }}
                      />

                      <span>

                        <strong>
                          Table{" "}
                          {table.number}
                        </strong>

                        <small>
                          Seats{" "}
                          {table.capacity}{" "}
                          people
                        </small>

                        {selectedTable?.id ===
                          table.id && (
                          <small>
                            QR-selected table
                          </small>
                        )}

                      </span>

                    </label>
                  ),
                )}

              </div>
            )}

          </section>
        )}

        {/* =================================================
            ORDER TYPE
        ================================================= */}

        <section className="checkout-section">

          <h2>
            Order Type
          </h2>

          <div className="checkout-options">

            <label>

              <input
                type="radio"
                name="orderType"
                value="dine-in"
                checked={
                  orderType ===
                  "dine-in"
                }
                onChange={() => {
                  setSubmitError(
                    "",
                  );

                  setOrderType(
                    "dine-in",
                  );
                }}
              />

              <span>
                <strong>
                  Dine In
                </strong>

                <small>
                  Eat at the cafe
                </small>
              </span>

            </label>

            <label>

              <input
                type="radio"
                name="orderType"
                value="waiting-lounge"
                checked={
                  orderType ===
                  "waiting-lounge"
                }
                onChange={() => {
                  setSubmitError(
                    "",
                  );

                  setOrderType(
                    "waiting-lounge",
                  );
                }}
              />

              <span>
                <strong>
                  Waiting Lounge
                </strong>

                <small>
                  Order and play games
                  while waiting for a table
                </small>
              </span>

            </label>

            <label>

              <input
                type="radio"
                name="orderType"
                value="takeaway"
                checked={
                  orderType ===
                  "takeaway"
                }
                onChange={() => {
                  setSubmitError(
                    "",
                  );

                  setOrderType(
                    "takeaway",
                  );
                }}
              />

              <span>
                <strong>
                  Takeaway
                </strong>

                <small>
                  Collect your order
                </small>
              </span>

            </label>

          </div>

        </section>

        {/* =================================================
            WAITING LOUNGE
        ================================================= */}

        {orderType ===
          "waiting-lounge" && (
          <section className="checkout-section">

            <h2>
              Waiting Lounge
            </h2>

            <p>
              Join the queue and enjoy
              gaming while you wait.
            </p>

            <div className="checkout-form-group">

              <label htmlFor="party-size">
                Number of People
              </label>

              <input
                id="party-size"
                type="number"
                min="1"
                max="20"
                value={
                  partySize
                }
                onChange={(event) => {
                  const value =
                    Number(
                      event.target
                        .value,
                    );

                  if (
                    Number.isNaN(
                      value,
                    )
                  ) {
                    setPartySize(
                      1,
                    );

                    return;
                  }

                  setPartySize(
                    Math.max(
                      1,
                      Math.min(
                        20,
                        value,
                      ),
                    ),
                  );
                }}
              />

              <small>
                Tell us how many people
                are waiting for a table.
              </small>

            </div>

          </section>
        )}

        {/* =================================================
            PAYMENT
        ================================================= */}

        <section className="checkout-section">

          <h2>
            Payment Method
          </h2>

          <div className="checkout-options">

            <label>

              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={
                  paymentMethod ===
                  "upi"
                }
                onChange={() =>
                  setPaymentMethod(
                    "upi",
                  )
                }
              />

              <span>
                <strong>
                  UPI
                </strong>

                <small>
                  Development payment
                  simulation
                </small>
              </span>

            </label>

            <label>

              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={
                  paymentMethod ===
                  "card"
                }
                onChange={() =>
                  setPaymentMethod(
                    "card",
                  )
                }
              />

              <span>
                <strong>
                  Card
                </strong>

                <small>
                  Development payment
                  simulation
                </small>
              </span>

            </label>

            <label>

              <input
                type="radio"
                name="paymentMethod"
                value="counter"
                checked={
                  paymentMethod ===
                  "counter"
                }
                onChange={() =>
                  setPaymentMethod(
                    "counter",
                  )
                }
              />

              <span>
                <strong>
                  Pay at Counter
                </strong>

                <small>
                  Staff confirms payment
                </small>
              </span>

            </label>

          </div>

        </section>

        {/* =================================================
            NOTES
        ================================================= */}

        <section className="checkout-section">

          <h2>
            Order Notes
          </h2>

          <textarea
            value={
              orderNotes
            }
            onChange={(event) =>
              setOrderNotes(
                event.target
                  .value,
              )
            }
            placeholder="Anything else we should know?"
            rows={4}
          />

        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <aside className="checkout-summary">

          <h2>
            Order Summary
          </h2>

          <div className="checkout-summary-items">

            {items.map(
              (item) => (
                <div
                  key={
                    item.cartItemId
                  }
                  className="checkout-summary-item"
                >

                  <div>

                    <strong>
                      {item.name} ×{" "}
                      {item.quantity}
                    </strong>

                    {item.customizations
                      .length >
                      0 && (
                      <small>
                        {item.customizations
                          .map(
                            (
                              customization,
                            ) =>
                              customization.name,
                          )
                          .join(
                            ", ",
                          )}
                      </small>
                    )}

                    {item.specialInstructions && (
                      <small>
                        Note:{" "}
                        {
                          item.specialInstructions
                        }
                      </small>
                    )}

                  </div>

                  <span>
                    {formatCurrency(
                      item.unitPrice *
                        item.quantity,
                    )}
                  </span>

                </div>
              ),
            )}

          </div>

          {orderType ===
            "dine-in" &&
            selectedDineInTable && (
              <div className="checkout-total-row">

                <span>
                  Selected Table
                </span>

                <strong>
                  Table{" "}
                  {
                    selectedDineInTable.number
                  }
                </strong>

              </div>
            )}

          {orderType ===
            "waiting-lounge" && (
            <div className="checkout-total-row">

              <span>
                Waiting People
              </span>

              <strong>
                {partySize}
              </strong>

            </div>
          )}

          <div className="checkout-total-row">

            <span>
              Order Type
            </span>

            <strong>
              {orderType ===
                "dine-in" &&
                "Dine In"}

              {orderType ===
                "waiting-lounge" &&
                "Waiting Lounge"}

              {orderType ===
                "takeaway" &&
                "Takeaway"}
            </strong>

          </div>

          <div className="checkout-total-row">

            <span>
              Subtotal
            </span>

            <strong>
              {formatCurrency(
                subtotal,
              )}
            </strong>

          </div>

          <div className="checkout-total-row">

            <span>
              Tax
            </span>

            <strong>
              {formatCurrency(
                taxAmount,
              )}
            </strong>

          </div>

          <div
            className={
              "checkout-total-row " +
              "checkout-grand-total"
            }
          >

            <span>
              Total
            </span>

            <strong>
              {formatCurrency(
                totalAmount,
              )}
            </strong>

          </div>

          <button
            type="submit"
            className={
              "primary-button " +
              "checkout-submit-button"
            }
            disabled={
              isSubmitting ||
              (
                orderType ===
                  "dine-in" &&
                suitableTables.length ===
                  0
              )
            }
          >
            {isSubmitting
              ? "Placing Order..."
              : (
                <>
                  Place Order •{" "}
                  {formatCurrency(
                    totalAmount,
                  )}
                </>
              )}
          </button>

        </aside>

      </form>

    </main>
  );
}