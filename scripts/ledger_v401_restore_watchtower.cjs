const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("RESTORE FAILED:", message);
  process.exit(1);
}

function addAfter(anchor, insert) {
  if (!app.includes(anchor)) fail(`Missing anchor: ${anchor}`);
  app = app.replace(anchor, `${anchor}\n\n${insert}`);
}

console.log("Restoring Watchtower + Security Team...");

// 1) Add defaults if missing.
if (!app.includes("const defaultSubscriptions")) {
  addAfter(
    'const STORAGE_KEY = "ledger_v2_state";',
    `const defaultSubscriptions = [
  { id: "streaming", name: "Streaming service", cost: 12.99, renewalDate: "2026-05-15", cancelByDate: "2026-05-12", status: "Review", category: "Entertainment" },
  { id: "music", name: "Music subscription", cost: 10.99, renewalDate: "2026-05-20", cancelByDate: "2026-05-17", status: "Keep", category: "Entertainment" },
  { id: "phone", name: "Phone contract / app bundle", cost: 28, renewalDate: "2026-06-01", cancelByDate: "2026-05-25", status: "Review", category: "Household" },
  { id: "kids-club", name: "Kids club / activity", cost: 25, renewalDate: "2026-05-28", cancelByDate: "2026-05-21", status: "Keep", category: "Family" },
  { id: "insurance-renewal", name: "Insurance renewal check", cost: 0, renewalDate: "2026-07-01", cancelByDate: "2026-06-15", status: "Renegotiate", category: "Protection" },
];

const defaultSecurityLog = [
  {
    id: "welcome-security",
    type: "Info",
    title: "Security Team online",
    message: "Local Demo Mode is active. Ledger is watching renewals, missing local data and planning gaps.",
    createdAt: new Date().toISOString(),
  },
];`
  );
}

// 2) Add default state fields if missing.
if (!app.includes("subscriptions: defaultSubscriptions")) {
  const stateAnchors = [
    "shoppingItems: defaultShoppingItems,",
    "protectedItems: defaultProtectedItems,",
    "savingsPots: defaultSavingsPots,",
    "debtPayment: 75,"
  ];

  let inserted = false;

  for (const anchor of stateAnchors) {
    if (app.includes(anchor)) {
      app = app.replace(
        anchor,
        `${anchor}
  subscriptions: defaultSubscriptions,
  securityLog: defaultSecurityLog,`
      );
      inserted = true;
      break;
    }
  }

  if (!inserted) fail("Could not insert subscriptions/securityLog into defaultState.");
}

// 3) Add Watchtower tab.
const tabsRegex = /const tabs = \[([^\]]+)\];/;
const tabsMatch = app.match(tabsRegex);
if (!tabsMatch) fail("Could not find const tabs array.");

const tabs = tabsMatch[1]
  .split(",")
  .map((x) => x.trim().replaceAll('"', "").replaceAll("'", ""))
  .filter(Boolean);

if (!tabs.includes("Watchtower")) {
  const after = tabs.includes("Shopping")
    ? tabs.indexOf("Shopping") + 1
    : tabs.includes("Protected")
      ? tabs.indexOf("Protected") + 1
      : tabs.includes("Budget")
        ? tabs.indexOf("Budget") + 1
        : 2;

  tabs.splice(after, 0, "Watchtower");

  app = app.replace(
    tabsRegex,
    `const tabs = [${tabs.map((x) => `"${x}"`).join(", ")}];`
  );
}

// 4) Add render block.
if (!app.includes('activeTab === "Watchtower"')) {
  const renderBlock = `{activeTab === "Watchtower" && (
          <WatchtowerPanel state={state} update={update} figures={figures} />
        )}
        `;

  const anchors = [
    '{activeTab === "Shopping" && (',
    '{activeTab === "Protected" && (',
    '{activeTab === "Savings" && (',
    '{activeTab === "Penny" && (',
  ];

  let inserted = false;

  for (const anchor of anchors) {
    if (app.includes(anchor)) {
      app = app.replace(anchor, renderBlock + anchor);
      inserted = true;
      break;
    }
  }

  if (!inserted) fail("Could not insert Watchtower render block.");
}

// 5) Add component before ShoppingGuardPanel.
if (!app.includes("function WatchtowerPanel(")) {
  const componentAnchor = "function ShoppingGuardPanel(";

  if (!app.includes(componentAnchor)) {
    fail("Could not find ShoppingGuardPanel component anchor.");
  }

  app = app.replace(
    componentAnchor,
    `function WatchtowerPanel({ state, update, figures }) {
  const subscriptions = getSubscriptions(state);
  const securityLog = getSecurityLog(state);
  const health = runLedgerSecurityCheck(state, figures, subscriptions);

  const totalMonthlyDrain = subscriptions.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const renewingSoon = subscriptions.filter((item) => daysUntil(item.renewalDate) <= 14);
  const reviewItems = subscriptions.filter((item) => item.status === "Review" || item.status === "Renegotiate");
  const safeAfterSubscriptions = Number(figures.safe || 0) - totalMonthlyDrain;

  const updateSubscription = (id, key, value) => {
    const next = subscriptions.map((item) =>
      item.id === id
        ? {
            ...item,
            [key]: key === "cost" ? Number(value) : value,
          }
        : item
    );

    update("subscriptions", next);
  };

  const addSecurityLog = (type, title, message) => {
    const nextLog = [
      {
        id: \`log-\${Date.now()}\`,
        type,
        title,
        message,
        createdAt: new Date().toISOString(),
      },
      ...getSecurityLog(state),
    ].slice(0, 12);

    update("securityLog", nextLog);
  };

  const runSelfRepair = () => {
    if (!Array.isArray(state.subscriptions) || state.subscriptions.length === 0) {
      update("subscriptions", defaultSubscriptions);
    }

    if (!Array.isArray(state.securityLog) || state.securityLog.length === 0) {
      update("securityLog", defaultSecurityLog);
    }

    if (typeof defaultSavingsPots !== "undefined" && (!Array.isArray(state.savingsPots) || state.savingsPots.length === 0)) {
      update("savingsPots", defaultSavingsPots);
    }

    if (typeof defaultProtectedItems !== "undefined" && (!Array.isArray(state.protectedItems) || state.protectedItems.length === 0)) {
      update("protectedItems", defaultProtectedItems);
    }

    if (typeof defaultShoppingItems !== "undefined" && (!Array.isArray(state.shoppingItems) || state.shoppingItems.length === 0)) {
      update("shoppingItems", defaultShoppingItems);
    }

    addSecurityLog(
      "Repair",
      "Self-repair check completed",
      "Ledger checked local demo data and restored missing default structures where needed."
    );
  };

  const logManualCheck = () => {
    addSecurityLog(
      health.level === "green" ? "Check" : "Warning",
      "Manual security scan",
      health.message
    );
  };

  return (
    <>
      <div className="section-title">
        <div>
          <span className="kicker">SUBSCRIPTION WATCHTOWER + SECURITY TEAM</span>
          <h2>Keep an eye on money before it disappears</h2>
          <p>
            What is happening: Ledger is watching renewals, local data health and planning gaps.
            What it means: subscriptions and broken local data are flagged before they cause problems.
            What to do next: review renewals, cancel waste, then run a security check.
          </p>
        </div>
        <div className={\`safe-pill small \${safeAfterSubscriptions < 0 ? "danger" : ""}\`}>
          <span>Safe after subs</span>
          <strong>{currency(safeAfterSubscriptions)}</strong>
        </div>
      </div>

      <div className="watchtower-hero">
        <div>
          <span className="kicker">LEDGE SECURITY TEAM</span>
          <h3>{health.title}</h3>
          <p>{health.message}</p>
        </div>
        <div className={\`watchtower-orb \${health.level}\`}>
          {health.label}
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric title="Monthly sub drain" value={currency(totalMonthlyDrain)} />
        <Metric title="Renewing soon" value={renewingSoon.length} />
        <Metric title="Needs review" value={reviewItems.length} />
        <Metric title="Security issues" value={health.issues.length} />
      </div>

      <div className="watchtower-actions">
        <button className="primary-action" onClick={runSelfRepair}>
          Run local self-repair
        </button>
        <button className="ghost-action" onClick={logManualCheck}>
          Log security check
        </button>
      </div>

      <div className="panel watchtower-advice">
        <span className="kicker">PENNY WATCHTOWER ADVICE ✨</span>
        <p>{getWatchtowerAdvice(safeAfterSubscriptions, renewingSoon, reviewItems, health)}</p>
      </div>

      {health.issues.length > 0 && (
        <div className="security-issues">
          {health.issues.map((issue) => (
            <div className="security-issue-card" key={issue}>
              <strong>{issue}</strong>
              <span>Recommended action: review or run local self-repair.</span>
            </div>
          ))}
        </div>
      )}

      <div className="watchtower-grid">
        <div className="watchtower-column">
          <div className="column-head">
            <span className="kicker">SUBSCRIPTIONS</span>
            <h3>Renewal radar</h3>
          </div>

          <div className="subscription-list">
            {subscriptions.map((item) => {
              const renewalDays = daysUntil(item.renewalDate);
              const cancelDays = daysUntil(item.cancelByDate);
              const isSoon = renewalDays <= 14;

              return (
                <div className={\`subscription-card \${isSoon ? "soon" : ""}\`} key={item.id}>
                  <div className="subscription-top">
                    <div>
                      <span className="pot-rank">{item.category}</span>
                      <h3>{item.name}</h3>
                    </div>
                    <strong>{currency(item.cost)}/mo</strong>
                  </div>

                  <div className="subscription-meta">
                    <span>Renews in {renewalDays} days</span>
                    <span>Cancel by {item.cancelByDate || "not set"}</span>
                    <span>{cancelDays <= 7 ? "Cancel window close" : "Cancel window open"}</span>
                  </div>

                  <div className="subscription-edit-grid">
                    <NumberInput
                      label="Monthly cost"
                      value={item.cost}
                      onChange={(v) => updateSubscription(item.id, "cost", v)}
                    />

                    <label className="field">
                      <span>Renewal date</span>
                      <input
                        type="date"
                        value={item.renewalDate || ""}
                        onChange={(e) => updateSubscription(item.id, "renewalDate", e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span>Cancel by</span>
                      <input
                        type="date"
                        value={item.cancelByDate || ""}
                        onChange={(e) => updateSubscription(item.id, "cancelByDate", e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span>Status</span>
                      <select
                        value={item.status || "Review"}
                        onChange={(e) => updateSubscription(item.id, "status", e.target.value)}
                      >
                        <option value="Keep">Keep</option>
                        <option value="Review">Review</option>
                        <option value="Cancel">Cancel</option>
                        <option value="Renegotiate">Renegotiate</option>
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="watchtower-column">
          <div className="column-head">
            <span className="kicker">SECURITY LOG</span>
            <h3>What Ledger is watching</h3>
          </div>

          <div className="security-log">
            {securityLog.map((entry) => (
              <div className="security-log-card" key={entry.id}>
                <div>
                  <span className="pot-rank">{entry.type}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.message}</p>
                </div>
                <small>{formatShortDate(entry.createdAt)}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function getSubscriptions(state) {
  return Array.isArray(state.subscriptions) && state.subscriptions.length
    ? state.subscriptions
    : defaultSubscriptions;
}

function getSecurityLog(state) {
  return Array.isArray(state.securityLog) && state.securityLog.length
    ? state.securityLog
    : defaultSecurityLog;
}

function daysUntil(dateValue) {
  if (!dateValue) return 999;

  const today = new Date();
  const target = new Date(dateValue);

  if (Number.isNaN(target.getTime())) return 999;

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / 86400000);
}

function runLedgerSecurityCheck(state, figures, subscriptions) {
  const issues = [];

  if (!Array.isArray(state.subscriptions) || state.subscriptions.length === 0) {
    issues.push("Subscription data missing");
  }

  if (!Array.isArray(state.securityLog) || state.securityLog.length === 0) {
    issues.push("Security log missing");
  }

  if (typeof defaultSavingsPots !== "undefined" && (!Array.isArray(state.savingsPots) || state.savingsPots.length === 0)) {
    issues.push("Savings pots missing");
  }

  if (typeof defaultProtectedItems !== "undefined" && (!Array.isArray(state.protectedItems) || state.protectedItems.length === 0)) {
    issues.push("Protected money data missing");
  }

  if (typeof defaultShoppingItems !== "undefined" && (!Array.isArray(state.shoppingItems) || state.shoppingItems.length === 0)) {
    issues.push("Shopping list data missing");
  }

  const renewingSoon = subscriptions.filter((item) => daysUntil(item.renewalDate) <= 7);

  if (renewingSoon.length > 0) {
    issues.push(\`\${renewingSoon.length} subscription renewal window close\`);
  }

  if (Number(figures.safe || 0) < 0) {
    issues.push("Safe-to-spend is negative");
  }

  if (issues.length >= 3) {
    return {
      level: "red",
      label: "ALERT",
      title: "Security Team found urgent issues",
      message: "Ledger has detected multiple problems that need attention before this month is considered safe.",
      issues,
    };
  }

  if (issues.length > 0) {
    return {
      level: "amber",
      label: "WATCH",
      title: "Security Team is watching",
      message: "Ledger found a few things to review. Nothing is connected to banks; this is local demo data only.",
      issues,
    };
  }

  return {
    level: "green",
    label: "CLEAR",
    title: "Security Team clear",
    message: "Local demo data looks healthy. No urgent renewal or planning warnings are currently showing.",
    issues,
  };
}

function getWatchtowerAdvice(safeAfterSubscriptions, renewingSoon, reviewItems, health) {
  if (health.level === "red") {
    return "Fab honesty moment: do the safety check first. Fix missing data, review renewal windows, and avoid treating this month as fully safe yet.";
  }

  if (renewingSoon.length > 0) {
    return \`Heads up, lovely. \${renewingSoon.length} subscription or renewal is close. Check whether to keep, cancel or renegotiate before it renews.\`;
  }

  if (reviewItems.length > 0) {
    return \`There are \${reviewItems.length} items marked for review. This is where quiet money leaks usually hide.\`;
  }

  if (safeAfterSubscriptions < 0) {
    return "Subscriptions are pushing the month into danger. Cancel or pause anything that is not essential.";
  }

  return "Fabulous. Renewals are visible, the Security Team is clear, and subscription spending is included before you decide what is safe.";
}

function formatShortDate(dateValue) {
  if (!dateValue) return "Now";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Now";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

${componentAnchor}`
  );
}

fs.writeFileSync(appPath, app);
console.log("Watchtower restored in App.jsx.");

// CSS restore
if (!css.includes("Ledger v4.0.1 Watchtower Restore")) {
  css += `

/* Ledger v4.0.1 Watchtower Restore */
.watchtower-hero {
  margin: 18px 0;
  padding: 24px;
  border: 1px solid rgba(127, 34, 255, 0.28);
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(127, 34, 255, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(76, 240, 166, 0.12), transparent 32%),
    rgba(255, 255, 255, 0.06);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.watchtower-hero h3 {
  margin: 8px 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.watchtower-hero p {
  margin: 0;
  color: var(--muted);
  max-width: 760px;
}

.watchtower-orb {
  min-width: 98px;
  min-height: 98px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.watchtower-orb.green {
  color: var(--green);
  background: rgba(76, 240, 166, 0.12);
  box-shadow: 0 0 34px rgba(76, 240, 166, 0.18);
}

.watchtower-orb.amber {
  color: #ffd36a;
  background: rgba(255, 211, 106, 0.12);
  box-shadow: 0 0 34px rgba(255, 211, 106, 0.16);
}

.watchtower-orb.red {
  color: #ff7a90;
  background: rgba(255, 70, 105, 0.12);
  box-shadow: 0 0 34px rgba(255, 70, 105, 0.18);
}

.watchtower-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 18px 0;
}

.watchtower-advice {
  margin: 18px 0;
  border-color: rgba(255, 208, 90, 0.28);
  background: linear-gradient(135deg, rgba(255, 208, 90, 0.1), rgba(127, 34, 255, 0.1)), var(--panel);
}

.security-issues {
  display: grid;
  gap: 12px;
  margin: 18px 0;
}

.security-issue-card {
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(255, 211, 106, 0.24);
  background: rgba(255, 211, 106, 0.08);
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: #ffe5a3;
}

.security-issue-card span {
  color: var(--muted);
}

.watchtower-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 16px;
}

.watchtower-column {
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: var(--shadow);
}

.subscription-list,
.security-log {
  display: grid;
  gap: 14px;
}

.subscription-card,
.security-log-card {
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 18px;
  background: rgba(0, 0, 0, 0.18);
}

.subscription-card.soon {
  border-color: rgba(255, 211, 106, 0.35);
  background:
    radial-gradient(circle at top right, rgba(255, 211, 106, 0.12), transparent 32%),
    rgba(0, 0, 0, 0.18);
}

.subscription-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.subscription-top h3,
.security-log-card h3 {
  margin: 10px 0 0;
  font-size: 20px;
  letter-spacing: -0.03em;
}

.subscription-top strong {
  color: var(--green);
  white-space: nowrap;
}

.subscription-meta {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 14px;
}

.subscription-edit-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.security-log-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.security-log-card p {
  color: var(--muted);
  margin: 8px 0 0;
}

.security-log-card small {
  color: var(--muted);
  white-space: nowrap;
}

@media (max-width: 1000px) {
  .watchtower-grid,
  .subscription-edit-grid {
    grid-template-columns: 1fr;
  }

  .watchtower-hero,
  .security-issue-card,
  .security-log-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log("Watchtower CSS restored.");
} else {
  console.log("Watchtower CSS already present.");
}
