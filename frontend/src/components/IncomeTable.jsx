import { incomeAPI } from '../api/api'

const SOURCE_COLORS = {
  salary: '#10b981',
  freelance: '#6366f1',
  digital_products: '#8b5cf6',
  real_estate: '#f59e0b',
  ecommerce: '#a855f7',
  affiliates: '#eab308',
  investments: '#06b6d4',
  other: '#6b7280',
}

export default function IncomeTable({ incomes, onAdd, onRefresh, monthName }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this income?')) return
    try {
      await incomeAPI.delete(id)
      onRefresh()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>
          <span className="table-icon income-icon">↓</span>
          Incomes {monthName ? <span style={{ fontSize: '0.8em', opacity: 0.6, fontWeight: 400 }}>— {monthName}</span> : ''}
        </h3>
        <button className="btn btn-sm btn-income" onClick={onAdd}>+ Add</button>
      </div>
      <div className="table-wrapper">
        <table id="incomes-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Source</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incomes.length === 0 ? (
              <tr><td colSpan={5} className="empty-row">No income yet</td></tr>
            ) : (
              incomes.map(inc => (
                <tr key={inc.id}>
                  <td className="name-cell">
                    <span className="cat-icon">💵</span>
                    {inc.name}
                  </td>
                  <td className="amount-cell income-amount">₹{Number(inc.amount).toFixed(2)}</td>
                  <td>
                    <span
                      className="tag tag-source"
                      style={{ backgroundColor: `${SOURCE_COLORS[inc.source] || '#6b7280'}22`, color: SOURCE_COLORS[inc.source] || '#6b7280' }}
                    >
                      {inc.source_display}
                    </span>
                  </td>
                  <td className="date-cell">{new Date(inc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(inc.id)} title="Delete">×</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
