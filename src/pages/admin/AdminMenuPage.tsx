import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMenu } from "../../context/MenuContext";

import type {
  MenuCategory,
} from "../../types/Menu";

// ============================================================
// SMART CAFE - ADMIN MENU MANAGEMENT
// ============================================================
//
// Phase 16.3
//
// Admin menu dashboard.
//
// FEATURES:
// - View all menu items
// - Search menu items
// - Filter by category
// - Filter by availability
// - Show price
// - Show Veg / Non-Veg
// - Show preparation time
// - Enable / disable items
// - Edit items
// - Delete items
// - Navigate to Add Menu Item
//
// MenuContext remains the single source of truth.
//
// Admin Page
//      ↓
// useMenu()
//      ↓
// MenuContext
//      ↓
// menuItems
//
// ============================================================

type AvailabilityFilter =
  | "all"
  | "available"
  | "unavailable";

type CategoryFilter =
  | "all"
  | MenuCategory;

const CATEGORY_OPTIONS: {
  value: CategoryFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Categories",
  },
  {
    value: "food",
    label: "Food",
  },
  {
    value: "drinks",
    label: "Drinks",
  },
  {
    value: "snacks",
    label: "Snacks",
  },
  {
    value: "desserts",
    label: "Desserts",
  },
  {
    value: "specials",
    label: "Specials",
  },
];

// ============================================================
// ADMIN MENU PAGE
// ============================================================

export default function AdminMenuPage() {
  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const navigate = useNavigate();

  // ----------------------------------------------------------
  // MENU CONTEXT
  // ----------------------------------------------------------

  const {
    menuItems,
    toggleMenuItemAvailability,
    deleteMenuItem,
  } = useMenu();

  // ----------------------------------------------------------
  // FILTER STATE
  // ----------------------------------------------------------

  const [searchTerm, setSearchTerm] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");

  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] =
    useState<AvailabilityFilter>("all");

  // ==========================================================
  // SUMMARY VALUES
  // ==========================================================

  const availableCount = menuItems.filter(
    (item) => item.isAvailable,
  ).length;

  const unavailableCount =
    menuItems.length - availableCount;

  const categoryCounts = useMemo(() => {
    return {
      food: menuItems.filter(
        (item) =>
          item.category === "food",
      ).length,

      drinks: menuItems.filter(
        (item) =>
          item.category === "drinks",
      ).length,

      snacks: menuItems.filter(
        (item) =>
          item.category === "snacks",
      ).length,

      desserts: menuItems.filter(
        (item) =>
          item.category === "desserts",
      ).length,

      specials: menuItems.filter(
        (item) =>
          item.category === "specials",
      ).length,
    };
  }, [menuItems]);

  // ==========================================================
  // FILTERED MENU
  // ==========================================================

  const filteredMenuItems =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return menuItems.filter(
        (item) => {
          // --------------------------------------------------
          // SEARCH
          // --------------------------------------------------

          const matchesSearch =
            !normalizedSearch ||
            item.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            item.description
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            item.tags?.some((tag) =>
              tag
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ),
            );

          if (!matchesSearch) {
            return false;
          }

          // --------------------------------------------------
          // CATEGORY
          // --------------------------------------------------

          const matchesCategory =
            categoryFilter === "all" ||
            item.category ===
              categoryFilter;

          if (!matchesCategory) {
            return false;
          }

          // --------------------------------------------------
          // AVAILABILITY
          // --------------------------------------------------

          const matchesAvailability =
            availabilityFilter ===
              "all" ||
            (availabilityFilter ===
              "available" &&
              item.isAvailable) ||
            (availabilityFilter ===
              "unavailable" &&
              !item.isAvailable);

          return matchesAvailability;
        },
      );
    }, [
      menuItems,
      searchTerm,
      categoryFilter,
      availabilityFilter,
    ]);

  // ==========================================================
  // DELETE HANDLER
  // ==========================================================

  // ==========================================================
// DELETE HANDLER
// ==========================================================
//
// Deleting is permanent from the current menu data.
// Therefore we ask for confirmation before calling
// deleteMenuItem().
//
// This is an important UI safety pattern:
// User clicks Delete
//       ↓
// Confirmation appears
//       ↓
// Cancel → nothing changes
//       ↓
// OK → MenuContext deletes the item
//
// ==========================================================

const handleDelete = (
  id: string,
  name: string,
) => {
  const confirmed = window.confirm(
    `Delete "${name}" permanently?\n\n` +
      "This menu item will be removed from the admin menu " +
      "and cannot be restored automatically.\n\n" +
      "Click OK to delete or Cancel to keep it.",
  );

  // --------------------------------------------------------
  // If the admin cancels, stop here.
  // --------------------------------------------------------

  if (!confirmed) {
    return;
  }

  // --------------------------------------------------------
  // Only after confirmation do we modify the real menu.
  // --------------------------------------------------------

  deleteMenuItem(id);
};

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <section
      style={{
        padding: "24px",
        maxWidth: "1280px",
        margin: "0 auto",
      }}
    >
      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              opacity: 0.65,
            }}
          >
            ADMIN MENU
          </p>

          <h1
            style={{
              margin:
                "6px 0 0",
            }}
          >
            Menu Management
          </h1>

          <p
            style={{
              margin:
                "8px 0 0",
              opacity: 0.7,
            }}
          >
            Manage restaurant menu
            items without editing
            code.
          </p>
        </div>

        {/* ==================================================
            ADD BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/admin/menu/add",
            )
          }
          style={{
            padding:
              "12px 18px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          + Add Menu Item
        </button>
      </div>

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* TOTAL */}

        <div
          style={{
            padding: "18px",
            border:
              "1px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Total Items
          </p>

          <h2
            style={{
              margin:
                "6px 0 0",
            }}
          >
            {menuItems.length}
          </h2>
        </div>

        {/* AVAILABLE */}

        <div
          style={{
            padding: "18px",
            border:
              "1px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Available
          </p>

          <h2
            style={{
              margin:
                "6px 0 0",
            }}
          >
            {availableCount}
          </h2>
        </div>

        {/* UNAVAILABLE */}

        <div
          style={{
            padding: "18px",
            border:
              "1px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Unavailable
          </p>

          <h2
            style={{
              margin:
                "6px 0 0",
            }}
          >
            {unavailableCount}
          </h2>
        </div>

        {/* FOOD */}

        <div
          style={{
            padding: "18px",
            border:
              "1px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Food
          </p>

          <h2
            style={{
              margin:
                "6px 0 0",
            }}
          >
            {categoryCounts.food}
          </h2>
        </div>

        {/* DRINKS */}

        <div
          style={{
            padding: "18px",
            border:
              "1px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Drinks
          </p>

          <h2
            style={{
              margin:
                "6px 0 0",
            }}
          >
            {categoryCounts.drinks}
          </h2>
        </div>
      </div>

      {/* ====================================================
          FILTER BAR
      ==================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(220px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {/* SEARCH */}

        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value,
            )
          }
          placeholder="Search menu items..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding:
              "12px 14px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
            fontSize: "14px",
          }}
        />

        {/* CATEGORY */}

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target
                .value as CategoryFilter,
            )
          }
          style={{
            width: "100%",
            padding:
              "12px 14px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
            fontSize: "14px",
            background:
              "#fff",
          }}
        >
          {CATEGORY_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            ),
          )}
        </select>

        {/* AVAILABILITY */}

        <select
          value={
            availabilityFilter
          }
          onChange={(event) =>
            setAvailabilityFilter(
              event.target
                .value as AvailabilityFilter,
            )
          }
          style={{
            width: "100%",
            padding:
              "12px 14px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
            fontSize: "14px",
            background:
              "#fff",
          }}
        >
          <option value="all">
            All Availability
          </option>

          <option value="available">
            Available
          </option>

          <option value="unavailable">
            Unavailable
          </option>
        </select>
      </div>

      {/* ====================================================
          RESULT COUNT
      ==================================================== */}

      <p
        style={{
          margin:
            "0 0 14px",
          fontSize: "14px",
          opacity: 0.65,
        }}
      >
        Showing{" "}
        {filteredMenuItems.length}{" "}
        of {menuItems.length} menu
        items
      </p>

      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {menuItems.length === 0 ? (
        <div
          style={{
            padding:
              "40px 20px",
            textAlign: "center",
            border:
              "1px dashed #ccc",
            borderRadius:
              "10px",
          }}
        >
          <h2>
            No menu items found
          </h2>

          <p>
            Add your first menu
            item to start managing
            the restaurant menu.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/menu/add",
              )
            }
            style={{
              padding:
                "12px 18px",
              marginTop: "12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            + Add First Menu Item
          </button>
        </div>
      ) : filteredMenuItems.length ===
        0 ? (
        <div
          style={{
            padding:
              "40px 20px",
            textAlign: "center",
            border:
              "1px dashed #ccc",
            borderRadius:
              "10px",
          }}
        >
          <h2>
            No matching items
          </h2>

          <p>
            Try changing your
            search or filters.
          </p>
        </div>
      ) : (
        /* ==================================================
           MENU CARDS
        ================================================== */

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredMenuItems.map(
            (item) => (
              <article
                key={item.id}
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "12px",
                  overflow:
                    "hidden",
                  background:
                    "#fff",
                }}
              >
                {/* ==========================================
                    IMAGE
                ========================================== */}

                {item.image ? (
                  <img
                    src={
                      item.image
                    }
                    alt={
                      item.name
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "180px",
                      objectFit:
                        "cover",
                      display:
                        "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height:
                        "180px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        "#f3f3f3",
                      color:
                        "#777",
                    }}
                  >
                    No Image
                  </div>
                )}

                {/* ==========================================
                    INFORMATION
                ========================================== */}

                <div
                  style={{
                    padding:
                      "18px",
                  }}
                >
                  {/* CATEGORY */}

                  <p
                    style={{
                      margin: 0,
                      fontSize:
                        "12px",
                      fontWeight:
                        700,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.06em",
                      opacity:
                        0.6,
                    }}
                  >
                    {item.category}
                  </p>

                  {/* NAME */}

                  <h2
                    style={{
                      margin:
                        "6px 0",
                      fontSize:
                        "20px",
                    }}
                  >
                    {item.name}
                  </h2>

                  {/* FOOD TYPE */}

                  {item.foodType && (
                    <p
                      style={{
                        margin:
                          "6px 0",
                        fontSize:
                          "13px",
                        fontWeight:
                          600,
                      }}
                    >
                      {item.foodType ===
                      "veg"
                        ? "🟢 Veg"
                        : "🔴 Non-Veg"}
                    </p>
                  )}

                  {/* DESCRIPTION */}

                  <p
                    style={{
                      margin:
                        "8px 0",
                      opacity:
                        0.75,
                    }}
                  >
                    {item.description ||
                      "No description available."}
                  </p>

                  {/* PRICE */}

                  <p
                    style={{
                      margin:
                        "12px 0 4px",
                      fontSize:
                        "20px",
                      fontWeight:
                        700,
                    }}
                  >
                    ₹{item.price}
                  </p>

                  {/* ORIGINAL PRICE */}

                  {item.originalPrice !==
                    undefined && (
                    <p
                      style={{
                        margin:
                          "4px 0",
                        fontSize:
                          "14px",
                        textDecoration:
                          "line-through",
                        opacity:
                          0.6,
                      }}
                    >
                      Original: ₹
                      {
                        item.originalPrice
                      }
                    </p>
                  )}

                  {/* PREPARATION TIME */}

                  {item.preparationTime !==
                    undefined && (
                    <p
                      style={{
                        margin:
                          "4px 0",
                        fontSize:
                          "14px",
                        opacity:
                          0.7,
                      }}
                    >
                      Preparation:{" "}
                      {
                        item.preparationTime
                      }{" "}
                      minutes
                    </p>
                  )}

                  {/* AVAILABILITY */}

                  <p
                    style={{
                      margin:
                        "10px 0",
                      fontWeight:
                        600,
                    }}
                  >
                    Status:{" "}
                    {item.isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </p>

                  {/* TAGS */}

                  {item.tags &&
                    item.tags.length >
                      0 && (
                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: "6px",
                          marginTop:
                            "10px",
                        }}
                      >
                        {item.tags.map(
                          (tag) => (
                            <span
                              key={
                                tag
                              }
                              style={{
                                padding:
                                  "4px 8px",
                                borderRadius:
                                  "999px",
                                background:
                                  "#f1f1f1",
                                fontSize:
                                  "12px",
                              }}
                            >
                              {tag}
                            </span>
                          ),
                        )}
                      </div>
                    )}

                  {/* ========================================
                      ACTIONS
                  ======================================== */}

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "8px",
                      flexWrap:
                        "wrap",
                      marginTop:
                        "16px",
                    }}
                  >
                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/menu/edit/${item.id}`,
                        )
                      }
                    >
                      Edit
                    </button>

                    {/* ENABLE / DISABLE */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleMenuItemAvailability(
                          item.id,
                        )
                      }
                    >
                      {item.isAvailable
                        ? "Disable"
                        : "Enable"}
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          item.id,
                          item.name,
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}