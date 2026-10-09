
// SMART CAFE - CUSTOMER MENU PAGE
// PHASE 13.2
// Menu search, category filters, food classification and cart access.

import {
  Search,
  ShoppingCart,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import MenuCard from "../../components/customer/MenuCard";

import {
  useCart,
} from "../../context/CartContext";

import {
  useMenu,
} from "../../context/MenuContext";

type CategoryFilter =
  | "all"
  | "food"
  | "drinks"
  | "snacks"
  | "desserts"
  | "specials";

type FoodTypeFilter =
  | "all"
  | "veg"
  | "non-veg";

export default function MenuPage() {
  const { menuItems } = useMenu();

  // CartContext provides itemCount, not totalItems.
  const { itemCount } = useCart();

  const [search, setSearch] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<CategoryFilter>("all");

  const [
    selectedFoodType,
    setSelectedFoodType,
  ] = useState<FoodTypeFilter>("all");

  // Show food-type filters only for Food and Snacks.
  const showFoodTypeFilter =
    selectedCategory === "food" ||
    selectedCategory === "snacks";

  // Filter menu items.
  const filteredItems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return menuItems.filter((item) => {
      // Hide unavailable items from customers.
      // Admins can manage these items separately.
      if (!item.isAvailable) {
        return false;
      }

      // Category filter.
      const matchesCategory =
        selectedCategory === "all" ||
        item.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      // Search by name, description or tags.
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.description
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(normalizedSearch),
        );

      if (!matchesSearch) {
        return false;
      }

      // Apply Veg/Non-Veg filtering only to Food and Snacks.
      if (
        showFoodTypeFilter &&
        selectedFoodType !== "all"
      ) {
        return item.foodType === selectedFoodType;
      }

      return true;
    });
  }, [
    menuItems,
    search,
    selectedCategory,
    selectedFoodType,
    showFoodTypeFilter,
  ]);

  const categories: {
    label: string;
    value: CategoryFilter;
  }[] = [
    { label: "All", value: "all" },
    { label: "Food", value: "food" },
    { label: "Drinks", value: "drinks" },
    { label: "Snacks", value: "snacks" },
    { label: "Desserts", value: "desserts" },
    { label: "Specials", value: "specials" },
  ];

  const foodTypes: {
    label: string;
    value: FoodTypeFilter;
  }[] = [
    { label: "All", value: "all" },
    { label: "🟢 Veg", value: "veg" },
    { label: "🔴 Non-Veg", value: "non-veg" },
  ];

  function handleCategoryChange(
    category: CategoryFilter,
  ) {
    setSelectedCategory(category);

    // Reset the food type when leaving Food/Snacks.
    if (
      category !== "food" &&
      category !== "snacks"
    ) {
      setSelectedFoodType("all");
    }
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("all");
    setSelectedFoodType("all");
  }

  return (
    <section className="customer-page menu-page">
      {/* Page header */}
      <div className="menu-page-header">
        <div>
          <p className="section-eyebrow">
            SMART CAFE MENU
          </p>

          <h1>Explore Our Menu</h1>

          <p>
            Fresh food, drinks, snacks and
            desserts made for every customer.
          </p>
        </div>

        {/* Cart link and item count */}
        <Link
          to="/cart"
          className="menu-cart-button"
        >
          <ShoppingCart size={20} />

          <span>Cart</span>

          {itemCount > 0 && (
            <span className="cart-count">
              {itemCount}
            </span>
          )}
        </Link>
      </div>

      {/* Search */}
      <div className="menu-search-wrapper">
        <Search size={20} />

        <input
          type="text"
          placeholder="Search food, drinks, snacks..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          aria-label="Search menu items"
        />
      </div>

      {/* Category filters */}
      <div className="menu-filter-section">
        <h3>Category</h3>

        <div className="menu-filter-buttons">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              className={
                selectedCategory === category.value
                  ? "menu-filter-button active"
                  : "menu-filter-button"
              }
              onClick={() =>
                handleCategoryChange(category.value)
              }
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Veg/Non-Veg filters: Food and Snacks only */}
      {showFoodTypeFilter && (
        <div className="menu-filter-section">
          <h3>
            {selectedCategory === "food"
              ? "Food Type"
              : "Snack Type"}
          </h3>

          <div className="menu-filter-buttons">
            {foodTypes.map((foodType) => (
              <button
                key={foodType.value}
                type="button"
                className={
                  selectedFoodType === foodType.value
                    ? "menu-filter-button active"
                    : "menu-filter-button"
                }
                onClick={() =>
                  setSelectedFoodType(foodType.value)
                }
              >
                {foodType.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="menu-results-header">
        <p>
          Showing{" "}
          <strong>{filteredItems.length}</strong>{" "}
          item{filteredItems.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Menu items */}
      {filteredItems.length > 0 ? (
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      ) : (
        <div className="menu-empty-state">
          <h2>No menu items found</h2>

          <p>
            Try another search or change your filters.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      )}
    </section>
  );
}
