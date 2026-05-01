const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("PATCH FAILED:", message);
  process.exit(1);
}

if (app.includes("function ProtectedMoneyPanel(")) {
  console.log("Ledger v3.8 Protected Money Engine already appears to be installed. Skipping App.jsx patch.");
} else {
  if (!app.includes('const STORAGE_KEY = "ledger_v2_state";')) {
    fail("Could not find STORAGE_KEY anchor.");
  }

  app = app.replace(
    /const STORAGE_KEY = "ledger_v2_state";/,
    `const STORAGE_KEY = "ledger_v2_state";

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
];`
  );

  if (app.includes("savingsPots: defaultSavingsPots,")) {
    app = app.replace(
      /savingsPots: defaultSavingsPots,/,
      `savingsPots: defaultSavingsPots,
  protectedItems: defaultProtectedItems,`
    );
  } else if (app.includes("debtPayment: 75,")) {
    app = app.replace(
      /debtPayment: 75,/,
      `debtPayment: 75,
  protectedItems: defaultProtectedItems,`
    );
  }

  const tabsMatch = app.match(/const tabs = \[([^\]]+)\];/);
  if (!tabsMatch) fail("Could not find tabs array.");

  const currentTabs = tabsMatch[1]
    .split(",")
    .map((x) => x.trim().replaceAll('"', "").replaceAll("'", ""))
    .filter(Boolean);

  if (!currentTabs.includes("Protected")) {
    const insertAfter = currentTabs.includes("Budget") ? currentTabs.indexOf("Budget") + 1 : 2;
    currentTabs.splice(insertAfter, 0, "Protected");
  }

  app = app.replace(
    /const tabs = \[[^\]]+\];/,
    `const tabs = [${currentTabs.map((x) => `"${x}"`).join(", ")}];`
  );

  if (app.includes('{activeTab === "Savings" && (')) {
    app = app.replace(
      /(\{activeTab === "Savings" && \()/,
      `{activeTab === "Protected" && (
          <ProtectedMoneyPanel state={state} update={update} figures={figures} />
        )}
        $1`
    );
  } else if (app.includes('{activeTab === "Penny" && (')) {
    app = app.replace(
      /(\{activeTab === "Penny" && \()/,
      `{activeTab === "Protected" && (
          <ProtectedMoneyPanel state={state} update={update} figures={figures} />
        )}
        $1`
    );
  } else {
    fail("Could not find tab render anchor.");
  }

  const componentAnchor = app.includes("function SavingsPanel(")
    ? "function SavingsPanel("
    : "function PennyPanel(";

  if (!app.includes(componentAnchor)) {
    fail("Could not find component insertion anchor.");
  }

  app = app.replace(
    componentAnchor,
    `function ProtectedMoneyPanel({ state, update, figures }) {
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
        <div className={\`safe-pill small \${trueFreeCash < 0 ? "danger" : ""}\`}>
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
        <div className={\`protection-light \${status.level}\`}>
          {status.label}
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric title="Protected total" value={currency(protectedTotal)} />
        <Metric title="Must-protect bills" value={currency(mustProtectTotal)} />
        <Metric title="Savings push included" value={currency(plannedSavingsPush)} />
        <Metric title="Protection ratio" value={\`\${protectionRatio}%\`} />
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

  return \`Fabulous. Ledger has protected \${currency(protectedTotal)} and still included \${currency(plannedSavingsPush)} toward family pots. Spend only from true free cash.\`;
}

${componentAnchor}`
  );

  fs.writeFileSync(appPath, app);
  console.log("Patched src/App.jsx with Ledger v3.8 Protected Money Engine.");
}

if (!css.includes("Ledger v3.8 Protected Money Engine")) {
  css += `

/* Ledger v3.8 Protected Money Engine */
.protected-status-card {
  margin: 18px 0;
  padding: 22px;
  border: 1px solid rgba(76, 240, 166, 0.22);
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(76, 240, 166, 0.16), transparent 35%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.035));
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.protected-status-card h3 {
  margin: 8px 0;
  font-size: 26px;
  letter-spacing: -0.04em;
}

.protected-status-card p {
  margin: 0;
  color: var(--muted);
  max-width: 760px;
}

.protection-light {
  min-width: 92px;
  min-height: 92px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.protection-light.green {
  color: var(--green);
  background: rgba(76, 240, 166, 0.12);
  box-shadow: 0 0 34px rgba(76, 240, 166, 0.16);
}

.protection-light.amber {
  color: #ffd36a;
  background: rgba(255, 211, 106, 0.12);
  box-shadow: 0 0 34px rgba(255, 211, 106, 0.14);
}

.protection-light.red {
  color: #ff7a90;
  background: rgba(255, 70, 105, 0.12);
  box-shadow: 0 0 34px rgba(255, 70, 105, 0.16);
}

.safe-pill.danger {
  border-color: rgba(255, 70, 105, 0.35);
  background: rgba(255, 70, 105, 0.12);
}

.safe-pill.danger strong {
  color: #ff7a90;
}

.protected-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.protected-item-card {
  border: 1px solid var(--line);
  border-radius: 28px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: var(--shadow);
}

.protected-item-card h3 {
  margin: 10px 0 0;
  font-size: 20px;
  letter-spacing: -0.03em;
}

.protected-edit-row {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 900px) {
  .protected-status-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .protected-grid,
  .protected-edit-row {
    grid-template-columns: 1fr;
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log("Patched src/App.css with Ledger v3.8 protected money styling.");
} else {
  console.log("Ledger v3.8 CSS already appears to be installed. Skipping App.css patch.");
}
