const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function fail(msg) {
  console.error("FAILED:", msg);
  process.exit(1);
}

console.log("Checking current app markers...");

const required = [
  ["Shopping tab", '"Shopping"'],
  ["Shopping component", "function ShoppingGuardPanel"],
  ["Watchtower tab", '"Watchtower"'],
  ["Watchtower component", "function WatchtowerPanel"],
];

for (const [label, marker] of required) {
  console.log(`${app.includes(marker) ? "" : ""} ${label}`);
}

// Fix likely name conflict: old budget uses state.subscriptions as a number.
// Watchtower should use subscriptionItems, not subscriptions.
if (app.includes("subscriptions: defaultSubscriptions")) {
  app = app.replaceAll("subscriptions: defaultSubscriptions", "subscriptionItems: defaultSubscriptions");
}

app = app.replaceAll("state.subscriptions) || state.subscriptions.length", "state.subscriptionItems) || state.subscriptionItems.length");
app = app.replaceAll("state.subscriptions", "state.subscriptionItems");
app = app.replaceAll('update("subscriptions"', 'update("subscriptionItems"');

if (app.includes("const essentials = state.unpaidBills + state.weeklyFood + state.fuelTravel + state.subscriptionItems + state.debtPayment;")) {
  app = app.replace(
    "const essentials = state.unpaidBills + state.weeklyFood + state.fuelTravel + state.subscriptionItems + state.debtPayment;",
    "const essentials = Number(state.unpaidBills || 0) + Number(state.weeklyFood || 0) + Number(state.fuelTravel || 0) + Number(state.subscriptions || 0) + Number(state.debtPayment || 0);"
  );
}

// Make sure budget subscription number stays numeric.
if (!app.includes("subscriptionItems: defaultSubscriptions") && app.includes("defaultSubscriptions")) {
  const anchors = [
    "shoppingItems: defaultShoppingItems,",
    "protectedItems: defaultProtectedItems,",
    "savingsPots: defaultSavingsPots,"
  ];

  let inserted = false;

  for (const anchor of anchors) {
    if (app.includes(anchor)) {
      app = app.replace(anchor, `${anchor}
  subscriptionItems: defaultSubscriptions,`);
      inserted = true;
      break;
    }
  }

  if (!inserted) console.log("Could not insert subscriptionItems, but continuing.");
}

// Add a small build stamp so we can see if the deployed app is latest.
if (!app.includes("LEDGER_BUILD_STAMP")) {
  app = app.replace(
    'const STORAGE_KEY = "ledger_v2_state";',
    `const STORAGE_KEY = "ledger_v2_state";
const LEDGER_BUILD_STAMP = "v4.0.2-runtime-visible-${Date.now()}";`
  );
}

if (!app.includes("{LEDGER_BUILD_STAMP}")) {
  app = app.replace(
    "Local Demo Mode  Data stays on this device  No bank connection",
    "Local Demo Mode  Data stays on this device  No bank connection  {LEDGER_BUILD_STAMP}"
  );
}

// Add emergency visual fallback CSS.
if (!css.includes("Ledger runtime visibility repair")) {
  css += `

/* Ledger runtime visibility repair */
body {
  min-height: 100vh;
  background: #130727;
}

#root {
  min-height: 100vh;
}
`;
}

fs.writeFileSync(appPath, app);
fs.writeFileSync(cssPath, css);

console.log("Runtime visibility repair applied.");
