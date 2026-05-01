const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("PATCH FAILED:", message);
  process.exit(1);
}

if (app.includes("function ShoppingGuardPanel(")) {
  console.log("Ledger v4.0 Shopping Guard already appears to be installed. Skipping App.jsx patch.");
} else {
  if (!app.includes('const STORAGE_KEY = "ledger_v2_state";')) {
    fail("Could not find STORAGE_KEY anchor.");
  }

  app = app.replace(
    /const STORAGE_KEY = "ledger_v2_state";/,
    `const STORAGE_KEY = "ledger_v2_state";

const defaultShoppingItems = [
  { id: "milk-bread", name: "Milk, bread and basics", estimatedCost: 12, category: "Food", priority: "Essential", bought: false },
  { id: "packed-lunch", name: "Packed lunch bits", estimatedCost: 18, category: "School", priority: "Essential", bought: false },
  { id: "pet-food", name: "Pet food", estimatedCost: 22, category: "Pets", priority: "Essential", bought: false },
  { id: "cleaning", name: "Cleaning supplies", estimatedCost: 15, category: "Home", priority: "Important", bought: false },
  { id: "kids-treat", name: "Kids treat", estimatedCost: 8, category: "Family", priority: "Flexible", bought: false },
  { id: "family-snacks", name: "Family snacks", estimatedCost: 14, category: "Food", priority: "Flexible", bought: false },
];`
  );

  if (!app.includes("shoppingItems: defaultShoppingItems,")) {
    if (app.includes("subscriptions: defaultSubscriptions,")) {
      app = app.replace(
        /subscriptions: defaultSubscriptions,/,
        `subscriptions: defaultSubscriptions,
  shoppingItems: defaultShoppingItems,`
      );
    } else if (app.includes("protectedItems: defaultProtectedItems,")) {
      app = app.replace(
        /protectedItems: defaultProtectedItems,/,
        `protectedItems: defaultProtectedItems,
  shoppingItems: defaultShoppingItems,`
      );
    } else if (app.includes("savingsPots: defaultSavingsPots,")) {
      app = app.replace(
        /savingsPots: defaultSavingsPots,/,
        `savingsPots: defaultSavingsPots,
  shoppingItems: defaultShoppingItems,`
      );
    } else if (app.includes("debtPayment: 75,")) {
      app = app.replace(
        /debtPayment: 75,/,
        `debtPayment: 75,
  shoppingItems: defaultShoppingItems,`
      );
    } else {
      fail("Could not find defaultState insertion point.");
    }
  }

  const tabsMatch = app.match(/const tabs = \[([^\]]+)\];/);
  if (!tabsMatch) fail("Could not find tabs array.");

  const currentTabs = tabsMatch[1]
    .split(",")
    .map((x) => x.trim().replaceAll('"', "").replaceAll("'", ""))
    .filter(Boolean);

  if (!currentTabs.includes("Shopping")) {
    const insertAfter = currentTabs.includes("Watchtower")
      ? currentTabs.indexOf("Watchtower") + 1
      : currentTabs.includes("Budget")
        ? currentTabs.indexOf("Budget") + 1
        : 2;

    currentTabs.splice(insertAfter, 0, "Shopping");
  }

  app = app.replace(
    /const tabs = \[[^\]]+\];/,
    `const tabs = [${currentTabs.map((x) => `"${x}"`).join(", ")}];`
  );

  if (app.includes('{activeTab === "Watchtower" && (')) {
    app = app.replace(
      /(\{activeTab === "Watchtower" && \()/,
      `{activeTab === "Shopping" && (
          <ShoppingGuardPanel state={state} update={update} figures={figures} />
        )}
        $1`
    );
  } else if (app.includes('{activeTab === "Protected" && (')) {
    app = app.replace(
      /(\{activeTab === "Protected" && \()/,
      `{activeTab === "Shopping" && (
          <ShoppingGuardPanel state={state} update={update} figures={figures} />
        )}
        $1`
    );
  } else if (app.includes('{activeTab === "Penny" && (')) {
    app = app.replace(
      /(\{activeTab === "Penny" && \()/,
      `{activeTab === "Shopping" && (
          <ShoppingGuardPanel state={state} update={update} figures={figures} />
        )}
        $1`
    );
  } else {
    fail("Could not find tab render anchor.");
  }

  const componentAnchor = app.includes("function WatchtowerPanel(")
    ? "function WatchtowerPanel("
    : app.includes("function ProtectedMoneyPanel(")
      ? "function ProtectedMoneyPanel("
      : app.includes("function SavingsPanel(")
        ? "function SavingsPanel("
        : "function PennyPanel(";

  if (!app.includes(componentAnchor)) {
    fail("Could not find component insertion anchor.");
  }

  app = app.replace(
    componentAnchor,
    `function ShoppingGuardPanel({ state, update, figures }) {
  const shoppingItems = getShoppingItems(state);

  const totalBasket = shoppingItems.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
  const boughtTotal = shoppingItems
    .filter((item) => item.bought)
    .reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
  const remainingBasket = totalBasket - boughtTotal;
  const essentialTotal = shoppingItems
    .filter((item) => item.priority === "Essential")
    .reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
  const flexibleTotal = shoppingItems
    .filter((item) => item.priority === "Flexible")
    .reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);

  const safeAfterShop = Number(figures.safe || 0) - remainingBasket;
  const decision = getShoppingDecision(safeAfterShop, essentialTotal, flexibleTotal, shoppingItems);

  const updateShoppingItem = (id, key, value) => {
    const next = shoppingItems.map((item) =>
      item.id === id
        ? {
            ...item,
            [key]: key === "estimatedCost" ? Number(value) : value,
          }
        : item
    );

    update("shoppingItems", next);
  };

  const addShoppingItem = () => {
    const next = [
      {
        id: \`shop-\${Date.now()}\`,
        name: "New item",
        estimatedCost: 0,
        category: "General",
        priority: "Important",
        bought: false,
      },
      ...shoppingItems,
    ];

    update("shoppingItems", next);
  };

  const removeShoppingItem = (id) => {
    update(
      "shoppingItems",
      shoppingItems.filter((item) => item.id !== id)
    );
  };

  const resetShoppingList = () => {
    update("shoppingItems", defaultShoppingItems);
  };

  return (
    <>
      <div className="section-title">
        <div>
          <span className="kicker">SHOPPING LIST + SPEND GUARD</span>
          <h2>Check the basket before money leaves</h2>
          <p>
            What is happening: Ledger is estimating the shop before checkout.
            What it means: essentials, important items and flexible extras are separated.
            What to do next: buy essentials first, delay flexible extras if safe-after-shop is tight.
          </p>
        </div>
        <div className={\`safe-pill small \${safeAfterShop < 0 ? "danger" : ""}\`}>
          <span>Safe after shop</span>
          <strong>{currency(safeAfterShop)}</strong>
        </div>
      </div>

      <div className="shopping-decision-card">
        <div>
          <span className="kicker">LEDGE DECISION</span>
          <h3>{decision.title}</h3>
          <p>{decision.message}</p>
        </div>
        <div className={\`shopping-light \${decision.level}\`}>
          {decision.label}
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric title="Basket estimate" value={currency(totalBasket)} />
        <Metric title="Remaining shop" value={currency(remainingBasket)} />
        <Metric title="Essentials" value={currency(essentialTotal)} />
        <Metric title="Flexible extras" value={currency(flexibleTotal)} />
      </div>

      <div className="shopping-actions">
        <button className="primary-action" onClick={addShoppingItem}>
          Add shopping item
        </button>
        <button className="ghost-action" onClick={resetShoppingList}>
          Reset demo list
        </button>
      </div>

      <div className="panel shopping-advice">
        <span className="kicker">PENNY SHOPPING ADVICE ✨</span>
        <p>{getShoppingAdvice(safeAfterShop, remainingBasket, flexibleTotal)}</p>
      </div>

      <div className="shopping-layout">
        <div className="shopping-list-panel">
          <div className="column-head">
            <span className="kicker">SHOPPING LIST</span>
            <h3>Basket control</h3>
          </div>

          <div className="shopping-list">
            {shoppingItems.map((item) => (
              <div className={\`shopping-item-card \${item.bought ? "bought" : ""}\`} key={item.id}>
                <div className="shopping-item-top">
                  <label className="shopping-check">
                    <input
                      type="checkbox"
                      checked={Boolean(item.bought)}
                      onChange={(e) => updateShoppingItem(item.id, "bought", e.target.checked)}
                    />
                    <span>{item.bought ? "Bought" : "Needed"}</span>
                  </label>

                  <button className="remove-mini" onClick={() => removeShoppingItem(item.id)}>
                    Remove
                  </button>
                </div>

                <div className="shopping-edit-grid">
                  <label className="field">
                    <span>Item</span>
                    <input
                      value={item.name || ""}
                      onChange={(e) => updateShoppingItem(item.id, "name", e.target.value)}
                    />
                  </label>

                  <NumberInput
                    label="Estimated cost"
                    value={item.estimatedCost}
                    onChange={(v) => updateShoppingItem(item.id, "estimatedCost", v)}
                  />

                  <label className="field">
                    <span>Category</span>
                    <input
                      value={item.category || ""}
                      onChange={(e) => updateShoppingItem(item.id, "category", e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Priority</span>
                    <select
                      value={item.priority || "Important"}
                      onChange={(e) => updateShoppingItem(item.id, "priority", e.target.value)}
                    >
                      <option value="Essential">Essential</option>
                      <option value="Important">Important</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shopping-side-panel">
          <div className="column-head">
            <span className="kicker">DELAY SUGGESTIONS</span>
            <h3>What to push back</h3>
          </div>

          <div className="delay-list">
            {getDelaySuggestions(shoppingItems, safeAfterShop).map((item) => (
              <div className="delay-card" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.priority} · {currency(item.estimatedCost)}</span>
              </div>
            ))}
          </div>

          <div className="mini-rule-card">
            <span className="kicker">HOUSE RULE</span>
            <p>
              Essentials first. Important second. Flexible extras only if safe-after-shop stays positive.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function getShoppingItems(state) {
  return Array.isArray(state.shoppingItems) && state.shoppingItems.length
    ? state.shoppingItems
    : defaultShoppingItems;
}

function getShoppingDecision(safeAfterShop, essentialTotal, flexibleTotal, shoppingItems) {
  const remainingItems = shoppingItems.filter((item) => !item.bought);

  if (safeAfterShop < 0) {
    return {
      level: "red",
      label: "STOP",
      title: "Basket is over the safe limit",
      message: "This shop would eat into protected money. Buy essentials only and delay flexible extras.",
    };
  }

  if (safeAfterShop < 50 || flexibleTotal > essentialTotal) {
    return {
      level: "amber",
      label: "TRIM",
      title: "Shop is possible but needs trimming",
      message: "Essentials look manageable, but flexible extras should be checked before checkout.",
    };
  }

  if (remainingItems.length === 0) {
    return {
      level: "green",
      label: "DONE",
      title: "Shopping list completed",
      message: "All items are marked as bought. Update the list before the next shop.",
    };
  }

  return {
    level: "green",
    label: "BUY",
    title: "Basket looks safe",
    message: "The estimated shop fits inside the current safe-to-spend figure.",
  };
}

function getShoppingAdvice(safeAfterShop, remainingBasket, flexibleTotal) {
  if (safeAfterShop < 0) {
    return "Fab honesty moment: do not treat the whole basket as safe. Keep food, school and pets first. Delay treats and extras.";
  }

  if (safeAfterShop < 50) {
    return "This is tight, lovely. Take the list, but check prices as you go and keep flexible extras as optional.";
  }

  if (flexibleTotal > 0) {
    return \`Fabulous. You can plan the shop, but remember \${currency(flexibleTotal)} is flexible and can be delayed if prices are higher than expected.\`;
  }

  return \`Nice and clean. The remaining shop is \${currency(remainingBasket)} and it is mostly essential.\`;
}

function getDelaySuggestions(shoppingItems, safeAfterShop) {
  const flexible = shoppingItems
    .filter((item) => !item.bought && item.priority === "Flexible")
    .sort((a, b) => Number(b.estimatedCost || 0) - Number(a.estimatedCost || 0));

  const important = shoppingItems
    .filter((item) => !item.bought && item.priority === "Important")
    .sort((a, b) => Number(b.estimatedCost || 0) - Number(a.estimatedCost || 0));

  if (safeAfterShop < 0) return [...flexible, ...important].slice(0, 5);
  if (safeAfterShop < 50) return flexible.slice(0, 5);

  return flexible.slice(0, 3);
}

${componentAnchor}`
  );

  fs.writeFileSync(appPath, app);
  console.log("Patched src/App.jsx with Ledger v4.0 Shopping List + Spend Guard.");
}

if (!css.includes("Ledger v4.0 Shopping List")) {
  css += `

/* Ledger v4.0 Shopping List + Spend Guard */
.shopping-decision-card {
  margin: 18px 0;
  padding: 24px;
  border: 1px solid rgba(76, 240, 166, 0.22);
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(76, 240, 166, 0.15), transparent 35%),
    radial-gradient(circle at bottom right, rgba(127, 34, 255, 0.14), transparent 34%),
    rgba(255, 255, 255, 0.06);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.shopping-decision-card h3 {
  margin: 8px 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.shopping-decision-card p {
  margin: 0;
  color: var(--muted);
  max-width: 780px;
}

.shopping-light {
  min-width: 98px;
  min-height: 98px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.shopping-light.green {
  color: var(--green);
  background: rgba(76, 240, 166, 0.12);
  box-shadow: 0 0 34px rgba(76, 240, 166, 0.18);
}

.shopping-light.amber {
  color: #ffd36a;
  background: rgba(255, 211, 106, 0.12);
  box-shadow: 0 0 34px rgba(255, 211, 106, 0.16);
}

.shopping-light.red {
  color: #ff7a90;
  background: rgba(255, 70, 105, 0.12);
  box-shadow: 0 0 34px rgba(255, 70, 105, 0.18);
}

.shopping-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 18px 0;
}

.shopping-advice {
  margin: 18px 0;
  border-color: rgba(255, 208, 90, 0.28);
  background: linear-gradient(135deg, rgba(255, 208, 90, 0.1), rgba(127, 34, 255, 0.1)), var(--panel);
}

.shopping-layout {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1.35fr 0.75fr;
  gap: 16px;
}

.shopping-list-panel,
.shopping-side-panel {
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: var(--shadow);
}

.shopping-list,
.delay-list {
  display: grid;
  gap: 14px;
}

.shopping-item-card {
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 18px;
  background: rgba(0, 0, 0, 0.18);
}

.shopping-item-card.bought {
  opacity: 0.72;
  border-color: rgba(76, 240, 166, 0.24);
}

.shopping-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.shopping-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: white;
}

.shopping-check input {
  width: 18px;
  height: 18px;
  accent-color: #4cf0a6;
}

.remove-mini {
  border: 1px solid rgba(255, 70, 105, 0.25);
  border-radius: 999px;
  padding: 8px 11px;
  background: rgba(255, 70, 105, 0.1);
  color: #ff9bad;
  font-weight: 900;
  cursor: pointer;
}

.shopping-edit-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr 1fr;
  gap: 12px;
}

.delay-card,
.mini-rule-card {
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.18);
}

.delay-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.delay-card span {
  color: var(--muted);
  white-space: nowrap;
}

.mini-rule-card {
  margin-top: 16px;
  border-color: rgba(76, 240, 166, 0.22);
  background: rgba(76, 240, 166, 0.08);
}

.mini-rule-card p {
  margin: 8px 0 0;
  color: var(--muted);
}

@media (max-width: 1100px) {
  .shopping-layout,
  .shopping-edit-grid {
    grid-template-columns: 1fr;
  }

  .shopping-decision-card,
  .delay-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log("Patched src/App.css with Ledger v4.0 Shopping Guard styling.");
} else {
  console.log("Ledger v4.0 CSS already appears to be installed. Skipping App.css patch.");
}
