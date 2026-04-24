import { expenseAPI } from '../api/api'

export default function ExpenseTable({ expenses, onAdd, onRefresh, monthName }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await expenseAPI.delete(id)
      onRefresh()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>
          <span className="table-icon">↑</span>
          Expenses {monthName ? <span style={{ fontSize: '0.8em', opacity: 0.6, fontWeight: 400 }}>— {monthName}</span> : ''}
        </h3>
        <button className="btn btn-sm btn-expense" onClick={onAdd}>+ Add</button>
      </div>
      <div className="table-wrapper">
        <table id="expenses-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="empty-row">No expenses yet</td></tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id}>
                  <td className="name-cell">
                    <span className="cat-icon">{exp.category_icon || '📁'}</span>
                    {exp.name}
                  </td>
                  <td className="amount-cell expense-amount">₹{Number(exp.amount).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="tag tag-category">{exp.category_name || '—'}</span>
                      {exp.payment_method && (
                        <span className="tag" style={{ background: 'var(--bg)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                          {exp.payment_method}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="date-cell">{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(exp.id)} title="Delete">×</button>
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
