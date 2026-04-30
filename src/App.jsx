cd ~/ledger

cat > src/App.jsx <<'EOF'
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const SAFETY_KEY = "ledgerSafetySeen";
const DATA_KEY = "ledgerDataV4";

const defaultData = {
  income: 1500,
  spent: 920,
  unpaid: 180,
  payday: 28,
  saved: 450,
  savingsGoal: 2000,
  bills: [
    { name: "Rent / Housing", amount: 700, paid: true },
    { name: "Phone / Internet", amount: 55, paid: true },
    { name: "Food / Essentials", amount: 140, paid: false },
    { name: "Utilities", amount: 85, paid: false },
  ],
};

function money(value) {
  const n = Number(value || 0);
  return n < 0 ? `£-${Math.abs(n).toLocaleString()}` : `£${n.toLocaleString()}`;
}

function decision(safe) {
  if (safe < 0) return ["Danger zone", "Teds", "🔴", "Freeze extras and protect bills first."];
  if (safe < 250) return ["Careful mode", "Penny", "🟠", "Set a small daily spend limit until payday."];
  return ["Stable", "Ledge", "🟢", "You’re in control. Keep building momentum."];
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [showSafety, setShowSafety] = useState(false);
  const [editing, setEditing] = useState(false);

  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DATA_KEY)) || defaultData;
    } catch {
      return defaultData;
    }
  });

  const [form, setForm] = useState(data);

  useEffect(() => {
    if (localStorage.getItem(SAFETY_KEY) !== "true") setShowSafety(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }, [data]);

  const safe = useMemo(
    () => Number(data.income || 0) - Number(data.spent || 0) - Number(data.unpaid || 0),
    [data]
  );

  const progress = Math.min(
    100,
    Math.round((Number(data.saved || 0) / Math.max(1, Number(data.savingsGoal || 1))) * 100)
  );

  const [mood, leader, icon, action] = decision(safe);

  function clean(field, value) {
    const fixed = value.replace(/^0+(?=\d)/, "");
    setForm({ ...form, [field]: fixed === "" ? "" : Number(fixed) });
  }

  function saveFigures() {
    setData({
      ...data,
      income: Number(form.income) || 0,
      spent: Number(form.spent) || 0,
      unpaid: Number(form.unpaid) || 0,
      payday: Number(form.payday) || 0,
      saved: Number(form.saved) || 0,
      savingsGoal: Number(form.savingsGoal) || 0,
    });
    setEditing(false);
  }

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      {showSafety && (
        <SafetyPopup
          onClose={() => {
            localStorage.setItem(SAFETY_KEY, "true");
            setShowSafety(false);
          }}
        />
      )}

      <main className="mx-auto min-h-screen w-full max-w-md px-5 py-6 lg:max-w-6xl">
        <section className="rounded-[36px] border border-white/10 bg-gradient-to-br from-violet-950/70 via-slate-950 to-black p-6 shadow-2xl shadow-black/50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.35em] text-violet-300">Ledger</div>
              <h1 className="mt-2 text-4xl font-black">Decision OS</h1>
              <p className="mt-2 text-sm text-white/55">
                Local money planning with Ledge, Penny, Eddie and Teds.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowSafety(true)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
                Safety
              </button>
              <button
                onClick={() => {
                  setForm(data);
                  setEditing(true);
                }}
                className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black shadow-lg shadow-violet-900/40"
              >
                Edit figures
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-yellow-300/25 bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">
            🟡 Local Demo Mode · Data stays on this device · No bank connection
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel>
              <Label>Decision Engine</Label>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{icon} {leader}: {mood}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{action}</p>
                </div>
                <div className="rounded-3xl bg-black/30 px-5 py-4 text-center">
                  <div className="text-xs text-white/40">Safe</div>
                  <div className={safe < 0 ? "text-2xl font-black text-red-300" : "text-2xl font-black text-emerald-300"}>
                    {money(safe)}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <Label>Penny Today ✨</Label>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {safe < 0
                  ? "You’re over the line, but we’ll sort it step by step — fab and steady."
                  : "You’re doing fab. Keep one eye on bills and one eye on your next goal."}
              </p>
            </Panel>
          </div>
        </section>

        {editing && (
          <section className="mt-5 rounded-[32px] border border-violet-300/20 bg-[#141425] p-5 shadow-2xl">
            <h2 className="text-2xl font-black">Edit money figures</h2>
            <p className="mt-1 text-sm text-white/50">Clean inputs. No leading-zero issue.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["income", "Monthly income"],
                ["spent", "Spent so far"],
                ["unpaid", "Unpaid bills"],
                ["payday", "Payday countdown"],
                ["saved", "Saved toward goal"],
                ["savingsGoal", "Savings goal"],
              ].map(([field, label]) => (
                <label key={field} className="block rounded-2xl bg-white/[0.06] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">{label}</span>
                  <input
                    type="number"
                    value={form[field] ?? ""}
                    onChange={(e) => clean(field, e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-violet-400"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={saveFigures} className="flex-1 rounded-2xl bg-emerald-600 p-4 font-black">Save</button>
              <button onClick={() => setEditing(false)} className="flex-1 rounded-2xl bg-white/10 p-4 font-black">Cancel</button>
            </div>
          </section>
        )}

        <Nav tab={tab} setTab={setTab} />

        <section className="mt-5">
          {tab === "home" && <Home data={data} safe={safe} progress={progress} />}
          {tab === "budget" && <Budget data={data} safe={safe} />}
          {tab === "goals" && <Goals data={data} progress={progress} />}
          {tab === "penny" && <Penny safe={safe} />}
          {tab === "family" && <Family />}
          {tab === "plan" && <Plan safe={safe} />}
        </section>
      </main>
    </div>
  );
}

function SafetyPopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
      <div className="max-w-lg rounded-[32px] border border-white/15 bg-[#111126] p-6 text-white shadow-2xl">
        <Label>Safety First</Label>
        <h1 className="mt-3 text-3xl font-black">Welcome to Ledger</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Ledger is a local finance planning tool. It is not connected to your bank and is not a secure vault.
        </p>
        <div className="mt-4 rounded-2xl border border-yellow-300/30 bg-yellow-400/10 p-4 text-sm text-yellow-100">
          Do not enter bank logins, card numbers, security codes, passwords, or sensitive financial credentials.
        </div>
        <div className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-sm text-white/70">
          Your data is stored only on this browser/device. There are no accounts, backend, or cloud sync yet.
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-2xl bg-violet-600 p-4 font-black">
          Continue safely
        </button>
      </div>
    </div>
  );
}

function Home({ data, safe, progress }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Income" value={money(data.income)} />
        <Metric title="Spent" value={money(data.spent)} danger={data.spent > data.income} />
        <Metric title="Unpaid bills" value={money(data.unpaid)} />
        <Metric title="Payday" value={`${data.payday}d`} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel>
          <Label>Goal Progress</Label>
          <div className="mt-4 flex justify-between text-sm text-white/60">
            <span>{money(data.saved)}</span>
            <span>{money(data.savingsGoal)}</span>
          </div>
          <div className="mt-3 h-4 rounded-full bg-black/30">
            <div className="h-4 rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-white/50">{progress}% complete</p>
        </Panel>

        <Panel>
          <Label>Team Insight</Label>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <p>🧾 Ledge: Keep the plan simple and practical.</p>
            <p>📊 Eddie: Safe-to-spend is {money(safe)} after spending and unpaid bills.</p>
            <p>⚠️ Teds: Local demo mode only. No sensitive details.</p>
          </div>
        </Panel>
      </section>
    </>
  );
}

function Budget({ data, safe }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <Label>Budget Snapshot</Label>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>Income: {money(data.income)}</p>
          <p>Spent: {money(data.spent)}</p>
          <p>Unpaid bills: {money(data.unpaid)}</p>
          <p className="font-black text-emerald-300">Safe-to-spend: {money(safe)}</p>
        </div>
      </Panel>

      <Panel>
        <Label>Bills</Label>
        <div className="mt-4 space-y-3">
          {data.bills.map((bill) => (
            <div key={bill.name} className="flex justify-between rounded-2xl bg-white/[0.06] p-3 text-sm">
              <span>{bill.name}</span>
              <span>{money(bill.amount)} · {bill.paid ? "Paid" : "Due"}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Goals({ data, progress }) {
  return (
    <Panel>
      <Label>Goals</Label>
      <h2 className="mt-3 text-2xl font-black">Main savings goal</h2>
      <p className="mt-2 text-white/60">{money(data.saved)} saved of {money(data.savingsGoal)}</p>
      <div className="mt-4 h-5 rounded-full bg-black/30">
        <div className="h-5 rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm text-white/50">Penny says: “Tiny steps still count — fab progress.”</p>
    </Panel>
  );
}

function Penny({ safe }) {
  return (
    <Panel>
      <Label>Penny Chat</Label>
      <h2 className="mt-3 text-2xl font-black">Today’s guidance</h2>
      <p className="mt-3 text-white/70">
        {safe < 0
          ? "Careful mode today. Freeze extras, protect bills, then reset calmly."
          : "You’ve got room to breathe. Keep it balanced and avoid surprise spending."}
      </p>
      <p className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-sm text-white/65">
        “Look after the pennies, and the pounds look after themselves.”
      </p>
    </Panel>
  );
}

function Family() {
  return (
    <Panel>
      <Label>Family</Label>
      <h2 className="mt-3 text-2xl font-black">Money learning</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Mini title="Little Learner" text="Ages 4–7 · coins, choices and patience." />
        <Mini title="Money Explorer" text="Ages 8–12 · saving, spending and goals." />
        <Mini title="Teen Builder" text="Ages 13–17 · budgeting and responsibility." />
      </div>
    </Panel>
  );
}

function Plan({ safe }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <Label>Plan</Label>
        <h2 className="mt-3 text-2xl font-black">Next best move</h2>
        <p className="mt-3 text-white/70">
          {safe < 0 ? "Reduce spending today and protect essential bills." : "Keep bills covered and move a little toward your goal."}
        </p>
      </Panel>

      <Panel>
        <Label>Privacy & Safety</Label>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Ledger is currently local only. No accounts, no bank connection, no secure cloud sync yet.
        </p>
        <p className="mt-3 text-sm font-bold text-yellow-100">
          Do not enter bank details, card numbers, passwords, or security codes.
        </p>
      </Panel>
    </div>
  );
}

function Nav({ tab, setTab }) {
  const items = [
    ["home", "Home"],
    ["budget", "Budget"],
    ["goals", "Goals"],
    ["penny", "Penny"],
    ["family", "Family"],
    ["plan", "Plan"],
  ];

  return (
    <nav className="mt-5 grid grid-cols-3 gap-2 rounded-[28px] border border-white/10 bg-white/[0.05] p-2 lg:grid-cols-6">
      {items.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`rounded-2xl px-3 py-3 text-sm font-black ${
            tab === id ? "bg-violet-600 text-white" : "text-white/50"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function Panel({ children }) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
      {children}
    </section>
  );
}

function Metric({ title, value, danger }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
      <div className="text-xs font-bold uppercase tracking-wider text-white/40">{title}</div>
      <div className={danger ? "mt-2 text-3xl font-black text-red-300" : "mt-2 text-3xl font-black text-white"}>
        {value}
      </div>
    </div>
  );
}

function Mini({ title, text }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4">
      <div className="font-black">{title}</div>
      <p className="mt-2 text-sm text-white/60">{text}</p>
    </div>
  );
}

function Label({ children }) {
  return (
    <div className="text-xs font-black uppercase tracking-[0.3em] text-violet-200">
      {children}
    </div>
  );
}
EOF

npm install
npm run build

git add src/App.jsx package-lock.json package.json
git commit -m "Install Ledger v4 premium full system"
git push

