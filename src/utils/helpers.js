export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return String(dateStr)
  }
}

export function getMonthlyReport(transactions, year, month) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)
  const filtered = transactions.filter((t) => {
    const d = typeof t.date === 'string' ? new Date(t.date) : new Date(t.date)
    return d >= start && d <= end
  })
  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const categoryTotals = {}
  filtered
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const name = t.categoryName || 'Uncategorized'
      categoryTotals[name] = (categoryTotals[name] || 0) + (Number(t.amount) || 0)
    })
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  return {
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    categoryTotals,
    highestSpendingCategory: entries[0] ? { name: entries[0][0], amount: entries[0][1] } : null,
  }
}

export function transactionsToCSV(transactions) {
  const headers = 'Date,Type,Category,Amount,Note,Payment Method\n'
  const rows = transactions.map((t) => {
    const date = formatDate(t.date)
    const note = (t.note || '').replace(/"/g, '""')
    const payment = (t.paymentMethod || '').replace(/"/g, '""')
    return `"${date}","${t.type}","${t.categoryName || ''}","${t.amount}","${note}","${payment}"`
  })
  return headers + rows.join('\n')
}
