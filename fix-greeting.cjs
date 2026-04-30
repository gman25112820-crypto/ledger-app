const fs = require("fs");

const path = "src/App.jsx";
let s = fs.readFileSync(path, "utf8");

// remove ALL existing getGreeting functions
s = s.replace(/function getGreeting\(\) \{[\s\S]*?return ["']Good evening["'];\s*\}/g, "");

// add ONE clean getGreeting after imports
const greeting = `
function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
`;

const imports = [...s.matchAll(/^import .*;$/gm)];
const lastImport = imports[imports.length - 1];

if (lastImport) {
  const insertAt = lastImport.index + lastImport[0].length;
  s = s.slice(0, insertAt) + "\n" + greeting + s.slice(insertAt);
}

// replace fixed greeting text
s = s.replace(/Hey Gareth/g, "{getGreeting()}");

fs.writeFileSync(path, s);
