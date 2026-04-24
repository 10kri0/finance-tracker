import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { dashboardAPI } from '../api/api'
import StatsCards from '../components/StatsCards'
import ExpenseTable from '../components/ExpenseTable'
import IncomeTable from '../components/IncomeTable'
import BudgetTable from '../components/BudgetTable'
import MonthlyStats from '../components/MonthlyStats'
import Charts from '../components/Charts'
import AddExpenseModal from '../components/AddExpenseModal'
import AddIncomeModal from '../components/AddIncomeModal'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMonthId, setSelectedMonthId] = useState('')

  const loadDashboard = async () => {
    try {
      const d = await dashboardAPI.get(selectedMonthId)
      setData(d)
    } catch (err) {
      console.error('Dashboard load failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    setLoading(true)
    loadDashboard() 
  }, [selectedMonthId])

  const refresh = () => {
    setLoading(true)
    loadDashboard()
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your finances...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <p>Failed to load dashboard</p>
        <button onClick={refresh} className="btn btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <img src="/spendwise-logo.png" alt="SpendWise" className="logo-img" />
            <span className="logo-text" onClick={() => setActiveTab('overview')}>SpendWise</span>
          </div>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >Overview</button>
          <button
            className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >Transactions</button>
          <button
            className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >Budget</button>

        </nav>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} id="theme-toggle-btn">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="user-info user-info-clickable" onClick={() => navigate('/profile')} title="Go to profile" id="user-profile-link">
            <div className="user-avatar">{(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
            <span className="user-name">{user?.name || user?.email}</span>
          </div>
          <button onClick={logout} className="btn btn-ghost" id="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-greeting">
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <div className="action-buttons">
            <button className="btn btn-expense" onClick={() => setShowExpenseModal(true)} id="add-expense-btn">
              <span className="btn-icon">↑</span> New Expense
            </button>
            <button className="btn btn-income" onClick={() => setShowIncomeModal(true)} id="add-income-btn">
              <span className="btn-icon">↓</span> New Income
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>
                {selectedMonthId ? `Viewing data for: ${data.current_month.name}` : `Current Month: ${data.current_month.name}`}
              </h2>
              {selectedMonthId && (
                <button className="btn btn-ghost" onClick={() => setSelectedMonthId('')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                  × Reset to Current Month
                </button>
              )}
            </div>
            <StatsCards data={data} />
            <div className="dashboard-grid">
              <div className="grid-col-2">
                <Charts data={data} onSelectMonth={setSelectedMonthId} />
              </div>
              <div className="grid-col-1">
                <BudgetTable categories={data.categories} />
              </div>
            </div>
            <MonthlyStats months={data.months} onSelectMonth={setSelectedMonthId} selectedMonthId={selectedMonthId} currentMonthId={data.current_month.id} />
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="dashboard-grid">
            <div className="grid-col-1">
              <ExpenseTable
                expenses={data.recent_expenses}
                onAdd={() => setShowExpenseModal(true)}
                onRefresh={refresh}
                monthName={data.current_month.name}
              />
            </div>
            <div className="grid-col-1">
              <IncomeTable
                incomes={data.recent_incomes}
                onAdd={() => setShowIncomeModal(true)}
                onRefresh={refresh}
                monthName={data.current_month.name}
              />
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => navigate('/budgets')} style={{ color: '#10b981', border: '1px solid #10b981' }}>
                ⚙️ Manage Budgets & Categories
              </button>
            </div>
            <BudgetTable categories={data.categories} expanded />
            <MonthlyStats months={data.months} />
          </>
        )}

      </main>

      {/* Modals */}
      {showExpenseModal && (
        <AddExpenseModal
          categories={data.categories}
          onClose={() => setShowExpenseModal(false)}
          onSaved={refresh}
        />
      )}
      {showIncomeModal && (
        <AddIncomeModal
          onClose={() => setShowIncomeModal(false)}
          onSaved={refresh}
        />
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2026 SpendWise. Built with Django + React.</p>
      </footer>
    </div>
  )
}
