const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

if (app.includes("function SavingsPanel(")) {
  console.log("Ledger v3.7 Savings Planner already appears to be installed. Skipping App.jsx patch.");
} else {
  // 1) Add default savings pots before defaultState
  app = app.replace(
    /const STORAGE_KEY = "ledger_v2_state";/,
    `const STORAGE_KEY = "ledger_v2_state";

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
];`
  );

  // 2) Add savingsPots to defaultState
  app = app.replace(
    /(const defaultState = \{[\s\S]*?debtPayment:\s*75,\s*)\};/,
    `$1savingsPots: defaultSavingsPots,
};`
  );

  // 3) Add Savings tab
  app = app.replace(
    /const tabs = \["Home", "Budget", "Goals", "Penny", "Family", "Plan"\];/,
    `const tabs = ["Home", "Budget", "Goals", "Savings", "Penny", "Family", "Plan"];`
  );

  // 4) Render Savings tab before Penny
  app = app.replace(
    /(\{activeTab === "Penny" && \()/,
    `{activeTab === "Savings" && (
          <SavingsPanel state={state} update={update} figures={figures} />
        )}
        $1`
  );

  // 5) Add SavingsPanel and helper functions before PennyPanel
  app = app.replace(
    /function PennyPanel\(\{ state, figures \}\) \{/,
    `function SavingsPanel({ state, update, figures }) {
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
              <div style={{ width: \`\${pot.progress}%\` }} />
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
    return \`Careful, lovely. The full push would over-stretch the month. Protect \${topPriority.name} first and reduce flexible pots until safe-after-push is positive.\`;
  }

  if (safeAfterPush < 100) {
    return \`You can do it, but keep it tight. Push toward \${topPriority.name} first, then review food, fuel and subscriptions before adding extra.\`;
  }

  if (combinedPushTotal > 0) {
    return \`Fabulous. A planned push of \${currency(combinedPushTotal)} keeps future costs from becoming surprise bills. Start with \${topPriority.name}.\`;
  }

  return "Everything is covered for now. Keep checking the pots weekly so birthdays, Christmas and insurance do not sneak up.";
}

function PennyPanel({ state, figures }) {`
  );

  fs.writeFileSync(appPath, app);
  console.log("Patched src/App.jsx with Ledger v3.7 Savings Push Planner.");
}

if (!css.includes("Ledger v3.7 Savings Push Planner")) {
  css += `

/* Ledger v3.7 Savings Push Planner */
.savings-advice-card {
  margin: 18px 0;
  border-color: rgba(255, 208, 90, 0.28);
  background: linear-gradient(135deg, rgba(255, 208, 90, 0.1), rgba(127, 34, 255, 0.1)), var(--panel);
}

.savings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.saving-pot-card {
  border: 1px solid var(--line);
  border-radius: 28px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.065);
  box-shadow: var(--shadow);
}

.pot-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.pot-head h3 {
  margin: 8px 0 0;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.pot-head strong {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(76, 240, 166, 0.12);
  border: 1px solid rgba(76, 240, 166, 0.25);
  color: var(--green);
  white-space: nowrap;
}

.pot-rank {
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(127, 34, 255, 0.18);
  color: #efe2ff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pot-meta {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 14px;
}

.pot-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.field select {
  width: 100%;
  border: 1px solid var(--line);
  outline: none;
  border-radius: 17px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.26);
  color: white;
}

.field select:focus {
  border-color: rgba(168, 85, 255, 0.75);
  box-shadow: 0 0 0 4px rgba(168, 85, 255, 0.13);
}

@media (max-width: 900px) {
  .savings-grid,
  .pot-edit-grid {
    grid-template-columns: 1fr;
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log("Patched src/App.css with Ledger v3.7 savings styling.");
} else {
  console.log("Ledger v3.7 CSS already appears to be installed. Skipping App.css patch.");
}
