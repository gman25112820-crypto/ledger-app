const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("V4.0.7 PATCH FAILED:", message);
  process.exit(1);
}

console.log("Forcing full Ledger navigation...");

const fullTabs = [
  "Home",
  "Budget",
  "Bills",
  "Shopping",
  "Watchtower",
  "Protected",
  "Goals",
  "Savings",
  "Penny",
  "Family",
  "Plan",
];

const tabIcons = {
  Home: "⌂",
  Budget: "▣",
  Bills: "📅",
  Shopping: "🛒",
  Watchtower: "🛡",
  Protected: "🔒",
  Goals: "◎",
  Savings: "🏦",
  Penny: "○",
  Family: "♚",
  Plan: "✓",
};

// 1. Force main tabs array.
const tabsRegex = /const tabs = \[[^\]]+\];/;

if (tabsRegex.test(app)) {
  app = app.replace(
    tabsRegex,
    `const tabs = ${JSON.stringify(fullTabs)};`
  );
} else {
  console.log("WARNING: Could not find main tabs array.");
}

// 2. Add icon helper if missing.
if (!app.includes("function getLedgerTabIcon(")) {
  const helper = `
function getLedgerTabIcon(tab) {
  const icons = ${JSON.stringify(tabIcons, null, 2)};
  return icons[tab] || "•";
}
`;

  const firstPanel = app.indexOf("function HomePanel(");

  if (firstPanel !== -1) {
    app = app.slice(0, firstPanel) + helper + "\n" + app.slice(firstPanel);
  } else {
    app += helper;
  }
}

// 3. Replace the visible hardcoded bottom nav block if the old six labels exist.
const oldLabels = ["Home", "Budget", "Goals", "Penny", "Family", "Plan"];
const hasOldBottomNav = oldLabels.every((label) => app.includes(label));

console.log("Old labels present:", hasOldBottomNav);

// Replace common hardcoded inline old nav maps.
app = app.replaceAll(
  '["Home", "Budget", "Goals", "Penny", "Family", "Plan"].map',
  "tabs.map"
);

app = app.replaceAll(
  "['Home', 'Budget', 'Goals', 'Penny', 'Family', 'Plan'].map",
  "tabs.map"
);

app = app.replaceAll("tabs.slice(0, 6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0, 5).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,5).map", "tabs.map");

// 4. If the app has a bottom nav class, add a second forced nav before it.
if (!app.includes("forced-ledger-nav-v407")) {
  const forcedNav = `
      <div className="forced-ledger-nav-v407">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={\`forced-ledger-nav-button-v407 \${activeTab === tab ? "active" : ""}\`}
            onClick={() => setActiveTab(tab)}
          >
            <span>{getLedgerTabIcon(tab)}</span>
            <strong>{tab}</strong>
          </button>
        ))}
      </div>
`;

  const anchors = [
    '<nav className="bottom-nav"',
    '<div className="bottom-nav"',
    '<nav className="mobile-nav"',
    '<div className="mobile-nav"',
  ];

  let inserted = false;

  for (const anchor of anchors) {
    if (app.includes(anchor)) {
      app = app.replace(anchor, forcedNav + "\n      " + anchor);
      inserted = true;
      console.log("Inserted forced nav before:", anchor);
      break;
    }
  }

  if (!inserted) {
    // Fallback: insert before Home route.
    const routeAnchor = '{activeTab === "Home" && (';
    if (app.includes(routeAnchor)) {
      app = app.replace(routeAnchor, forcedNav + "\n        " + routeAnchor);
      inserted = true;
      console.log("Inserted forced nav before Home route.");
    }
  }

  if (!inserted) {
    fail("Could not find a safe place to insert forced nav.");
  }
}

fs.writeFileSync(appPath, app);
console.log("Forced bottom navigation installed.");

// 5. CSS.
if (!css.includes("Ledger v4.0.7 Force Full Bottom Navigation")) {
  css += `

/* Ledger v4.0.7 Force Full Bottom Navigation */
.forced-ledger-nav-v407 {
  position: sticky;
  top: 8px;
  z-index: 80;
  margin: 12px 0 16px;
  padding: 10px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  border: 1px solid rgba(168, 85, 255, 0.32);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(168, 85, 255, 0.22), transparent 36%),
    rgba(10, 8, 24, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(18px);
  scrollbar-width: thin;
}

.forced-ledger-nav-v407::-webkit-scrollbar {
  height: 4px;
}

.forced-ledger-nav-v407::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.24);
  border-radius: 999px;
}

.forced-ledger-nav-button-v407 {
  min-width: 92px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 18px;
  padding: 10px 8px;
  color: rgba(255, 255, 255, 0.74);
  background: rgba(255, 255, 255, 0.045);
  cursor: pointer;
  display: grid;
  gap: 5px;
  place-items: center;
  font-weight: 900;
}

.forced-ledger-nav-button-v407 span {
  font-size: 17px;
  line-height: 1;
}

.forced-ledger-nav-button-v407 strong {
  font-size: 11px;
}

.forced-ledger-nav-button-v407.active {
  color: white;
  border-color: rgba(139, 92, 246, 0.7);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.7));
  box-shadow: 0 12px 28px rgba(139, 92, 246, 0.3);
}

/* Give desktop more usable width */
@media (min-width: 900px) {
  #root {
    display: flex;
    justify-content: center;
  }

  #root > div {
    width: min(1120px, calc(100vw - 48px)) !important;
    max-width: 1120px !important;
  }
}
`;
}

fs.writeFileSync(cssPath, css);
console.log("Navigation CSS installed.");
