import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']

export default function Charts({ data, onSelectMonth }) {
  // Pie chart: expenses by category
  const categoryData = data.category_breakdown?.map((item, i) => ({
    name: item.category__name || 'Uncategorized',
    value: Number(item.total),
    icon: item.category__icon || '📁',
  })) || []

  // Bar chart: monthly income vs expense
  const monthlyData = [...data.months]
    .reverse()
    .filter(m => Number(m.total_income) > 0 || Number(m.total_expense) > 0)
    .map(m => ({
      id: m.id,
      name: m.name.replace(/\s\d{4}/, '').substring(0, 3),
      income: Number(m.total_income),
      expense: Number(m.total_expense),
    }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: ₹{Number(p.value).toLocaleString()}
          </div>
        ))}
      </div>
    )
  }

  const handleBarClick = (data) => {
    if (onSelectMonth && data && data.id) {
      onSelectMonth(data.id)
    }
  }

  return (
    <div className="charts-grid">
      {/* Monthly Income vs Expense Bar Chart */}
      <div className="chart-card">
        <h3 className="chart-title">Monthly Overview</h3>
        {monthlyData.length === 0 ? (
          <div className="chart-empty">No data to display</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" onClick={handleBarClick} cursor="pointer" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" onClick={handleBarClick} cursor="pointer" />
            </BarChart>

          </ResponsiveContainer>
        )}
      </div>

      {/* Expense by Category Pie Chart */}
      <div className="chart-card">
        <h3 className="chart-title">This Month by Category</h3>
        {categoryData.length === 0 ? (
          <div className="chart-empty">No expenses this month</div>
        ) : (
          <div className="pie-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {categoryData.map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="legend-icon">{item.icon}</span>
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-value">₹{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
