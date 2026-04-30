import React, { useState } from "react";

/* ---------- SIMPLE HELPERS ---------- */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getTeamVoice(type, data = {}) {
  const { safeToSpend = 0, income = 0, spent = 0 } = data;

  const voices = {
    ledge: "Your position is your position. Stay sharp.",

    penny:
      safeToSpend < 0
        ? "You’re over your safe-to-spend — let’s rein it in, fab and steady ✨"
        : "You’re doing fab — keep going ✨",

    eddie: `Income £${income} vs spent £${spent}`,

    teds:
      safeToSpend < 0
        ? "⚠️ Overspending detected. Pause non-essential spending."
        : "All stable. No alerts.",
  };

  return voices[type] || "";
}

function getDecision(data = {}) {
  const { safeToSpend = 0, income = 0, spent = 0 } = data;

  let score = 100;
  if (safeToSpend < 0) score -= 40;
  if (spent > income) score -= 30;

  if (score < 40) {
    return {
      score,
      leader: "Teds",
      icon: "🔴",
      title: "High pressure",
      message: "Pause non-essential spending and protect bills.",
      action: "Stop extra spending today.",
    };
  }

  if (score < 70) {
    return {
      score,
      leader: "Penny",
      icon: "🟠",
      title: "Careful mode",
      message: "Tight but manageable.",
      action: "Reduce spending until payday.",
    };
  }

  return {
    score,
    leader: "Ledge",
    icon: "🟢",
    title: "Stable",
    message: "You’re in control.",
    action: "Keep building forward.",
  };
}

/* ---------- MAIN APP ---------- */

export default function App() {
  const [tab, setTab] = useState("home");

  const data = {
    income: 1200,
    spent: 1925,
    safeToSpend: -725,
  };

  const decision = getDecision(data);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", color: "white", background: "#0b0f1f", minHeight: "100vh" }}>
      
      <h1>{getGreeting()}</h1>

      <p>Ledge: {decision.message}</p>

      {tab === "home" && (
        <>
          <h2>{decision.icon} {decision.title}</h2>
          <p>Score: {decision.score}</p>
          <p>Leader: {decision.leader}</p>
          <p><strong>Action:</strong> {decision.action}</p>

          <hr />

          <p>Penny: {getTeamVoice("penny", data)}</p>
          <p>Eddie: {getTeamVoice("eddie", data)}</p>
          <p>Teds: {getTeamVoice("teds", data)}</p>
        </>
      )}

      {tab === "family" && (
        <>
          <h2>Family Learning</h2>
          <p>Interactive kids system will expand here.</p>
        </>
      )}

      <hr />

      <button onClick={() => setTab("home")}>Home</button>
      <button onClick={() => setTab("family")}>Family</button>
    </div>
  );
}
