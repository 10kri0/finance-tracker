import { useState } from 'react'
import { incomeAPI } from '../api/api'

const SOURCES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'digital_products', label: 'Digital Products' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'ecommerce', label: 'Ecommerce' },
  { value: 'affiliates', label: 'Affiliates' },
  { value: 'investments', label: 'Investments' },
  { value: 'other', label: 'Other' },
]

export default function AddIncomeModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [source, setSource] = useState('salary')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await incomeAPI.create({
        name,
        amount: parseFloat(amount),
        date,
        source,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError('Failed to add income')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><span className="modal-icon income-icon">↓</span> Add Income</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="inc-name">Description</label>
            <input id="inc-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Salary" required autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="inc-amount">Amount (₹)</label>
              <input id="inc-amount" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label htmlFor="inc-date">Date</label>
              <input id="inc-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="inc-source">Source</label>
            <select id="inc-source" value={source} onChange={e => setSource(e.target.value)}>
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-income" disabled={loading}>
              {loading ? 'Adding...' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
