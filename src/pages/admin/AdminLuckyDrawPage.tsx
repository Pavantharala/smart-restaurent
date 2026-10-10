
import { useEffect, useState, type FormEvent } from "react";

import { useLuckyDraw } from "../../context/LuckyDrawContext";
import { useSettings } from "../../context/SettingsContext";
import { useMenu } from "../../context/MenuContext";

import type {
  LuckyDrawConfig,
  LuckyDrawPrize,
  LuckyDrawPrizeType,
} from "../../types/LuckyDraw";

import "./AdminLuckyDrawPage.css";

// Numeric fields remain strings while editing.
// This prevents an empty field from immediately turning into zero.
type NumericConfigKey =
  | "ticketsPerEntry"
  | "minimumSubtotal"
  | "maximumSubtotal"
  | "minimumItemPrice"
  | "maximumItemPrice";

type ConfigDraft = Omit<LuckyDrawConfig, NumericConfigKey> &
  Record<NumericConfigKey, string>;

type PrizeDraft = Omit<
  LuckyDrawPrize,
  "id" | "value" | "quantity"
> & {
  value: string;
  quantity: string;
};

const EMPTY_PRIZE: PrizeDraft = {
  prizeType: "custom",
  name: "",
  description: "",
  value: "",
  quantity: "1",
  imageUrl: "",
  active: true,
  menuItemId: "",
};

function toConfigDraft(config: LuckyDrawConfig): ConfigDraft {
  return {
    ...config,
    ticketsPerEntry: String(config.ticketsPerEntry),
    minimumSubtotal: String(config.minimumSubtotal),
    maximumSubtotal: String(config.maximumSubtotal),
    minimumItemPrice: String(config.minimumItemPrice),
    maximumItemPrice: String(config.maximumItemPrice),
  };
}

function toPrizeDraft(prize: LuckyDrawPrize): PrizeDraft {
  return {
    prizeType: prize.prizeType,
    name: prize.name,
    description: prize.description,
    value: prize.value > 0 ? String(prize.value) : "",
    quantity: String(prize.quantity),
    imageUrl: prize.imageUrl,
    active: prize.active,
    menuItemId: prize.menuItemId || "",
  };
}

function formatRupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function AdminLuckyDrawPage() {
  const {
    entries,
    config,
    prizes,
    updateConfig,
    addPrize,
    updatePrize,
    deletePrize,
  } = useLuckyDraw();

  const { settings } = useSettings();
  const { menuItems } = useMenu();

  const [draftConfig, setDraftConfig] = useState<ConfigDraft>(
    () => toConfigDraft(config),
  );
  const [prizeForm, setPrizeForm] = useState<PrizeDraft>(EMPTY_PRIZE);
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  // Keep the campaign form in sync if its saved settings change elsewhere.
  useEffect(() => {
    setDraftConfig(toConfigDraft(config));
  }, [config]);

  function showNotice(message: string, isError = false) {
    setNotice(message);
    setNoticeIsError(isError);
  }

  function changeConfig<K extends keyof ConfigDraft>(
    key: K,
    value: ConfigDraft[K],
  ) {
    setDraftConfig((current) => ({ ...current, [key]: value }));
  }

  function handleSaveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numberKeys: NumericConfigKey[] = [
      "ticketsPerEntry",
      "minimumSubtotal",
      "maximumSubtotal",
      "minimumItemPrice",
      "maximumItemPrice",
    ];

    // Reject empty or invalid numeric fields instead of silently saving zero.
    if (
      numberKeys.some(
        (key) =>
          draftConfig[key].trim() === "" ||
          !Number.isFinite(Number(draftConfig[key])),
      )
    ) {
      showNotice("Please enter a valid number in every campaign field.", true);
      return;
    }

    const nextConfig: LuckyDrawConfig = {
      ticketsPerEntry: Number(draftConfig.ticketsPerEntry),
      minimumSubtotal: Number(draftConfig.minimumSubtotal),
      maximumSubtotal: Number(draftConfig.maximumSubtotal),
      minimumItemPrice: Number(draftConfig.minimumItemPrice),
      maximumItemPrice: Number(draftConfig.maximumItemPrice),
      startDate: draftConfig.startDate,
      endDate: draftConfig.endDate,
    };

    if (
      nextConfig.ticketsPerEntry < 1 ||
      nextConfig.ticketsPerEntry > 100 ||
      !Number.isInteger(nextConfig.ticketsPerEntry)
    ) {
      showNotice("Tickets per order must be a whole number from 1 to 100.", true);
      return;
    }

    if (
      [
        nextConfig.minimumSubtotal,
        nextConfig.maximumSubtotal,
        nextConfig.minimumItemPrice,
        nextConfig.maximumItemPrice,
      ].some((number) => number < 0)
    ) {
      showNotice("Price values cannot be negative.", true);
      return;
    }

    if (
      nextConfig.maximumSubtotal < nextConfig.minimumSubtotal ||
      nextConfig.maximumItemPrice < nextConfig.minimumItemPrice
    ) {
      showNotice("Each maximum value must be at least its minimum value.", true);
      return;
    }

    if (
      nextConfig.startDate &&
      nextConfig.endDate &&
      nextConfig.endDate < nextConfig.startDate
    ) {
      showNotice("The campaign end date cannot be before its start date.", true);
      return;
    }

    showNotice(
      updateConfig(nextConfig)
        ? "Lucky Draw campaign settings saved."
        : "Could not save the campaign settings. Please try again.",
      false,
    );
  }

  function changePrizeField<K extends keyof PrizeDraft>(
    key: K,
    value: PrizeDraft[K],
  ) {
    setPrizeForm((current) => ({ ...current, [key]: value }));
  }

  function resetPrizeForm() {
    setPrizeForm(EMPTY_PRIZE);
    setEditingPrizeId(null);
  }

  function handlePrizeTypeChange(type: LuckyDrawPrizeType) {
    setPrizeForm((current) => ({
      ...current,
      prizeType: type,
      name: type === "custom" ? "" : current.name,
      menuItemId: "",
      value: "",
      imageUrl: "",
    }));
  }

  function handleMenuProductChange(menuItemId: string) {
    const selectedItem = menuItems.find(
      (item) => String(item.id) === menuItemId,
    );

    setPrizeForm((current) => ({
      ...current,
      menuItemId,
      name: selectedItem ? selectedItem.name : "",
      value: selectedItem ? String(selectedItem.price) : "",
    }));
  }

  function handlePrizeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(prizeForm.quantity);
    const value = prizeForm.value.trim() === "" ? 0 : Number(prizeForm.value);

    if (!prizeForm.name.trim()) {
      showNotice("Please enter a prize name or select a menu product.", true);
      return;
    }

    if (
      prizeForm.quantity.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      showNotice("Prize quantity must be a whole number of at least 1.", true);
      return;
    }

    if (!Number.isFinite(value) || value < 0) {
      showNotice("Prize value must be zero or a positive number.", true);
      return;
    }

    if (
      prizeForm.prizeType === "menu-product" &&
      !prizeForm.menuItemId
    ) {
      showNotice("Please select a menu product.", true);
      return;
    }

    const prizeData = {
      ...prizeForm,
      name: prizeForm.name.trim(),
      value,
      quantity,
      menuItemId:
        prizeForm.prizeType === "menu-product"
          ? prizeForm.menuItemId
          : undefined,
    };

    const saved = editingPrizeId
      ? updatePrize({ ...prizeData, id: editingPrizeId })
      : addPrize(prizeData);

    if (!saved) {
      showNotice("Could not save the prize. Please try again.", true);
      return;
    }

    showNotice(editingPrizeId ? "Prize updated successfully." : "Prize added successfully.");
    resetPrizeForm();
  }

  function startEditingPrize(prize: LuckyDrawPrize) {
    setEditingPrizeId(prize.id);
    setPrizeForm(toPrizeDraft(prize));
    showNotice("Editing prize.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeletePrize(prize: LuckyDrawPrize) {
    if (!window.confirm(`Delete the prize "${prize.name}"?`)) return;

    const deleted = deletePrize(prize.id);

    showNotice(
      deleted ? "Prize deleted." : "Could not delete the prize.",
      !deleted,
    );

    if (editingPrizeId === prize.id) resetPrizeForm();
  }

  const totalTickets = entries.reduce(
    (total, entry) => total + entry.tickets,
    0,
  );

  const activePrizes = prizes.filter((prize) => prize.active);

  return (
    <div className="admin-lucky-draw">
      <header className="lucky-admin-header">
        <div>
          <p className="lucky-admin-eyebrow">CAMPAIGN MANAGEMENT</p>
          <h1>Lucky Draw</h1>
          <p>Configure eligibility, tickets, prizes, and review entries.</p>
        </div>

        <span
          className={`lucky-admin-status ${
            settings.luckyDrawEnabled ? "is-enabled" : "is-disabled"
          }`}
        >
          {settings.luckyDrawEnabled ? "Enabled" : "Disabled"}
        </span>
      </header>

      {notice && (
        <div
          className={noticeIsError ? "lucky-admin-warning" : "lucky-admin-notice"}
          role="status"
        >
          {notice}
        </div>
      )}

      {!settings.luckyDrawEnabled && (
        <div className="lucky-admin-warning">
          Lucky Draw is disabled. Open <strong>Admin → Settings</strong> to
          enable it for customers.
        </div>
      )}

      <section className="lucky-admin-card">
        <div className="lucky-section-heading">
          <div>
            <h2>Campaign &amp; eligibility</h2>
            <p>Set the ticket count and qualifying price ranges.</p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig}>
          <div className="lucky-admin-form-grid">
            <label>
              Tickets per eligible order
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                required
                value={draftConfig.ticketsPerEntry}
                onChange={(event) => changeConfig("ticketsPerEntry", event.target.value)}
              />
              <small>Each order can still enter only once.</small>
            </label>

            <label>
              Minimum order subtotal (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={draftConfig.minimumSubtotal}
                onChange={(event) => changeConfig("minimumSubtotal", event.target.value)}
              />
            </label>

            <label>
              Maximum order subtotal (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={draftConfig.maximumSubtotal}
                onChange={(event) => changeConfig("maximumSubtotal", event.target.value)}
              />
            </label>

            <label>
              Minimum individual item price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={draftConfig.minimumItemPrice}
                onChange={(event) => changeConfig("minimumItemPrice", event.target.value)}
              />
            </label>

            <label>
              Maximum individual item price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={draftConfig.maximumItemPrice}
                onChange={(event) => changeConfig("maximumItemPrice", event.target.value)}
              />
            </label>

            <label>
              Campaign start date
              <input
                type="date"
                value={draftConfig.startDate}
                onChange={(event) => changeConfig("startDate", event.target.value)}
              />
              <small>Leave blank for no start-date restriction.</small>
            </label>

            <label>
              Campaign end date
              <input
                type="date"
                min={draftConfig.startDate || undefined}
                value={draftConfig.endDate}
                onChange={(event) => changeConfig("endDate", event.target.value)}
              />
              <small>Leave blank for no end-date restriction.</small>
            </label>
          </div>

          <div className="lucky-admin-rule-note">
            Eligible order types: dine-in, waiting lounge, and takeaway. Only
            completed orders qualify. Subtotal excludes tax. At least one item
            must match the individual item-price range. All menu categories
            are eligible.
          </div>

          <button className="lucky-admin-primary-button" type="submit">
            Save Campaign Settings
          </button>
        </form>
      </section>

      <section className="lucky-admin-card">
        <div className="lucky-section-heading">
          <div>
            <h2>{editingPrizeId ? "Edit Prize" : "Add a Prize"}</h2>
            <p>Add a menu product or create a custom reward.</p>
          </div>
        </div>

        <form onSubmit={handlePrizeSubmit}>
          <div className="lucky-admin-form-grid">
            <label>
              Prize type
              <select
                value={prizeForm.prizeType}
                onChange={(event) =>
                  handlePrizeTypeChange(event.target.value as LuckyDrawPrizeType)
                }
              >
                <option value="menu-product">Existing menu product</option>
                <option value="custom">Custom reward</option>
              </select>
            </label>

            {prizeForm.prizeType === "menu-product" ? (
              <label>
                Select menu product
                <select
                  required
                  value={prizeForm.menuItemId}
                  onChange={(event) => handleMenuProductChange(event.target.value)}
                >
                  <option value="">Choose a product</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name} — {formatRupees(Number(item.price) || 0)}
                    </option>
                  ))}
                </select>
                {menuItems.length === 0 && (
                  <small>No menu products found. Add menu items first.</small>
                )}
              </label>
            ) : (
              <label>
                Custom reward name
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={prizeForm.name}
                  onChange={(event) => changePrizeField("name", event.target.value)}
                  placeholder="Example: Free meal voucher"
                />
              </label>
            )}

            <label>
              Prize value (₹, optional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={prizeForm.value}
                onChange={(event) => changePrizeField("value", event.target.value)}
                placeholder="Leave blank if not needed"
              />
              <small>Used for reference only. A prize can have no stated value.</small>
            </label>

            <label>
              Available prize quantity
              <input
                type="number"
                min="1"
                step="1"
                required
                value={prizeForm.quantity}
                onChange={(event) => changePrizeField("quantity", event.target.value)}
              />
            </label>

            <label>
              Prize image URL (optional)
              <input
                type="url"
                value={prizeForm.imageUrl}
                onChange={(event) => changePrizeField("imageUrl", event.target.value)}
                placeholder="https://example.com/prize.jpg"
              />
            </label>

            <label className="lucky-admin-full-width">
              Description
              <textarea
                rows={3}
                maxLength={500}
                value={prizeForm.description}
                onChange={(event) => changePrizeField("description", event.target.value)}
                placeholder="Describe the prize and any conditions."
              />
            </label>

            <label className="lucky-admin-checkbox">
              <input
                type="checkbox"
                checked={prizeForm.active}
                onChange={(event) => changePrizeField("active", event.target.checked)}
              />
              Show this prize as active
            </label>
          </div>

          <div className="lucky-admin-actions">
            <button className="lucky-admin-primary-button" type="submit">
              {editingPrizeId ? "Save Prize Changes" : "Add Prize"}
            </button>

            {editingPrizeId && (
              <button
                className="lucky-admin-secondary-button"
                type="button"
                onClick={resetPrizeForm}
              >
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="lucky-admin-card">
        <div className="lucky-section-heading">
          <div>
            <h2>Prize inventory</h2>
            <p>{activePrizes.length} active prize type(s) out of {prizes.length}.</p>
          </div>
        </div>

        {prizes.length === 0 ? (
          <p className="lucky-admin-empty">
            No prizes added yet. Use the form above to add your first prize.
          </p>
        ) : (
          <div className="lucky-prize-list">
            {prizes.map((prize) => (
              <article className="lucky-prize-row" key={prize.id}>
                {prize.imageUrl ? (
                  <img
                    className="lucky-prize-image"
                    src={prize.imageUrl}
                    alt={prize.name}
                  />
                ) : (
                  <div className="lucky-prize-image lucky-prize-placeholder" aria-hidden="true">
                    🎁
                  </div>
                )}

                <div className="lucky-prize-details">
                  <h3>{prize.name}</h3>
                  <p>{prize.description || "No description provided."}</p>
                  <span>
                    {prize.value > 0
                      ? `Value: ${formatRupees(prize.value)}`
                      : "Value not specified"}
                    {" · "}Quantity: {prize.quantity}
                  </span>
                  <p>
                    {prize.prizeType === "menu-product"
                      ? "Menu product"
                      : "Custom reward"}
                  </p>
                </div>

                <span className={`lucky-prize-state ${prize.active ? "is-enabled" : "is-disabled"}`}>
                  {prize.active ? "Active" : "Inactive"}
                </span>

                <div className="lucky-prize-actions">
                  <button
                    className="lucky-admin-secondary-button"
                    type="button"
                    onClick={() => startEditingPrize(prize)}
                  >
                    Edit
                  </button>
                  <button
                    className="lucky-admin-danger-button"
                    type="button"
                    onClick={() => handleDeletePrize(prize)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lucky-admin-card">
        <div className="lucky-section-heading">
          <div>
            <h2>Entry overview</h2>
            <p>Entries currently saved in this browser.</p>
          </div>
        </div>

        <div className="lucky-admin-stat-grid">
          <div className="lucky-admin-stat">
            <span>Total entries</span>
            <strong>{entries.length}</strong>
          </div>
          <div className="lucky-admin-stat">
            <span>Total tickets</span>
            <strong>{totalTickets}</strong>
          </div>
          <div className="lucky-admin-stat">
            <span>Active prize types</span>
            <strong>{activePrizes.length}</strong>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="lucky-admin-empty">
            No Lucky Draw entries have been recorded in this browser.
          </p>
        ) : (
          <div className="lucky-admin-table-wrap">
            <table className="lucky-admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Order type</th>
                  <th>Subtotal</th>
                  <th>Tickets</th>
                  <th>Entered at</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.orderId}</td>
                    <td>{entry.customerName}</td>
                    <td>{entry.orderType}</td>
                    <td>{formatRupees(entry.subtotal)}</td>
                    <td>{entry.tickets}</td>
                    <td>{new Date(entry.enteredAt).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="lucky-admin-rule-note">
          This is a prototype entry overview, not a secure public draw
          register. Winner selection and prize-claim verification require
          server-side validation and a shared database.
        </p>
      </section>
    </div>
  );
}
