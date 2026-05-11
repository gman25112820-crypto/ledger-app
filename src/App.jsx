import React, { useState } from "react";
import "./App.css";
import TierToggle from "./components/TierToggle";

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleStart = () => {
    setShowOnboarding(false);
  };

  return (
    <main className="ledgerApp">
      <TierToggle />

      {showOnboarding && (
        <section className="onboardingOverlay">
          <div className="onboardingCard">
            <span className="badge">Local Demo Mode</span>
            <h1>Welcome to Ledger</h1>
            <p className="introText">
              Ledger is your private household finance planner. 
              Track bills, manage the family budget, and optimize your bulk-buy gains.
            </p>
            
            <ul className="featureList">
              <li><strong>Privacy First:</strong> No bank logins required.</li>
              <li><strong>Family Sync:</strong> Balance the kids' needs with household costs.</li>
              <li><strong>Gains Tracking:</strong> Integrated protein-to-cost logic (Pro).</li>
            </ul>

            <button className="getStartedBtn" onClick={handleStart}>
              Enter My Ledger
            </button>
            <p className="footerNote">Version 5.0 | Data stored locally</p>
          </div>
        </section>
      )}

      {!showOnboarding && (
        <div className="appContent">
          <nav className="bottomNav">
            <button 
              className={activeTab === "dashboard" ? "active" : ""} 
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button 
              className={activeTab === "budget" ? "active" : ""} 
              onClick={() => setActiveTab("budget")}
            >
              Budget
            </button>
          </nav>

          <section className="viewContainer">
            {activeTab === "dashboard" && (
              <div className="dashboardView">
                <h2>Weekly Overview</h2>
                <div className="statCard">
                  <span>Safe to Spend</span>
                  <h3>£145.20</h3>
                </div>
              </div>
            )}
            
            {activeTab === 'budget' && (
              <div className="budgetView">
                <div className="sectionHeader">
                  <h2>Dragon Pro: Workout Hub 🐉</h2>
                  <span className="status">Now Playing: High-Octane Fuel</span>
                </div>
                
                <div className="workoutLibrary">
                  <div className="exerciseCard">
                    <h4>Single-Arm Row</h4>
                    <p>Target: Mid-Back | 3x12 per side</p>
                    <button className="videoBtn" onClick={() => window.open('https://www.youtube.com/watch?v=roCP6wC4734')}>
                      Watch Form
                    </button>
                  </div>
                  
                  <div className="exerciseCard">
                    <h4>Goblet Deadlift</h4>
                    <p>Target: Hips & Back | 3x12</p>
                    <button className="videoBtn" onClick={() => window.open('https://www.youtube.com/watch?v=X0SAnW_iE9o')}>
                      Watch Form
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;