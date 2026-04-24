export default function MonthlyStats({ months, onSelectMonth, selectedMonthId, currentMonthId }) {
  return (
    <div className="table-card monthly-stats-card">
      <div className="table-header">
        <h3>
          <span className="table-icon">📅</span>
          Monthly Stats
        </h3>
      </div>
      <div className="table-wrapper">
        <table id="monthly-stats-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expense</th>
              <th>Cashflow</th>
              <th>Budget</th>
            </tr>
          </thead>
          <tbody>
            {months.map(m => {
              const cashflow = Number(m.cashflow)
              const effectiveSelectedId = selectedMonthId || currentMonthId
              const isSelected = effectiveSelectedId == m.id
              return (
                <tr 
                  key={m.id} 
                  onClick={() => onSelectMonth && onSelectMonth(m.id)}
                  style={{ 
                    cursor: onSelectMonth ? 'pointer' : 'default',
                    backgroundColor: isSelected ? 'var(--bg-secondary, #f3f4f6)' : 'transparent',
                    boxShadow: isSelected ? 'inset 4px 0 0 var(--primary-color)' : 'none'
                  }}
                  title="Click to view details for this month"
                >
                  <td className="name-cell month-name">{m.name}</td>
                  <td className="amount-cell income-amount">₹{Number(m.total_income).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="amount-cell expense-amount">₹{Number(m.total_expense).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className={`amount-cell ${cashflow >= 0 ? 'income-amount' : 'expense-amount'}`}>
                    ₹{cashflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`budget-badge ${Number(m.budget_usage) > 80 ? 'over' : Number(m.budget_usage) > 50 ? 'warn' : 'good'}`}>
                      {Math.min(Number(m.budget_usage || 0), 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
