const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync("src/App.backup-before-mobile-nav.jsx", app);
fs.writeFileSync("src/App.backup-before-mobile-nav.css", css);

function fail(msg) {
  console.error("PATCH STOPPED:", msg);
  process.exit(1);
}

/*
  1. Add mobile nav before hidden file input / modals / closing shell.
*/
if (!app.includes('className="mobile-nav"')) {
  const markers = [
    '<input',
    '{editOpen && (',
    '{safetyOpen &&',
  ];

  let marker = markers.find((m) => app.includes(m));

  if (!marker) {
    fail("Could not find a safe insertion point for mobile nav.");
  }

  const mobileNav = `
      <nav className="mobile-nav">
        {["Home", "Budget", "Goals", "Penny", "Plan"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "mobile-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

`;

  app = app.replace(marker, `${mobileNav}      ${marker}`);
}

/*
  2. Mark existing desktop tabs so they can hide on mobile.
*/
if (!app.includes('desktop-tabs')) {
  app = app.replace(
    /<nav className="tabs">/g,
    '<nav className="tabs desktop-tabs">'
  );
}

/*
  3. Add mobile CSS safely.
*/
if (!css.includes(".mobile-nav")) {
  css += `

/* Ledger v3.3 mobile app navigation */
.mobile-nav {
  display: none;
}

@media (max-width: 900px) {
  .ledger-shell {
    padding-bottom: 96px;
  }

  .desktop-tabs {
    display: none;
  }

  .mobile-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 100;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 8px;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 24px;
    background: rgba(14, 12, 28, 0.92);
    backdrop-filter: blur(18px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.55);
  }

  .mobile-nav button {
    border: 0;
    border-radius: 17px;
    padding: 12px 6px;
    color: rgba(255,255,255,0.62);
    background: transparent;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .mobile-nav button.mobile-active {
    color: #ffffff;
    background: linear-gradient(135deg, #7f22ff, #a855ff);
    box-shadow: 0 10px 25px rgba(127, 34, 255, 0.32);
  }

  .hero {
    gap: 16px;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-actions button {
    flex: 1;
  }

  .top-grid,
  .content-grid,
  .page-grid,
  .metric-grid,
  .metric-grid.compact,
  .input-grid,
  .family-grid {
    grid-template-columns: 1fr !important;
  }

  .decision-row,
  .section-title {
    flex-direction: column;
    align-items: stretch;
  }

  .safe-pill {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .ledger-shell {
    padding: 8px 8px 96px;
  }

  .hero,
  .decision-card,
  .penny-card,
  .panel,
  .metric-card {
    border-radius: 22px;
    padding: 18px;
  }

  .hero h1 {
    font-size: 42px;
  }

  .demo-banner {
    margin-left: 0;
    margin-right: 0;
    font-size: 13px;
  }

  .mobile-nav {
    left: 8px;
    right: 8px;
    bottom: 8px;
  }

  .mobile-nav button {
    font-size: 11px;
    padding: 11px 4px;
  }
}
`;
}

fs.writeFileSync(appPath, app);
fs.writeFileSync(cssPath, css);

console.log("Ledger mobile navigation patch applied safely.");
