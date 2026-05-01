const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(message) {
  console.error("MODULE LAUNCHER PATCH FAILED:", message);
  process.exit(1);
}

console.log("Installing always-visible module launcher...");

if (!app.includes("const priorityModules = [")) {
  const anchor = /function HomePanel\(\{ state, figures \}\) \{/;

  if (!anchor.test(app)) {
    fail("Could not find HomePanel anchor.");
  }

  app = app.replace(
    anchor,
    `function HomePanel({ state, figures, setActiveTab }) {
  const priorityModules = [
    { name: "Bills", label: "Bills Radar", detail: "Due dates + payment pressure" },
    { name: "Shopping", label: "Shopping Guard", detail: "Basket check before spending" },
    { name: "Watchtower", label: "Watchtower", detail: "Subscriptions + security team" },
    { name: "Protected", label: "Protected Money", detail: "Ring-fenced essentials" },
    { name: "Savings", label: "Family Pots", detail: "Savings pushes + targets" },
  ];`
  );
}

// Update HomePanel call to pass setActiveTab.
app = app.replaceAll(
  "<HomePanel state={state} figures={figures} />",
  "<HomePanel state={state} figures={figures} setActiveTab={setActiveTab} />"
);

// Insert launcher into HomePanel return.
if (!app.includes("module-launcher-grid")) {
  const insertAfter = `<div className="metric-grid">`;

  if (!app.includes(insertAfter)) {
    fail("Could not find HomePanel metric grid anchor.");
  }

  app = app.replace(
    insertAfter,
    `<div className="module-launcher-card">
        <div className="module-launcher-head">
          <div>
            <span className="kicker">LEDGER MODULES</span>
            <h3>Open the new tools</h3>
            <p>Quick access to the latest Decision OS builds.</p>
          </div>
        </div>

        <div className="module-launcher-grid">
          {priorityModules.map((mod) => (
            <button
              key={mod.name}
              className="module-launcher-button"
              onClick={() => setActiveTab(mod.name)}
            >
              <strong>{mod.label}</strong>
              <span>{mod.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="metric-grid">`
  );
}

fs.writeFileSync(appPath, app);
console.log("Module launcher installed in App.jsx.");

if (!css.includes("Ledger v4.0.4 Module Launcher")) {
  css += `

/* Ledger v4.0.4 Module Launcher */
.module-launcher-card {
  margin: 18px 0;
  padding: 20px;
  border-radius: 30px;
  border: 1px solid rgba(168, 85, 255, 0.28);
  background:
    radial-gradient(circle at top left, rgba(168, 85, 255, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(76, 240, 166, 0.12), transparent 36%),
    rgba(255, 255, 255, 0.06);
  box-shadow: var(--shadow);
}

.module-launcher-head h3 {
  margin: 8px 0;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.module-launcher-head p {
  margin: 0;
  color: var(--muted);
}

.module-launcher-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.module-launcher-button {
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 16px;
  color: white;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.module-launcher-button:hover {
  transform: translateY(-2px);
  border-color: rgba(76, 240, 166, 0.35);
  background: rgba(76, 240, 166, 0.08);
}

.module-launcher-button strong {
  display: block;
  font-size: 15px;
  margin-bottom: 6px;
}

.module-launcher-button span {
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 800px) {
  .module-launcher-grid {
    grid-template-columns: 1fr;
  }
}
`;
}

fs.writeFileSync(cssPath, css);
console.log("Module launcher CSS installed.");
