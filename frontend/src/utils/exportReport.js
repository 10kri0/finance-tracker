const currency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const displayDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '—'
const safeFilename = (monthName) => monthName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function reportData(data) {
  const month = data.current_month
  const expenses = data.recent_expenses || []
  const incomes = data.recent_incomes || []
  const categories = data.categories || []
  return {
    month, expenses, incomes, categories,
    filename: `spendwise-${safeFilename(month.name)}-report`,
    summary: [
      ['Total income', currency(month.total_income)],
      ['Total expenses', currency(month.total_expense)],
      ['Net cashflow', currency(month.cashflow)],
      ['Budget used', `${Math.min(Number(month.budget_usage || 0), 100).toFixed(0)}%`],
    ],
  }
}

function transactionRows(items, type) {
  return items.map((item) => [
    displayDate(item.date), item.name,
    type === 'Expense' ? item.category_name || 'Uncategorized' : item.source_display || item.source || 'Other',
    type === 'Expense' ? item.payment_method || '—' : '—', currency(item.amount),
  ])
}

export function hasExportableData(data) {
  return Boolean(data?.recent_expenses?.length || data?.recent_incomes?.length)
}

export async function downloadPdf(data) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const report = reportData(data)
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(99, 102, 241)
  pdf.rect(0, 0, pageWidth, 82, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(22)
  pdf.text('SpendWise Financial Report', 40, 43)
  pdf.setFontSize(11)
  pdf.text(report.month.name, 40, 64)
  pdf.setTextColor(30, 41, 59)
  autoTable(pdf, {
    startY: 102, head: [['Summary', 'Amount']], body: report.summary, theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 9, cellPadding: 7 },
  })
  const budgetStartY = pdf.lastAutoTable.finalY + 24
  pdf.setFontSize(14)
  pdf.text('Budget overview', 40, budgetStartY)
  autoTable(pdf, {
    startY: budgetStartY + 8,
    head: [['Category', 'Budget', 'Spent', 'Remaining']],
    body: report.categories.map((category) => [
      category.name,
      currency(category.monthly_budget),
      currency(category.expense_this_month),
      currency(category.category_type === 'BALANCE' ? category.remaining_balance : Number(category.monthly_budget) - Number(category.expense_this_month)),
    ]),
    theme: 'striped', headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8, cellPadding: 5 }, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  })
  const addTransactions = (title, items, type) => {
    const startY = pdf.lastAutoTable.finalY + 24
    pdf.setFontSize(14)
    pdf.text(title, 40, startY)
    autoTable(pdf, {
      startY: startY + 8,
      head: [['Date', 'Name', type === 'Expense' ? 'Category' : 'Source', type === 'Expense' ? 'Payment method' : 'Notes', 'Amount']],
      body: transactionRows(items, type), theme: 'striped',
      headStyles: { fillColor: type === 'Expense' ? [244, 63, 94] : [16, 185, 129] },
      styles: { fontSize: 8, cellPadding: 5 }, columnStyles: { 4: { halign: 'right' } },
    })
  }
  addTransactions('Income', report.incomes, 'Income')
  addTransactions('Expenses', report.expenses, 'Expense')
  pdf.save(`${report.filename}.pdf`)
}

export async function downloadExcel(data) {
  const XLSX = await import('xlsx')
  const report = reportData(data)
  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['SpendWise Financial Report'], [report.month.name], [], ['Metric', 'Value'], ...report.summary,
  ])
  summarySheet['!cols'] = [{ wch: 24 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  const budgetSheet = XLSX.utils.json_to_sheet(report.categories.map((category) => ({
    Category: category.name,
    Type: category.category_type === 'BALANCE' ? 'Balance' : 'Expense',
    Budget: Number(category.monthly_budget || 0),
    Spent: Number(category.expense_this_month || 0),
    Remaining: category.category_type === 'BALANCE'
      ? Number(category.remaining_balance || 0)
      : Number(category.monthly_budget || 0) - Number(category.expense_this_month || 0),
  })))
  budgetSheet['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget')
  const createTransactionSheet = (items, type) => {
    const rows = items.map((item) => ({
      Date: displayDate(item.date), Name: item.name,
      [type === 'Expense' ? 'Category' : 'Source']: type === 'Expense' ? item.category_name || 'Uncategorized' : item.source_display || item.source || 'Other',
      ...(type === 'Expense' ? { 'Payment Method': item.payment_method || '—' } : {}), Amount: Number(item.amount || 0),
    }))
    const headers = type === 'Expense'
      ? ['Date', 'Name', 'Category', 'Payment Method', 'Amount']
      : ['Date', 'Name', 'Source', 'Amount']
    const sheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([headers])
    sheet['!cols'] = headers.map((key) => ({ wch: Math.max(14, key.length + 3) }))
    return sheet
  }
  XLSX.utils.book_append_sheet(workbook, createTransactionSheet(report.incomes, 'Income'), 'Income')
  XLSX.utils.book_append_sheet(workbook, createTransactionSheet(report.expenses, 'Expense'), 'Expenses')
  XLSX.writeFile(workbook, `${report.filename}.xlsx`)
}
