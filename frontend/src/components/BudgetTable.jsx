export default function BudgetTable({ categories, expanded }) {
  // Always show BALANCE categories first
  const sorted = [...categories].sort((a, b) => {
    const aIsBalance = a.category_type === 'BALANCE' ? 0 : 1
    const bIsBalance = b.category_type === 'BALANCE' ? 0 : 1
    return aIsBalance - bIsBalance || a.name.localeCompare(b.name)
  })

  return (
    <div className={`table-card ${expanded ? 'expanded' : ''}`}>
      <div className="table-header">
        <h3>
          <span className="table-icon budget-icon">📊</span>
          Budget Overview
        </h3>
      </div>
      <div className="budget-list">
        {sorted.map(cat => {
          const isBalance = cat.category_type === 'BALANCE'
          const budget    = Number(cat.monthly_budget)
          const spent     = Number(cat.expense_this_month)
          const remaining = isBalance && cat.remaining_balance !== undefined && cat.remaining_balance !== null ? Number(cat.remaining_balance) : budget - spent
          const usage     = cat.usage || 0

          if (isBalance) {
            // Bar = remaining percentage (like a battery / fuel tank)
            const remainPct   = budget > 0 ? Math.max(0, Math.min(100, (remaining / budget) * 100)) : 0
            const barColor    = remainPct > 50 ? '#10b981' : remainPct > 20 ? '#f59e0b' : '#ef4444'

            return (
              <div key={cat.id} className="budget-item">
                <div className="budget-info">
                  <div className="budget-name">
                    <span className="budget-icon-emoji">{cat.icon}</span>
                    <div>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', color: remaining < 0 ? '#ef4444' : '#10b981', fontWeight: 500 }}>
                        {remaining >= 0
                          ? `₹${remaining.toFixed(2)} remaining`
                          : `₹${Math.abs(remaining).toFixed(2)} over budget`}
                      </div>
                    </div>
                  </div>
                  <div className="budget-amounts">
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: remaining < 0 ? '#ef4444' : 'var(--text)' }}>
                      ₹{remaining.toFixed(2)}
                    </span>
                    <span className="budget-sep"> / </span>
                    <span className="budget-total" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      ₹{budget.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="budget-bar-bg">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${remainPct}%`,
                      backgroundColor: barColor,
                      transition: 'width 0.5s ease, background-color 0.4s ease',
                    }}
                  />
                </div>
                <div className="budget-usage" style={{ color: barColor }}>
                  {remainPct.toFixed(0)}% left
                </div>
              </div>
            )
          }

          // Regular expense category
          const barColor = usage > 80 ? '#ef4444' : usage > 50 ? '#f59e0b' : '#10b981'
          return (
            <div key={cat.id} className="budget-item">
              <div className="budget-info">
                <div className="budget-name">
                  <span className="budget-icon-emoji">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                <div className="budget-amounts">
                  <span className="budget-spent">₹{spent.toFixed(2)}</span>
                  <span className="budget-sep">/</span>
                  <span className="budget-total">₹{budget.toFixed(2)}</span>
                </div>
              </div>
              <div className="budget-bar-bg">
                <div
                  className="budget-bar-fill"
                  style={{ width: `${Math.min(usage, 100)}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="budget-usage">{Math.min(usage, 100).toFixed(0)}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
