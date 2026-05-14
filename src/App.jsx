import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- 1. CORE FINANCIAL STATE ---
  const [monthlyIncome, setMonthlyIncome] = useState(() => Number(localStorage.getItem('monthlyIncome')) || 0);
  const [currentBalance, setCurrentBalance] = useState(() => Number(localStorage.getItem('currentBalance')) || 0);
  const [billsPressure, setBillsPressure] = useState(() => Number(localStorage.getItem('billsPressure')) || 0);
  const [foodBudget, setFoodBudget] = useState(() => Number(localStorage.getItem('foodBudget')) || 0);
  const [fuelBudget, setFuelBudget] = useState(() => Number(localStorage.getItem('fuelBudget')) || 0);

  // --- 2. SHOPPING LIST STATE ---
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('shoppingList')) || []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // --- 3. PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('monthlyIncome', monthlyIncome);
    localStorage.setItem('currentBalance', currentBalance);
    localStorage.setItem('billsPressure', billsPressure);
    localStorage.setItem('foodBudget', foodBudget);
    localStorage.setItem('fuelBudget', fuelBudget);
    localStorage.setItem('shoppingList', JSON.stringify(items));
  }, [monthlyIncome, currentBalance, billsPressure, foodBudget, fuelBudget, items]);

  // --- 4. CALCULATIONS ---
  const totalOutgoings = billsPressure + foodBudget + fuelBudget;
  const safeToSpend = currentBalance - totalOutgoings;
  const currentListTotal = items.reduce((acc, item) => acc + item.price, 0);
  const finalRemaining = safeToSpend - currentListTotal;

  // --- 5. FUNCTIONS ---
  const addItem = () => {
    if (newItemName && newItemPrice) {
      setItems([...items, { name: newItemName, price: parseFloat(newItemPrice) }]);
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const resetLedger = () => {
    if (window.confirm("Hard Reset all data?")) {
      setMonthlyIncome(0);
      setCurrentBalance(0);
      setBillsPressure(0);
      setFoodBudget(0);
      setFuelBudget(0);
      setItems([]);
      localStorage.clear();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>RAGE // HOUSEHOLD COMMAND</h1>
        <div className="status-bar">
          <span>Remaining: £{finalRemaining.toFixed(2)}</span>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* LEFT COLUMN: TOTALS */}
        <section className="column">
          <h2>Ledger Overview</h2>
          <div className="metric-card"><h3>Income</h3><p>£{monthlyIncome}</p></div>
          <div className="metric-card"><h3>Bank Balance</h3><p>£{currentBalance}</p></div>
          <div className={`metric-card ${finalRemaining < 0 ? 'deficit' : 'surplus'}`}>
            <h3>Post-Shop Balance</h3>
            <p>£{finalRemaining.toFixed(2)}</p>
          </div>
          
          <button onClick={resetLedger} className="btn-reset">HARD RESET ALL</button>
        </section>

        {/* CENTER COLUMN: SHOPPING LIST */}
        <section className="column shopping-section">
          <h2>Weekly Shop</h2>
          <div className="add-item-box">
            <input placeholder="Item (e.g. Eggs)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
            <input type="number" placeholder="£" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} />
            <button onClick={addItem}>Add</button>
          </div>
          
          <div className="list-container">
            {items.map((item, index) => (
              <div key={index} className="list-item">
                <span>{item.name}</span>
                <span>£{item.price.toFixed(2)}</span>
                <button onClick={() => removeItem(index)}>X</button>
              </div>
            ))}
            <div className="list-total">List Total: £{currentListTotal.toFixed(2)}</div>
          </div>
        </section>

        {/* RIGHT COLUMN: BASE COSTS */}
        <section className="column">
          <h2>Fixed Estimates</h2>
          <div className="input-group">
             <label>Income</label>
             <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} />
          </div>
          <div className="input-group">
             <label>Bank Balance</label>
             <input type="number" value={currentBalance} onChange={(e) => setCurrentBalance(Number(e.target.value))} />
          </div>
          <div className="input-group">
             <label>Bills Outstanding</label>
             <input type="number" value={billsPressure} onChange={(e) => setBillsPressure(Number(e.target.value))} />
          </div>
          <div className="input-group">
             <label>Food Budget</label>
             <input type="number" value={foodBudget} onChange={(e) => setFoodBudget(Number(e.target.value))} />
          </div>
          <div className="input-group">
             <label>Fuel Budget</label>
             <input type="number" value={fuelBudget} onChange={(e) => setFuelBudget(Number(e.target.value))} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;