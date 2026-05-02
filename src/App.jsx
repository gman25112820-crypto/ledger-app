import React, { useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "ledger_household_v4_trust_build";

const todayIso = () => new Date().toISOString().slice(0, 10);

const defaultData = {
  acceptedSafety: false,
  household: {
    name: "Your Household",
    payday: "2026-05-31",
    income: 1200,
    monthlySpending: 350,
    emergencyTarget: 1000,
    emergencySaved: 120,
  },
  bills: [
    {
      id: "bill-rent",
      name: "Rent / Mortgage",
      amount: 550,
      dueDate: "2026-05-28",
      frequency: "Monthly",
      category: "Home",
      paid: false,
      autoRenew: false,
      reminderDays: 3,
      notes: "",
    },
    {
      id: "bill-energy",
      name: "Energy",
      amount: 95,
      dueDate: "2026-05-20",
      frequency: "Monthly",
      category: "Utilities",
      paid: false,
      autoRenew: true,
      reminderDays: 5,
      notes: "Check usage before renewal.",
    },
    {
      id: "bill-streaming",
      name: "Streaming subscription",
      amount: 12.99,
      dueDate: "2026-05-16",
      frequency: "Monthly",
      category: "Subscription",
      paid: false,
      autoRenew: true,
      reminderDays: 7,
      notes: "Cancel if not being used.",
    },
  ],
  goals: [
    {
      id: "goal-xmas",
      name: "Christmas fund",
      target: 500,
      saved: 80,
      category: "Family",
      notes: "Keep pressure off December.",
    },
    {
      id: "goal-school",
      name: "School clubs",
      target: 180,
      saved: 35,
      category: "Kids",
      notes: "",
    },
    {
      id: "goal-birthday",
      name: "Birthdays",
      target: 300,
      saved: 60,
      category: "Family",
      notes: "",
    },
  ],
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultData;
    return { ...defaultData, ...JSON.parse(saved) };
  } catch {
    return defaultData;
  }
}

function money(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(number);
}

function daysUntil(dateString) {
  const today = new Date(todayIso());
  const due = new Date(dateString);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("dashboard");
  const [importWarning, setImportWarning] = useState("");
  const fileRef = useRef(null);

  function save(next) {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function patchHousehold(field, value) {
    save({
      ...data,
      household: {
        ...data.household,
        [field]: value,
      },
    });
  }

  function patchBill(id, field, value) {
    save({
      ...data,
      bills: data.bills.map((bill) =>
        bill.id === id ? { ...bill, [field]: value } : bill
      ),
    });
  }

  function patchGoal(id, field, value) {
    save({
      ...data,
      goals: data.goals.map((goal) =>
        goal.id === id ? { ...goal, [field]: value } : goal
      ),
    });
  }

  function addBill() {
    save({
      ...data,
      bills: [
        ...data.bills,
        {
          id: uid("bill"),
          name: "New bill",
          amount: 0,
          dueDate: todayIso(),
          frequency: "Monthly",
          category: "General",
          paid: false,
          autoRenew: false,
          reminderDays: 3,
          notes: "",
        },
      ],
    });
    setTab("bills");
  }

  function removeBill(id) {
    save({
      ...data,
      bills: data.bills.filter((bill) => bill.id !== id),
    });
  }

  function addGoal() {
    save({
      ...data,
      goals: [
        ...data.goals,
        {
          id: uid("goal"),
          name: "New family goal",
          target: 100,
          saved: 0,
          category: "Family",
          notes: "",
        },
      ],
    });
    setTab("goals");
  }

  function removeGoal(id) {
    save({
      ...data,
      goals: data.goals.filter((goal) => goal.id !== id),
    });
  }

  function acceptSafety() {
    save({ ...data, acceptedSafety: true });
  }

  function resetDemo() {
    const next = { ...defaultData, acceptedSafety: true };
    save(next);
    setTab("dashboard");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger-local-export-${todayIso()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.household || !Array.isArray(parsed.bills) || !Array.isArray(parsed.goals)) {
          setImportWarning("That file does not look like a valid Ledger export.");
          return;
        }

        const next = {
          ...defaultData,
          ...parsed,
          acceptedSafety: true,
        };

        save(next);
        setImportWarning("Import complete. Your local Ledger data has been replaced.");
        setTab("dashboard");
      } catch {
        setImportWarning("Import failed. Please choose a valid Ledger JSON export.");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  const summary = useMemo(() => {
    const income = Number(data.household.income || 0);
    const spending = Number(data.household.monthlySpending || 0);
    const unpaidBills = data.bills.filter((bill) => !bill.paid);
    const paidBills = data.bills.filter((bill) => bill.paid);
    const unpaidTotal = unpaidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const paidTotal = paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const subscriptionTotal = data.bills
      .filter((bill) => bill.autoRenew || bill.category.toLowerCase().includes("subscription"))
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const safeToSpend = income - unpaidTotal - spending;
    const dueSoon = data.bills
      .filter((bill) => !bill.paid && daysUntil(bill.dueDate) <= Number(bill.reminderDays || 0))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return {
      income,
      spending,
      unpaidTotal,
      paidTotal,
      subscriptionTotal,
      safeToSpend,
      dueSoon,
    };
  }, [data]);

  return (
    <div className="appShell">
      {!data.acceptedSafety && (
        <div className="onboardingOverlay">
          <div className="onboardingCard">
            <div className="eyebrow">Ledger early access</div>
            <h1>Welcome to Ledger</h1>
            <p>
              Ledger is a local household finance planner. It helps with bills,
              subscriptions, goals, payday planning, and family money habits.
            </p>

            <div className="warningBox">
              <strong>Important safety notice</strong>
              <ul>
                <li>This is a local demo planner, not a bank.</li>
                <li>Your data is saved only in this browser/device.</li>
                <li>Ledger does not connect to bank accounts.</li>
                <li>Do not enter card details, passwords, or sensitive financial information.</li>
                <li>Ledger is not financial advice.</li>
              </ul>
            </div>

            <button className="primaryBtn full" onClick={acceptSafety}>
              I understand — start Ledger
            </button>
          </div>
        </div>
      )}

      <header className="topBar">
        <div>
          <div className="brandRow">
            <div className="logoMark">L</div>
            <div>
              <h1>Ledger</h1>
              <p>Family household money planner</p>
            </div>
          </div>
        </div>

        <div className="statusPill">
          <span className="dot" />
          Local Demo Mode
        </div>
      </header>

      <main className="layout">
        <aside className="sidePanel">
          <div className="householdCard">
            <label>Household name</label>
            <input
              value={data.household.name}
              onChange={(event) => patchHousehold("name", event.target.value)}
            />
            <p>
              No bank connection. No cloud account yet. Your data remains local
              unless you export it.
            </p>
          </div>

          <nav className="navStack">
            {[
              ["dashboard", "Dashboard"],
              ["bills", "Bills & subscriptions"],
              ["goals", "Family goals"],
              ["safety", "Privacy & safety"],
              ["settings", "Export / import"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={tab === key ? "navBtn active" : "navBtn"}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="pennyCard">
            <strong>Penny says</strong>
            <p>
              Fab money planning is boring on purpose: know what is due, what is
              safe, and what needs protecting.
            </p>
          </div>
        </aside>

        <section className="contentPanel">
          {tab === "dashboard" && (
            <Dashboard
              data={data}
              summary={summary}
              patchHousehold={patchHousehold}
              setTab={setTab}
              addBill={addBill}
              addGoal={addGoal}
            />
          )}

          {tab === "bills" && (
            <Bills
              bills={data.bills}
              summary={summary}
              patchBill={patchBill}
              addBill={addBill}
              removeBill={removeBill}
            />
          )}

          {tab === "goals" && (
            <Goals
              goals={data.goals}
              patchGoal={patchGoal}
              addGoal={addGoal}
              removeGoal={removeGoal}
            />
          )}

          {tab === "safety" && <Safety />}

          {tab === "settings" && (
            <Settings
              exportData={exportData}
              importData={importData}
              resetDemo={resetDemo}
              importWarning={importWarning}
              fileRef={fileRef}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ data, summary, patchHousehold, setTab, addBill, addGoal }) {
  return (
    <>
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Command view</div>
          <h2>{data.household.name}</h2>
          <p>Your household snapshot for this month.</p>
        </div>
        <div className="buttonRow">
          <button className="secondaryBtn" onClick={addBill}>Add bill</button>
          <button className="primaryBtn" onClick={addGoal}>Add goal</button>
        </div>
      </div>

      <div className="metricGrid">
        <Metric title="Income" value={money(summary.income)} note="Editable monthly estimate" />
        <Metric
          title="Unpaid bills"
          value={money(summary.unpaidTotal)}
          note={`${summary.dueSoon.length} due soon`}
          urgent={summary.dueSoon.length > 0}
        />
        <Metric title="Subscriptions" value={money(summary.subscriptionTotal)} note="Auto-renew watch" />
        <Metric
          title="Safe after bills"
          value={money(summary.safeToSpend)}
          note={summary.safeToSpend >= 0 ? "Positive buffer" : "Needs attention"}
          urgent={summary.safeToSpend < 0}
        />
      </div>

      <div className="twoColumn">
        <div className="card">
          <h3>Editable household figures</h3>
          <div className="formGrid">
            <label>
              Monthly income
              <input
                type="number"
                value={data.household.income}
                onChange={(event) => patchHousehold("income", Number(event.target.value))}
              />
            </label>
            <label>
              Monthly spending estimate
              <input
                type="number"
                value={data.household.monthlySpending}
                onChange={(event) => patchHousehold("monthlySpending", Number(event.target.value))}
              />
            </label>
            <label>
              Payday
              <input
                type="date"
                value={data.household.payday}
                onChange={(event) => patchHousehold("payday", event.target.value)}
              />
            </label>
            <label>
              Emergency target
              <input
                type="number"
                value={data.household.emergencyTarget}
                onChange={(event) => patchHousehold("emergencyTarget", Number(event.target.value))}
              />
            </label>
            <label>
              Emergency saved
              <input
                type="number"
                value={data.household.emergencySaved}
                onChange={(event) => patchHousehold("emergencySaved", Number(event.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="card">
          <h3>Due soon</h3>
          {summary.dueSoon.length === 0 ? (
            <p className="muted">No urgent bills inside their reminder window.</p>
          ) : (
            <div className="miniList">
              {summary.dueSoon.map((bill) => (
                <div className="miniItem" key={bill.id}>
                  <div>
                    <strong>{bill.name}</strong>
                    <span>{bill.dueDate} · {daysUntil(bill.dueDate)} days</span>
                  </div>
                  <b>{money(bill.amount)}</b>
                </div>
              ))}
            </div>
          )}
          <button className="secondaryBtn full" onClick={() => setTab("bills")}>
            Review bills
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Ledger decision</h3>
        <p className="decisionText">
          {summary.safeToSpend >= 0
            ? "You have a positive buffer after unpaid bills and planned spending. Keep upcoming renewals under review before adding new commitments."
            : "Your plan is currently over-stretched. Review unpaid bills, subscriptions, and non-essential spending before committing to anything else."}
        </p>
      </div>
    </>
  );
}

function Bills({ bills, summary, patchBill, addBill, removeBill }) {
  return (
    <>
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Control bills before they control you</div>
          <h2>Bills & subscriptions</h2>
          <p>Track due dates, paid state, renewals, and reminders.</p>
        </div>
        <button className="primaryBtn" onClick={addBill}>Add bill</button>
      </div>

      <div className="metricGrid">
        <Metric title="Unpaid" value={money(summary.unpaidTotal)} note="Still to cover" />
        <Metric title="Paid" value={money(summary.paidTotal)} note="Cleared this cycle" />
        <Metric title="Renewals" value={money(summary.subscriptionTotal)} note="Auto-renew/subscription total" />
      </div>

      <div className="listStack">
        {bills.map((bill) => {
          const dueIn = daysUntil(bill.dueDate);
          return (
            <div className="editCard" key={bill.id}>
              <div className="editCardHeader">
                <div>
                  <input
                    className="titleInput"
                    value={bill.name}
                    onChange={(event) => patchBill(bill.id, "name", event.target.value)}
                  />
                  <p className={dueIn <= Number(bill.reminderDays || 0) && !bill.paid ? "dangerText" : "muted"}>
                    {bill.paid ? "Paid" : dueIn < 0 ? `Overdue by ${Math.abs(dueIn)} days` : `Due in ${dueIn} days`}
                  </p>
                </div>
                <button className="dangerBtn" onClick={() => removeBill(bill.id)}>Remove</button>
              </div>

              <div className="formGrid">
                <label>
                  Amount
                  <input
                    type="number"
                    value={bill.amount}
                    onChange={(event) => patchBill(bill.id, "amount", Number(event.target.value))}
                  />
                </label>
                <label>
                  Due date
                  <input
                    type="date"
                    value={bill.dueDate}
                    onChange={(event) => patchBill(bill.id, "dueDate", event.target.value)}
                  />
                </label>
                <label>
                  Frequency
                  <select
                    value={bill.frequency}
                    onChange={(event) => patchBill(bill.id, "frequency", event.target.value)}
                  >
                    <option>Weekly</option>
                    <option>Fortnightly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Yearly</option>
                    <option>One-off</option>
                  </select>
                </label>
                <label>
                  Category
                  <input
                    value={bill.category}
                    onChange={(event) => patchBill(bill.id, "category", event.target.value)}
                  />
                </label>
                <label>
                  Reminder days before
                  <input
                    type="number"
                    value={bill.reminderDays}
                    onChange={(event) => patchBill(bill.id, "reminderDays", Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="checkRow">
                <label>
                  <input
                    type="checkbox"
                    checked={bill.paid}
                    onChange={(event) => patchBill(bill.id, "paid", event.target.checked)}
                  />
                  Paid
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={bill.autoRenew}
                    onChange={(event) => patchBill(bill.id, "autoRenew", event.target.checked)}
                  />
                  Auto-renew / subscription
                </label>
              </div>

              <label>
                Notes
                <textarea
                  value={bill.notes}
                  onChange={(event) => patchBill(bill.id, "notes", event.target.value)}
                  placeholder="Renewal notes, cancellation reminder, reference, or useful context."
                />
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Goals({ goals, patchGoal, addGoal, removeGoal }) {
  return (
    <>
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Simple family planning</div>
          <h2>Family goals</h2>
          <p>Christmas, birthdays, school clubs, holidays, kids savings, home costs.</p>
        </div>
        <button className="primaryBtn" onClick={addGoal}>Add goal</button>
      </div>

      <div className="goalGrid">
        {goals.map((goal) => {
          const target = Number(goal.target || 0);
          const saved = Number(goal.saved || 0);
          const progress = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
          const remaining = Math.max(0, target - saved);

          return (
            <div className="editCard" key={goal.id}>
              <div className="editCardHeader">
                <input
                  className="titleInput"
                  value={goal.name}
                  onChange={(event) => patchGoal(goal.id, "name", event.target.value)}
                />
                <button className="dangerBtn" onClick={() => removeGoal(goal.id)}>Remove</button>
              </div>

              <div className="progressTrack">
                <div className="progressFill" style={{ width: `${progress}%` }} />
              </div>
              <p className="muted">
                {progress}% complete · {money(remaining)} remaining
              </p>

              <div className="formGrid">
                <label>
                  Target
                  <input
                    type="number"
                    value={goal.target}
                    onChange={(event) => patchGoal(goal.id, "target", Number(event.target.value))}
                  />
                </label>
                <label>
                  Saved
                  <input
                    type="number"
                    value={goal.saved}
                    onChange={(event) => patchGoal(goal.id, "saved", Number(event.target.value))}
                  />
                </label>
                <label>
                  Category
                  <input
                    value={goal.category}
                    onChange={(event) => patchGoal(goal.id, "category", event.target.value)}
                  />
                </label>
              </div>

              <label>
                Notes
                <textarea
                  value={goal.notes}
                  onChange={(event) => patchGoal(goal.id, "notes", event.target.value)}
                  placeholder="Why this goal matters or how you plan to fund it."
                />
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Safety() {
  return (
    <>
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Trust layer</div>
          <h2>Privacy & safety</h2>
          <p>Plain English, no fake banking claims.</p>
        </div>
      </div>

      <div className="card safetyCard">
        <h3>What Ledger is</h3>
        <p>
          Ledger is a household planning tool for budgets, bills, subscriptions,
          family goals, and basic money decisions.
        </p>

        <h3>What Ledger is not</h3>
        <ul>
          <li>Ledger is not a bank.</li>
          <li>Ledger does not connect to your bank account.</li>
          <li>Ledger does not verify balances.</li>
          <li>Ledger is not financial advice.</li>
          <li>Ledger is not a secure cloud vault.</li>
        </ul>

        <h3>How your data works today</h3>
        <p>
          Your data is stored locally in this browser/device. Clearing browser
          storage may remove your Ledger data. Exported files are your
          responsibility to keep safe.
        </p>

        <h3>Future backend/accounts</h3>
        <p>
          Accounts, shared household access, cloud sync, authentication,
          encryption, and real AI support belong in a later backend phase. They
          should not be claimed until they are genuinely built.
        </p>
      </div>
    </>
  );
}

function Settings({ exportData, importData, resetDemo, importWarning, fileRef }) {
  return (
    <>
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Local data controls</div>
          <h2>Export / import</h2>
          <p>Move or back up your local Ledger data manually.</p>
        </div>
      </div>

      <div className="twoColumn">
        <div className="card">
          <h3>Export data</h3>
          <p>
            Downloads your current Ledger data as a JSON file. Keep it somewhere
            safe if it contains personal household details.
          </p>
          <button className="primaryBtn full" onClick={exportData}>
            Export Ledger data
          </button>
        </div>

        <div className="card">
          <h3>Import data</h3>
          <p>
            Importing replaces the current local Ledger data on this device.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={importData}
          />
          {importWarning && <p className="notice">{importWarning}</p>}
        </div>
      </div>

      <div className="card">
        <h3>Reset demo data</h3>
        <p>
          This clears your current local Ledger data and restores the basic demo
          planner.
        </p>
        <button className="dangerBtn" onClick={resetDemo}>
          Reset local demo data
        </button>
      </div>
    </>
  );
}

function Metric({ title, value, note, urgent }) {
  return (
    <div className={urgent ? "metricCard urgent" : "metricCard"}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
