
// ============================================================
// SMART RESTAURANT - CART PAGE
// ============================================================
// Displays all products currently inside the customer's cart.
//
// Features:
// - Product list
// - Increase/decrease quantity
// - Remove individual cart configuration
// - Show selected customizations
// - Show customization prices
// - Show special instructions
// - Correct subtotal
// - Proceed to Checkout
//
// Updated for Phase 6B.
// ============================================================

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // ----------------------------------------------------------
  // Empty cart
  // ----------------------------------------------------------

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <section className="cart-empty-state">
          <div className="cart-empty-icon">
            <ShoppingBag size={42} />
          </div>

          <h1>Your cart is empty</h1>

          <p>
            Add some delicious items from our menu
            to get started.
          </p>

          <Link
            to="/menu"
            className="primary-button"
          >
            Browse Menu
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* ----------------------------------------------------
          Page heading
      ----------------------------------------------------- */}

      <section className="cart-header">
        <div>
          <span className="section-eyebrow">
            YOUR ORDER
          </span>

          <h1>Shopping Cart</h1>

          <p>
            {itemCount}{" "}
            {itemCount === 1
              ? "item"
              : "items"}{" "}
            in your cart
          </p>
        </div>

        <button
          type="button"
          className="clear-cart-button"
          onClick={clearCart}
        >
          <Trash2 size={18} />
          Clear Cart
        </button>
      </section>

      {/* ----------------------------------------------------
          Cart content
      ----------------------------------------------------- */}

      <div className="cart-layout">
        {/* --------------------------------------------------
            Items
        --------------------------------------------------- */}

        <section className="cart-items">
          {items.map((item) => (
            <article
              key={item.cartItemId}
              className="cart-item"
            >
              {/* ------------------------------------------------
                  Product image
              ------------------------------------------------- */}

              <div className="cart-item-image">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                  />
                ) : (
                  <span>🍽️</span>
                )}
              </div>

              {/* ------------------------------------------------
                  Product information
              ------------------------------------------------- */}

              <div className="cart-item-info">
                <h2>{item.name}</h2>

                {/* Base price */}
                <p>
                  Base price:{" "}
                  {formatCurrency(item.basePrice)}
                </p>

                {/* ------------------------------------------------
                    Customizations
                ------------------------------------------------- */}

                {item.customizations.length > 0 && (
                  <div className="cart-item-customizations">
                    <strong>Customizations:</strong>

                    {item.customizations.map(
                      (customization) => (
                        <div
                          key={customization.id}
                          className="cart-customization"
                        >
                          <span>
                            {customization.name}
                          </span>

                          <span>
                            +
                            {formatCurrency(
                              customization.price ?? 0,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* ------------------------------------------------
                    Final unit price
                ------------------------------------------------- */}

                <p className="cart-item-unit-price">
                  {formatCurrency(item.unitPrice)}
                  {" "}each
                </p>

                {/* ------------------------------------------------
                    Special instructions
                ------------------------------------------------- */}

                {item.specialInstructions && (
                  <div className="cart-special-instructions">
                    <strong>Note:</strong>{" "}
                    {item.specialInstructions}
                  </div>
                )}

                {/* ------------------------------------------------
                    Quantity controls
                ------------------------------------------------- */}

                <div className="quantity-controls">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.cartItemId,
                        item.quantity - 1,
                      )
                    }
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.cartItemId,
                        item.quantity + 1,
                      )
                    }
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------
                  Item total
              ------------------------------------------------- */}

              <div className="cart-item-right">
                <strong>
                  {formatCurrency(
                    item.unitPrice *
                      item.quantity,
                  )}
                </strong>

                <button
                  type="button"
                  className="remove-item-button"
                  onClick={() =>
                    removeItem(item.cartItemId)
                  }
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* --------------------------------------------------
            Order summary
        --------------------------------------------------- */}

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Items</span>

            <span>{itemCount}</span>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>

            <span>
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total</span>

            <strong>
              {formatCurrency(subtotal)}
            </strong>
          </div>

          {/* ------------------------------------------------
              Checkout
          ------------------------------------------------- */}

          <Link
            to="/checkout"
            className="checkout-button"
          >
            Proceed to Checkout
          </Link>

          <Link
            to="/menu"
            className="continue-shopping-link"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
