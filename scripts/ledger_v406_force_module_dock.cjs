const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("V4.0.6 PATCH FAILED:", message);
  process.exit(1);
}

console.log("Installing forced Command Module Dock...");

// 1) Make sure all intended tabs exist.
const desiredTabs = [
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

const tabsRegex = /const tabs = \[([^\]]+)\];/;

if (tabsRegex.test(app)) {
  app = app.replace(
    tabsRegex,
    `const tabs = [${desiredTabs.map((tab) => `"${tab}"`).join(", ")}];`
  );
} else {
  console.log("WARNING: Could not find const tabs array.");
}

// 2) Add the forced dock component if missing.
if (!app.includes("function CommandModuleDock(")) {
  const componentAnchor =
    app.includes("function HomePanel(")
      ? "function HomePanel("
      : app.includes("function BudgetPanel(")
        ? "function BudgetPanel("
        : null;

  if (!componentAnchor) {
    fail("Could not find component insertion anchor.");
  }

  app = app.replace(
    componentAnchor,
    `function CommandModuleDock({ activeTab, setActiveTab }) {
  const modules = [
    { name: "Bills", icon: "📅", label: "Bills", detail: "Payment radar" },
    { name: "Shopping", icon: "🛒", label: "Shopping", detail: "Spend guard" },
    { name: "Watchtower", icon: "🛡️", label: "Watchtower", detail: "Security team" },
    { name: "Protected", icon: "🔒", label: "Protected", detail: "Safe money" },
    { name: "Savings", icon: "🏦", label: "Savings", detail: "Family pots" },
  ];

  return (
    <div className="command-module-dock-v406">
      <div className="command-module-title-v406">
        <span className="kicker">LEDGER COMMAND MODULES</span>
        <strong>Open new tools</strong>
      </div>

      <div className="command-module-grid-v406">
        {modules.map((mod) => (
          <button
            type="button"
            key={mod.name}
            className={\`command-module-button-v406 \${activeTab === mod.name ? "active" : ""}\`}
            onClick={() => setActiveTab(mod.name)}
          >
            <span>{mod.icon}</span>
            <strong>{mod.label}</strong>
            <small>{mod.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

${componentAnchor}`
  );
}

// 3) Insert dock before the Home route if not already inserted.
if (!app.includes("<CommandModuleDock activeTab={activeTab} setActiveTab={setActiveTab} />")) {
  const routeAnchors = [
    '{activeTab === "Home" && (',
    '{activeTab === "Budget" && (',
    '{activeTab === "Shopping" && (',
  ];

  let inserted = false;

  for (const anchor of routeAnchors) {
    if (app.includes(anchor)) {
      app = app.replace(
        anchor,
        `<CommandModuleDock activeTab={activeTab} setActiveTab={setActiveTab} />

        ${anchor}`
      );
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    fail("Could not insert CommandModuleDock before route block.");
  }
}

// 4) Remove common tab slicing/hardcoded bottom nav arrays.
app = app.replaceAll("tabs.slice(0, 6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0, 5).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,5).map", "tabs.map");

app = app.replaceAll(
  '["Home", "Budget", "Goals", "Penny", "Family", "Plan"].map',
  "tabs.map"
);

app = app.replaceAll(
  "['Home', 'Budget', 'Goals', 'Penny', 'Family', 'Plan'].map",
  "tabs.map"
);

fs.writeFileSync(appPath, app);
console.log("Command Module Dock installed in App.jsx.");

// 5) Stronger CSS: force wider desktop shell and visible module dock.
if (!css.includes("Ledger v4.0.6 Force Command Module Dock")) {
  css += `

/* Ledger v4.0.6 Force Command Module Dock + Wider Shell */

/* Force the app out of narrow phone-only mode on desktop */
@media (min-width: 900px) {
  #root {
    width: 100%;
    min-height: 100vh;
    display: flex;
    justify-content: center;
  }

  #root > div {
    width: min(1180px, calc(100vw - 40px)) !important;
    max-width: 1180px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .app,
  .ledger-app,
  .app-shell,
  .phone-shell,
  .phone-frame,
  .mobile-frame,
  .app-frame,
  .shell,
  .ledger-shell,
  .app-container,
  .page,
  .screen {
    width: min(1180px, calc(100vw - 40px)) !important;
    max-width: 1180px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
}

/* Always-visible command dock */
.command-module-dock-v406 {
  margin: 16px 0 18px;
  padding: 18px;
  border-radius: 30px;
  border: 1px solid rgba(168, 85, 255, 0.3);
  background:
    radial-gradient(circle at top left, rgba(168, 85, 255, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(76, 240, 166, 0.13), transparent 36%),
    rgba(255, 255, 255, 0.065);
  box-shadow: var(--shadow);
}

.command-module-title-v406 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.command-module-title-v406 strong {
  font-size: 20px;
  letter-spacing: -0.04em;
}

.command-module-grid-v406 {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.command-module-button-v406 {
  min-height: 105px;
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 14px;
  text-align: left;
  color: white;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.035)),
    rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.command-module-button-v406:hover,
.command-module-button-v406.active {
  transform: translateY(-2px);
  border-color: rgba(76, 240, 166, 0.42);
  background:
    radial-gradient(circle at top right, rgba(76, 240, 166, 0.14), transparent 36%),
    rgba(0, 0, 0, 0.22);
}

.command-module-button-v406 span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 14px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.09);
  font-size: 18px;
}

.command-module-button-v406 strong {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.command-module-button-v406 small {
  display: block;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.3;
}

/* Make the bottom nav usable if it still remains */
.bottom-nav,
.mobile-nav,
nav.bottom-nav {
  max-width: 100%;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav button,
.mobile-nav button,
nav.bottom-nav button {
  min-width: 78px;
  flex: 0 0 auto;
}

@media (max-width: 1100px) {
  .command-module-grid-v406 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .command-module-dock-v406 {
    padding: 15px;
  }

  .command-module-title-v406 {
    align-items: flex-start;
    flex-direction: column;
  }

  .command-module-grid-v406 {
    grid-template-columns: 1fr;
  }

  .command-module-button-v406 {
    min-height: auto;
  }
}
`;
}

fs.writeFileSync(cssPath, css);
console.log("CSS installed.");
