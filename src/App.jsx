import React, { useMemo, useState } from "react";
import {
  Home,
  Wallet,
  Target,
  MessageCircle,
  Users,
  CheckCircle2,
  ShieldCheck,
  Coins,
  Sparkles,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import "./App.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function money(value) {
  const amount = Number(value || 0);
  return amount < 0
    ? `£-${Math.abs(amount).toLocaleString()}`
    : `£${amount.toLocaleString()}`;
}

function getDecision(data = {}) {
  const safe = data.safeToSpend ?? 0;
  const unpaid = data.unpaidBills ?? 0;
  const spent = data.spent ?? 0;
  const income = data.income ?? 0;

  let score = 100;

  if (safe < 0) score -= Math.min(45, Math.abs(safe) / 25);
  if (unpaid > 0) score -= Math.min(20, unpaid / 25);
  if (income > 0 && spent > income) score -= 20;
  if (income > 0 && spent > income * 1.25) score -= 15;

  score = Math.max(0, Math.round(score));

  if (score < 35) {
    return {
      score,
      level: "danger",
      leader: "Teds",
      icon: "🔴",
      title: "Danger zone",
      message: "Your spending pressure is high. Protect bills first and pause non-essential spending.",
      action: "Freeze extra spending today and clear the nearest unpaid bill.",
    };
  }

  if (score < 70) {
    return {
      score,
      level: "warning",
      leader: "Penny",
      icon: "🟠",
      title: "Careful mode",
      message: "You’re stretched, but this is recoverable with a steady plan.",
      action: "Set a small daily spend limit until payday.",
    };
  }

  return {
    score,
    level: "stable",
    leader: "Ledge",
    icon: "🟢",
    title: "Stable",
    message: "Your position is controlled. Keep building momentum.",
    action: "Keep bills covered and move a little toward your main goal.",
  };
}

function getTeamVoice(type, data = {}) {
  const decision = getDecision(data);
  const safe = data.safeToSpend ?? 0;

  const voices = {
    ledge: () =>
      `${decision.title}. ${decision.message}`,

    penny: () =>
      safe < 0
        ? "You’re over the line, but we’ll sort it step by step — fab and steady ✨"
        : "You’re doing fab. Keep building, one sensible choice at a time ✨",

    eddie: () =>
      `Income ${money(data.income)} vs spent ${money(data.spent)}. Safe-to-spend is ${money(data.safeToSpend)}.`,

    teds: () =>
      safe < 0
        ? "Overspending detected. Pause, protect bills, then reset."
        : "No major risk alert. Keep watching the basics.",
  };

  return voices[type] ? voices[type]() : "";
}

const initialData = {
  income: 1200,
  spent: 1925,
  paydayDay: 28,
  unpaidBills: 350,
  targetProgress: 38,
  bills: [
    { name: "Rent / Housing", amount: 900, paid: true },
    { name: "Council / Utilities", amount: 180, paid: true },
    { name: "Phone / Internet", amount: 75, paid: false },
    { name: "Food / Essentials", amount: 95, paid: false },
  ],
  goals: [
    { name: "Emergency Fund", current: 320, target: 2000 },
    { name: "RAGE Trading Income", current: 1200, target: 3200 },
    { name: "Nova App Launch", current: 35, target: 100 },
    { name: "Debt Cleared", current: 1100, target: 5000 },
  ],
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [data] = useState(initialData);

  const safeToSpend = useMemo(
    () => (data.income || 0) - (data.spent || 0),
    [data]
  );

  const teamData = { ...data, safeToSpend };
  const decision = getDecision(teamData);

  return (
    <div className="min-h-screen bg-[#070712] text-white">
      <main className="mx-auto min-h-screen max-w-md bg-gradient-to-b from-[#080819] via-[#0c0d1f] to-[#070712] px-5 pb-28 pt-8">
        <header className="mb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.35em] text-violet-300">
            Ledger
          </div>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {getGreeting()}
              </h1>
              <p className="mt-1 text-sm text-white/45">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            <button className="rounded-2xl border border-violet-300/30 bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-100">
              Edit
            </button>
          </div>

          <p className="mt-3 text-sm text-white/65">
            🧾 Ledge: {getTeamVoice("ledge", teamData)}
          </p>
        </header>

        {tab === "home" && <HomeScreen data={teamData} decision={decision} />}
        {tab === "budget" && <BudgetScreen data={teamData} />}
        {tab === "goals" && <GoalsScreen data={teamData} />}
        {tab === "penny" && <PennyScreen data={teamData} decision={decision} />}
        {tab === "family" && <FamilyScreen />}
        {tab === "plan" && <PlanScreen decision={decision} />}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function HomeScreen({ data, decision }) {
  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-violet-500/30">
            <Coins />
          </div>
          <div>
            <div className="flex items-center gap-2 font-black">
              Penny Today <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/70">
              {getTeamVoice("penny", data)}
            </p>
          </div>
        </div>
      </GlassCard>

      <DecisionCard decision={decision} />

      <GlassCard>
        <Label>Today’s money position</Label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric title="Safe to spend" value={money(data.safeToSpend)} danger={data.safeToSpend < 0} />
          <Metric title="Payday countdown" value={`${data.paydayDay}d`} />
          <Metric title="Money pressure" value={data.safeToSpend < 0 ? "Medium" : "Low"} />
          <Metric title="Unpaid bills" value={money(data.unpaidBills)} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-3">
        <MiniMetric icon={<Wallet />} title="Income" value={money(data.income)} />
        <MiniMetric icon={<Coins />} title="Spent" value={money(data.spent)} />
        <MiniMetric icon={<ShieldCheck />} title="Target" value={`${data.targetProgress}%`} />
      </div>

      <GlassCard>
        <Label>Upcoming bills</Label>
        <div className="mt-4 space-y-3">
          {data.bills.map((bill) => (
            <div key={bill.name} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3">
              <div>
                <div className="font-black">{bill.name}</div>
                <div className="text-xs text-white/45">{bill.paid ? "Paid" : "Unpaid"}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{money(bill.amount)}</div>
                <div className={bill.paid ? "text-xs font-black text-emerald-300" : "text-xs font-black text-yellow-300"}>
                  {bill.paid ? "PAID" : "DUE"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <Label>Team insight</Label>
        <div className="mt-3 space-y-2 text-sm text-white/70">
          <p>📊 Eddie: {getTeamVoice("eddie", data)}</p>
          <p>⚠️ Teds: {getTeamVoice("teds", data)}</p>
        </div>
      </GlassCard>
    </div>
  );
}

function DecisionCard({ decision }) {
  const colour =
    decision.level === "danger"
      ? "border-red-400/30 bg-red-500/10"
      : decision.level === "warning"
      ? "border-yellow-400/30 bg-yellow-500/10"
      : decision.level === "watch"
      ? "border-sky-400/30 bg-sky-500/10"
      : "border-emerald-400/30 bg-emerald-500/10";

  return (
    <section className={`rounded-[28px] border p-5 ${colour}`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{decision.icon}</div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">
            Decision Engine
          </div>
          <h2 className="mt-1 text-xl font-black">{decision.leader}: {decision.title}</h2>
          <p className="mt-2 text-sm text-white/70">{decision.message}</p>
          <div className="mt-4 rounded-2xl bg-black/20 p-3 text-sm font-bold">
            Best action: {decision.action}
          </div>
        </div>
      </div>
    </section>
  );
}

function BudgetScreen({ data }) {
  return (
    <GlassCard>
      <Label>Budget</Label>
      <p className="mt-4 text-sm text-white/70">
        Eddie says: {getTeamVoice("eddie", data)}
      </p>
      <p className="mt-4 text-sm text-white/55">
        Next build: editable categories, spending caps, and bill toggles.
      </p>
    </GlassCard>
  );
}

function GoalsScreen({ data }) {
  return (
    <div className="space-y-4">
      <GlassCard>
        <Label>Milestone map</Label>
        <p className="mt-2 text-sm text-white/60">
          Track what matters without making money feel chaotic.
        </p>
      </GlassCard>

      {data.goals.map((goal) => {
        const pct = Math.round((goal.current / goal.target) * 100);
        return (
          <GlassCard key={goal.name}>
            <div className="flex justify-between">
              <div className="font-black">{goal.name}</div>
              <div className="text-sm text-violet-300">
                {money(goal.current)} / {money(goal.target)}
              </div>
            </div>
            <div className="mt-2 text-sm text-white/45">{pct}% complete</div>
            <div className="mt-3 h-3 rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-violet-500" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function PennyScreen({ data, decision }) {
  return (
    <div className="space-y-4">
      <GlassCard>
        <Label>Penny Chat</Label>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          {getTeamVoice("penny", data)}
        </p>
        <p className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-sm text-white/65">
          Penny says: “Look after the pennies, and the pounds look after themselves.”
        </p>
      </GlassCard>

      <DecisionCard decision={decision} />
    </div>
  );
}

function FamilyScreen() {
  return (
    <div className="space-y-4">
      <GlassCard>
        <Label>Ledger Family</Label>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <FamilyCard title="Little Learner" age="4–7" />
          <FamilyCard title="Money Explorer" age="8–12" />
          <FamilyCard title="Teen Builder" age="13–17" />
        </div>
      </GlassCard>
    </div>
  );
}

function PlanScreen({ decision }) {
  return (
    <GlassCard>
      <Label>Plan</Label>
      <p className="mt-4 text-sm text-white/70">
        Current priority: {decision.action}
      </p>
      <p className="mt-4 text-sm text-white/55">
        Next build: weekly plan, payday plan, and debt-clear roadmap.
      </p>
    </GlassCard>
  );
}

function FamilyCard({ title, age }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <Users className="mb-2 h-5 w-5 text-violet-200" />
      <div className="text-sm font-black">{title}</div>
      <div className="text-xs text-emerald-300">{age}</div>
    </div>
  );
}

function GlassCard({ children }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30">
      {children}
    </section>
  );
}

function Label({ children }) {
  return (
    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-200">
      {children}
    </div>
  );
}

function Metric({ title, value, danger }) {
  return (
    <div className="rounded-3xl bg-black/20 p-4">
      <div className="text-xs text-white/45">{title}</div>
      <div className={`mt-2 text-3xl font-black ${danger ? "text-red-300" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function MiniMetric({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-3 text-violet-200">{icon}</div>
      <div className="text-xs text-white/45">{title}</div>
      <div className="font-black">{value}</div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    ["home", "Home", Home],
    ["budget", "Budget", Wallet],
    ["goals", "Goals", Target],
    ["penny", "Penny", MessageCircle],
    ["family", "Family", Users],
    ["plan", "Plan", CheckCircle2],
  ];

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md px-4">
      <div className="grid grid-cols-6 gap-1 rounded-[28px] border border-white/10 bg-slate-950/90 p-2 backdrop-blur-xl">
        {items.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-2xl px-2 py-3 text-center text-[11px] font-bold ${
              tab === id ? "bg-violet-600 text-white" : "text-white/50"
            }`}
          >
            <Icon className="mx-auto mb-1 h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
