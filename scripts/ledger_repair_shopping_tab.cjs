const fs = require("fs");

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

function fail(message) {
  console.error("REPAIR FAILED:", message);
  process.exit(1);
}

function has(text) {
  return app.includes(text);
}

console.log("Checking Shopping Guard install...");

if (!has("function ShoppingGuardPanel(")) {
  fail("ShoppingGuardPanel component is not in App.jsx. The v4.0 patch did not install properly. Re-run the full v4.0 patch first.");
}

// 1) Force Shopping into the tabs array.
const tabsRegex = /const tabs = \[([^\]]+)\];/;
const tabsMatch = app.match(tabsRegex);

if (!tabsMatch) {
  fail("Could not find const tabs array.");
}

const tabs = tabsMatch[1]
  .split(",")
  .map((x) => x.trim().replaceAll('"', "").replaceAll("'", ""))
  .filter(Boolean);

if (!tabs.includes("Shopping")) {
  const insertAfter = tabs.includes("Watchtower")
    ? tabs.indexOf("Watchtower") + 1
    : tabs.includes("Protected")
      ? tabs.indexOf("Protected") + 1
      : tabs.includes("Budget")
        ? tabs.indexOf("Budget") + 1
        : 2;

  tabs.splice(insertAfter, 0, "Shopping");

  app = app.replace(
    tabsRegex,
    `const tabs = [${tabs.map((x) => `"${x}"`).join(", ")}];`
  );

  console.log("Added Shopping to tabs array.");
} else {
  console.log("Shopping already exists in tabs array.");
}

// 2) Force Shopping render block into the main tab rendering area.
if (!has('activeTab === "Shopping"')) {
  const renderBlock = `{activeTab === "Shopping" && (
          <ShoppingGuardPanel state={state} update={update} figures={figures} />
        )}
        `;

  const anchors = [
    '{activeTab === "Watchtower" && (',
    '{activeTab === "Protected" && (',
    '{activeTab === "Savings" && (',
    '{activeTab === "Penny" && (',
    '{activeTab === "Family" && (',
    '{activeTab === "Plan" && (',
  ];

  let inserted = false;

  for (const anchor of anchors) {
    if (has(anchor)) {
      app = app.replace(anchor, renderBlock + anchor);
      inserted = true;
      console.log(`Inserted Shopping render block before ${anchor}`);
      break;
    }
  }

  if (!inserted) {
    fail("Could not find a safe tab render anchor.");
  }
} else {
  console.log("Shopping render block already exists.");
}

// 3) Add a visible fallback marker near the app if tab exists but CSS hides it.
// No functional change, just ensures React can render the tab label normally.
fs.writeFileSync(appPath, app);

console.log("Shopping tab repair complete.");
