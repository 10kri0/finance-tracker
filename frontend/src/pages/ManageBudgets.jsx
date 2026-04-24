import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { categoryAPI } from '../api/api'

export default function ManageBudgets() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [modifiedBudgets, setModifiedBudgets] = useState({})
  const [saving, setSaving] = useState(false)
  
  // New Category State
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📁')
  const [newCatBudget, setNewCatBudget] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryAPI.list()
      setCategories(data)
    } catch (err) {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      setAddLoading(true)
      await categoryAPI.create({
        name: newCatName,
        icon: newCatIcon,
        monthly_budget: parseFloat(newCatBudget) || 0
      })
      setNewCatName('')
      setNewCatIcon('📁')
      setNewCatBudget('')
      await fetchCategories()
    } catch (err) {
      setError('Failed to add category.')
    } finally {
      setAddLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    setError(null)
    setSuccessMsg(null)
    try {
      for (const [id, newBudget] of Object.entries(modifiedBudgets)) {
        const cat = categories.find(c => c.id == id)
        if (cat) {
          await categoryAPI.update(id, {
            ...cat,
            monthly_budget: parseFloat(newBudget) || 0
          })
        }
      }
      setModifiedBudgets({})
      await fetchCategories()
      setSuccessMsg('Changes saved successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError('Failed to save some changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All related expenses will lose their category.')) return
    try {
      await categoryAPI.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError('Failed to delete category.')
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading budgets...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <img src="/spendwise-logo.png" alt="SpendWise" className="logo-img" />
            <span className="logo-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SpendWise</span>
          </div>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="profile-card-icon">🎯</div>
                <h2 style={{ margin: 0 }}>Set Expense Budgets</h2>
              </div>
              {Object.keys(modifiedBudgets).length > 0 && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveChanges} 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
            
            {error && <div className="profile-msg profile-msg-error">{error}</div>}
            {successMsg && <div className="profile-msg profile-msg-success">{successMsg}</div>}

            <div className="category-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                    <div>
                      <span style={{ fontWeight: '500' }}>{cat.name}</span>
                      {cat.is_protected && (
                        <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '99px' }}>
                          Mandatory
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {cat.is_protected ? 'Balance (₹)' : 'Budget (₹)'}
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={modifiedBudgets[cat.id] !== undefined ? modifiedBudgets[cat.id] : cat.monthly_budget}
                        onChange={(e) => setModifiedBudgets(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        style={{ width: '120px', padding: '0.5rem', borderRadius: 'var(--radius)', border: cat.is_protected ? '1px solid #6366f1' : '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                    {cat.is_protected ? (
                      <span title="Mandatory — cannot be deleted" style={{ fontSize: '1.1rem', opacity: 0.45, cursor: 'not-allowed' }}>🔒</span>
                    ) : (
                      <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(cat.id)}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <h3>Add New Category</h3>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: '0 0 60px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Icon</label>
                  <input type="text" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Name</label>
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" required style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Monthly Budget (₹)</label>
                  <input type="number" step="0.01" min="0" value={newCatBudget} onChange={e => setNewCatBudget(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={addLoading} style={{ height: '38px' }}>
                  {addLoading ? 'Adding...' : 'Add'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
