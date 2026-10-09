
// SMART CAFE - CUSTOMER PRODUCT DETAILS

import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";

import { useState } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { useMenu } from "../../context/MenuContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";

import type {
  MenuCustomization,
} from "../../types/Menu";

export default function ProductDetailsPage() {
  const { itemId } = useParams<{ itemId: string }>();

  const { menuItems } = useMenu();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);

  const [
    selectedCustomizations,
    setSelectedCustomizations,
  ] = useState<MenuCustomization[]>([]);

  const [
    specialInstructions,
    setSpecialInstructions,
  ] = useState("");

  const product = menuItems.find(
    (menuItem) => menuItem.id === itemId,
  );

  if (!product) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            🍽️
          </div>

          <h1>Menu Item Not Found</h1>

          <p>
            The menu item you are looking for does not
            exist or is no longer available.
          </p>

          <Link
            to="/menu"
            className="primary-button"
          >
            <ArrowLeft size={18} />
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  const price = Number(product.price) || 0;

  const originalPrice =
    product.originalPrice &&
    product.originalPrice > price
      ? Number(product.originalPrice)
      : null;

  const image = product.image || "";

  const supportsFoodType =
    product.category === "food" ||
    product.category === "snacks";

  const customizationTotal =
    selectedCustomizations.reduce(
      (total, customization) =>
        total + (customization.price ?? 0),
      0,
    );

  const unitPrice = price + customizationTotal;
  const total = unitPrice * quantity;

  function isCustomizationSelected(
    customizationId: string,
  ) {
    return selectedCustomizations.some(
      (customization) =>
        customization.id === customizationId,
    );
  }

  function toggleCustomization(
    customization: MenuCustomization,
  ) {
    setSelectedCustomizations((current) => {
      const alreadySelected = current.some(
        (selected) =>
          selected.id === customization.id,
      );

      if (alreadySelected) {
        return current.filter(
          (selected) =>
            selected.id !== customization.id,
        );
      }

      return [...current, customization];
    });
  }

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1),
    );
  }

  function handleAddToCart() {
    // Explicit guard for TypeScript and runtime safety.
    if (!product || !product.isAvailable) {
      return;
    }

    addItem(
      product,
      quantity,
      selectedCustomizations,
      specialInstructions,
    );

    window.alert(`${product.name} added to cart.`);
  }

  return (
    <main className="page-container product-details-page">
      <div className="product-details-topbar">
        <Link
          to="/menu"
          className="back-link"
        >
          <ArrowLeft size={18} />
          Back to Menu
        </Link>
      </div>

      <section className="product-details-container">
        <div className="product-details-image-section">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="product-details-image"
            />
          ) : (
            <div className="product-details-image-placeholder">
              🍽️
            </div>
          )}
        </div>

        <div className="product-details-info">
          <span className="product-details-category">
            {product.category}
          </span>

          {supportsFoodType && product.foodType && (
            <span
              className={
                product.foodType === "veg"
                  ? "menu-food-type veg"
                  : "menu-food-type non-veg"
              }
            >
              {product.foodType === "veg"
                ? "🟢 Veg"
                : "🔴 Non-Veg"}
            </span>
          )}

          <h1>{product.name}</h1>

          <p className="product-details-description">
            {product.description ||
              "A delicious item prepared fresh for you at Smart Cafe."}
          </p>

          {product.isAvailable ? (
            <div className="product-details-availability available">
              <Check size={17} />
              Currently Available
            </div>
          ) : (
            <div className="product-details-availability unavailable">
              <X size={17} />
              Currently Unavailable
            </div>
          )}

          <div className="product-details-price-row">
            <div className="product-details-price">
              {formatCurrency(price)}
            </div>

            {originalPrice !== null && (
              <span className="product-details-original-price">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          {product.preparationTime !== undefined && (
            <div className="product-details-preparation">
              <strong>Preparation Time</strong>
              <span>
                {product.preparationTime} minutes
              </span>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="product-details-tags">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="product-details-tag"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.customizations &&
            product.customizations.length > 0 && (
              <div className="product-details-customizations">
                <div className="product-details-section-heading">
                  <h2>Customize Your Order</h2>
                  <p>Select any extras you want.</p>
                </div>

                <div className="product-details-customization-list">
                  {product.customizations.map(
                    (customization) => {
                      const selected =
                        isCustomizationSelected(
                          customization.id,
                        );

                      return (
                        <button
                          key={customization.id}
                          type="button"
                          className={
                            selected
                              ? "product-customization selected"
                              : "product-customization"
                          }
                          onClick={() =>
                            toggleCustomization(
                              customization,
                            )
                          }
                        >
                          <span className="product-customization-check">
                            {selected && <Check size={15} />}
                          </span>

                          <span className="product-customization-name">
                            {customization.name}
                          </span>

                          <span className="product-customization-price">
                            {(customization.price ?? 0) > 0
                              ? `+${formatCurrency(
                                  customization.price ?? 0,
                                )}`
                              : "Included"}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                {customizationTotal > 0 && (
                  <div className="product-details-customization-total">
                    <span>Customizations</span>
                    <strong>
                      +{formatCurrency(customizationTotal)}
                    </strong>
                  </div>
                )}
              </div>
            )}

          <div className="product-details-instructions">
            <label htmlFor="special-instructions">
              Special Instructions
            </label>

            <textarea
              id="special-instructions"
              value={specialInstructions}
              onChange={(event) =>
                setSpecialInstructions(event.target.value)
              }
              placeholder="Example: No onions, less spicy..."
              rows={3}
              maxLength={300}
            />

            <small>
              {specialInstructions.length}/300
            </small>
          </div>

          <div className="product-details-quantity-section">
            <span>Quantity</span>

            <div className="product-details-quantity-control">
              <button
                type="button"
                onClick={decreaseQuantity}
                aria-label="Decrease quantity"
              >
                <Minus size={18} />
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={increaseQuantity}
                aria-label="Increase quantity"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="product-details-price-summary">
            <div>
              <span>Base Price</span>
              <span>{formatCurrency(price)}</span>
            </div>

            {customizationTotal > 0 && (
              <div>
                <span>Customizations</span>
                <span>
                  +{formatCurrency(customizationTotal)}
                </span>
              </div>
            )}

            <div className="product-details-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <button
            type="button"
            className="product-details-add-button"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
          >
            <ShoppingCart size={20} />

            {product.isAvailable
              ? "Add to Cart"
              : "Currently Unavailable"}
          </button>

          <Link
            to="/cart"
            className="product-details-cart-link"
          >
            View Cart
          </Link>
        </div>
      </section>
    </main>
  );
}

