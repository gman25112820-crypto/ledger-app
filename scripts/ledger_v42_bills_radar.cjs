const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("V4.2 PATCH FAILED:", message);
  process.exit(1);
}

console.log("Installing Ledger v4.2 Bills Calendar + Payment Radar...");

// 1. Add default bills.
if (!app.includes("const defaultBills")) {
  const anchor = 'const STORAGE_KEY = "ledger_v2_state";';

  if (!app.includes(anchor)) fail("Could not find STORAGE_KEY anchor.");

  app = app.replace(
    anchor,
    `${anchor}

const defaultBills = [
  { id: "council", name: "Council / utilities", amount: 180, dueDate: "2026-05-05", paid: true, category: "Home", priority: "Must pay" },
  { id: "phones", name: "Phones / internet", amount: 75, dueDate: "2026-05-12", paid: false, category: "Household", priority: "Important" },
  { id: "transport", name: "Transport / fuel", amount: 155, dueDate: "2026-05-18", paid: false, category: "Travel", priority: "Must pay" },
  { id: "kids-school", name: "Kids / school", amount: 120, dueDate: "2026-05-22", paid: false, category: "Family", priority: "Important" },
  { id: "rent-housing", name: "Rent / housing", amount: 900, dueDate: "2026-05-01", paid: true, category: "Home", priority: "Must pay" },
  { id: "pet-insurance", name: "Pet insurance", amount: 22, dueDate: "2026-05-21", paid: false, category: "Pets", priority: "Important" },
  { id: "home-insurance", name: "Home insurance", amount: 30, dueDate: "2026-05-29", paid: false, category: "Insurance", priority: "Must pay" },
];`
  );
}

// 2. Add bills to default state.
if (!app.includes("bills: defaultBills")) {
  const anchors = [
    "subscriptionItems: defaultSubscriptions,",
    "shoppingItems: defaultShoppingItems,",
    "protectedItems: defaultProtectedItems,",
    "savingsPots: defaultSavingsPots,",
    "debtPayment: 75,"
  ];

  let inserted = false;

  for (const anchor of anchors) {
    if (app.includes(anchor)) {
      app = app.replace(anchor, `${anchor}
  bills: defaultBills,`);
      inserted = true;
      break;
    }
  }

  if (!inserted) fail("Could not insert bills into defaultState.");
}

// 3. Make sure Bills tab exists.
const tabsRegex = /const tabs = \[([^\]]+)\];/;

if (tabsRegex.test(app)) {
  const tabsMatch = app.match(tabsRegex);
  const tabs = tabsMatch[1]
    .split(",")
    .map((x) => x.trim().replaceAll('"', "").replaceAll("'", ""))
    .filter(Boolean);

  if (!tabs.includes("Bills")) {
    const after = tabs.includes("Budget") ? tabs.indexOf("Budget") + 1 : 2;
    tabs.splice(after, 0, "Bills");
  }

  app = app.replace(
    tabsRegex,
    `const tabs = [${tabs.map((tab) => `"${tab}"`).join(", ")}];`
  );
}

// 4. Add Bills render route if missing.
if (!app.includes('activeTab === "Bills"')) {
  const renderBlock = `{activeTab === "Bills" && (
          <BillsRadarPanel state={state} update={update} figures={figures} />
        )}
        `;

  const anchors = [
    '{activeTab === "Shopping" && (',
    '{activeTab === "Watchtower" && (',
    '{activeTab === "Protected" && (',
    '{activeTab === "Goals" && (',
    '{activeTab === "Savings" && (',
  ];

  let inserted = false;

  for (const anchor of anchors) {
    if (app.includes(anchor)) {
      app = app.replace(anchor, renderBlock + anchor);
      inserted = true;
      break;
    }
  }

  if (!inserted) fail("Could not insert Bills route.");
}

// 5. Add Bills component.
if (!app.includes("function BillsRadarPanel(")) {
  const componentAnchor = app.includes("function ShoppingGuardPanel(")
    ? "function ShoppingGuardPanel("
    : app.includes("function WatchtowerPanel(")
      ? "function WatchtowerPanel("
      : app.includes("function HomePanel(")
        ? "function HomePanel("
        : null;

  if (!componentAnchor) fail("Could not find component anchor.");

  app = app.replace(
    componentAnchor,
    `function BillsRadarPanel({ state, update, figures }) {
  const bills = getBills(state);

  const analysedBills = bills
    .map((bill) => {
      const amount = Number(bill.amount || 0);
      const days = daysUntilBill(bill.dueDate);
      const paid = Boolean(bill.paid);
      const urgency =
        paid ? "paid" :
        days < 0 ? "overdue" :
        days <= 3 ? "urgent" :
        days <= 7 ? "soon" :
        "planned";

      return { ...bill, amount, days, paid, urgency };
    })
    .sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;
      return a.days - b.days;
    });

  const unpaidBills = analysedBills.filter((bill) => !bill.paid);
  const paidBills = analysedBills.filter((bill) => bill.paid);
  const overdueBills = unpaidBills.filter((bill) => bill.days < 0);
  const dueThisWeek = unpaidBills.filter((bill) => bill.days >= 0 && bill.days <= 7);
  const unpaidTotal = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
  const dueThisWeekTotal = dueThisWeek.reduce((sum, bill) => sum + bill.amount, 0);
  const mustPayTotal = unpaidBills
    .filter((bill) => bill.priority === "Must pay")
    .reduce((sum, bill) => sum + bill.amount, 0);

  const safeAfterBills = Number(figures.safe || 0) - unpaidTotal;
  const decision = getBillsRadarDecision(safeAfterBills, overdueBills, dueThisWeek, mustPayTotal);

  const updateBill = (id, key, value) => {
    const next = bills.map((bill) =>
      bill.id === id
        ? {
            ...bill,
            [key]: key === "amount" ? Number(value) : value,
          }
        : bill
    );

    update("bills", next);
  };

  const addBill = () => {
    const today = new Date().toISOString().slice(0, 10);

    update("bills", [
      {
        id: \`bill-\${Date.now()}\`,
        name: "New bill",
        amount: 0,
        dueDate: today,
        paid: false,
        category: "General",
        priority: "Important",
      },
      ...bills,
    ]);
  };

  const removeBill = (id) => {
    update("bills", bills.filter((bill) => bill.id !== id));
  };

  const resetBills = () => {
    update("bills", defaultBills);
  };

  return (
    <>
      <div className="section-title">
        <div>
          <span className="kicker">BILLS CALENDAR + PAYMENT RADAR</span>
          <h2>Know what is due before it hits</h2>
          <p>
            What is happening: Ledger is lining up bills by due date.
            What it means: unpaid bills reduce what is truly safe.
            What to do next: clear overdue and this-week bills before spending on extras.
          </p>
        </div>

        <div className={\`safe-pill small \${safeAfterBills < 0 ? "danger" : ""}\`}>
          <span>Safe after bills</span>
          <strong>{currency(safeAfterBills)}</strong>
        </div>
      </div>

      <div className="bills-radar-card">
        <div>
          <span className="kicker">LEDGE PAYMENT RADAR</span>
          <h3>{decision.title}</h3>
          <p>{decision.message}</p>
        </div>

        <div className={\`bills-light \${decision.level}\`}>
          {decision.label}
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric title="Unpaid bills" value={currency(unpaidTotal)} />
        <Metric title="Due this week" value={currency(dueThisWeekTotal)} />
        <Metric title="Must-pay total" value={currency(mustPayTotal)} />
        <Metric title="Paid bills" value={paidBills.length} />
      </div>

      <div className="shopping-actions">
        <button className="primary-action" onClick={addBill}>
          Add bill
        </button>
        <button className="ghost-action" onClick={resetBills}>
          Reset demo bills
        </button>
      </div>

      <div className="panel bills-advice">
        <span className="kicker">PENNY PAYMENT ADVICE ✨</span>
        <p>{getBillsAdvice(safeAfterBills, overdueBills, dueThisWeek, unpaidTotal)}</p>
      </div>

      <div className="bills-layout">
        <div className="bills-list-panel">
          <div className="column-head">
            <span className="kicker">BILLS CALENDAR</span>
            <h3>Due-date control</h3>
          </div>

          <div className="bills-list">
            {analysedBills.map((bill) => (
              <div className={\`bill-card \${bill.urgency}\`} key={bill.id}>
                <div className="bill-top">
                  <label className="shopping-check">
                    <input
                      type="checkbox"
                      checked={bill.paid}
                      onChange={(e) => updateBill(bill.id, "paid", e.target.checked)}
                    />
                    <span>{bill.paid ? "Paid" : "Unpaid"}</span>
                  </label>

                  <button className="remove-mini" onClick={() => removeBill(bill.id)}>
                    Remove
                  </button>
                </div>

                <div className="bill-name-row">
                  <div>
                    <span className="pot-rank">{bill.category}</span>
                    <h3>{bill.name}</h3>
                  </div>
                  <strong>{currency(bill.amount)}</strong>
                </div>

                <div className="bill-status-line">
                  <span>{getBillDueLabel(bill)}</span>
                  <span>{bill.priority}</span>
                </div>

                <div className="bill-edit-grid">
                  <label className="field">
                    <span>Bill name</span>
                    <input
                      value={bill.name || ""}
                      onChange={(e) => updateBill(bill.id, "name", e.target.value)}
                    />
                  </label>

                  <NumberInput
                    label="Amount"
                    value={bill.amount}
                    onChange={(v) => updateBill(bill.id, "amount", v)}
                  />

                  <label className="field">
                    <span>Due date</span>
                    <input
                      type="date"
                      value={bill.dueDate || ""}
                      onChange={(e) => updateBill(bill.id, "dueDate", e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Category</span>
                    <input
                      value={bill.category || ""}
                      onChange={(e) => updateBill(bill.id, "category", e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Priority</span>
                    <select
                      value={bill.priority || "Important"}
                      onChange={(e) => updateBill(bill.id, "priority", e.target.value)}
                    >
                      <option value="Must pay">Must pay</option>
                      <option value="Important">Important</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bills-side-panel">
          <div className="column-head">
            <span className="kicker">THIS WEEK</span>
            <h3>Payment radar</h3>
          </div>

          <div className="delay-list">
            {overdueBills.length === 0 && dueThisWeek.length === 0 ? (
              <div className="mini-rule-card">
                <span className="kicker">CLEAR</span>
                <p>No unpaid bills are due this week.</p>
              </div>
            ) : (
              [...overdueBills, ...dueThisWeek].map((bill) => (
                <div className="delay-card" key={bill.id}>
                  <strong>{bill.name}</strong>
                  <span>{getBillDueLabel(bill)} · {currency(bill.amount)}</span>
                </div>
              ))
            )}
          </div>

          <div className="mini-rule-card">
            <span className="kicker">HOUSE RULE</span>
            <p>Bills first. Shopping second. Savings push third. Flexible spending last.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function getBills(state) {
  return Array.isArray(state.bills) && state.bills.length ? state.bills : defaultBills;
}

function daysUntilBill(dateValue) {
  if (!dateValue) return 999;

  const today = new Date();
  const target = new Date(dateValue);

  if (Number.isNaN(target.getTime())) return 999;

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / 86400000);
}

function getBillDueLabel(bill) {
  if (bill.paid) return "Paid";
  if (bill.days < 0) return \`Overdue by \${Math.abs(bill.days)} days\`;
  if (bill.days === 0) return "Due today";
  if (bill.days === 1) return "Due tomorrow";
  if (bill.days >= 999) return "No date set";
  return \`Due in \${bill.days} days\`;
}

function getBillsRadarDecision(safeAfterBills, overdueBills, dueThisWeek, mustPayTotal) {
  if (overdueBills.length > 0) {
    return {
      level: "red",
      label: "PAY",
      title: "Overdue bills need action",
      message: "A bill is overdue. Sort this before shopping, savings pushes or flexible spending.",
    };
  }

  if (safeAfterBills < 0) {
    return {
      level: "red",
      label: "LOCK",
      title: "Bills would break the month",
      message: "Unpaid bills are higher than the current safe figure. Protect must-pay bills first.",
    };
  }

  if (dueThisWeek.length > 0 || mustPayTotal > 0) {
    return {
      level: "amber",
      label: "WATCH",
      title: "Bills due soon",
      message: "This week has bills due. Keep money protected until they are marked paid.",
    };
  }

  return {
    level: "green",
    label: "CLEAR",
    title: "Bills are under control",
    message: "No urgent unpaid bills are showing. Keep the calendar updated before payday.",
  };
}

function getBillsAdvice(safeAfterBills, overdueBills, dueThisWeek, unpaidTotal) {
  if (overdueBills.length > 0) {
    return \`Fab honesty moment: \${overdueBills.length} bill is overdue. Pay or plan that first before anything flexible.\`;
  }

  if (safeAfterBills < 0) {
    return "This is tight, lovely. Unpaid bills are eating into safe money. Reduce shopping extras, subscriptions or flexible pots until bills are covered.";
  }

  if (dueThisWeek.length > 0) {
    return \`You have \${dueThisWeek.length} bill due this week. Keep that money protected and only spend what remains after bills.\`;
  }

  return \`Fabulous. Unpaid bills total \${currency(unpaidTotal)}, and the radar is not showing urgent pressure right now.\`;
}

${componentAnchor}`
  );
}

fs.writeFileSync(appPath, app);
console.log("Bills Radar installed in App.jsx.");

// 6. Add CSS.
if (!css.includes("Ledger v4.2 Bills Calendar")) {
  css += `

/* Ledger v4.2 Bills Calendar + Payment Radar */
.bills-radar-card {
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

.bills-radar-card h3 {
  margin: 8px 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.bills-radar-card p {
  margin: 0;
  color: var(--muted);
  max-width: 780px;
}

.bills-light {
  min-width: 98px;
  min-height: 98px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.bills-light.green {
  color: var(--green);
  background: rgba(76, 240, 166, 0.12);
  box-shadow: 0 0 34px rgba(76, 240, 166, 0.18);
}

.bills-light.amber {
  color: #ffd36a;
  background: rgba(255, 211, 106, 0.12);
  box-shadow: 0 0 34px rgba(255, 211, 106, 0.16);
}

.bills-light.red {
  color: #ff7a90;
  background: rgba(255, 70, 105, 0.12);
  box-shadow: 0 0 34px rgba(255, 70, 105, 0.18);
}

.bills-advice {
  margin: 18px 0;
  border-color: rgba(255, 208, 90, 0.28);
  background: linear-gradient(135deg, rgba(255, 208, 90, 0.1), rgba(127, 34, 255, 0.1)), var(--panel);
}

.bills-layout {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1.35fr 0.75fr;
  gap: 16px;
}

.bills-list-panel,
.bills-side-panel {
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: var(--shadow);
}

.bills-list {
  display: grid;
  gap: 14px;
}

.bill-card {
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 18px;
  background: rgba(0, 0, 0, 0.18);
}

.bill-card.overdue,
.bill-card.urgent {
  border-color: rgba(255, 70, 105, 0.36);
  background:
    radial-gradient(circle at top right, rgba(255, 70, 105, 0.13), transparent 32%),
    rgba(0, 0, 0, 0.18);
}

.bill-card.soon {
  border-color: rgba(255, 211, 106, 0.35);
  background:
    radial-gradient(circle at top right, rgba(255, 211, 106, 0.12), transparent 32%),
    rgba(0, 0, 0, 0.18);
}

.bill-card.paid {
  opacity: 0.72;
  border-color: rgba(76, 240, 166, 0.24);
}

.bill-top,
.bill-name-row,
.bill-status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.bill-name-row {
  margin-top: 14px;
}

.bill-name-row h3 {
  margin: 10px 0 0;
  font-size: 20px;
  letter-spacing: -0.03em;
}

.bill-name-row strong {
  color: var(--green);
  white-space: nowrap;
}

.bill-status-line {
  margin-top: 12px;
  color: var(--muted);
  font-size: 14px;
}

.bill-edit-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr 1fr 1fr;
  gap: 12px;
}

@media (max-width: 1100px) {
  .bills-layout,
  .bill-edit-grid {
    grid-template-columns: 1fr;
  }

  .bills-radar-card,
  .bill-top,
  .bill-name-row,
  .bill-status-line {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log("Bills CSS installed.");
} else {
  console.log("Bills CSS already present.");
}
