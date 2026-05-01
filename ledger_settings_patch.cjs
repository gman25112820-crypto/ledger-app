const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync("src/App.backup-before-settings.jsx", app);
fs.writeFileSync("src/App.backup-before-settings.css", css);

function fail(msg) {
  console.error("PATCH STOPPED:", msg);
  process.exit(1);
}

// 1. Ensure useRef is imported
if (app.includes('import React, { useEffect, useMemo, useState } from "react";')) {
  app = app.replace(
    'import React, { useEffect, useMemo, useState } from "react";',
    'import React, { useEffect, useMemo, useRef, useState } from "react";'
  );
} else if (app.includes('import React, { useMemo, useState } from "react";')) {
  app = app.replace(
    'import React, { useMemo, useState } from "react";',
    'import React, { useMemo, useRef, useState } from "react";'
  );
} else if (!app.includes("useRef")) {
  fail("Could not safely update React import.");
}

// 2. Add file input ref near state declarations
if (!app.includes("const fileInputRef = useRef(null);")) {
  const marker = 'const [safetyOpen, setSafetyOpen] = useState(false);';
  if (!app.includes(marker)) fail("Could not find safetyOpen state.");
  app = app.replace(marker, `${marker}\n  const fileInputRef = useRef(null);`);
}

// 3. Add export/import tools after resetDemo function or before tabs
if (!app.includes("const exportLedgerData = () =>")) {
  const marker = 'const tabs = ["Home", "Budget", "Goals", "Penny", "Family", "Plan"];';
  if (!app.includes(marker)) fail("Could not find tabs array.");

  const tools = `
  const exportLedgerData = () => {
    const payload = {
      app: "Ledger",
      mode: "Local Demo",
      exportedAt: new Date().toISOString(),
      data: state,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger-local-demo-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLedgerData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importedData = parsed.data || parsed;
      setState((prev) => ({ ...prev, ...importedData }));
      setActiveTab("Settings");
    } catch {
      alert("Import failed. Please use a Ledger JSON export file.");
    } finally {
      event.target.value = "";
    }
  };

`;
  app = app.replace(marker, `${tools}  ${marker.replace("Plan", "Plan\", \"Settings")}`);
}

// 4. Add hidden file input before modals
if (!app.includes('className="hidden-file-input"')) {
  const marker = `{editOpen && (`;
  if (!app.includes(marker)) fail("Could not find modal insertion point.");

  const input = `
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden-file-input"
        onChange={importLedgerData}
      />

      `;
  app = app.replace(marker, `${input}${marker}`);
}

// 5. Add Settings render section after Plan render
if (!app.includes('activeTab === "Settings"')) {
  const marker = `          {activeTab === "Plan" && (
            <PlanPanel state={state} figures={figures} resetDemo={resetDemo} />
          )}`;
  if (!app.includes(marker)) fail("Could not find PlanPanel render block.");

  const replacement = `${marker}

          {activeTab === "Settings" && (
            <SettingsPanel
              exportLedgerData={exportLedgerData}
              fileInputRef={fileInputRef}
              resetDemo={resetDemo}
            />
          )}`;

  app = app.replace(marker, replacement);
}

// 6. Add SettingsPanel component before EditModal
if (!app.includes("function SettingsPanel(")) {
  const marker = "function EditModal";
  if (!app.includes(marker)) fail("Could not find EditModal component.");

  const component = `
function SettingsPanel({ exportLedgerData, fileInputRef, resetDemo }) {
  return (
    <section className="content-grid">
      <div className="panel">
        <div className="kicker">SETTINGS</div>
        <h2>Local data controls</h2>
        <p>
          Ledger is currently local-first. Export your demo data before clearing
          your browser or testing on another device.
        </p>

        <div className="settings-actions">
          <button className="primary-btn" onClick={exportLedgerData}>
            Export Ledger data
          </button>
          <button className="ghost-btn" onClick={() => fileInputRef.current?.click()}>
            Import Ledger data
          </button>
          <button className="danger-btn" onClick={resetDemo}>
            Reset demo data
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="kicker">NEXT LIVE STEP</div>
        <h2>Accounts and cloud sync</h2>
        <p>
          To become fully live, Ledger needs protected user accounts, a cloud
          database, shared family access and then a real Penny AI backend.
        </p>
      </div>
    </section>
  );
}

`;
  app = app.replace(marker, `${component}${marker}`);
}

// 7. CSS additions
if (!css.includes(".settings-actions")) {
  css += `

.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.hidden-file-input {
  display: none;
}

@media (max-width: 900px) {
  .settings-actions {
    flex-direction: column;
  }

  .settings-actions button {
    width: 100%;
  }
}
`;
}

fs.writeFileSync(appPath, app);
fs.writeFileSync(cssPath, css);

console.log("Ledger Settings patch applied safely.");
