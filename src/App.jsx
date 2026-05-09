import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "ledger_v5_household_state";
const ONBOARDING_KEY = "ledger_v5_onboarding_seen";

const defaultState = {
  household: {
    monthlyIncome: 2200,
    currentBalance: 650,
    foodBudget: 420,
    fuelBudget: 180,
    emergencyFund: 250,
    payday: "2026-05-28",
  },
  bills: [
    { id: "rent", name: "Rent / Mortgage", amount: 850, dueDay: 1, paid: false, type: "bill", autoRenew: false },
    { id: "council", name: "Council Tax", amount: 145, dueDay: 5, paid: false, type: "bill", autoRenew: false },
    { id: "energy", name: "Gas & Electric", amount: 170, dueDay: 12, paid: false, type: "bill", autoRenew: false },
    { id: "phone", name: "Phone", amount: 38, dueDay: 18, paid: false, type: "subscription", autoRenew: true },
    { id: "streaming", name: "Streaming", amount: 15, dueDay: 22, paid: false, type: "subscription", autoRenew: true },
  ],
  shoppingItems: [
    { id: "milk-bread", name: "Milk, bread and basics", estimatedCost: 12, category: "Food", priority: "Essential", bought: false },
    { id: "packed-lunch", name: "Packed lunch bits", estimatedCost: 18, category: "School", priority: "Essential", bought: false },
    { id: "pet-food", name: "Pet food", estimatedCost: 22, category: "Pets", priority: "Essential", bought: false },
    { id: "cleaning", name: "Cleaning supplies", estimatedCost: 15, category: "Home", priority: "Important", bought: false },
    { id: "kids-treat", name: "Kids treat", estimatedCost: 8, category: "Family", priority: "Flexible", bought: false },
  ],
  goals: [
    { id: "christmas", name: "Christmas fund", target: 600, saved: 120 },
    { id: "birthday", name: "Birthdays", target: 350, saved: 90 },
    { id: "school", name: "School clubs", target: 220, saved: 40 },
    { id: "holiday", name: "Holiday fund", target: 1000, saved: 180 },
  ],
  notes: "",
};

function money(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(number);
}

function safeNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, number);
}

function daysUntilPayday(payday) {
  if (!payday) return null;
  const today = new Date();
  const pay = new Date(`${payday}T12:00:00`);
  if (Number.isNaN(pay.getTime())) return null;
  return Math.ceil((pay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function mergeState(saved) {
  return {
    ...defaultState,
    ...saved,
    household: {
      ...defaultState.household,
      ...(saved?.household || {}),
    },
    bills: Array.isArray(saved?.bills) ? saved.bills : defaultState.bills,
    goals: Array.isArray(saved?.goals) ? saved.goals : defaultState.goals,
    shoppingItems: Array.isArray(saved?.shoppingItems) ? saved.shoppingItems : defaultState.shoppingItems,
  };
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? mergeState(JSON.parse(saved)) : defaultState;
    } catch {
      return defaultState;
    }
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== "yes");
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const totals = useMemo(() => {
    const billsTotal = data.bills.reduce((sum, bill) => sum + safeNumber(bill.amount), 0);
    const paidTotal = data.bills.filter((bill) => bill.paid).reduce((sum, bill) => sum + safeNumber(bill.amount), 0);
    const unpaidTotal = billsTotal - paidTotal;

    const subscriptionsTotal = data.bills
      .filter((bill) => bill.type === "subscription")
      .reduce((sum, bill) => sum + safeNumber(bill.amount), 0);

    const goalsSaved = data.goals.reduce((sum, goal) => sum + safeNumber(goal.saved), 0);
    const goalsTarget = data.goals.reduce((sum, goal) => sum + safeNumber(goal.target), 0);

    const shoppingTotal = data.shoppingItems.reduce((sum, item) => sum + safeNumber(item.estimatedCost), 0);
    const shoppingLeft = data.shoppingItems
      .filter((item) => !item.bought)
      .reduce((sum, item) => sum + safeNumber(item.estimatedCost), 0);

    const essentialShop = data.shoppingItems
      .filter((item) => item.priority === "Essential" && !item.bought)
      .reduce((sum, item) => sum + safeNumber(item.estimatedCost), 0);

    const safeToSpend =
      safeNumber(data.household.currentBalance) -
      unpaidTotal -
      safeNumber(data.household.foodBudget) -
      safeNumber(data.household.fuelBudget);

    const afterShopping = safeToSpend - shoppingLeft;

    return {
      billsTotal,
      paidTotal,
      unpaidTotal,
      subscriptionsTotal,
      goalsSaved,
      goalsTarget,
      shoppingTotal,
      shoppingLeft,
      essentialShop,
      safeToSpend,
      afterShopping,
      paydayDays: daysUntilPayday(data.household.payday),
    };
  }, [data]);

  const guidance = useMemo(() => {
    const messages = [];

    if (totals.safeToSpend < 0) {
      messages.push("Your plan is tight. Cover bills, food and fuel before extra spending.");
    } else if (totals.afterShopping < 0) {
      messages.push("The shopping list pushes you over budget. Buy essentials first and delay flexible items.");
    } else if (totals.safeToSpend < 100) {
      messages.push("You have a small buffer. Keep spending boring and controlled.");
    } else {
      messages.push("You have some breathing room. Keep bills updated and move a small amount toward goals.");
    }

    if (totals.subscriptionsTotal > 50) {
      messages.push("Subscriptions are worth reviewing before payday. Auto-renews are quiet budget leaks.");
    }

    if (totals.paydayDays !== null && totals.paydayDays >= 0 && totals.paydayDays <= 7) {
      messages.push("Payday is close. Avoid panic spending and plan the first week now.");
    }

    if (totals.essentialShop > 0) {
      messages.push(`Essential shop still visible: ${money(totals.essentialShop)}. Protect this before treats.`);
    }

    return messages;
  }, [totals]);

  function acceptOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "yes");
    setShowOnboarding(false);
  }

  function updateHousehold(key, value) {
    setData((current) => ({
      ...current,
      household: {
        ...current.household,
        [key]: key === "payday" ? value : safeNumber(value),
      },
    }));
  }

  function updateBill(id, key, value) {
    setData((current) => ({
      ...current,
      bills: current.bills.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              [key]:
                key === "amount" || key === "dueDay"
                  ? safeNumber(value)
                  : key === "paid" || key === "autoRenew"
                    ? Boolean(value)
                    : value,
            }
          : bill
      ),
    }));
  }

  function addBill() {
    setData((current) => ({
      ...current,
      bills: [
        ...current.bills,
        { id: makeId("bill"), name: "New bill", amount: 0, dueDay: 1, paid: false, type: "bill", autoRenew: false },
      ],
    }));
  }

  function removeBill(id) {
    setData((current) => ({ ...current, bills: current.bills.filter((bill) => bill.id !== id) }));
  }

  function updateShoppingItem(id, key, value) {
    setData((current) => ({
      ...current,
      shoppingItems: current.shoppingItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: key === "estimatedCost" ? safeNumber(value) : key === "bought" ? Boolean(value) : value,
            }
          : item
      ),
    }));
  }

  function addShoppingItem() {
    setData((current) => ({
      ...current,
      shoppingItems: [
        ...current.shoppingItems,
        {
          id: makeId("shop"),
          name: "New item",
          estimatedCost: 0,
          category: "Food",
          priority: "Important",
          bought: false,
        },
      ],
    }));
  }

  function removeShoppingItem(id) {
    setData((current) => ({
      ...current,
      shoppingItems: current.shoppingItems.filter((item) => item.id !== id),
    }));
  }

  function updateGoal(id, key, value) {
    setData((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === id ? { ...goal, [key]: key === "name" ? value : safeNumber(value) } : goal
      ),
    }));
  }

  function addGoal() {
    setData((current) => ({
      ...current,
      goals: [...current.goals, { id: makeId("goal"), name: "New family goal", target: 100, saved: 0 }],
    }));
  }

  function removeGoal(id) {
    setData((current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== id) }));
  }

  function exportJson() {
    const payload = {
      app: "Ledger",
      mode: "Local Demo Mode",
      exportedAt: new Date().toISOString(),
      data,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = parsed.data || parsed;

        if (!imported.household || !Array.isArray(imported.bills) || !Array.isArray(imported.goals)) {
          throw new Error("Invalid Ledger file");
        }

        setData(mergeState(imported));
        setImportMessage("Import complete. Your Ledger data has been loaded into this browser.");
      } catch {
        setImportMessage("Import failed. Please choose a valid Ledger JSON export file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  }

  function resetDemoData() {
    const ok = window.confirm("Reset Ledger back to demo data on this browser?");
    if (!ok) return;
    setData(defaultState);
  }

  return (
    <main className="ledgerApp">
      {showOnboarding && (
        <section className="onboardingOverlay">
          <div className="onboardingCard">
            <span className="badge">Local Demo Mode</span>
            <h1>Welcome to Ledger</h1>
            <p>
              Ledger is an early household finance planner. It helps with bills, subscriptions, shopping decisions,
              family goals and safe-to-spend planning.
            </p>
            <div className="warningBox">
              <strong>Important:</strong>
              <ul>
                <li>This is not a bank.</li>
                <li>Do not enter bank logins, card details or passwords.</li>
                <li>Your data is stored only in this browser on this device.</li>
                <li>Clearing browser data may remove your Ledger data.</li>
                <li>Ledger gives planning guidance, not regulated financial advice.</li>
              </ul>
            </div>
            <button className="primaryButton" onClick={acceptOnboarding}>
              I understand — continue
            </button>
          </div>
        </section>
      )}

      <header className="heroHeader">
        <div className="heroGlow" />
        <div className="heroText">
          <span className="badge">Local Demo Mode</span>
          <h1>Ledger</h1>
          <p>Household money without the noise. Plan bills, shop smarter, protect family goals.</p>
        </div>

        <div className="heroPanel">
          <span>Safe to spend</span>
          <strong className={totals.safeToSpend < 0 ? "dangerText" : ""}>{money(totals.safeToSpend)}</strong>
          <small>After unpaid bills, food and fuel.</small>
        </div>

        <div className="headerActions">
          <button onClick={exportJson}>Export</button>
          <button onClick={() => fileInputRef.current?.click()}>Import</button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={importJson} hidden />
        </div>
      </header>

      {importMessage && <div className="notice">{importMessage}</div>}

      <nav className="navTabs">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </button>
        <button className={activeTab === "bills" ? "active" : ""} onClick={() => setActiveTab("bills")}>
          Bills
        </button>
        <button className={activeTab === "shopping" ? "active" : ""} onClick={() => setActiveTab("shopping")}>
          Shopping
        </button>
        <button className={activeTab === "goals" ? "active" : ""} onClick={() => setActiveTab("goals")}>
          Family Goals
        </button>
        <button className={activeTab === "data" ? "active" : ""} onClick={() => setActiveTab("data")}>
          Data
        </button>
        <button className={activeTab === "safety" ? "active" : ""} onClick={() => setActiveTab("safety")}>
          Privacy & Safety
        </button>
      </nav>

      {activeTab === "dashboard" && (
        <section className="dashboardGrid">
          <div className="quickDecisionBar">
            <div className={totals.safeToSpend < 0 ? "quickDecisionMain danger" : "quickDecisionMain good"}>
              <span className="quickLabel">Quick answer</span>
              <h2>{totals.safeToSpend < 0 ? "No extra spending today" : "Spending is possible, carefully"}</h2>
              <p>
                {totals.safeToSpend < 0
                  ? "Stick to bills, food, fuel and essential shopping. Flexible extras wait."
                  : "Essentials look covered. Keep the shop controlled and avoid random extras."}
              </p>
            </div>

            <div className="quickDecisionCard">
              <span>Can I shop?</span>
              <strong>{totals.afterShopping < 0 ? "Essentials only" : "Yes, controlled"}</strong>
              <small>{money(totals.shoppingLeft)} left on list</small>
            </div>

            <div className="quickDecisionCard">
              <span>Bills pressure</span>
              <strong>{totals.unpaidTotal > 0 ? "Check bills" : "Looks okay"}</strong>
              <small>{money(totals.unpaidTotal)} unpaid</small>
            </div>

            <div className="quickDecisionCard">
              <span>Family goals</span>
              <strong>{money(totals.goalsSaved)}</strong>
              <small>saved so far</small>
            </div>
          </div>

          <div className="thisWeekFocusPanel">
            <div className="weekFocusHeader">
              <div>
                <span className="quickLabel">This week</span>
                <h2>Household focus</h2>
                <p>Keep the week simple. Deal with what matters first, then protect the rest.</p>
              </div>
            </div>

            <div className="weekFocusGrid">
              <div className="weekFocusCard">
                <span className="weekFocusTag">Bills</span>
                <h3>{totals.unpaidTotal > 0 ? "Needs checking" : "Looks covered"}</h3>
                <p>{totals.unpaidTotal > 0 ? money(totals.unpaidTotal) + " is still unpaid or unmarked." : "No unpaid bill pressure showing right now."}</p>
              </div>

              <div className="weekFocusCard">
                <span className="weekFocusTag">Shopping</span>
                <h3>{totals.afterShopping < 0 ? "Essentials only" : "Controlled shop"}</h3>
                <p>{totals.shoppingLeft > 0 ? money(totals.shoppingLeft) + " remains on the shopping list." : "Shopping list is clear."}</p>
              </div>

              <div className="weekFocusCard">
                <span className="weekFocusTag">Goals</span>
                <h3>{money(totals.goalsSaved)}</h3>
                <p>Saved toward family goals. Small steady progress is enough.</p>
              </div>

              <div className="weekFocusCard">
                <span className="weekFocusTag">Subscriptions</span>
                <h3>{money(totals.subscriptionsTotal)}</h3>
                <p>Monthly recurring costs. Review these before payday.</p>
              </div>
            </div>
          </div>

          <div className="parentDecisionHome">
            <div className="decisionHero">
              <div className="decisionHeroCopy">
                <span className="decisionKicker">Today’s household money plan</span>
                <h2>{totals.safeToSpend < 0 ? "Essentials first. Extras wait." : "You have room to plan today."}</h2>
                <p>
                  {totals.safeToSpend < 0
                    ? "Ledger is showing that the visible plan is short after bills, food and fuel are protected. That does not mean panic. It means make the next move carefully."
                    : "Your essentials are covered by the visible plan. Keep shopping controlled and keep the family goals moving slowly."}
                </p>
              </div>

              <div className={totals.safeToSpend < 0 ? "decisionStatus danger" : "decisionStatus good"}>
                <span>{totals.safeToSpend < 0 ? "Needs attention" : "On track"}</span>
                <strong>{money(totals.safeToSpend)}</strong>
                <small>safe to spend after essentials</small>
              </div>
            </div>

            <div className="decisionActionGrid">
              <div className="decisionActionCard">
                <span className="actionNumber">1</span>
                <div>
                  <h3>Protect bills first</h3>
                  <p>{totals.unpaidTotal > 0 ? money(totals.unpaidTotal) + " still needs covering or marking as paid." : "Bills currently look covered."}</p>
                </div>
              </div>

              <div className="decisionActionCard">
                <span className="actionNumber">2</span>
                <div>
                  <h3>Control the shop</h3>
                  <p>{totals.shoppingLeft > 0 ? money(totals.shoppingLeft) + " is still on the shopping list." : "Shopping list is clear for now."}</p>
                </div>
              </div>

              <div className="decisionActionCard">
                <span className="actionNumber">3</span>
                <div>
                  <h3>Delay flexible spending</h3>
                  <p>{totals.safeToSpend < 0 ? "Treats, extras and non-essentials wait until the plan is covered." : "Only add extras if the week stays steady."}</p>
                </div>
              </div>
            </div>

            <div className="decisionMiniGrid">
              <div>
                <span>Balance</span>
                <strong>{money(data.household.currentBalance)}</strong>
              </div>
              <div>
                <span>Unpaid bills</span>
                <strong>{money(totals.unpaidTotal)}</strong>
              </div>
              <div>
                <span>Shopping left</span>
                <strong>{money(totals.shoppingLeft)}</strong>
              </div>
              <div>
                <span>Goals saved</span>
                <strong>{money(totals.goalsSaved)}</strong>
              </div>
            </div>

            <div className="decisionPlainEnglish">
              <strong>Plain English:</strong>{" "}
              {totals.safeToSpend < 0
                ? "Your current balance does not cover the full visible plan. Buy essentials first, check the nearest bill, and avoid adding new spending today."
                : "Your current plan has breathing room. Keep the shop controlled and do not let flexible spending creep up."}
            </div>
          </div>
          <div className="card fullWidth commandCard">
            <div>
              <h2>Household command</h2>
              <p className="muted">Edit your figures. Ledger saves locally in this browser.</p>
            </div>

            <div className="formGrid">
              <label>
                Monthly income
                <input type="number" value={data.household.monthlyIncome} onChange={(e) => updateHousehold("monthlyIncome", e.target.value)} />
              </label>
              <label>
                Current balance
                <input type="number" value={data.household.currentBalance} onChange={(e) => updateHousehold("currentBalance", e.target.value)} />
              </label>
              <label>
                Food budget left
                <input type="number" value={data.household.foodBudget} onChange={(e) => updateHousehold("foodBudget", e.target.value)} />
              </label>
              <label>
                Fuel / travel budget left
                <input type="number" value={data.household.fuelBudget} onChange={(e) => updateHousehold("fuelBudget", e.target.value)} />
              </label>
              <label>
                Emergency fund
                <input type="number" value={data.household.emergencyFund} onChange={(e) => updateHousehold("emergencyFund", e.target.value)} />
              </label>
              <label>
                Next payday
                <input type="date" value={data.household.payday} onChange={(e) => updateHousehold("payday", e.target.value)} />
              </label>
            </div>
          </div>

          <Metric title="Unpaid bills" value={money(totals.unpaidTotal)} help={`${money(totals.paidTotal)} already marked paid.`} />
          <Metric title="Subscriptions" value={money(totals.subscriptionsTotal)} help="Monthly auto-renew watch." />
          <Metric title="Shopping left" value={money(totals.shoppingLeft)} help={`After shop: ${money(totals.afterShopping)}`} danger={totals.afterShopping < 0} />
          <Metric title="Family goals" value={`${money(totals.goalsSaved)} / ${money(totals.goalsTarget)}`} help="Saved against targets." />

          <div className="card fullWidth">
            <h2>Today’s guidance</h2>
            <div className="guidanceList">
              {guidance.map((item) => (
                <div className="guidanceItem" key={item}>
                  <span className="dot" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="card fullWidth">
            <h2>Household notes</h2>
            <textarea
              value={data.notes}
              onChange={(e) => setData((current) => ({ ...current, notes: e.target.value }))}
              placeholder="Add reminders, upcoming costs, school clubs, birthdays, car costs, or anything you need visible."
            />
          </div>
        </section>
      )}

      {activeTab === "bills" && (
        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>Bills & subscriptions</h2>
              <p className="muted">Track what is due, what is paid, and what auto-renews.</p>
            </div>
            <button className="primaryButton small" onClick={addBill}>Add item</button>
          </div>

          <div className="tableList">
            {data.bills.map((bill) => (
              <div className="billRow" key={bill.id}>
                <input className="nameInput" value={bill.name} onChange={(e) => updateBill(bill.id, "name", e.target.value)} />
                <input type="number" value={bill.amount} onChange={(e) => updateBill(bill.id, "amount", e.target.value)} />
                <input type="number" min="1" max="31" value={bill.dueDay} onChange={(e) => updateBill(bill.id, "dueDay", e.target.value)} />
                <select value={bill.type} onChange={(e) => updateBill(bill.id, "type", e.target.value)}>
                  <option value="bill">Bill</option>
                  <option value="subscription">Subscription</option>
                </select>
                <label className="checkLabel">
                  <input type="checkbox" checked={bill.autoRenew} onChange={(e) => updateBill(bill.id, "autoRenew", e.target.checked)} />
                  Auto-renew
                </label>
                <label className="checkLabel">
                  <input type="checkbox" checked={bill.paid} onChange={(e) => updateBill(bill.id, "paid", e.target.checked)} />
                  Paid
                </label>
                <button className="dangerButton" onClick={() => removeBill(bill.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="renewBox">
            <h3>Auto-renew watch</h3>
            <p>Check these before payday. Cancel anything you do not use.</p>
            <ul>
              {data.bills.filter((bill) => bill.autoRenew).map((bill) => (
                <li key={bill.id}>{bill.name} — {money(bill.amount)} due around day {bill.dueDay}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {activeTab === "shopping" && (
        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>Shopping List & Spend Guard</h2>
              <p className="muted">Separate essentials from flexible spending before the shop gets away from you.</p>
            </div>
            <button className="primaryButton small" onClick={addShoppingItem}>Add item</button>
          </div>

          <div className="shoppingSummary">
            <Metric title="Total list" value={money(totals.shoppingTotal)} help="Estimated full shop." />
            <Metric title="Still to buy" value={money(totals.shoppingLeft)} help="Unchecked items only." />
            <Metric title="Essentials left" value={money(totals.essentialShop)} help="Protect these first." />
            <Metric title="After shopping" value={money(totals.afterShopping)} help="Safe-to-spend after list." danger={totals.afterShopping < 0} />
          </div>

          <div className="tableList">
            {data.shoppingItems.map((item) => (
              <div className={`shoppingRow ${item.bought ? "bought" : ""}`} key={item.id}>
                <input className="nameInput" value={item.name} onChange={(e) => updateShoppingItem(item.id, "name", e.target.value)} />
                <input type="number" value={item.estimatedCost} onChange={(e) => updateShoppingItem(item.id, "estimatedCost", e.target.value)} />
                <select value={item.category} onChange={(e) => updateShoppingItem(item.id, "category", e.target.value)}>
                  <option>Food</option>
                  <option>School</option>
                  <option>Pets</option>
                  <option>Home</option>
                  <option>Family</option>
                  <option>Travel</option>
                  <option>Other</option>
                </select>
                <select value={item.priority} onChange={(e) => updateShoppingItem(item.id, "priority", e.target.value)}>
                  <option>Essential</option>
                  <option>Important</option>
                  <option>Flexible</option>
                </select>
                <label className="checkLabel">
                  <input type="checkbox" checked={item.bought} onChange={(e) => updateShoppingItem(item.id, "bought", e.target.checked)} />
                  Bought
                </label>
                <button className="dangerButton" onClick={() => removeShoppingItem(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className={totals.afterShopping < 0 ? "warningBox" : "successBox"}>
            <strong>{totals.afterShopping < 0 ? "Spend guard warning:" : "Spend guard clear:"}</strong>
            <p>
              {totals.afterShopping < 0
                ? "This shop would push your plan negative. Buy essentials first, move flexible items later, and avoid adding new subscriptions."
                : "This shop currently fits inside the plan. Keep essentials first and do not let flexible items creep up."}
            </p>
          </div>
        </section>
      )}

      {activeTab === "goals" && (
        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>Simple family goals</h2>
              <p className="muted">Christmas, birthdays, school clubs, holidays and emergency pots.</p>
            </div>
            <button className="primaryButton small" onClick={addGoal}>Add goal</button>
          </div>

          <div className="goalGrid">
            {data.goals.map((goal) => {
              const progress = safeNumber(goal.target) > 0 ? Math.min(100, (safeNumber(goal.saved) / safeNumber(goal.target)) * 100) : 0;

              return (
                <div className="goalCard" key={goal.id}>
                  <input value={goal.name} onChange={(e) => updateGoal(goal.id, "name", e.target.value)} />
                  <div className="miniForm">
                    <label>
                      Target
                      <input type="number" value={goal.target} onChange={(e) => updateGoal(goal.id, "target", e.target.value)} />
                    </label>
                    <label>
                      Saved
                      <input type="number" value={goal.saved} onChange={(e) => updateGoal(goal.id, "saved", e.target.value)} />
                    </label>
                  </div>
                  <div className="progressBar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <p>{money(goal.saved)} saved of {money(goal.target)}</p>
                  <button className="dangerButton" onClick={() => removeGoal(goal.id)}>Remove</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "data" && (
        <section className="card">
          <h2>Export, import and local data</h2>
          <p className="muted">
            Ledger currently stores data locally in this browser. Use export/import if you want to move the data or keep a backup.
          </p>

          <div className="actionGrid">
            <button className="primaryButton" onClick={exportJson}>Export Ledger JSON</button>
            <button onClick={() => fileInputRef.current?.click()}>Import Ledger JSON</button>
            <button className="dangerButton" onClick={resetDemoData}>Reset demo data</button>
            <button onClick={() => { localStorage.removeItem(ONBOARDING_KEY); setShowOnboarding(true); }}>Show onboarding again</button>
          </div>

          <div className="warningBox">
            <strong>Do not treat this as secure storage.</strong>
            <p>This version is useful for planning and testing. It is not for passwords, card details, bank logins or private documents.</p>
          </div>
        </section>
      )}

      {activeTab === "safety" && (
        <section className="card">
          <h2>Privacy & Safety</h2>
          <p>
            Ledger is currently a local household planning app. It helps you think clearly about bills, subscriptions,
            shopping, goals and day-to-day spending.
          </p>

          <div className="safetyGrid">
            <div className="safetyCard">
              <h3>What Ledger does</h3>
              <ul>
                <li>Helps organise household figures.</li>
                <li>Tracks bills, subscriptions and auto-renews.</li>
                <li>Shows a simple safe-to-spend estimate.</li>
                <li>Tracks shopping estimates and priorities.</li>
                <li>Stores data locally in your browser.</li>
                <li>Lets you export and import JSON backups.</li>
              </ul>
            </div>

            <div className="safetyCard">
              <h3>What Ledger does not do</h3>
              <ul>
                <li>It does not connect to your bank.</li>
                <li>It does not provide regulated financial advice.</li>
                <li>It does not protect your device.</li>
                <li>It does not verify your identity.</li>
                <li>It does not replace proper debt, benefit or legal advice.</li>
              </ul>
            </div>
          </div>

          <div className="warningBox">
            <strong>Plain truth:</strong>
            <p>
              Ledger is safe to use as a budgeting demo and household planner. It is not ready to be marketed as a banking,
              financial security or advice product.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ title, value, help, danger = false }) {
  return (
    <div className="metricCard">
      <span>{title}</span>
      <strong className={danger ? "dangerText" : ""}>{value}</strong>
      <small>{help}</small>
    </div>
  );
}
