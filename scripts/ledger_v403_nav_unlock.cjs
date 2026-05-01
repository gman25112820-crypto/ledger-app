const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("NAV PATCH FAILED:", message);
  process.exit(1);
}

console.log("Unlocking Ledger navigation...");

const desiredTabs = [
  "Home",
  "Budget",
  "Shopping",
  "Watchtower",
  "Protected",
  "Goals",
  "Savings",
  "Penny",
  "Family",
  "Plan",
];

const tabsRegex = /const tabs = \[([^\]]+)\];/;

if (!tabsRegex.test(app)) {
  fail("Could not find const tabs array.");
}

app = app.replace(
  tabsRegex,
  `const tabs = [${desiredTabs.map((tab) => `"${tab}"`).join(", ")}];`
);

// Replace hardcoded bottom nav labels if present.
const bottomNavPatterns = [
  /const bottomTabs = \[[^\]]+\];/,
  /const mobileTabs = \[[^\]]+\];/,
  /const navTabs = \[[^\]]+\];/,
];

for (const pattern of bottomNavPatterns) {
  if (pattern.test(app)) {
    app = app.replace(
      pattern,
      `const bottomTabs = tabs;`
    );
  }
}

// If bottom nav maps a hardcoded slice, remove the slice.
app = app.replaceAll("tabs.slice(0, 6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0, 5).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,5).map", "tabs.map");

// If old bottom nav uses explicit array inline, replace the common old one.
app = app.replaceAll(
  '["Home", "Budget", "Goals", "Penny", "Family", "Plan"].map',
  "tabs.map"
);

app = app.replaceAll(
  "['Home', 'Budget', 'Goals', 'Penny', 'Family', 'Plan'].map",
  "tabs.map"
);

// Add build stamp if missing.
if (!app.includes("LEDGER_NAV_UNLOCK_STAMP")) {
  app = app.replace(
    'const STORAGE_KEY = "ledger_v2_state";',
    `const STORAGE_KEY = "ledger_v2_state";
const LEDGER_NAV_UNLOCK_STAMP = "nav-unlocked-v4.0.3";`
  );
}

fs.writeFileSync(appPath, app);
console.log("Navigation routes updated.");

// CSS: make bottom nav horizontally scrollable instead of hiding tabs.
if (!css.includes("Ledger v4.0.3 Navigation Unlock")) {
  css += `

/* Ledger v4.0.3 Navigation Unlock */
.bottom-nav,
.mobile-nav,
nav.bottom-nav {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav::-webkit-scrollbar,
.mobile-nav::-webkit-scrollbar {
  height: 4px;
}

.bottom-nav::-webkit-scrollbar-thumb,
.mobile-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
}

.bottom-nav button,
.mobile-nav button,
nav.bottom-nav button {
  min-width: 78px;
  flex: 0 0 auto;
}

.tabs,
.tab-row,
.nav-tabs {
  flex-wrap: wrap;
  gap: 8px;
}

.tabs button,
.tab-row button,
.nav-tabs button {
  white-space: nowrap;
}
`;
}

fs.writeFileSync(cssPath, css);
console.log("Navigation CSS updated.");
