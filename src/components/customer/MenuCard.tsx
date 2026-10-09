// ============================================================
// SMART RESTAURANT - CUSTOMER MENU CARD
// ============================================================
// Displays one restaurant menu item.
//
// FEATURES:
// - Product image
// - Product details link
// - Availability status
// - Veg / Non-Veg classification
// - Price and original price
// - Add to cart
//
// FOOD TYPE RULE:
// - Food     -> Veg / Non-Veg
// - Snacks   -> Veg / Non-Veg
// - Drinks   -> No Veg / Non-Veg
// - Desserts -> No Veg / Non-Veg
// - Specials -> No Veg / Non-Veg
// ============================================================

import {
  Check,
  Plus,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import type {
  MenuItem,
} from "../../types/Menu";

import {
  useCart,
} from "../../context/CartContext";

import {
  formatCurrency,
} from "../../utils/formatCurrency";

interface MenuCardProps {
  item: MenuItem;
}

export default function MenuCard({
  item,
}: MenuCardProps) {
  // ==========================================================
  // CART
  // ==========================================================

  const { addItem } = useCart();

  // ==========================================================
  // ADD ITEM TO CART
  // ==========================================================

  const handleAddToCart = () => {
    addItem(item);
  };

  // ==========================================================
  // FOOD TYPE SUPPORT
  //
  // Only Food and Snacks can have Veg / Non-Veg.
  // ==========================================================

  const supportsFoodType =
    item.category === "food" ||
    item.category === "snacks";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <article className="menu-card">

      {/* ====================================================
          PRODUCT IMAGE
      ==================================================== */}

      <Link
        to={`/menu/${item.id}`}
        className="menu-card-image-link"
      >
        <div className="menu-card-image">

          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
            />
          ) : (
            <div className="menu-card-image-placeholder">
              🍽️
            </div>
          )}

        </div>
      </Link>

      {/* ====================================================
          PRODUCT INFORMATION
      ==================================================== */}

      <div className="menu-card-content">

        {/* ==================================================
            PRODUCT HEADER
        ================================================== */}

        <div className="menu-card-top">

          {/* Product name */}

          <Link
            to={`/menu/${item.id}`}
            className="menu-card-title-link"
          >
            <h3>{item.name}</h3>
          </Link>

          {/* Availability */}

          {item.isAvailable ? (
            <span className="availability available">
              <Check size={14} />
              Available
            </span>
          ) : (
            <span className="availability unavailable">
              <X size={14} />
              Unavailable
            </span>
          )}

        </div>

        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        {item.description && (
          <p className="menu-card-description">
            {item.description}
          </p>
        )}

        {/* ==================================================
            VEG / NON-VEG BADGE
        ==================================================

            Food and Snacks only.

            Drinks, Desserts and Specials will not
            display a food type badge.
        ================================================== */}

        {supportsFoodType && item.foodType && (
          <div className="menu-card-food-type">

            {item.foodType === "veg" ? (
              <span className="menu-food-type veg">
                🟢 Veg
              </span>
            ) : (
              <span className="menu-food-type non-veg">
                🔴 Non-Veg
              </span>
            )}

          </div>
        )}

        {/* ==================================================
            PRICE + ADD TO CART
        ================================================== */}

        <div className="menu-card-bottom">

          {/* Price */}

          <div className="menu-card-price">

            {formatCurrency(item.price)}

            {/* Original price */}

            {item.originalPrice &&
              item.originalPrice > item.price && (
                <span className="menu-card-original-price">
                  {formatCurrency(
                    item.originalPrice,
                  )}
                </span>
              )}

          </div>

          {/* Add button */}

          <button
            type="button"
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
          >
            <Plus size={18} />

            {item.isAvailable
              ? "Add"
              : "Unavailable"}

          </button>

        </div>

      </div>

    </article>
  );
}