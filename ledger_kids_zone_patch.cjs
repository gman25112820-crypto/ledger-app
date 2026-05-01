const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync("src/App.backup-before-kids-zone.jsx", app);
fs.writeFileSync("src/App.backup-before-kids-zone.css", css);

function fail(msg) {
  console.error("PATCH STOPPED:", msg);
  process.exit(1);
}

/*
  1. Add kids game state to defaultState.
*/
if (!app.includes("kidsCoins:")) {
  const marker = "kidsStars:";
  if (!app.includes(marker)) fail("Could not find kidsStars in defaultState.");

  app = app.replace(
    /kidsStars:\s*([0-9]+),/,
    `kidsStars: $1,
  kidsCoins: 10,
  kidsSaved: 4,
  kidsSpent: 3,
  kidsShared: 3,
  kidsGoalName: "Bike fund",
  kidsGoalTarget: 30,
  kidsGoalSaved: 8,
  kidsMessage: "Fab start. Try saving a few coins before spending.",`
  );
}

/*
  2. Add kids action handler before resetDemo.
*/
if (!app.includes("const playKidsChoice = (choice) =>")) {
  const marker = "const resetDemo = () =>";
  if (!app.includes(marker)) fail("Could not find resetDemo function.");

  const handler = `
  const playKidsChoice = (choice) => {
    setState((prev) => {
      const coins = Number(prev.kidsCoins || 0);
      if (coins <= 0) {
        return {
          ...prev,
          kidsMessage: "No coins left for this round. Ask a grown-up to reset the game.",
        };
      }

      const next = { ...prev, kidsCoins: coins - 1 };

      if (choice === "spend") {
        next.kidsSpent = Number(prev.kidsSpent || 0) + 1;
        next.kidsMessage = "Nice choice. Spending is okay when we plan it.";
      }

      if (choice === "save") {
        next.kidsSaved = Number(prev.kidsSaved || 0) + 1;
        next.kidsGoalSaved = Number(prev.kidsGoalSaved || 0) + 1;
        next.kidsStars = Number(prev.kidsStars || 0) + 2;
        next.kidsMessage = "Fabulous saving. Future you will be very pleased.";
      }

      if (choice === "share") {
        next.kidsShared = Number(prev.kidsShared || 0) + 1;
        next.kidsStars = Number(prev.kidsStars || 0) + 1;
        next.kidsMessage = "That was kind. Sharing is part of good money choices.";
      }

      return next;
    });
  };

  const resetKidsGame = () => {
    setState((prev) => ({
      ...prev,
      kidsCoins: 10,
      kidsSaved: 0,
      kidsSpent: 0,
      kidsShared: 0,
      kidsGoalSaved: 0,
      kidsStars: Number(prev.kidsStars || 0),
      kidsMessage: "New round started. Try spend, save and share.",
    }));
  };

`;
  app = app.replace(marker, `${handler}  ${marker}`);
}

/*
  3. Pass kids handlers into FamilyPanel.
*/
app = app.replace(
  /<FamilyPanel state=\{state\} update=\{update\} \/>/g,
  `<FamilyPanel
              state={state}
              update={update}
              playKidsChoice={playKidsChoice}
              resetKidsGame={resetKidsGame}
            />`
);

/*
  4. Upgrade FamilyPanel signature.
*/
app = app.replace(
  /function FamilyPanel\(\{ state, update \}\)/g,
  `function FamilyPanel({ state, update, playKidsChoice, resetKidsGame })`
);

/*
  5. Insert Kids Money Zone inside FamilyPanel.
*/
if (!app.includes("KIDS MONEY ZONE")) {
  const marker = `<div className="input-grid">
          <NumberInput`;

  if (!app.includes(marker)) fail("Could not find FamilyPanel insertion point.");

  const kidsZone = `
        <div className="kids-zone">
          <div className="section-title">
            <div>
              <div className="kicker">KIDS MONEY ZONE</div>
              <h2>Spend · Save · Share</h2>
            </div>
            <div className="safe-pill small">
              <span>Coins</span>
              <strong>{state.kidsCoins ?? 10}</strong>
            </div>
          </div>

          <div className="kids-game-grid">
            <button className="kids-choice spend" onClick={() => playKidsChoice("spend")}>
              <span>Spend</span>
              <strong>{state.kidsSpent ?? 0}</strong>
              <small>Fun now</small>
            </button>

            <button className="kids-choice save" onClick={() => playKidsChoice("save")}>
              <span>Save</span>
              <strong>{state.kidsSaved ?? 0}</strong>
              <small>Future goal</small>
            </button>

            <button className="kids-choice share" onClick={() => playKidsChoice("share")}>
              <span>Share</span>
              <strong>{state.kidsShared ?? 0}</strong>
              <small>Kindness pot</small>
            </button>
          </div>

          <div className="goal-jar">
            <div className="goal-jar-head">
              <strong>{state.kidsGoalName || "Goal jar"}</strong>
              <span>
                {state.kidsGoalSaved ?? 0}/{state.kidsGoalTarget ?? 30} coins
              </span>
            </div>
            <div className="progress-track">
              <div
                style={{
                  width: \`\${Math.min(
                    100,
                    Math.round(
                      ((state.kidsGoalSaved ?? 0) / Math.max(state.kidsGoalTarget ?? 30, 1)) * 100
                    )
                  )}%\`,
                }}
              />
            </div>
          </div>

          <div className="penny-kids-note">
            <strong>Penny ✨</strong>
            <p>{state.kidsMessage || "Fab start. Try saving a few coins before spending."}</p>
          </div>

          <div className="kids-actions">
            <button className="ghost-btn" onClick={resetKidsGame}>Reset kids round</button>
          </div>
        </div>

`;

  app = app.replace(marker, `${kidsZone}${marker}`);
}

/*
  6. Add goal inputs to Family controls.
*/
if (!app.includes('label="Kids goal name"')) {
  const marker = `<NumberInput
            label="Kids stars"`;

  if (app.includes(marker)) {
    const insertBefore = `<TextInput
            label="Kids goal name"
            value={state.kidsGoalName || "Bike fund"}
            onChange={(v) => update("kidsGoalName", v)}
          />
          <NumberInput
            label="Kids goal target"
            value={state.kidsGoalTarget ?? 30}
            onChange={(v) => update("kidsGoalTarget", v)}
          />
          `;
    app = app.replace(marker, `${insertBefore}${marker}`);
  }
}

/*
  7. CSS for Kids Money Zone.
*/
if (!css.includes(".kids-zone")) {
  css += `

/* Ledger v3.4 Kids Money Zone */
.kids-zone {
  margin-top: 22px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 26px;
  background:
    radial-gradient(circle at top left, rgba(255, 208, 90, 0.14), transparent 35%),
    rgba(255,255,255,0.055);
}

.kids-game-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.kids-choice {
  min-height: 136px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: 18px;
  color: white;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 18px 50px rgba(0,0,0,0.25);
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.kids-choice:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.28);
}

.kids-choice span {
  display: block;
  color: rgba(255,255,255,0.72);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 12px;
}

.kids-choice strong {
  display: block;
  margin: 8px 0 4px;
  font-size: 42px;
  line-height: 1;
}

.kids-choice small {
  color: rgba(255,255,255,0.72);
  font-weight: 800;
}

.kids-choice.spend {
  background: linear-gradient(135deg, rgba(168, 85, 255, 0.32), rgba(127, 34, 255, 0.14));
}

.kids-choice.save {
  background: linear-gradient(135deg, rgba(76, 240, 166, 0.26), rgba(34, 197, 94, 0.12));
}

.kids-choice.share {
  background: linear-gradient(135deg, rgba(255, 208, 90, 0.28), rgba(245, 158, 11, 0.12));
}

.goal-jar {
  margin-top: 18px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(0,0,0,0.22);
  border: 1px solid rgba(255,255,255,0.08);
}

.goal-jar-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.goal-jar-head span {
  color: rgba(255,255,255,0.68);
  font-weight: 900;
}

.penny-kids-note {
  margin-top: 16px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(168, 85, 255, 0.16);
  border: 1px solid rgba(168, 85, 255, 0.26);
}

.penny-kids-note p {
  margin: 8px 0 0;
}

.kids-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .kids-game-grid {
    grid-template-columns: 1fr;
  }

  .kids-choice {
    min-height: 104px;
  }

  .goal-jar-head {
    flex-direction: column;
  }

  .kids-actions {
    justify-content: stretch;
  }

  .kids-actions button {
    width: 100%;
  }
}
`;
}

fs.writeFileSync(appPath, app);
fs.writeFileSync(cssPath, css);

console.log("Ledger Kids Money Zone patch applied safely.");
