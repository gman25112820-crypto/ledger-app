const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("LAYOUT PATCH FAILED:", message);
  process.exit(1);
}

console.log("Upgrading Ledger layout space and module boxes...");

// Make sure HomePanel receives setActiveTab.
app = app.replaceAll(
  "<HomePanel state={state} figures={figures} />",
  "<HomePanel state={state} figures={figures} setActiveTab={setActiveTab} />"
);

// If HomePanel does not accept setActiveTab yet, update its signature.
app = app.replace(
  /function HomePanel\(\{ state, figures \}\) \{/,
  "function HomePanel({ state, figures, setActiveTab }) {"
);

// Insert priority module data if missing.
if (!app.includes("const priorityModules = [")) {
  const homeAnchor = /function HomePanel\(\{ state, figures, setActiveTab \}\) \{/;

  if (!homeAnchor.test(app)) {
    fail("Could not find HomePanel signature.");
  }

  app = app.replace(
    homeAnchor,
    `function HomePanel({ state, figures, setActiveTab }) {
  const priorityModules = [
    { name: "Bills", icon: "📅", label: "Bills Radar", detail: "Due dates, paid status and payment pressure" },
    { name: "Shopping", icon: "🛒", label: "Shopping Guard", detail: "Check the basket before money leaves" },
    { name: "Watchtower", icon: "🛡️", label: "Watchtower", detail: "Subscriptions, renewals and Security Team" },
    { name: "Protected", icon: "🔒", label: "Protected Money", detail: "Ring-fence bills, food, pets and essentials" },
    { name: "Savings", icon: "🏦", label: "Family Pots", detail: "Birthdays, Christmas, school, holidays and buffers" },
  ];`
  );
}

// Insert module launcher higher up on Home if missing.
if (!app.includes("ledger-module-launcher-v405")) {
  const homeMetricAnchor = `<div className="metric-grid">`;

  if (!app.includes(homeMetricAnchor)) {
    fail("Could not find Home metric grid anchor.");
  }

  app = app.replace(
    homeMetricAnchor,
    `<div className="ledger-module-launcher-v405">
        <div className="module-launcher-copy">
          <span className="kicker">LEDGER COMMAND MODULES</span>
          <h3>Open the new tools</h3>
          <p>
            More space for the household Decision OS. Jump straight into the latest modules.
          </p>
        </div>

        <div className="module-box-grid-v405">
          {priorityModules.map((mod) => (
            <button
              type="button"
              key={mod.name}
              className="module-box-v405"
              onClick={() => setActiveTab(mod.name)}
            >
              <span className="module-box-icon">{mod.icon}</span>
              <strong>{mod.label}</strong>
              <small>{mod.detail}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="metric-grid">`
  );
}

// Ensure tabs include all current modules.
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
  console.log("Could not find tabs array. Continuing with layout CSS only.");
}

// Remove common tab slicing if present.
app = app.replaceAll("tabs.slice(0, 6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,6).map", "tabs.map");
app = app.replaceAll("tabs.slice(0, 5).map", "tabs.map");
app = app.replaceAll("tabs.slice(0,5).map", "tabs.map");

fs.writeFileSync(appPath, app);
console.log("App layout hooks updated.");

if (!css.includes("Ledger v4.0.5 Layout Space Upgrade")) {
  css += `

/* Ledger v4.0.5 Layout Space Upgrade */

/* Give the app more breathing room on desktop */
.app,
.ledger-app,
.phone-shell,
.app-shell,
main {
  max-width: 1180px;
}

/* Many earlier Ledger builds used a narrow phone-style wrapper.
   These rules safely widen common wrapper names without breaking mobile. */
.phone-frame,
.mobile-frame,
.app-frame,
.shell,
.ledger-shell,
.app-container {
  max-width: 1180px !important;
}

/* Keep the central content premium but not cramped */
@media (min-width: 900px) {
  body {
    overflow-x: hidden;
  }

  .app,
  .ledger-app,
  .phone-shell,
  .app-shell,
  .phone-frame,
  .mobile-frame,
  .app-frame,
  .shell,
  .ledger-shell,
  .app-container {
    width: min(1180px, calc(100vw - 48px)) !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .metric-grid,
  .savings-grid,
  .protected-grid,
  .watchtower-grid,
  .shopping-layout,
  .bills-layout {
    gap: 18px;
  }
}

/* New always-visible Home module launcher */
.ledger-module-launcher-v405 {
  margin: 18px 0;
  padding: 22px;
  border-radius: 32px;
  border: 1px solid rgba(168, 85, 255, 0.3);
  background:
    radial-gradient(circle at top left, rgba(168, 85, 255, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(76, 240, 166, 0.13), transparent 36%),
    rgba(255, 255, 255, 0.065);
  box-shadow: var(--shadow);
}

.module-launcher-copy h3 {
  margin: 8px 0;
  font-size: 26px;
  letter-spacing: -0.04em;
}

.module-launcher-copy p {
  margin: 0;
  color: var(--muted);
}

.module-box-grid-v405 {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.module-box-v405 {
  min-height: 132px;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 16px;
  color: white;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.035)),
    rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.module-box-v405:hover {
  transform: translateY(-2px);
  border-color: rgba(76, 240, 166, 0.38);
  background:
    radial-gradient(circle at top right, rgba(76, 240, 166, 0.12), transparent 36%),
    rgba(0, 0, 0, 0.22);
}

.module-box-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 15px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.09);
  font-size: 20px;
}

.module-box-v405 strong {
  display: block;
  margin-bottom: 7px;
  font-size: 15px;
}

.module-box-v405 small {
  display: block;
  color: var(--muted);
  line-height: 1.35;
}

/* More useful grids on wider screens */
@media (min-width: 1000px) {
  .metric-grid.compact {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .savings-grid,
  .protected-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Tablet */
@media (max-width: 1100px) {
  .module-box-grid-v405 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Mobile */
@media (max-width: 760px) {
  .ledger-module-launcher-v405 {
    padding: 18px;
  }

  .module-box-grid-v405 {
    grid-template-columns: 1fr;
  }

  .module-box-v405 {
    min-height: auto;
  }
}

/* Make bottom nav usable when many modules exist */
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

.bottom-nav::-webkit-scrollbar,
.mobile-nav::-webkit-scrollbar {
  height: 4px;
}

.bottom-nav::-webkit-scrollbar-thumb,
.mobile-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
}
`;
}

fs.writeFileSync(cssPath, css);
console.log("CSS layout space upgrade installed.");
