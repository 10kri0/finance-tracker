import { useState } from 'react'
import { expenseAPI, incomeAPI } from '../api/api'
import { downloadExcel, downloadPdf, hasExportableData } from '../utils/exportReport'

const total = (items) => items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

export default function CustomDownloadSection({ categories }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const download = async (format) => {
    if (!startDate || !endDate) {
      setMessage('Choose both a start date and an end date.')
      return
    }
    if (startDate > endDate) {
      setMessage('The start date must be before the end date.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const query = `?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
      const [expenses, incomes] = await Promise.all([expenseAPI.list(query), incomeAPI.list(query)])
      if (!hasExportableData({ recent_expenses: expenses, recent_incomes: incomes })) {
        setMessage('No income or expense data was found for this date range.')
        return
      }
      const expensesByCategory = expenses.reduce((totals, expense) => ({
        ...totals,
        [expense.category]: (totals[expense.category] || 0) + Number(expense.amount || 0),
      }), {})
      const reportCategories = categories.map((category) => ({
        ...category,
        expense_this_month: expensesByCategory[category.id] || 0,
        remaining_balance: Number(category.monthly_budget || 0) - (expensesByCategory[category.id] || 0),
      }))
      const incomeTotal = total(incomes)
      const expenseTotal = total(expenses)
      const report = {
        current_month: {
          name: `${startDate} to ${endDate}`,
          total_income: incomeTotal,
          total_expense: expenseTotal,
          cashflow: incomeTotal - expenseTotal,
          budget_usage: 0,
        },
        recent_expenses: expenses,
        recent_incomes: incomes,
        categories: reportCategories,
      }
      if (format === 'pdf') await downloadPdf(report)
      else await downloadExcel(report)
    } catch {
      setMessage('Unable to prepare the report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="custom-download-section" aria-labelledby="custom-download-title">
      <div className="custom-download-section__intro">
        <h2 id="custom-download-title">Custom date report</h2>
        <p>Select a date range, then download only the transactions in that period.</p>
      </div>
      <div className="custom-download-section__form">
        <label>Start date<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>End date<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
        <div className="custom-download-section__actions">
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => download('pdf')}>Download PDF</button>
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => download('excel')}>{loading ? 'Preparing…' : 'Download Excel'}</button>
        </div>
      </div>
      {message && <p className="custom-download-section__message" role="status">{message}</p>}
    </section>
  )
}
