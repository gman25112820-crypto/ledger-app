import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "ledger_v2_state";

const defaultShoppingItems = [
  { id: "milk-bread", name: "Milk, bread and basics", estimatedCost: 12, category: "Food", priority: "Essential", bought: false },
  { id: "packed-lunch", name: "Packed lunch bits", estimatedCost: 18, category: "School", priority: "Essential", bought: false },
  { id: "pet-food", name: "Pet food", estimatedCost: 22, category: "Pets", priority: "Essential", bought: false },
  { id: "cleaning", name: "Cleaning supplies", estimatedCost: 15, category: "Home", priority: "Important", bought: false },
  { id: "kids-treat", name: "Kids treat", estimatedCost: 8, category: "Family", priority: "Flexible", bought: false },
  { id: "family-snacks", name: "Family snacks", estimatedCost: 14, category: "Food", priority: "Flexible", bought: false },
];

const defaultProtectedItems = [
  { id: "rent-home", name: "Rent / home payment", amount: 0, category: "Home", priority: 1 },
  { id: "council-tax", name: "Council tax", amount: 0, category: "Home", priority: 1 },
  { id: "utilities", name: "Gas, electric and water", amount: 0, category: "Bills", priority: 1 },
  { id: "food", name: "Food shop buffer", amount: 300, category: "Essentials", priority: 1 },
  { id: "fuel-travel", name: "Fuel / travel", amount: 120, category: "Essentials", priority: 1 },
  { id: "school-costs", name: "School costs", amount: 60, category: "Family", priority: 2 },
  { id: "subscriptions", name: "Subscriptions / renewals", amount: 60, category: "Bills", priority: 2 },
  { id: "pets", name: "Pets and insurance buffer", amount: 45, category: "Pets", priority: 2 },
  { id: "debt-minimums", name: "Debt minimum payments", amount: 75, category: "Debt", priority: 1 },
  { id: "emergency", name: "Emergency breathing space", amount: 100, category: "Safety", priority: 1 },
];

const defaultSavingsPots = [
  { id: "school-clubs", name: "School clubs", target: 240, saved: 40, dueDate: "2026-09-01", priority: 2 },
  { id: "birthdays", name: "Birthdays", target: 500, saved: 120, dueDate: "2026-06-30", priority: 2 },
  { id: "christmas", name: "Christmas", target: 800, saved: 100, dueDate: "2026-12-01", priority: 3 },
  { id: "holiday-fund", name: "Holiday fund", target: 1000, saved: 150, dueDate: "2026-08-01", priority: 3 },
  { id: "pets-vet", name: "Pets / vet bills", target: 400, saved: 60, dueDate: "2026-10-01", priority: 2 },
  { id: "pet-insurance-buffer", name: "Pet insurance buffer", target: 180, saved: 25, dueDate: "2026-07-01", priority: 1 },
  { id: "home-insurance", name: "Home insurance", target: 320, saved: 50, dueDate: "2026-11-01", priority: 1 },
  { id: "car-insurance", name: "Car insurance", target: 600, saved: 80, dueDate: "2026-09-15", priority: 1 },
  { id: "school-uniform", name: "School uniform", target: 250, saved: 30, dueDate: "2026-08-15", priority: 2 },
  { id: "emergency-buffer", name: "Emergency buffer", target: 1000, saved: 250, dueDate: "2026-12-31", priority: 1 },
  { id: "family-days-out", name: "Family days out", target: 300, saved: 45, dueDate: "2026-07-20", priority: 3 },
];

const defaultState = {
  income: 1500,
  spent: 920,
  unpaidBills: 180,
  paydayDays: 28,
  goalName: "Emergency buffer",
  goalSaved: 450,
  goalTarget: 2000,
  kidsStars: 12,
  familyPot: 35,
  weeklyFood: 80,
  fuelTravel: 45,
  subscriptions: 28,
  debtPayment: 75,
savingsPots: defaultSavingsPots,
  protectedItems: defaultProtectedItems,
  shoppingItems: defaultShoppingItems,
};

function currency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [editOpen, setEditOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const figures = useMemo(() => {
    const safe = state.income - state.spent - state.unpaidBills;
    const essentials =
      state.unpaidBills +
      state.weeklyFood +
      state.fuelTravel +
      state.subscriptions +
      state.debtPayment;

    const goalProgress = clamp(
      Math.round((state.goalSaved / Math.max(state.goalTarget, 1)) * 100),
      0,
      100
    );

    let status = "Stable";
    let statusTone = "good";
    let message = "You’re in control. Keep building momentum.";

    if (safe < 0) {
      status = "Pressure";
      statusTone = "danger";
      message = "Spending is above the current plan. Protect essentials first.";
    } else if (safe < 150) {
      status = "Careful";
      statusTone = "warn";
      message = "Keep spending tight until payday. Small decisions matter.";
    } else if (safe > 500) {
      status = "Strong";
      statusTone = "great";
      message = "Good breathing room. Push some extra money toward your goal.";
    }

    return {
      safe,
      essentials,
      goalProgress,
      status,
      statusTone,
      message,
    };
  }, [state]);

  const update = (key, value) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetDemo = () => {
    setState(defaultState);
    setActiveTab("Home");
  };

  const tabs = ["Home", "Budget", "Shopping", "Protected", "Goals", "Savings", "Penny", "Family", "Plan"];

  return (
    <div className="ledger-shell">
      <div className="app-frame">
        <header className="hero">
          <div>
            <div className="kicker">LEDGER</div>
            <h1>Decision OS</h1>
            <p>Local money planning with Ledge, Penny, Eddie and Teds.</p>
          </div>

          <div className="hero-actions">
            <button className="ghost-btn" onClick={() => setSafetyOpen(true)}>
              Safety
            </button>
            <button className="primary-btn" onClick={() => setEditOpen(true)}>
              Edit figures
            </button>
          </div>
        </header>

        <div className="demo-banner">
          <span className="dot gold" />
          Local Demo Mode · Data stays on this device · No bank connection
        </div>

        <section className="top-grid">
          <div className="decision-card">
            <div className="kicker">DECISION ENGINE</div>
            <div className="decision-row">
              <div>
                <h2>
                  <span className={`status-light ${figures.statusTone}`} />
                  Ledge: {figures.status}
                </h2>
                <p>{figures.message}</p>
              </div>
              <div className="safe-pill">
                <span>Safe</span>
                <strong>{currency(figures.safe)}</strong>
              </div>
            </div>
          </div>

          <div className="penny-card">
            <div className="kicker">PENNY TODAY ✨</div>
            <p>{getPennyLine(figures, state)}</p>
          </div>
        </section>

        <nav className="tabs desktop-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === "Home" && (
            <HomePanel state={state} figures={figures} />
          )}

          {activeTab === "Budget" && (
            <BudgetPanel state={state} update={update} figures={figures} />
          )}

          {activeTab === "Goals" && (
            <GoalsPanel state={state} update={update} figures={figures} />
          )}

          {activeTab === "Shopping" && (
          <ShoppingGuardPanel state={state} update={update} figures={figures} />
        )}
        {activeTab === "Protected" && (
          <ProtectedMoneyPanel state={state} update={update} figures={figures} />
        )}
        {activeTab === "Savings" && (
          <SavingsPanel state={state} update={update} figures={figures} />
        )}
        {activeTab === "Penny" && (
            <PennyPanel state={state} figures={figures} />
          )}

          {activeTab === "Family" && (
            <FamilyPanel state={state} update={update} />
          )}

          {activeTab === "Plan" && (
            <PlanPanel state={state} figures={figures} resetDemo={resetDemo} />
          )}
        </main>
      </div>

      {editOpen && (
        <EditModal
          state={state}
          update={update}
          onClose={() => setEditOpen(false)}
        />
      )}

      {safetyOpen && <SafetyModal onClose={() => setSafetyOpen(false)} />}
    </div>
  );
}

function HomePanel({ state, figures }) {
  return (
    <>
      <section className="metric-grid">
        <Metric title="Income" value={currency(state.income)} />
        <Metric title="Spent" value={currency(state.spent)} />
        <Metric title="Unpaid bills" value={currency(state.unpaidBills)} />
        <Metric title="Payday" value={`${state.paydayDays}d`} />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="kicker">GOAL PROGRESS</div>
          <div className="goal-line">
            <span>{currency(state.goalSaved)}</span>
            <span>{currency(state.goalTarget)}</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${figures.goalProgress}%` }} />
          </div>
          <p>{figures.goalProgress}% complete</p>
        </div>

        <div className="panel">
          <div className="kicker">TEAM INSIGHT</div>
          <ul className="insight-list">
            <li>🧾 Ledge: Keep the plan simple and practical.</li>
            <li>
              📊 Eddie: Safe-to-spend is {currency(figures.safe)} after spending
              and unpaid bills.
            </li>
            <li>⚠️ Teds: Local demo mode only. No sensitive details.</li>
          </ul>
        </div>
      </section>
    </>
  );
}

function BudgetPanel({ state, update, figures }) {
  return (
    <section className="page-grid">
      <div className="panel wide">
        <div className="section-title">
          <div>
            <div className="kicker">BUDGET CONTROL</div>
            <h2>Make the numbers editable and useful.</h2>
          </div>
          <div className="safe-pill small">
            <span>Safe</span>
            <strong>{currency(figures.safe)}</strong>
          </div>
        </div>

        <div className="input-grid">
          <NumberInput label="Monthly income" value={state.income} onChange={(v) => update("income", v)} />
          <NumberInput label="Spent so far" value={state.spent} onChange={(v) => update("spent", v)} />
          <NumberInput label="Unpaid bills" value={state.unpaidBills} onChange={(v) => update("unpaidBills", v)} />
          <NumberInput label="Days until payday" value={state.paydayDays} onChange={(v) => update("paydayDays", v)} />
          <NumberInput label="Food / household" value={state.weeklyFood} onChange={(v) => update("weeklyFood", v)} />
          <NumberInput label="Fuel / travel" value={state.fuelTravel} onChange={(v) => update("fuelTravel", v)} />
          <NumberInput label="Subscriptions" value={state.subscriptions} onChange={(v) => update("subscriptions", v)} />
          <NumberInput label="Debt payment" value={state.debtPayment} onChange={(v) => update("debtPayment", v)} />
        </div>
      </div>

      <div className="panel">
        <div className="kicker">BILLS SNAPSHOT</div>
        <ul className="bill-list">
          <li><span>Unpaid bills</span><strong>{currency(state.unpaidBills)}</strong></li>
          <li><span>Food estimate</span><strong>{currency(state.weeklyFood)}</strong></li>
          <li><span>Fuel / travel</span><strong>{currency(state.fuelTravel)}</strong></li>
          <li><span>Subscriptions</span><strong>{currency(state.subscriptions)}</strong></li>
          <li><span>Debt payment</span><strong>{currency(state.debtPayment)}</strong></li>
        </ul>
      </div>
    </section>
  );
}

function GoalsPanel({ state, update, figures }) {
  const remaining = Math.max(0, state.goalTarget - state.goalSaved);

  return (
    <section className="page-grid">
      <div className="panel wide">
        <div className="section-title">
          <div>
            <div className="kicker">GOALS</div>
            <h2>{state.goalName}</h2>
          </div>
          <strong className="big-percent">{figures.goalProgress}%</strong>
        </div>

        <div className="progress-track large">
          <div style={{ width: `${figures.goalProgress}%` }} />
        </div>

        <div className="metric-grid compact">
          <Metric title="Saved" value={currency(state.goalSaved)} />
          <Metric title="Target" value={currency(state.goalTarget)} />
          <Metric title="Remaining" value={currency(remaining)} />
        </div>

        <div className="input-grid">
          <TextInput label="Goal name" value={state.goalName} onChange={(v) => update("goalName", v)} />
          <NumberInput label="Saved so far" value={state.goalSaved} onChange={(v) => update("goalSaved", v)} />
          <NumberInput label="Goal target" value={state.goalTarget} onChange={(v) => update("goalTarget", v)} />
        </div>
      </div>

      <div className="panel">
        <div className="kicker">PENNY GOAL ADVICE</div>
        <p>
          Fab goal building. If safe-to-spend stays positive, move a small amount
          into the goal before the month disappears.
        </p>
      </div>
    </section>
  );
}

function ShoppingGuardPanel({ state, update, figures }) {
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
        id: `shop-${Date.now()}`,
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
        <div className={`safe-pill small ${safeAfterShop < 0 ? "danger" : ""}`}>
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
        <div className={`shopping-light ${decision.level}`}>
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
              <div className={`shopping-item-card ${item.bought ? "bought" : ""}`} key={item.id}>
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
    return `Fabulous. You can plan the shop, but remember ${currency(flexibleTotal)} is flexible and can be delayed if prices are higher than expected.`;
  }

  return `Nice and clean. The remaining shop is ${currency(remainingBasket)} and it is mostly essential.`;
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

function ProtectedMoneyPanel({ state, update, figures }) {
  const protectedItems = getProtectedItems(state);
  const savingsPots = getSavingsPotsForProtection(state);

  const protectedTotal = protectedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const mustProtectTotal = protectedItems
    .filter((item) => Number(item.priority || 1) === 1)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const plannedSavingsPush = savingsPots.reduce((sum, pot) => {
    const target = Number(pot.target || 0);
    const saved = Number(pot.saved || 0);
    const remaining = Math.max(0, target - saved);
    return sum + Math.ceil(remaining / Math.max(monthsUntilProtected(pot.dueDate), 1));
  }, 0);

  const income = Number(state.income || figures.income || 0);
  const spend = Number(state.spent || figures.spent || 0);
  const trueFreeCash = income - spend - protectedTotal - plannedSavingsPush;
  const protectionRatio = income > 0 ? Math.round((protectedTotal / income) * 100) : 0;
  const status = getProtectionStatus(trueFreeCash, protectionRatio);

  const updateProtectedItem = (id, key, value) => {
    const nextItems = protectedItems.map((item) =>
      item.id === id
        ? {
            ...item,
            [key]: key === "amount" || key === "priority" ? Number(value) : value,
          }
        : item
    );

    update("protectedItems", nextItems);
  };

  return (
    <>
      <div className="section-title">
        <div>
          <span className="kicker">PROTECTED MONEY ENGINE</span>
          <h2>Money that must not be touched</h2>
          <p>
            What is happening: Ledger is ring-fencing essentials before calling money safe.
            What it means: bills, food, family basics and minimum payments are protected first.
            What to do next: edit the protected amounts, then only spend from the true free cash.
          </p>
        </div>
        <div className={`safe-pill small ${trueFreeCash < 0 ? "danger" : ""}`}>
          <span>True free cash</span>
          <strong>{currency(trueFreeCash)}</strong>
        </div>
      </div>

      <div className="protected-status-card">
        <div>
          <span className="kicker">LEDGE STATUS</span>
          <h3>{status.title}</h3>
          <p>{status.message}</p>
        </div>
        <div className={`protection-light ${status.level}`}>
          {status.label}
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric title="Protected total" value={currency(protectedTotal)} />
        <Metric title="Must-protect bills" value={currency(mustProtectTotal)} />
        <Metric title="Savings push included" value={currency(plannedSavingsPush)} />
        <Metric title="Protection ratio" value={`${protectionRatio}%`} />
      </div>

      <div className="panel savings-advice-card">
        <span className="kicker">PENNY PROTECTION ADVICE ✨</span>
        <p>{getProtectedAdvice(trueFreeCash, protectedTotal, plannedSavingsPush)}</p>
      </div>

      <div className="protected-grid">
        {protectedItems.map((item) => (
          <div className="protected-item-card" key={item.id}>
            <div>
              <span className="pot-rank">{item.category}</span>
              <h3>{item.name}</h3>
            </div>

            <div className="protected-edit-row">
              <NumberInput
                label="Protected amount"
                value={item.amount}
                onChange={(v) => updateProtectedItem(item.id, "amount", v)}
              />

              <label className="field">
                <span>Priority</span>
                <select
                  value={item.priority || 1}
                  onChange={(e) => updateProtectedItem(item.id, "priority", e.target.value)}
                >
                  <option value={1}>Must protect</option>
                  <option value={2}>Important</option>
                  <option value={3}>Flexible</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function getProtectedItems(state) {
  return Array.isArray(state.protectedItems) && state.protectedItems.length
    ? state.protectedItems
    : defaultProtectedItems;
}

function getSavingsPotsForProtection(state) {
  if (Array.isArray(state.savingsPots) && state.savingsPots.length) return state.savingsPots;
  if (typeof defaultSavingsPots !== "undefined") return defaultSavingsPots;
  return [];
}

function monthsUntilProtected(dateValue) {
  if (!dateValue) return 12;

  const today = new Date();
  const due = new Date(dateValue);

  if (Number.isNaN(due.getTime())) return 12;

  const years = due.getFullYear() - today.getFullYear();
  const months = due.getMonth() - today.getMonth();

  return Math.max(1, years * 12 + months + 1);
}

function getProtectionStatus(trueFreeCash, protectionRatio) {
  if (trueFreeCash < 0) {
    return {
      level: "red",
      label: "LOCK",
      title: "Protected money breach risk",
      message: "Spending or savings pushes are currently eating into money that should be protected.",
    };
  }

  if (trueFreeCash < 100 || protectionRatio > 80) {
    return {
      level: "amber",
      label: "TIGHT",
      title: "Protected but tight",
      message: "The essentials are covered, but there is not much breathing room. Keep optional spending controlled.",
    };
  }

  return {
    level: "green",
    label: "SAFE",
    title: "Protected money is covered",
    message: "Essentials are ring-fenced and there is still usable breathing space after protection.",
  };
}

function getProtectedAdvice(trueFreeCash, protectedTotal, plannedSavingsPush) {
  if (trueFreeCash < 0) {
    return "Fab honesty moment: this month is not safe yet. Reduce flexible spending first, pause nice-to-have pots, and protect home, food, school, pets and debt minimums.";
  }

  if (trueFreeCash < 100) {
    return "You are protected, but only just. Keep the savings push small, check subscriptions, and avoid surprise spends until payday.";
  }

  return `Fabulous. Ledger has protected ${currency(protectedTotal)} and still included ${currency(plannedSavingsPush)} toward family pots. Spend only from true free cash.`;
}

function SavingsPanel({ state, update, figures }) {
  const pots = getSavingsPots(state);

  const analysedPots = pots
    .map((pot) => {
      const target = Number(pot.target || 0);
      const saved = Number(pot.saved || 0);
      const remaining = Math.max(0, target - saved);
      const months = monthsUntil(pot.dueDate);
      const suggestedMonthlyPush = remaining <= 0 ? 0 : Math.ceil(remaining / Math.max(months, 1));
      const progress = clamp(Math.round((saved / Math.max(target, 1)) * 100), 0, 100);
      const urgency = months <= 2 ? 3 : months <= 5 ? 2 : 1;
      const rankScore = Number(pot.priority || 2) * 10 + urgency * 3 + suggestedMonthlyPush / 20;

      return {
        ...pot,
        target,
        saved,
        remaining,
        months,
        suggestedMonthlyPush,
        progress,
        urgency,
        rankScore,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore);

  const combinedPushTotal = analysedPots.reduce((sum, pot) => sum + pot.suggestedMonthlyPush, 0);
  const safeAfterPush = figures.safe - combinedPushTotal;
  const topPriority = analysedPots[0];

  const updatePot = (id, key, value) => {
    const nextPots = pots.map((pot) =>
      pot.id === id
        ? {
            ...pot,
            [key]: key === "target" || key === "saved" || key === "priority" ? Number(value) : value,
          }
        : pot
    );

    update("savingsPots", nextPots);
  };

  return (
    <>
      <div className="section-title">
        <div>
          <span className="kicker">SAVINGS PUSH PLANNER</span>
          <h2>Family pots</h2>
          <p>
            What is happening: Ledger is splitting future family costs into named pots.
            What it means: you can see the monthly push before the money disappears.
            What to do next: protect priority pots first, then nice-to-have days out.
          </p>
        </div>
        <div className="safe-pill small">
          <span>After push</span>
          <strong>{currency(safeAfterPush)}</strong>
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric title="Combined push" value={currency(combinedPushTotal)} />
        <Metric title="Tracked pots" value={analysedPots.length} />
        <Metric title="Top priority" value={topPriority ? topPriority.name : "None"} />
      </div>

      <div className="panel savings-advice-card">
        <span className="kicker">PENNY SAVINGS ADVICE ✨</span>
        <p>{getPennySavingsAdvice(safeAfterPush, combinedPushTotal, topPriority)}</p>
      </div>

      <div className="savings-grid">
        {analysedPots.map((pot, index) => (
          <div className="saving-pot-card" key={pot.id}>
            <div className="pot-head">
              <div>
                <span className="pot-rank">Priority #{index + 1}</span>
                <h3>{pot.name}</h3>
              </div>
              <strong>{currency(pot.suggestedMonthlyPush)}/mo</strong>
            </div>

            <div className="goal-line">
              <span>{currency(pot.saved)} saved</span>
              <span>{currency(pot.target)} target</span>
            </div>

            <div className="progress-track">
              <div style={{ width: `${pot.progress}%` }} />
            </div>

            <div className="pot-meta">
              <span>Remaining: {currency(pot.remaining)}</span>
              <span>Due: {pot.dueDate || "No date"}</span>
              <span>Months left: {pot.months}</span>
            </div>

            <div className="pot-edit-grid">
              <NumberInput
                label="Target"
                value={pot.target}
                onChange={(v) => updatePot(pot.id, "target", v)}
              />
              <NumberInput
                label="Saved"
                value={pot.saved}
                onChange={(v) => updatePot(pot.id, "saved", v)}
              />
              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={pot.dueDate || ""}
                  onChange={(e) => updatePot(pot.id, "dueDate", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Priority</span>
                <select
                  value={pot.priority || 2}
                  onChange={(e) => updatePot(pot.id, "priority", e.target.value)}
                >
                  <option value={1}>Must protect</option>
                  <option value={2}>Important</option>
                  <option value={3}>Flexible</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function getSavingsPots(state) {
  return Array.isArray(state.savingsPots) && state.savingsPots.length
    ? state.savingsPots
    : defaultSavingsPots;
}

function monthsUntil(dateValue) {
  if (!dateValue) return 12;

  const today = new Date();
  const due = new Date(dateValue);

  if (Number.isNaN(due.getTime())) return 12;

  const years = due.getFullYear() - today.getFullYear();
  const months = due.getMonth() - today.getMonth();
  const total = years * 12 + months + 1;

  return Math.max(1, total);
}

function getPennySavingsAdvice(safeAfterPush, combinedPushTotal, topPriority) {
  if (!topPriority) {
    return "Fab, no savings pots are active yet. Add a few family pots so Ledger can plan ahead.";
  }

  if (safeAfterPush < 0) {
    return `Careful, lovely. The full push would over-stretch the month. Protect ${topPriority.name} first and reduce flexible pots until safe-after-push is positive.`;
  }

  if (safeAfterPush < 100) {
    return `You can do it, but keep it tight. Push toward ${topPriority.name} first, then review food, fuel and subscriptions before adding extra.`;
  }

  if (combinedPushTotal > 0) {
    return `Fabulous. A planned push of ${currency(combinedPushTotal)} keeps future costs from becoming surprise bills. Start with ${topPriority.name}.`;
  }

  return "Everything is covered for now. Keep checking the pots weekly so birthdays, Christmas and insurance do not sneak up.";
}

function PennyPanel({ state, figures }) {
  const lines = [
    `Safe-to-spend is ${currency(figures.safe)}.`,
    `Goal progress is ${figures.goalProgress}%.`,
    `Payday is in ${state.paydayDays} days.`,
    `Current state is ${figures.status}.`,
  ];

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="kicker">PENNY CHAT</div>
        <h2>Friendly guidance, not financial advice.</h2>
        <div className="chat-card">
          <strong>Penny ✨</strong>
          <p>{getPennyLine(figures, state)}</p>
        </div>
        <div className="chat-card muted">
          <strong>Ledge</strong>
          <p>
            Keep decisions practical: essentials first, then goals, then flexible
            spending.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="kicker">WHAT PENNY KNOWS</div>
        <ul className="insight-list">
          {lines.map((line) => (
            <li key={line}>✨ {line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FamilyPanel({ state, update }) {
  return (
    <section className="page-grid">
      <div className="panel wide">
        <div className="section-title">
          <div>
            <div className="kicker">FAMILY MONEY</div>
            <h2>Kids learning zones</h2>
          </div>
          <div className="safe-pill small">
            <span>Stars</span>
            <strong>{state.kidsStars}</strong>
          </div>
        </div>

        <div className="family-grid">
          <FamilyCard
            title="Little Learner"
            age="4–7"
            text="Coins, jars, simple choices and reward stars."
          />
          <FamilyCard
            title="Money Explorer"
            age="8–12"
            text="Wants vs needs, saving goals and pocket money habits."
          />
          <FamilyCard
            title="Teen Builder"
            age="13–17"
            text="Budgeting, responsibility, planning and real-world choices."
          />
        </div>

        <div className="input-grid">
          <NumberInput label="Family pot" value={state.familyPot} onChange={(v) => update("familyPot", v)} />
          <NumberInput label="Kids stars" value={state.kidsStars} onChange={(v) => update("kidsStars", v)} />
        </div>
      </div>

      <div className="panel">
        <div className="kicker">PARENT SNAPSHOT</div>
        <p>
          Current family pot: <strong>{currency(state.familyPot)}</strong>
        </p>
        <p>
          Simple rule: split money into <strong>spend</strong>,{" "}
          <strong>save</strong> and <strong>share</strong>.
        </p>
      </div>
    </section>
  );
}

function PlanPanel({ state, figures, resetDemo }) {
  return (
    <section className="content-grid">
      <div className="panel">
        <div className="kicker">THIS WEEK PLAN</div>
        <h2>Next best money moves</h2>
        <ol className="plan-list">
          <li>Protect unpaid bills: {currency(state.unpaidBills)}.</li>
          <li>Keep weekly food around {currency(state.weeklyFood)}.</li>
          <li>Review subscriptions before payday.</li>
          <li>Send a small amount toward {state.goalName} if safe remains positive.</li>
          <li>Keep demo mode visible until accounts and backend are added.</li>
        </ol>
      </div>

      <div className="panel">
        <div className="kicker">SYSTEM STATUS</div>
        <ul className="bill-list">
          <li><span>Live deployment</span><strong>Active</strong></li>
          <li><span>Data mode</span><strong>Local</strong></li>
          <li><span>Bank connection</span><strong>None</strong></li>
          <li><span>Decision engine</span><strong>{figures.status}</strong></li>
        </ul>

        <button className="danger-btn" onClick={resetDemo}>
          Reset demo data
        </button>
      </div>
    </section>
  );
}

function EditModal({ state, update, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="section-title">
          <div>
            <div className="kicker">EDIT FIGURES</div>
            <h2>Update Ledger numbers</h2>
          </div>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>

        <div className="input-grid">
          <NumberInput label="Income" value={state.income} onChange={(v) => update("income", v)} />
          <NumberInput label="Spent" value={state.spent} onChange={(v) => update("spent", v)} />
          <NumberInput label="Unpaid bills" value={state.unpaidBills} onChange={(v) => update("unpaidBills", v)} />
          <NumberInput label="Payday days" value={state.paydayDays} onChange={(v) => update("paydayDays", v)} />
          <NumberInput label="Goal saved" value={state.goalSaved} onChange={(v) => update("goalSaved", v)} />
          <NumberInput label="Goal target" value={state.goalTarget} onChange={(v) => update("goalTarget", v)} />
        </div>
      </div>
    </div>
  );
}

function SafetyModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="section-title">
          <div>
            <div className="kicker">SAFETY</div>
            <h2>Privacy & demo mode</h2>
          </div>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>

        <div className="safety-copy">
          <p>
            Ledger is currently an early-access local demo. It is not connected
            to your bank and does not store data on a secure backend yet.
          </p>
          <p>
            Do not enter bank logins, card details, passwords, national insurance
            numbers or sensitive financial information.
          </p>
          <p>
            The next production step is accounts, database sync and protected
            user data.
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FamilyCard({ title, age, text }) {
  return (
    <div className="family-card">
      <span>{age}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      
      <nav className="mobile-nav">
        {["Home", "Budget", "Goals", "Penny", "Plan"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "mobile-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function getPennyLine(figures, state) {
  if (figures.safe < 0) {
    return "Careful, lovely. Essentials first today. No panic, just tighten the plan.";
  }

  if (figures.safe < 150) {
    return "You’re doing fab, but keep one eye on bills and one eye on payday.";
  }

  if (figures.goalProgress >= 50) {
    return `Fabulous. ${state.goalName} is moving nicely. Keep the little wins coming.`;
  }

  return "You’re doing fab. Keep one eye on bills and one eye on your next goal.";
}
