import { useState } from 'react'
import { expenseAPI } from '../api/api'

export default function AddExpenseModal({ categories, onClose, onSaved }) {
  const [name, setName]               = useState('')
  const [amount, setAmount]           = useState('')
  const today                         = new Date().toISOString().split('T')[0]
  const [date, setDate]               = useState(today)
  const [categoryId, setCategoryId]   = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await expenseAPI.create({
        name,
        amount: parseFloat(amount),
        date,
        category: categoryId || null,
        payment_method: 'cash',
      })
      onSaved()
      onClose()
    } catch (err) {
      setError('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><span className="modal-icon">↑</span> Add Expense</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="exp-name">Description</label>
            <input id="exp-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grocery Shopping" required autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exp-amount">Amount (₹)</label>
              <input id="exp-amount" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label htmlFor="exp-date">Date</label>
              <input id="exp-date" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="exp-category">Category</label>
            <select
              id="exp-category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-expense" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
