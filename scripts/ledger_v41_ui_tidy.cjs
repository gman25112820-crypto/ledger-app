const fs = require("fs");

const cssPath = "src/App.css";
let css = fs.readFileSync(cssPath, "utf8");

console.log("Installing Ledger v4.1 tidy redesign CSS...");

if (!css.includes("Ledger v4.1 UI Tidy Pass")) {
  css += `

/* Ledger v4.1 UI Tidy Pass + Premium Command Centre Redesign */

/* Overall shell polish */
body {
  background:
    radial-gradient(circle at top left, rgba(139, 92, 246, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 28%),
    #05030d;
}

#root {
  min-height: 100vh;
}

/* Widen and centre the product shell */
@media (min-width: 900px) {
  #root > div {
    width: min(1240px, calc(100vw - 44px)) !important;
    max-width: 1240px !important;
    margin: 0 auto !important;
  }
}

/* Cleaner card rhythm */
.panel,
.card,
.metric-card,
.section-card,
.ledger-module-launcher-v405,
.command-module-dock-v406,
.forced-ledger-nav-v407,
.bills-radar-card,
.shopping-decision-card,
.watchtower-hero,
.protected-status-card,
.saving-pot-card,
.protected-item-card,
.shopping-list-panel,
.shopping-side-panel,
.bills-list-panel,
.bills-side-panel,
.watchtower-column {
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.28) !important;
}

/* Hero section: less bulky, more premium */
.hero,
.header,
.app-header {
  border-radius: 34px !important;
}

/* Safety banner cleaner */
.safety-banner,
.demo-banner,
.local-demo-banner {
  border-radius: 20px !important;
  padding: 14px 18px !important;
  letter-spacing: 0.01em;
}

/* Main nav: make it the primary navigation */
.forced-ledger-nav-v407 {
  position: relative !important;
  top: auto !important;
  margin: 18px 0 20px !important;
  padding: 12px !important;
  display: grid !important;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px !important;
  overflow: visible !important;
  border-radius: 28px !important;
  background:
    linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035)),
    rgba(14, 12, 28, 0.92) !important;
}

.forced-ledger-nav-button-v407 {
  min-width: 0 !important;
  min-height: 54px !important;
  padding: 11px 10px !important;
  border-radius: 18px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 8px !important;
}

.forced-ledger-nav-button-v407 span {
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  font-size: 16px !important;
}

.forced-ledger-nav-button-v407 strong {
  font-size: 13px !important;
}

/* Hide the old bottom nav on wider screens because the new nav now does the job */
@media (min-width: 900px) {
  .bottom-nav,
  .mobile-nav,
  nav.bottom-nav {
    display: none !important;
  }
}

/* On small screens keep the nav scrollable */
@media (max-width: 899px) {
  .forced-ledger-nav-v407 {
    display: flex !important;
    overflow-x: auto !important;
    position: sticky !important;
    top: 8px !important;
  }

  .forced-ledger-nav-button-v407 {
    min-width: 92px !important;
    flex: 0 0 auto !important;
    display: grid !important;
  }
}

/* Command module area: compact and polished */
.command-module-dock-v406,
.ledger-module-launcher-v405 {
  margin: 18px 0 22px !important;
  padding: 22px !important;
  border-radius: 34px !important;
  background:
    radial-gradient(circle at top left, rgba(168, 85, 247, 0.18), transparent 30%),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.13), transparent 34%),
    rgba(255, 255, 255, 0.055) !important;
}

.command-module-title-v406,
.module-launcher-copy {
  margin-bottom: 16px !important;
}

.command-module-title-v406 strong,
.module-launcher-copy h3 {
  font-size: 22px !important;
}

/* Make module boxes less huge */
.command-module-grid-v406,
.module-box-grid-v405 {
  grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  gap: 12px !important;
}

.command-module-button-v406,
.module-box-v405 {
  min-height: 94px !important;
  padding: 14px !important;
  border-radius: 22px !important;
}

.command-module-button-v406 span,
.module-box-icon {
  width: 32px !important;
  height: 32px !important;
  border-radius: 13px !important;
  margin-bottom: 8px !important;
}

.command-module-button-v406 strong,
.module-box-v405 strong {
  font-size: 14px !important;
}

.command-module-button-v406 small,
.module-box-v405 small {
  font-size: 12px !important;
}

/* Better desktop grids */
@media (min-width: 1050px) {
  .metric-grid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 18px !important;
  }

  .metric-grid.compact {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  }

  .home-grid,
  .dashboard-grid {
    display: grid !important;
    grid-template-columns: 1.2fr 0.8fr !important;
    gap: 20px !important;
  }
}

/* Decision engine + Penny cards should read as one command layer */
.decision-engine,
.penny-card,
.team-insight,
.goal-progress {
  border-radius: 30px !important;
}

/* Make big money figures consistent */
.metric-card strong,
.metric-card h3,
.safe-pill strong {
  letter-spacing: -0.04em;
}

/* Improve module pages */
.savings-grid,
.protected-grid,
.watchtower-grid,
.shopping-layout,
.bills-layout {
  gap: 18px !important;
}

@media (min-width: 1000px) {
  .savings-grid,
  .protected-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .watchtower-grid,
  .shopping-layout,
  .bills-layout {
    grid-template-columns: 1.25fr 0.85fr !important;
  }
}

/* Tablet layout */
@media (max-width: 1100px) {
  .forced-ledger-nav-v407 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .command-module-grid-v406,
  .module-box-grid-v405 {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

/* Mobile layout */
@media (max-width: 760px) {
  #root > div {
    width: 100% !important;
  }

  .command-module-grid-v406,
  .module-box-grid-v405,
  .metric-grid,
  .metric-grid.compact,
  .savings-grid,
  .protected-grid,
  .watchtower-grid,
  .shopping-layout,
  .bills-layout {
    grid-template-columns: 1fr !important;
  }

  .command-module-dock-v406,
  .ledger-module-launcher-v405 {
    padding: 16px !important;
    border-radius: 26px !important;
  }
}

/* Reduce duplicate feeling if both command launchers exist */
.ledger-module-launcher-v405 + .metric-grid {
  margin-top: 18px;
}

/* General text polish */
.kicker {
  letter-spacing: 0.18em !important;
}

button {
  font-family: inherit;
}
`;
}

fs.writeFileSync(cssPath, css);
console.log("Ledger v4.1 tidy redesign CSS installed.");
