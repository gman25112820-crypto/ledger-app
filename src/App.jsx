import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Wallet,
  Target,
  MessageCircle,
  Users,
  Settings,
  Plus,
  Trash2,
  Sparkles,
  PiggyBank,
  Heart,
  ShoppingBag,
  Star,
  Baby,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Coins,
} from "lucide-react";

// Ledger — single-file React prototype
// Assistant: Penny
// Storage: localStorage-first, with optional window.storage fallback

const STORAGE_KEY = "ledger_finance_v2";
const CHAT_KEY = "ledger_penny_chat_v2";

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

async function loadItem(key, fallback) {
  try {
    if (window.storage?.get) {
      const r = await window.storage.get(key);
      if (r?.value) return safeJsonParse(r.value, fallback);
    }
  } catch {}
  try {
    return safeJsonParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

async function saveItem(key, data) {
  const value = JSON.stringify(data);
  try {
    if (window.storage?.set) await window.storage.set(key, value);
  } catch {}
  try {
    localStorage.setItem(key, value);
  } catch {}
}

const DEFAULT_DATA = {
  activeProfileId: "gareth",
  stress: 5,
  income: 1200,
  incomeTarget: 3200,
  paydayDay: 28,
  householdMode: true,
  bills: [
    { id: "rent", name: "Rent / Housing", amount: 900, dueDay: 1, paid: true, icon: "🏠" },
    { id: "council", name: "Council / Utilities", amount: 180, dueDay: 5, paid: true, icon: "🏛️" },
    { id: "phone", name: "Phones / Internet", amount: 75, dueDay: 12, paid: false, icon: "📱" },
    { id: "car", name: "Transport / Fuel", amount: 155, dueDay: 18, paid: false, icon: "🚗" },
    { id: "kids", name: "Kids / School", amount: 120, dueDay: 22, paid: false, icon: "🎒" },
  ],
  mood: null,
  moodLog: [],
  weekMoods: ["😰", "😐", "😊", "😐", "😰", "😊", null],
  categories: [
    { id: "housing", name: "Housing", icon: "🏠", budget: 900, spent: 900 },
    { id: "food", name: "Food", icon: "🥗", budget: 400, spent: 310 },
    { id: "transport", name: "Transport", icon: "🚗", budget: 200, spent: 155 },
    { id: "kids", name: "Kids", icon: "🧒", budget: 300, spent: 280 },
    { id: "bills", name: "Bills", icon: "⚡", budget: 250, spent: 240 },
    { id: "savings", name: "Savings", icon: "💰", budget: 150, spent: 40 },
  ],
  goals: [
    { id: "emergency", label: "Emergency Fund", target: 2000, current: 320, icon: "🛡️" },
    { id: "rage", label: "RAGE Trading Income", target: 3200, current: 1200, icon: "📈" },
    { id: "nova", label: "Nova App Launch", target: 100, current: 35, unit: "%", icon: "🚀" },
    { id: "debt", label: "Debt Cleared", target: 5000, current: 1100, icon: "✅" },
  ],
  childProfiles: [
    {
      id: "little-one",
      name: "Little Learner",
      age: 4,
      level: "little",
      balance: 3,
      streak: 2,
      gameStars: 6,
      kindnessPoints: 3,
      pennyTipIndex: 0,
      jars: [
        { id: "spend", label: "Spend", emoji: "🛍️", amount: 1, color: "#FF8FAB" },
        { id: "save", label: "Save", emoji: "🐷", amount: 2, color: "#7CFFCB" },
        { id: "share", label: "Share", emoji: "❤️", amount: 0, color: "#FFD166" },
      ],
      goals: [{ id: "toy", label: "Toy Goal", emoji: "🧸", target: 10, current: 2 }],
      lastChoice: null,
      miniGame: {
        round: 1,
        question: "Where should Penny put a coin to make it grow?",
        options: ["Spend", "Save", "Hide"],
        answer: "Save",
        complete: false,
      },
    },
    {
      id: "explorer",
      name: "Money Explorer",
      age: 9,
      level: "explorer",
      balance: 12,
      allowance: 5,
      goals: [{ id: "bike", label: "Bike Fund", emoji: "🚲", target: 80, current: 18 }],
      chores: [
        { id: "room", label: "Tidy room", reward: 1, done: false },
        { id: "dishes", label: "Help dishes", reward: 1, done: true },
      ],
    },
    {
      id: "teen",
      name: "Teen Builder",
      age: 14,
      level: "teen",
      balance: 45,
      income: 20,
      categories: [
        { name: "Food", budget: 25, spent: 12 },
        { name: "Gaming", budget: 20, spent: 15 },
        { name: "Saving", budget: 30, spent: 18 },
      ],
      goals: [{ id: "phone", label: "Phone Upgrade", emoji: "📱", target: 300, current: 75 }],
    },
  ],
};

const MOODS = [
  { emoji: "😊", label: "Good", color: "#22C55E" },
  { emoji: "😐", label: "Okay", color: "#F59E0B" },
  { emoji: "😰", label: "Pressed", color: "#EF4444" },
  { emoji: "😤", label: "Frustrated", color: "#F97316" },
  { emoji: "💪", label: "Focused", color: "#8B5CF6" },
];

const QUICK_PROMPTS = [
  "How is my budget tracking this month?",
  "Where am I overspending?",
  "What should I prioritise this week?",
  "How long until my emergency fund is full?",
  "Give me a simple 3-month plan",
];

const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "goals", label: "Goals", icon: Target },
  { id: "penny", label: "Penny", icon: MessageCircle },
  { id: "family", label: "Family", icon: Users },
  { id: "plan", label: "Plan", icon: CheckCircle2 },
];

function clampPct(a, b) {
  if (!b || Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.min(100, Math.round((a / b) * 100)));
}

function money(n) {
  return `£${Number(n || 0).toLocaleString("en-GB")}`;
}

function daysUntilDay(day) {
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth(), Number(day || 1));
  if (target < today) target.setMonth(target.getMonth() + 1);
  return Math.max(0, Math.ceil((target - today) / 86400000));
}

function upcomingBills(bills = []) {
  return [...bills]
    .filter((b) => !b.paid)
    .map((b) => ({ ...b, days: daysUntilDay(b.dueDay) }))
    .sort((a, b) => a.days - b.days);
}

function pressureLabel(score) {
  if (score >= 8) return "High";
  if (score >= 5) return "Medium";
  return "Calm";
}

function statusColour(p) {
  if (p >= 100) return "#EF4444";
  if (p >= 85) return "#F97316";
  if (p >= 70) return "#F59E0B";
  return "#22C55E";
}

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function GlassCard({ children, className = "", soft = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-[28px] border p-4 shadow-2xl ${
        soft
          ? "border-white/50 bg-white/70 text-slate-900 shadow-violet-100/60"
          : "border-white/10 bg-white/[0.055] text-white shadow-black/20 backdrop-blur-xl"
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Label({ children, soft = false }) {
  return (
    <div className={`mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${soft ? "text-violet-600" : "text-violet-300"}`}>
      {children}
    </div>
  );
}

function Progress({ value, max, color = "#8B5CF6", height = 10 }) {
  const p = clampPct(value, max);
  return (
    <div className="overflow-hidden rounded-full bg-white/10" style={{ height }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${p}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 18px ${color}77` }}
      />
    </div>
  );
}

function StatPill({ icon: Icon, label, value, tone = "violet" }) {
  const tones = {
    violet: "from-violet-500/20 to-fuchsia-500/10 text-violet-100 border-violet-300/20",
    green: "from-emerald-500/20 to-teal-500/10 text-emerald-100 border-emerald-300/20",
    amber: "from-amber-500/20 to-orange-500/10 text-amber-100 border-amber-300/20",
    red: "from-red-500/20 to-pink-500/10 text-red-100 border-red-300/20",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-3 ${tones[tone]}`}>
      <Icon className="mb-2 h-4 w-4 opacity-80" />
      <div className="text-[11px] text-white/50">{label}</div>
      <div className="text-lg font-black leading-tight">{value}</div>
    </div>
  );
}

function PennyOrb({ size = 42 }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-violet-500 shadow-lg shadow-violet-500/30"
      style={{ width: size, height: size }}
    >
      <Coins className="h-5 w-5 text-white" />
      <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-slate-950" />
    </div>
  );
}

function AppHeader({ data, onEdit }) {
  return (
    <div className="px-5 pb-3 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300">Ledger</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">
            {data.mood ? `${data.mood} Hey Gareth` : "Hey Gareth"}
          </h1>
          <div className="mt-1 text-sm text-white/45">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="rounded-2xl border border-violet-300/20 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-100 active:scale-95"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function PennyInsight({ data }) {
  const spent = data.categories.reduce((s, c) => s + Number(c.spent || 0), 0);
  const budget = data.categories.reduce((s, c) => s + Number(c.budget || 0), 0);
  const gap = Math.max(0, data.incomeTarget - data.income);
  const worst = [...data.categories].sort((a, b) => clampPct(b.spent, b.budget) - clampPct(a.spent, a.budget))[0];
  const worstPct = worst ? clampPct(worst.spent, worst.budget) : 0;
  let message = `You're ${clampPct(data.income, data.incomeTarget)}% toward your income target. The current monthly gap is ${money(gap)}.`;
  if (worstPct >= 95) message += ` ${worst.name} is tight at ${worstPct}% used, so protect that category first.`;
  else message += ` Spending is currently at ${clampPct(spent, budget)}% of planned budget.`;

  return (
    <GlassCard className="bg-gradient-to-br from-violet-500/18 via-white/[0.06] to-emerald-500/10">
      <div className="flex gap-3">
        <PennyOrb />
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-white">
            Penny Insight <Sparkles className="h-4 w-4 text-yellow-300" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-white/70">{message}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function HomeScreen({ data, setData }) {
  const incomePct = clampPct(data.income, data.incomeTarget);
  const spent = data.categories.reduce((s, c) => s + Number(c.spent || 0), 0);
  const budget = data.categories.reduce((s, c) => s + Number(c.budget || 0), 0);
  const unpaidBills = upcomingBills(data.bills || []);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + Number(b.amount || 0), 0);
  const safeToSpend = data.income - spent - unpaidTotal;
  const paydayIn = daysUntilDay(data.paydayDay || 28);
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  function selectMood(m) {
    const today = new Date().toISOString().slice(0, 10);
    const dayIdx = new Date().getDay();
    const week = [...(data.weekMoods || Array(7).fill(null))];
    week[dayIdx] = m.emoji;
    setData((d) => ({
      ...d,
      mood: m.emoji,
      weekMoods: week,
      moodLog: [...(d.moodLog || []).filter((x) => x.date !== today), { date: today, mood: m.emoji }],
    }));
  }

  function toggleBill(id) {
    setData((d) => ({
      ...d,
      bills: (d.bills || []).map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
    }));
  }

  const nextAction = safeToSpend < 0
    ? `You are ${money(Math.abs(safeToSpend))} over your safe-to-spend line. Pause non-essential spending and clear the nearest unpaid bill first.`
    : unpaidBills.length
      ? `${unpaidBills[0].name} is next. Keep at least ${money(unpaidBills[0].amount)} protected before spending freely.`
      : `Bills look covered. Put a small amount toward the emergency fund before increasing spending.`;

  return (
    <div className="space-y-4 px-5 pb-28">
      <GlassCard className="bg-gradient-to-br from-violet-500/18 via-white/[0.06] to-emerald-500/10">
        <div className="flex gap-3">
          <PennyOrb />
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-white">
              Penny Today <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{nextAction}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden bg-gradient-to-br from-emerald-500/14 via-white/[0.06] to-violet-500/12">
        <Label>Today’s money position</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-black/20 p-4">
            <div className="text-xs text-white/45">Safe to spend</div>
            <div className={`mt-1 text-3xl font-black ${safeToSpend >= 0 ? "text-emerald-300" : "text-red-300"}`}>{money(safeToSpend)}</div>
          </div>
          <div className="rounded-3xl bg-black/20 p-4">
            <div className="text-xs text-white/45">Payday countdown</div>
            <div className="mt-1 text-3xl font-black text-violet-200">{paydayIn}d</div>
          </div>
          <div className="rounded-3xl bg-black/20 p-4">
            <div className="text-xs text-white/45">Money pressure</div>
            <div className="mt-1 text-2xl font-black text-amber-200">{pressureLabel(data.stress)}</div>
          </div>
          <div className="rounded-3xl bg-black/20 p-4">
            <div className="text-xs text-white/45">Unpaid bills</div>
            <div className="mt-1 text-2xl font-black text-white">{money(unpaidTotal)}</div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={TrendingUp} label="Income" value={money(data.income)} tone="green" />
        <StatPill icon={Wallet} label="Spent" value={money(spent)} tone={clampPct(spent, budget) >= 90 ? "red" : "amber"} />
        <StatPill icon={ShieldCheck} label="Target" value={`${incomePct}%`} tone="violet" />
      </div>

      <GlassCard>
        <Label>Upcoming bills</Label>
        <div className="space-y-2">
          {(data.bills || []).slice().sort((a, b) => daysUntilDay(a.dueDay) - daysUntilDay(b.dueDay)).map((bill) => (
            <button key={bill.id} onClick={() => toggleBill(bill.id)} className="flex w-full items-center justify-between rounded-2xl bg-white/[0.055] p-3 text-left active:scale-[0.99]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/8 text-lg">{bill.icon || "🧾"}</div>
                <div>
                  <div className="text-sm font-bold text-white">{bill.name}</div>
                  <div className="text-xs text-white/35">Due day {bill.dueDay} · {daysUntilDay(bill.dueDay)} days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-white/60">{money(bill.amount)}</div>
                <div className={`mt-1 text-[10px] font-black uppercase ${bill.paid ? "text-emerald-300" : "text-amber-300"}`}>{bill.paid ? "Paid" : "To pay"}</div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <Label>Money check-in</Label>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.emoji}
              onClick={() => selectMood(m)}
              className="rounded-2xl border p-2 transition active:scale-95"
              style={{
                borderColor: data.mood === m.emoji ? m.color : "rgba(255,255,255,0.09)",
                background: data.mood === m.emoji ? `${m.color}1f` : "rgba(255,255,255,0.04)",
              }}
            >
              <div className="text-xl">{m.emoji}</div>
              <div className="mt-1 text-[9px] font-bold uppercase text-white/45">{m.label}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <Label>Income progress</Label>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-3xl font-black text-emerald-300">{money(data.income)}</div>
            <div className="text-xs text-white/40">current / month</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white/30">{money(data.incomeTarget)}</div>
            <div className="text-xs text-white/40">family target</div>
          </div>
        </div>
        <Progress value={data.income} max={data.incomeTarget} color="#22C55E" height={12} />
        <div className="mt-2 text-sm text-white/50">{incomePct}% there · {money(data.incomeTarget - data.income)} remaining</div>
      </GlassCard>

      <GlassCard>
        <Label>This week</Label>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => (
            <div key={i} className="text-center">
              <div className={`rounded-2xl border py-2 text-lg ${i === new Date().getDay() ? "border-violet-300 bg-violet-500/20" : "border-white/10 bg-white/5"}`}>
                {data.weekMoods?.[i] || "·"}
              </div>
              <div className="mt-1 font-mono text-[10px] text-white/35">{day}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function BudgetScreen({ data }) {
  const spent = data.categories.reduce((s, c) => s + Number(c.spent || 0), 0);
  const budget = data.categories.reduce((s, c) => s + Number(c.budget || 0), 0);
  return (
    <div className="space-y-4 px-5 pb-28">
      <GlassCard>
        <Label>Spending health</Label>
        <div className="mb-3 flex justify-between">
          <div>
            <div className="text-3xl font-black">{money(spent)}</div>
            <div className="text-sm text-white/45">spent this month</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white/35">{money(budget)}</div>
            <div className="text-sm text-white/45">planned</div>
          </div>
        </div>
        <Progress value={spent} max={budget} color={statusColour(clampPct(spent, budget))} height={12} />
      </GlassCard>

      <div className="space-y-3">
        {data.categories.map((c) => {
          const p = clampPct(c.spent, c.budget);
          return (
            <GlassCard key={c.id || c.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/8 text-xl">{c.icon || "💸"}</div>
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-white/40">{p}% used</div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs" style={{ color: statusColour(p) }}>
                  {money(c.spent)} / {money(c.budget)}
                </div>
              </div>
              <Progress value={c.spent} max={c.budget} color={statusColour(p)} />
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function GoalsScreen({ data }) {
  return (
    <div className="space-y-4 px-5 pb-28">
      <GlassCard className="bg-gradient-to-br from-yellow-400/10 to-violet-500/10">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-300/15 text-yellow-200">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <div className="font-black">Milestone map</div>
            <div className="text-sm text-white/45">Track what matters without making money feel chaotic.</div>
          </div>
        </div>
      </GlassCard>
      {data.goals.map((g, i) => {
        const p = clampPct(g.current, g.target);
        const colors = ["#8B5CF6", "#22C55E", "#F59E0B", "#38BDF8"];
        const color = colors[i % colors.length];
        return (
          <GlassCard key={g.id || g.label}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/8 text-xl">{g.icon || "🎯"}</div>
                <div>
                  <div className="font-bold">{g.label}</div>
                  <div className="text-xs text-white/40">{p}% complete</div>
                </div>
              </div>
              <div className="text-right font-mono text-xs" style={{ color }}>
                {g.unit ? `${g.current}${g.unit}` : money(g.current)} / {g.unit ? `${g.target}${g.unit}` : money(g.target)}
              </div>
            </div>
            <Progress value={g.current} max={g.target} color={color} height={12} />
          </GlassCard>
        );
      })}
    </div>
  );
}

function localPennyReply(text, data) {
  const lower = text.toLowerCase();
  const spent = data.categories.reduce((s, c) => s + Number(c.spent || 0), 0);
  const budget = data.categories.reduce((s, c) => s + Number(c.budget || 0), 0);
  const unpaid = upcomingBills(data.bills || []);
  const unpaidTotal = unpaid.reduce((s, b) => s + Number(b.amount || 0), 0);
  const safe = data.income - spent - unpaidTotal;
  const gap = data.incomeTarget - data.income;
  const worst = [...data.categories].sort((a, b) => clampPct(b.spent, b.budget) - clampPct(a.spent, a.budget))[0];

  if (lower.includes("bill") || lower.includes("payday") || lower.includes("safe")) {
    return `Your safe-to-spend number is ${money(safe)} after current spending and unpaid bills.

Unpaid bills still protected: ${money(unpaidTotal)}. ${unpaid[0] ? `Next bill is ${unpaid[0].name} for ${money(unpaid[0].amount)} in ${unpaid[0].days} days.` : "No unpaid bills are showing right now."}

Penny move: don't treat income as available until bills are covered first.`;
  }
  if (lower.includes("overspend") || lower.includes("overspending")) {
    return `Your tightest category is ${worst.name}: ${money(worst.spent)} used from ${money(worst.budget)} (${clampPct(worst.spent, worst.budget)}%).

This week, protect that category first. Set a small cap for the next 7 days and move anything non-essential into savings or income-building work.`;
  }
  if (lower.includes("income") || lower.includes("target")) {
    return `You’re currently at ${money(data.income)} against a ${money(data.incomeTarget)} monthly target, leaving a ${money(gap)} gap.

The clean move is to split that gap into smaller targets: ${money(Math.ceil(gap / 4))} per week. Focus on the highest-probability income vehicle first, not all projects at once.`;
  }
  if (lower.includes("emergency")) {
    const g = data.goals.find((x) => x.label.toLowerCase().includes("emergency"));
    if (g) return `Your emergency fund is ${money(g.current)} / ${money(g.target)} (${clampPct(g.current, g.target)}%).

At ${money(150)} per month, you’d reach it in roughly ${Math.ceil((g.target - g.current) / 150)} months. Even £25 weekly would keep the habit moving.`;
  }
  return `Here’s the clean snapshot: income is ${money(data.income)}, spending is ${money(spent)}, unpaid bills are ${money(unpaidTotal)}, and safe-to-spend is ${money(safe)}.

Penny’s priority: cover bills first, protect the highest-pressure category, and push one income lever this week instead of spreading energy across everything.`;
}

function PennyScreen({ data }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    loadItem(CHAT_KEY, []).then(setMessages);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const clean = text.trim();
    if (!clean) return;
    const next = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    const reply = localPennyReply(clean, data);
    const finalMsgs = [...next, { role: "assistant", content: reply }];
    setTimeout(() => {
      setMessages(finalMsgs);
      saveItem(CHAT_KEY, finalMsgs.slice(-30));
    }, 350);
  }

  return (
    <div className="flex min-h-[calc(100vh-110px)] flex-col px-5 pb-28">
      <GlassCard className="mb-4 border-amber-300/20 bg-gradient-to-br from-amber-300/12 to-violet-500/12">
        <div className="flex gap-3">
          <PennyOrb size={48} />
          <div>
            <div className="text-lg font-black">Penny</div>
            <div className="text-sm text-white/50">Your calm money guide. This prototype uses a local Penny brain so it works today.</div>
          </div>
        </div>
      </GlassCard>

      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button key={q} onClick={() => send(q)} className="rounded-full border border-violet-300/20 bg-violet-500/12 px-3 py-2 text-xs font-semibold text-violet-100 active:scale-95">
            {q}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">Ask Penny about your money, budget, goals or next best step.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[86%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-violet-600 text-white" : "rounded-bl-md border border-white/10 bg-white/[0.07] text-white/80"}`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 mt-4 flex gap-2 rounded-3xl border border-white/10 bg-slate-950/90 p-2 backdrop-blur-xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask Penny…"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30"
        />
        <button onClick={() => send(input)} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 font-black text-white active:scale-95">↑</button>
      </div>
    </div>
  );
}

function LittleLearner({ child, updateChild }) {
  const [celebrate, setCelebrate] = useState(false);
  const goal = child.goals?.[0];

  function chooseJar(id) {
    const jar = child.jars.find((j) => j.id === id);
    if (!jar || child.balance <= 0) return;
    const next = {
      ...child,
      balance: Math.max(0, child.balance - 1),
      lastChoice: jar.label,
      streak: (child.streak || 0) + 1,
      kindnessPoints: Number(child.kindnessPoints || 0) + (id === "share" ? 1 : 0),
      jars: child.jars.map((j) => (j.id === id ? { ...j, amount: Number(j.amount || 0) + 1 } : j)),
      goals: id === "save" ? child.goals.map((g, idx) => (idx === 0 ? { ...g, current: Number(g.current || 0) + 1 } : g)) : child.goals,
    };
    updateChild(next);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 900);
  }

  return (
    <div className="relative space-y-4 overflow-hidden rounded-[36px] bg-gradient-to-br from-sky-100 via-violet-100 to-amber-100 p-4 text-slate-900 shadow-2xl shadow-violet-900/20">
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-white/30 backdrop-blur-sm">
            <div className="rounded-[32px] bg-white px-6 py-5 text-center shadow-xl">
              <div className="text-5xl">🎉</div>
              <div className="mt-2 text-xl font-black">Great choice!</div>
              <div className="text-sm text-slate-500">Penny is proud of you.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Little Learner</div>
          <div className="text-2xl font-black">Hi 👋</div>
          <div className="text-sm text-slate-500">Age 4–7 money habits</div>
        </div>
        <div className="rounded-3xl bg-white/80 px-4 py-3 text-center shadow-sm">
          <div className="text-xs font-bold text-slate-400">Today</div>
          <div className="text-2xl font-black">{money(child.balance)}</div>
        </div>
      </div>

      <div className="rounded-[28px] bg-white/80 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <PennyOrb />
          <div>
            <div className="font-black">Penny says</div>
            <div className="text-sm text-slate-500">Spend some, save some, share some.</div>
          </div>
        </div>
      </div>

      <WisdomCard soft />

      <div className="grid grid-cols-3 gap-3">
        {child.jars.map((jar) => (
          <button key={jar.id} onClick={() => chooseJar(jar.id)} className="rounded-[28px] bg-white/85 p-3 text-center shadow-sm transition active:scale-95">
            <div className="text-4xl">{jar.emoji}</div>
            <div className="mt-2 text-sm font-black">{jar.label}</div>
            <div className="mt-1 text-xs font-bold text-slate-400">{money(jar.amount)}</div>
          </button>
        ))}
      </div>

      {goal && (
        <div className="rounded-[28px] bg-white/85 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black"><span className="text-2xl">{goal.emoji}</span>{goal.label}</div>
            <div className="text-sm font-black text-violet-600">{money(goal.current)} / {money(goal.target)}</div>
          </div>
          <div className="overflow-hidden rounded-full bg-slate-200">
            <div className="h-4 rounded-full bg-gradient-to-r from-violet-400 to-emerald-400" style={{ width: `${clampPct(goal.current, goal.target)}%` }} />
          </div>
        </div>
      )}

      <MoneyMiniGame child={child} updateChild={updateChild} />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[24px] bg-white/70 p-3 text-center">
          <Star className="mx-auto h-5 w-5 text-amber-500" />
          <div className="mt-1 text-lg font-black">{child.streak || 0}</div>
          <div className="text-xs font-bold text-slate-400">choices</div>
        </div>
        <div className="rounded-[24px] bg-white/70 p-3 text-center">
          <PiggyBank className="mx-auto h-5 w-5 text-emerald-500" />
          <div className="mt-1 text-lg font-black">Save</div>
          <div className="text-xs font-bold text-slate-400">patience</div>
        </div>
        <div className="rounded-[24px] bg-white/70 p-3 text-center">
          <Heart className="mx-auto h-5 w-5 text-rose-500" />
          <div className="mt-1 text-lg font-black">{child.kindnessPoints || 0}</div>
          <div className="text-xs font-bold text-slate-400">kindness</div>
        </div>
      </div>
    </div>
  );
}

function ExplorerCard({ child, updateChild }) {
  function toggleChore(id) {
    updateChild({ ...child, chores: child.chores.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  }
  const goal = child.goals?.[0];
  const weeksToGoal = goal ? Math.ceil(Math.max(0, goal.target - goal.current) / Math.max(1, child.allowance || 1)) : 0;
  return (
    <GlassCard soft className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-600"><GraduationCap /></div>
        <div>
          <div className="text-xl font-black">Money Explorer</div>
          <div className="text-sm text-slate-500">Ages 8–12 · goals, chores, choices</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-100 p-4"><div className="text-xs font-bold text-slate-400">Balance</div><div className="text-2xl font-black">{money(child.balance)}</div></div>
        <div className="rounded-3xl bg-slate-100 p-4"><div className="text-xs font-bold text-slate-400">Allowance</div><div className="text-2xl font-black">{money(child.allowance)}</div></div>
      </div>
      <WisdomCard soft />
      {goal && <div><div className="mb-2 flex justify-between text-sm font-bold"><span>{goal.emoji} {goal.label}</span><span>{money(goal.current)} / {money(goal.target)}</span></div><Progress value={goal.current} max={goal.target} color="#38BDF8" /><div className="mt-2 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-700">Mini insight: save your allowance each week and you could reach this in about {weeksToGoal} weeks.</div></div>}
      <div className="space-y-2">
        {child.chores?.map((c) => <button key={c.id} onClick={() => toggleChore(c.id)} className="flex w-full items-center justify-between rounded-2xl bg-slate-100 p-3 text-left active:scale-[0.99]"><span className="font-bold">{c.done ? "✅" : "⬜"} {c.label}</span><span className="text-sm font-black text-emerald-600">+{money(c.reward)}</span></button>)}
      </div>
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-black text-violet-700">Choice challenge</div>
        <div className="text-sm text-slate-600">Before buying something, wait one day. If you still want it tomorrow, it might be worth it.</div>
      </div>
    </GlassCard>
  );
}

const CHILD_LEVELS = [
  {
    id: "little",
    title: "Little Learner",
    ages: "4–7",
    icon: Baby,
    description: "Playful money habits: spend, save, share.",
  },
  {
    id: "explorer",
    title: "Money Explorer",
    ages: "8–12",
    icon: GraduationCap,
    description: "Goals, chores, waiting, and smart choices.",
  },
  {
    id: "teen",
    title: "Teen Builder",
    ages: "13–17",
    icon: TrendingUp,
    description: "Budgeting, independence, subscriptions, and future planning.",
  },
];

const PENNY_WISDOM = [
  "Look after the pennies, and the pounds look after themselves.",
  "Saving is waiting with a reward at the end.",
  "Spend some, save some, share some — that’s a strong money habit.",
  "A small coin saved today can become a big choice later.",
  "Kind money matters too — sharing builds a generous heart.",
];

function WisdomCard({ soft = false }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className={`${soft ? "bg-white/80 text-slate-800" : "bg-white/[0.065] text-white"} rounded-[28px] p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`${soft ? "bg-amber-100 text-amber-600" : "bg-amber-400/15 text-amber-200"} grid h-11 w-11 shrink-0 place-items-center rounded-2xl`}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className={`text-xs font-black uppercase tracking-[0.16em] ${soft ? "text-violet-600" : "text-violet-300"}`}>Penny wisdom</div>
          <div className="mt-1 text-sm font-bold leading-relaxed">“{PENNY_WISDOM[idx]}”</div>
          <button onClick={() => setIdx((idx + 1) % PENNY_WISDOM.length)} className={`${soft ? "text-violet-600" : "text-violet-200"} mt-2 text-xs font-black`}>Another message →</button>
        </div>
      </div>
    </div>
  );
}

function MoneyMiniGame({ child, updateChild }) {
  const game = child.miniGame || {
    question: "Where should Penny put a coin to make it grow?",
    options: ["Spend", "Save", "Hide"],
    answer: "Save",
    complete: false,
  };

  function answer(option) {
    const correct = option === game.answer;
    updateChild({
      ...child,
      gameStars: Number(child.gameStars || 0) + (correct ? 2 : 0),
      miniGame: { ...game, complete: true, picked: option, correct },
    });
  }

  function nextRound() {
    const games = [
      { question: "You get £1. What is a strong habit?", options: ["Spend all", "Save some", "Lose it"], answer: "Save some" },
      { question: "Which jar helps someone else?", options: ["Share", "Spend", "Hide"], answer: "Share" },
      { question: "What helps you buy a bigger toy later?", options: ["Saving", "Rushing", "Forgetting"], answer: "Saving" },
    ];
    const next = games[Math.floor(Math.random() * games.length)];
    updateChild({ ...child, miniGame: { ...next, complete: false, picked: null, correct: false } });
  }

  return (
    <div className="rounded-[28px] bg-white/85 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Mini game</div>
          <div className="text-lg font-black">Penny’s Coin Choice</div>
        </div>
        <div className="rounded-2xl bg-amber-100 px-3 py-2 text-sm font-black text-amber-600">⭐ {child.gameStars || 0}</div>
      </div>
      <div className="rounded-3xl bg-violet-50 p-4 text-center text-base font-black text-slate-800">{game.question}</div>
      {!game.complete ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {game.options.map((o) => (
            <button key={o} onClick={() => answer(o)} className="rounded-2xl bg-white px-2 py-3 text-sm font-black shadow-sm active:scale-95">{o}</button>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-3xl bg-white p-4 text-center">
          <div className="text-3xl">{game.correct ? "🎉" : "🌱"}</div>
          <div className="mt-1 text-sm font-black">{game.correct ? "Brilliant choice!" : "Good try — Penny says try again."}</div>
          <button onClick={nextRound} className="mt-3 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Next game</button>
        </div>
      )}
    </div>
  );
}

function TeenCard({ child }) {
  return (
    <GlassCard soft className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600"><TrendingUp /></div>
        <div>
          <div className="text-xl font-black">Teen Builder</div>
          <div className="text-sm text-slate-500">Ages 13–17 · independence and smart choices</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-100 p-4"><div className="text-xs font-bold text-slate-400">Balance</div><div className="text-2xl font-black">{money(child.balance)}</div></div>
        <div className="rounded-3xl bg-slate-100 p-4"><div className="text-xs font-bold text-slate-400">Income</div><div className="text-2xl font-black">{money(child.income)}</div></div>
      </div>
      <WisdomCard soft />
      <div className="rounded-3xl bg-violet-50 p-4">
        <div className="mb-2 text-sm font-black text-violet-700">Mini insight</div>
        <div className="text-sm leading-relaxed text-slate-600">If you save 20% of every bit of income now, you are practising the same habit adults use for real financial freedom.</div>
      </div>
      {child.categories?.map((c) => <div key={c.name}><div className="mb-1 flex justify-between text-sm font-bold"><span>{c.name}</span><span>{money(c.spent)} / {money(c.budget)}</span></div><Progress value={c.spent} max={c.budget} color={statusColour(clampPct(c.spent, c.budget))} /></div>)}
    </GlassCard>
  );
}

function FamilyScreen({ data, setData }) {
  const [selected, setSelected] = useState(data.childProfiles?.[0]?.id || "");
  const child = data.childProfiles.find((c) => c.id === selected) || data.childProfiles[0];

  function updateChild(nextChild) {
    setData((d) => ({ ...d, childProfiles: d.childProfiles.map((c) => (c.id === nextChild.id ? nextChild : c)) }));
  }

  return (
    <div className="space-y-4 px-5 pb-28">
      <GlassCard>
        <Label>Ledger Family</Label>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {CHILD_LEVELS.map(({ id, title, ages, icon: Icon, description }) => (
            <div key={id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <Icon className="mb-2 h-5 w-5 text-violet-200" />
              <div className="text-xs font-black text-white">{title}</div>
              <div className="text-[10px] font-bold text-emerald-200">{ages}</div>
              <div className="mt-1 text-[10px] leading-snug text-white/35">{description}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.childProfiles.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`shrink-0 rounded-2xl border px-4 py-3 text-left active:scale-95 ${selected === c.id ? "border-violet-300 bg-violet-500/20" : "border-white/10 bg-white/5"}`}>
              <div className="text-sm font-black">{c.name}</div>
              <div className="text-xs text-white/40">Age {c.age}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      {child?.level === "little" && <LittleLearner child={child} updateChild={updateChild} />}
      {child?.level === "explorer" && <ExplorerCard child={child} updateChild={updateChild} />}
      {child?.level === "teen" && <TeenCard child={child} />}
    </div>
  );
}

function PlanScreen({ data }) {
  const spent = data.categories.reduce((s, c) => s + Number(c.spent || 0), 0);
  const unpaid = upcomingBills(data.bills || []);
  const unpaidTotal = unpaid.reduce((s, b) => s + Number(b.amount || 0), 0);
  const safe = data.income - spent - unpaidTotal;
  const worst = [...data.categories].sort((a, b) => clampPct(b.spent, b.budget) - clampPct(a.spent, a.budget))[0];
  const actions = [
    {
      title: safe < 0 ? "Freeze non-essential spending" : "Protect safe-to-spend",
      detail: safe < 0 ? `You are ${money(Math.abs(safe))} below safe. Pause extras until the next bill is protected.` : `You have ${money(safe)} safe-to-spend after bills. Keep this visible before purchases.`,
      icon: safe < 0 ? AlertTriangle : ShieldCheck,
      tone: safe < 0 ? "text-red-300 bg-red-500/12" : "text-emerald-300 bg-emerald-500/12",
    },
    {
      title: unpaid[0] ? `Cover ${unpaid[0].name}` : "Bills covered",
      detail: unpaid[0] ? `Next bill is ${money(unpaid[0].amount)} in ${unpaid[0].days} days.` : "No unpaid bills showing. Move a small amount to savings.",
      icon: CheckCircle2,
      tone: "text-violet-200 bg-violet-500/12",
    },
    {
      title: worst ? `Watch ${worst.name}` : "Review categories",
      detail: worst ? `${worst.name} is at ${clampPct(worst.spent, worst.budget)}% of its budget.` : "Add categories to make Penny more useful.",
      icon: Wallet,
      tone: "text-amber-200 bg-amber-500/12",
    },
  ];

  return (
    <div className="space-y-4 px-5 pb-28">
      <GlassCard className="bg-gradient-to-br from-violet-500/16 to-emerald-500/10">
        <Label>Weekly plan</Label>
        <div className="text-2xl font-black">Penny’s simple money plan</div>
        <p className="mt-2 text-sm leading-relaxed text-white/55">A calm short list for this week. Keep it practical: bills, pressure points, then income growth.</p>
      </GlassCard>

      {actions.map(({ title, detail, icon: Icon, tone }) => (
        <GlassCard key={title}>
          <div className="flex gap-3">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></div>
            <div>
              <div className="font-black">{title}</div>
              <div className="mt-1 text-sm leading-relaxed text-white/50">{detail}</div>
            </div>
          </div>
        </GlassCard>
      ))}

      <GlassCard>
        <Label>Partner summary</Label>
        <div className="space-y-3 text-sm text-white/65">
          <p><b className="text-white">Household position:</b> Income {money(data.income)}, spending {money(spent)}, unpaid bills {money(unpaidTotal)}, safe-to-spend {money(safe)}.</p>
          <p><b className="text-white">This week:</b> protect bills first, keep spending simple, and review anything that feels unclear together.</p>
        </div>
      </GlassCard>
    </div>
  );
}

function EditModal({ data, setData, onClose }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(data)));

  function save() {
    setData(draft);
    onClose();
  }
  function addCategory() {
    setDraft((d) => ({ ...d, categories: [...d.categories, { id: uid("cat"), name: "New Category", icon: "💸", budget: 100, spent: 0 }] }));
  }
  function removeCategory(id) {
    setDraft((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
  }
  function addGoal() {
    setDraft((d) => ({ ...d, goals: [...d.goals, { id: uid("goal"), label: "New Goal", icon: "🎯", target: 1000, current: 0 }] }));
  }

  const input = "w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-sm text-white outline-none";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-4 backdrop-blur-xl">
      <div className="mx-auto max-w-md space-y-4 pb-10">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-black/50 py-3 backdrop-blur-xl">
          <div><div className="text-xl font-black text-white">Edit Ledger</div><div className="text-sm text-white/40">Update figures, categories and goals.</div></div>
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 font-black text-white">✕</button>
        </div>

        <GlassCard>
          <Label>Income</Label>
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="number" value={draft.income} onChange={(e) => setDraft({ ...draft, income: Number(e.target.value) })} />
            <input className={input} type="number" value={draft.incomeTarget} onChange={(e) => setDraft({ ...draft, incomeTarget: Number(e.target.value) })} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center justify-between"><Label>Categories</Label><button onClick={addCategory} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white"><Plus className="inline h-3 w-3" /> Add</button></div>
          <div className="space-y-3">
            {draft.categories.map((c, i) => (
              <div key={c.id || i} className="rounded-3xl bg-white/5 p-3">
                <div className="mb-2 flex gap-2">
                  <input className={`${input} w-14 text-center`} value={c.icon || ""} onChange={(e) => { const cats = [...draft.categories]; cats[i] = { ...cats[i], icon: e.target.value }; setDraft({ ...draft, categories: cats }); }} />
                  <input className={input} value={c.name} onChange={(e) => { const cats = [...draft.categories]; cats[i] = { ...cats[i], name: e.target.value }; setDraft({ ...draft, categories: cats }); }} />
                  <button onClick={() => removeCategory(c.id)} className="rounded-2xl bg-red-500/15 px-3 text-red-200"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={input} type="number" value={c.budget} onChange={(e) => { const cats = [...draft.categories]; cats[i] = { ...cats[i], budget: Number(e.target.value) }; setDraft({ ...draft, categories: cats }); }} />
                  <input className={input} type="number" value={c.spent} onChange={(e) => { const cats = [...draft.categories]; cats[i] = { ...cats[i], spent: Number(e.target.value) }; setDraft({ ...draft, categories: cats }); }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center justify-between"><Label>Goals</Label><button onClick={addGoal} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white"><Plus className="inline h-3 w-3" /> Add</button></div>
          <div className="space-y-3">
            {draft.goals.map((g, i) => (
              <div key={g.id || i} className="rounded-3xl bg-white/5 p-3">
                <div className="mb-2 flex gap-2"><input className={`${input} w-14 text-center`} value={g.icon || ""} onChange={(e) => { const goals = [...draft.goals]; goals[i] = { ...goals[i], icon: e.target.value }; setDraft({ ...draft, goals }); }} /><input className={input} value={g.label} onChange={(e) => { const goals = [...draft.goals]; goals[i] = { ...goals[i], label: e.target.value }; setDraft({ ...draft, goals }); }} /></div>
                <div className="grid grid-cols-2 gap-2"><input className={input} type="number" value={g.current} onChange={(e) => { const goals = [...draft.goals]; goals[i] = { ...goals[i], current: Number(e.target.value) }; setDraft({ ...draft, goals }); }} /><input className={input} type="number" value={g.target} onChange={(e) => { const goals = [...draft.goals]; goals[i] = { ...goals[i], target: Number(e.target.value) }; setDraft({ ...draft, goals }); }} /></div>
              </div>
            ))}
          </div>
        </GlassCard>

        <button onClick={save} className="w-full rounded-3xl bg-violet-600 py-4 text-base font-black text-white shadow-xl shadow-violet-600/30 active:scale-95">Save Ledger</button>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-slate-950/80 px-3 pb-4 pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-6 gap-1 rounded-[28px] border border-white/10 bg-white/[0.06] p-2 shadow-2xl">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-2xl px-1 py-2 text-center transition active:scale-95 ${tab === id ? "bg-violet-600 text-white" : "text-white/45"}`}>
            <Icon className="mx-auto h-5 w-5" />
            <div className="mt-1 text-[10px] font-bold">{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("home");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadItem(STORAGE_KEY, DEFAULT_DATA).then((loaded) => setData({ ...DEFAULT_DATA, ...loaded }));
  }, []);
  useEffect(() => {
    if (data) saveItem(STORAGE_KEY, data);
  }, [data]);

  if (!data) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-white">Loading Ledger…</div>;
  }

  return (
    <div className="min-h-screen bg-[#080714] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.28),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.10),transparent_28%)]" />
      <main className="relative mx-auto min-h-screen max-w-md overflow-hidden border-x border-white/5 bg-slate-950/55 shadow-2xl shadow-black/60">
        <AppHeader data={data} onEdit={() => setEditing(true)} />
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
            {tab === "home" && <HomeScreen data={data} setData={setData} />}
            {tab === "budget" && <BudgetScreen data={data} />}
            {tab === "goals" && <GoalsScreen data={data} />}
            {tab === "penny" && <PennyScreen data={data} />}
            {tab === "family" && <FamilyScreen data={data} setData={setData} />}
            {tab === "plan" && <PlanScreen data={data} />}
          </motion.div>
        </AnimatePresence>
        <BottomNav tab={tab} setTab={setTab} />
      </main>
      {editing && <EditModal data={data} setData={setData} onClose={() => setEditing(false)} />}
    </div>
  );
}
