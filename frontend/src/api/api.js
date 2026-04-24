const API_BASE = '/api'

function getHeaders() {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Token ${token}`
  return headers
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: getHeaders(),
    ...options,
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw { status: res.status, data }
  }
  if (res.status === 204) return null
  return res.json()
}

// Auth
export const authAPI = {
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login/', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  me: () => request('/auth/me/'),
  updateProfile: (data) => request('/auth/update-profile/', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/auth/change-password/', { method: 'PUT', body: JSON.stringify(data) }),
}

// Dashboard
export const dashboardAPI = {
  get: (monthId = '') => request(monthId ? `/dashboard/?month_id=${monthId}` : '/dashboard/'),
}

// Expenses
export const expenseAPI = {
  list: (params = '') => request(`/expenses/${params}`),
  create: (data) => request('/expenses/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/expenses/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/expenses/${id}/`, { method: 'DELETE' }),
}

// Incomes
export const incomeAPI = {
  list: (params = '') => request(`/incomes/${params}`),
  create: (data) => request('/incomes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/incomes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/incomes/${id}/`, { method: 'DELETE' }),
}

// Categories
export const categoryAPI = {
  list: () => request('/categories/'),
  create: (data) => request('/categories/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}/`, { method: 'DELETE' }),
}

// Months
export const monthAPI = {
  list: () => request('/months/'),
  get: (id) => request(`/months/${id}/`),
}
