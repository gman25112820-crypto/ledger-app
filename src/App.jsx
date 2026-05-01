import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "ledger_v2_state";

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

  const tabs = ["Home", "Budget", "Goals", "Penny", "Family", "Plan"];

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

        <nav className="tabs">
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
