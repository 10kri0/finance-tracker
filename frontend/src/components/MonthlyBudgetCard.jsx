import { useState } from 'react'

export default function MonthlyBudgetCard({ categories = [], onApply, loading = false }) {
  const [presetBudget, setPresetBudget] = useState('')
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')

  const editableCategories = categories.filter(cat => cat.category_type !== 'BALANCE' && !cat.is_protected)
  const totalBudget = categories.reduce((sum, cat) => sum + Number(cat.monthly_budget || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const value = Number(presetBudget)
    if (Number.isNaN(value) || value < 0) {
      setMessage('Please enter a valid non-negative budget value.')
      return
    }

    try {
      setApplying(true)
      await onApply(value)
      setPresetBudget('')
      setMessage(`Applied ₹${value.toFixed(2)} to ${editableCategories.length} editable categories.`)
    } catch (err) {
      setMessage(err.message || 'Failed to apply monthly budget.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="monthly-budget-card">
      <div className="monthly-budget-card__header">
        <div>
          <h3>Monthly Budget Setup</h3>
          <p>Set one monthly target and apply it to your editable expense categories.</p>
        </div>
        <div className="monthly-budget-card__summary">
          <span>Total planned</span>
          <strong>₹{totalBudget.toFixed(2)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="monthly-budget-card__form">
        <div className="monthly-budget-card__field">
          <label htmlFor="monthly-budget-input">Monthly budget (₹)</label>
          <input
            id="monthly-budget-input"
            type="number"
            step="0.01"
            min="0"
            value={presetBudget}
            onChange={(e) => setPresetBudget(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || applying || editableCategories.length === 0}>
          {applying ? 'Applying...' : 'Apply to Categories'}
        </button>
      </form>

      {message && <div className="profile-msg profile-msg-success">{message}</div>}
      {editableCategories.length === 0 && (
        <div className="profile-msg profile-msg-error">There are no editable expense categories to update.</div>
      )}
    </div>
  )
}
