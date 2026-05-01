const fs = require("fs");

const appPath = "src/App.jsx";
const cssPath = "src/App.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync("src/App.backup-before-subscription-guard.jsx", app);
fs.writeFileSync("src/App.backup-before-subscription-guard.css", css);

function fail(message) {
  console.error("PATCH STOPPED:", message);
  process.exit(1);
}

/*
  1. Add default subscriptions to defaultState.
*/
if (!app.includes("subscriptions: [")) {
  const marker = "kidsStars:";
  if (!app.includes(marker)) {
    fail("Could not find a safe place in defaultState. Expected kidsStars.");
  }

  app = app.replace(
    marker,
    `subscriptions: [
    {
      id: 1,
      name: "Disney+",
      amount: 10.99,
      renewalDate: "2026-05-28",
      cancelByDate: "2026-05-25",
      frequency: "monthly",
      category: "Entertainment",
      status: "review",
      autoRenew: true,
    },
    {
      id: 2,
      name: "Pet insurance",
      amount: 18.5,
      renewalDate: "2026-06-03",
      cancelByDate: "2026-05-30",
      frequency: "monthly",
      category: "Pets",
      status: "active",
      autoRenew: true,
    },
    {
      id: 3,
      name: "Home insurance",
      amount: 180,
      renewalDate: "2026-07-10",
      cancelByDate: "2026-07-01",
      frequency: "yearly",
      category: "Insurance",
      status: "review",
      autoRenew: true,
    },
  ],
  ${marker}`
  );
}

/*
  2. Add ID helper if not already present.
*/
if (!app.includes("function createLedgerId()")) {
  const marker = "function clamp(value, min, max)";
  if (!app.includes(marker)) {
    fail("Could not find clamp helper.");
  }

  app = app.replace(
    marker,
    `function createLedgerId() {
  return Math.floor(Date.now() + Math.random() * 10000);
}

${marker}`
  );
}

/*
  3. Add date helpers.
*/
if (!app.includes("function daysUntil(dateValue)")) {
  const marker = "function createLedgerId()";
  if (!app.includes(marker)) {
    fail("Could not find ID helper insertion area.");
  }

  const helperBlock = `
function daysUntil(dateValue) {
  if (!dateValue) return 9999;

  const today = new Date();
  const target = new Date(dateValue);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateValue) {
  if (!dateValue) return "No date";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(dateValue));
  } catch {
    return dateValue;
  }
}

`;

  app = app.replace(marker, `${helperBlock}${marker}`);
}

/*
  4. Add Subscription tab.
*/
if (!app.includes('"Subscriptions"')) {
  app = app.replace(
    /const tabs = \[([^\]]+)\];/,
    (match, inner) => {
      if (inner.includes('"Subscriptions"')) return match;
      return `const tabs = [${inner.replace('"Settings"', '"Subscriptions", "Settings"')}];`;
    }
  );
}

/*
  5. Add subscription handlers before resetDemo.
*/
if (!app.includes("const updateSubscription = (id, patch) =>")) {
  const marker = "const resetDemo = () =>";
  if (!app.includes(marker)) {
    fail("Could not find resetDemo function.");
  }

  const handlers = `
  const updateSubscription = (id, patch) => {
    setState((prev) => ({
      ...prev,
      subscriptions: (prev.subscriptions || []).map((sub) =>
        sub.id === id ? { ...sub, ...patch } : sub
      ),
    }));
  };

  const addSubscription = () => {
    setState((prev) => ({
      ...prev,
      subscriptions: [
        ...(prev.subscriptions || []),
        {
          id: createLedgerId(),
          name: "New subscription",
          amount: 0,
          renewalDate: new Date().toISOString().slice(0, 10),
          cancelByDate: new Date().toISOString().slice(0, 10),
          frequency: "monthly",
          category: "General",
          status: "review",
          autoRenew: true,
        },
      ],
    }));
  };

  const removeSubscription = (id) => {
    setState((prev) => ({
      ...prev,
      subscriptions: (prev.subscriptions || []).filter((sub) => sub.id !== id),
    }));
  };

`;

  app = app.replace(marker, `${handlers}  ${marker}`);
}

/*
  6. Add subscription analytics into figures useMemo.
*/
if (!app.includes("activeSubscriptionsTotal")) {
  const returnMarker = "return {";
  if (!app.includes(returnMarker)) {
    fail("Could not find figures return block.");
  }

  const analytics = `
    const activeSubscriptions = (state.subscriptions || []).filter(
      (sub) => sub.status !== "cancelled"
    );

    const activeSubscriptionsTotal = activeSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.amount || 0),
      0
    );

    const upcomingSubscriptions = activeSubscriptions
      .map((sub) => ({
        ...sub,
        renewalDays: daysUntil(sub.renewalDate),
        cancelDays: daysUntil(sub.cancelByDate),
      }))
      .sort((a, b) => a.renewalDays - b.renewalDays);

    const urgentSubscriptionCount = upcomingSubscriptions.filter(
      (sub) => sub.renewalDays <= 14 || sub.cancelDays <= 7
    ).length;

`;

  const firstReturnIndex = app.indexOf(returnMarker);
  app = app.slice(0, firstReturnIndex) + analytics + app.slice(firstReturnIndex);

  app = app.replace(
    returnMarker,
    `return {
      activeSubscriptionsTotal,
      upcomingSubscriptions,
      urgentSubscriptionCount,`
  );
}

/*
  7. Add Subscriptions panel render after Plan render or before Settings.
*/
if (!app.includes("<SubscriptionGuardPanel")) {
  const marker = `{activeTab === "Settings" &&`;
  if (!app.includes(marker)) {
    fail("Could not find Settings render block.");
  }

  const renderBlock = `
          {activeTab === "Subscriptions" && (
            <SubscriptionGuardPanel
              state={state}
              figures={figures}
              updateSubscription={updateSubscription}
              addSubscription={addSubscription}
              removeSubscription={removeSubscription}
            />
          )}

          `;

  app = app.replace(marker, `${renderBlock}${marker}`);
}

/*
  8. Add SubscriptionGuardPanel component before SettingsPanel or EditModal.
*/
if (!app.includes("function SubscriptionGuardPanel(")) {
  let marker = "function SettingsPanel";
  if (!app.includes(marker)) {
    marker = "function EditModal";
  }

  if (!app.includes(marker)) {
    fail("Could not find component insertion point.");
  }

  const component = `
function SubscriptionGuardPanel({
  state,
  figures,
  updateSubscription,
  addSubscription,
  removeSubscription,
}) {
  const subscriptions = state.subscriptions || [];
  const upcoming = figures.upcomingSubscriptions || [];
  const nextRenewal = upcoming[0];

  return (
    <section className="page-grid">
      <div className="panel wide">
        <div className="section-title">
          <div>
            <div className="kicker">SUBSCRIPTION GUARD</div>
            <h2>Watch renewals before they sneak through.</h2>
          </div>

          <div className="safe-pill small">
            <span>Monthly risk</span>
            <strong>{currency(figures.activeSubscriptionsTotal || 0)}</strong>
          </div>
        </div>

        {nextRenewal && (
          <div className="renewal-alert">
            <strong>Penny reminder ✨</strong>
            <p>
              {nextRenewal.name} renews in {nextRenewal.renewalDays} days.
              Cancel-by date: {formatShortDate(nextRenewal.cancelByDate)}.
            </p>
          </div>
        )}

        <div className="subhead-row">
          <h3>Subscriptions and renewals</h3>
          <button className="mini-btn" onClick={addSubscription}>
            Add renewal
          </button>
        </div>

        <div className="subscription-list">
          {subscriptions.map((sub) => {
            const renewalDays = daysUntil(sub.renewalDate);
            const cancelDays = daysUntil(sub.cancelByDate);
            const isUrgent = renewalDays <= 14 || cancelDays <= 7;

            return (
              <div
                className={isUrgent ? "subscription-row urgent" : "subscription-row"}
                key={sub.id}
              >
                <div className="subscription-main">
                  <input
                    value={sub.name}
                    onChange={(e) =>
                      updateSubscription(sub.id, { name: e.target.value })
                    }
                  />

                  <select
                    value={sub.status}
                    onChange={(e) =>
                      updateSubscription(sub.id, { status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="review">Review</option>
                    <option value="cancelling">Cancelling</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="subscription-fields">
                  <label>
                    <span>Amount</span>
                    <input
                      type="number"
                      value={sub.amount}
                      onChange={(e) =>
                        updateSubscription(sub.id, {
                          amount: Number(e.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Renewal</span>
                    <input
                      type="date"
                      value={sub.renewalDate}
                      onChange={(e) =>
                        updateSubscription(sub.id, {
                          renewalDate: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Cancel by</span>
                    <input
                      type="date"
                      value={sub.cancelByDate}
                      onChange={(e) =>
                        updateSubscription(sub.id, {
                          cancelByDate: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Frequency</span>
                    <select
                      value={sub.frequency}
                      onChange={(e) =>
                        updateSubscription(sub.id, {
                          frequency: e.target.value,
                        })
                      }
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="trial">Trial</option>
                    </select>
                  </label>

                  <label>
                    <span>Category</span>
                    <input
                      value={sub.category}
                      onChange={(e) =>
                        updateSubscription(sub.id, {
                          category: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="check-label">
                    <span>Auto-renew</span>
                    <input
                      type="checkbox"
                      checked={Boolean(sub.autoRenew)}
                      onChange={(e) =>
                        updateSubscription(sub.id, {
                          autoRenew: e.target.checked,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="subscription-footer">
                  <span>
                    Renews in <strong>{renewalDays}</strong> days · cancel in{" "}
                    <strong>{cancelDays}</strong> days
                  </span>

                  <button onClick={() => removeSubscription(sub.id)}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="kicker">RENEWAL WATCH</div>

        <ul className="bill-list">
          <li>
            <span>Active / review items</span>
            <strong>
              {subscriptions.filter((s) => s.status !== "cancelled").length}
            </strong>
          </li>
          <li>
            <span>Urgent warnings</span>
            <strong>{figures.urgentSubscriptionCount || 0}</strong>
          </li>
          <li>
            <span>Tracked total</span>
            <strong>{currency(figures.activeSubscriptionsTotal || 0)}</strong>
          </li>
        </ul>

        <div className="penny-kids-note">
          <strong>Penny ✨</strong>
          <p>
            Fab idea keeping an eye on renewals. The sneaky ones are trials,
            yearly insurance and entertainment subscriptions.
          </p>
        </div>
      </div>
    </section>
  );
}

`;

  app = app.replace(marker, `${component}${marker}`);
}

/*
  9. Add mobile tab support if mobile nav exists.
*/
if (app.includes('className="mobile-nav"') && !app.includes('"Subscriptions"].map')) {
  app = app.replace(
    /\["Home", "Budget", "Goals", "Penny", "Plan"\]\.map/g,
    `["Home", "Budget", "Goals", "Subscriptions", "Plan"].map`
  );
}

/*
  10. CSS.
*/
if (!css.includes(".subscription-list")) {
  css += `

/* Ledger v3.6 Subscription Guard */
.renewal-alert {
  margin-top: 18px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255, 208, 90, 0.35);
  background: rgba(255, 208, 90, 0.1);
}

.renewal-alert p {
  margin: 8px 0 0;
  color: #fff3c4;
}

.subscription-list {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.subscription-row {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.18);
}

.subscription-row.urgent {
  border-color: rgba(255, 208, 90, 0.45);
  background:
    radial-gradient(circle at top left, rgba(255, 208, 90, 0.12), transparent 45%),
    rgba(0,0,0,0.18);
}

.subscription-main {
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 10px;
}

.subscription-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.subscription-fields label {
  display: grid;
  gap: 6px;
}

.subscription-fields span {
  color: rgba(255,255,255,0.62);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.subscription-row input,
.subscription-row select {
  width: 100%;
  border: 1px solid rgba(255,255,255,0.13);
  outline: none;
  border-radius: 14px;
  padding: 12px;
  background: rgba(0,0,0,0.25);
  color: white;
}

.subscription-row option {
  color: #111;
}

.check-label input {
  width: 24px;
  height: 24px;
  accent-color: #a855ff;
}

.subscription-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: rgba(255,255,255,0.7);
}

.subscription-footer button {
  border: 0;
  border-radius: 14px;
  padding: 10px 12px;
  color: white;
  background: rgba(255, 95, 125, 0.18);
  cursor: pointer;
}

@media (max-width: 760px) {
  .subscription-main,
  .subscription-fields {
    grid-template-columns: 1fr;
  }

  .subscription-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .subscription-footer button {
    width: 100%;
  }
}
`;
}

fs.writeFileSync(appPath, app);
fs.writeFileSync(cssPath, css);

console.log("Ledger Subscription Guard patch applied safely.");
