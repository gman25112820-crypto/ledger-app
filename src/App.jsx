import React, { useState, useEffect } from 'react';
import './App.css'; // Assumes you have basic styling here

function App() {
  // --- 1. STATE MANAGEMENT ---
  // Initializing state with values or falling back to 0
  const [monthlyIncome, setMonthlyIncome] = useState(() => {
    return Number(localStorage.getItem('monthlyIncome')) || 0;
  });
  const [currentBalance, setCurrentBalance] = useState(() => {
    return Number(localStorage.getItem('currentBalance')) || 0;
  });
  const [billsPressure, setBillsPressure] = useState(() => {
    return Number(localStorage.getItem('billsPressure')) || 0;
  });
  const [foodBudget, setFoodBudget] = useState(() => {
    return Number(localStorage.getItem('foodBudget')) || 0;
  });
  const [fuelBudget, setFuelBudget] = useState(() => {
    return Number(localStorage.getItem('fuelBudget')) || 0;
  });

  // --- 2. PERSIST DATA TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('monthlyIncome', monthlyIncome);
    localStorage.setItem('currentBalance', currentBalance);
    localStorage.setItem('billsPressure', billsPressure);
    localStorage.setItem('foodBudget', foodBudget);
    localStorage.setItem('fuelBudget', fuelBudget);
  }, [monthlyIncome, currentBalance, billsPressure, foodBudget, fuelBudget]);

  // --- 3. FINANCIAL CALCULATIONS ---
  const totalOutgoings = billsPressure + foodBudget + fuelBudget;
  const safeToSpend = currentBalance - totalOutgoings;

  // --- 4. THE HARD RESET FUNCTION ---
  const resetLedger = () => {
    if (window.confirm("Are you sure you want to clear all Ledger data to zero?")) {
      setMonthlyIncome(0);
      setCurrentBalance(0);
      setBillsPressure(0);
      setFoodBudget(0);
      setFuelBudget(0);
      localStorage.clear();
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <h1>RAGE // HOUSEHOLD COMMAND</h1>
        <p className="subtitle">System Status: Active</p>
      </header>

      {/* MAIN DASHBOARD BLOCK */}
      <main className="dashboard-grid">
        
        {/* LEFT COLUMN: METRICS & VISUALS */}
        <section className="column left-column">
          <h2>Financial Health</h2>
          
          <div className="metric-card">
            <h3>Monthly Income</h3>
            <p className="amount">£{monthlyIncome}</p>
          </div>

          <div className="metric-card">
            <h3>Current Bank Balance</h3>
            <p className="amount">£{currentBalance}</p>
          </div>

          {/* Dynamic color based on deficit */}
          <div className={`metric-card safe-to-spend ${safeToSpend < 0 ? 'deficit' : 'surplus'}`}>
            <h3>Safe To Spend</h3>
            <p className="amount">£{safeToSpend}</p>
            {safeToSpend < 0 && <span className="warning-text">Budget Deficit Detected</span>}
          </div>
        </section>

        {/* RIGHT COLUMN: CONTROLS & INPUTS */}
        <section className="column right-column">
          <h2>Command Controls</h2>

          <div className="input-group">
            <label>Update Monthly Income (£)</label>
            <input 
              type="number" 
              value={monthlyIncome} 
              onChange={(e) => setMonthlyIncome(Number(e.target.value))} 
            />
          </div>

          <div className="input-group">
            <label>Update Bank Balance (£)</label>
            <input 
              type="number" 
              value={currentBalance} 
              onChange={(e) => setCurrentBalance(Number(e.target.value))} 
            />
          </div>

          <div className="input-group">
            <label>Bills Outstandng (£)</label>
            <input 
              type="number" 
              value={billsPressure} 
              onChange={(e) => setBillsPressure(Number(e.target.value))} 
            />
          </div>

          <div className="input-group">
            <label>Food Budget (£)</label>
            <input 
              type="number" 
              value={foodBudget} 
              onChange={(e) => setFoodBudget(Number(e.target.value))} 
            />
          </div>

          <div className="input-group">
            <label>Fuel Budget (£)</label>
            <input 
              type="number" 
              value={fuelBudget} 
              onChange={(e) => setFuelBudget(Number(e.target.value))} 
            />
          </div>

          {/* DANGER ZONE RESET BUTTON */}
          <div className="danger-zone">
            <button onClick={resetLedger} className="btn-reset">
              HARD RESET LEDGER DATA
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;