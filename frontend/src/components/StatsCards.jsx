export default function StatsCards({ data }) {
  const { current_month, total_income_all, total_expense_all, total_cashflow_all } = data

  const stats = [
    {
      label: 'Monthly Income',
      value: current_month.total_income,
      icon: '↓',
      color: 'emerald',
      sub: `All Time: ₹${Number(total_income_all).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      label: 'Monthly Expenses',
      value: current_month.total_expense,
      icon: '↑',
      color: 'rose',
      sub: `All Time: ₹${Number(total_expense_all).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      label: 'Monthly Cashflow',
      value: current_month.cashflow,
      icon: '⚡',
      color: current_month.cashflow >= 0 ? 'blue' : 'rose',
      sub: `All Time: ₹${Number(total_cashflow_all).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      label: 'Budget Used',
      value: null,
      displayValue: `${Math.min(Number(current_month.budget_usage || 0), 100).toFixed(0)}%`,
      icon: '📊',
      color: current_month.budget_usage > 80 ? 'rose' : current_month.budget_usage > 50 ? 'amber' : 'emerald',
      sub: current_month.name
    }
  ]

  return (
    <div className="stats-grid">
      {stats.map((stat, i) => (
        <div key={i} className={`stat-card stat-card-${stat.color}`}>
          <div className="stat-header">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-icon">{stat.icon}</span>
          </div>
          <div className="stat-value">
            {stat.displayValue || `₹${Number(stat.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
          <div className="stat-sub">{stat.sub}</div>
        </div>
      ))}
    </div>
  )
}
