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