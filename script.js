const API_BASE = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let expenses = []; // Global list of expenses
let editingExpenseId = null; // Tracks currently editing expense ID

// Redirect handling
if (token && window.location.pathname.endsWith('/index.html')) {
  window.location.href = 'dashboard.html';
} else if (!token && window.location.pathname.endsWith('/dashboard.html')) {
  window.location.href = 'index.html';
}

// Show register and login forms toggling
function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

// Login form submission
document.getElementById('login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.msg);
    }
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
});

// Register form submission
document.getElementById('register')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.msg);
    }
  } catch (err) {
    alert('Registration failed: ' + err.message);
  }
});

// Load dashboard data only on dashboard page
if (window.location.pathname.endsWith('/dashboard.html')) {
  loadDashboard();
}

// Load initial dashboard data (expenses, overview, charts)
async function loadDashboard() {
  await fetchExpenses();        // loads expenses into global 'expenses'
  displayExpenses(expenses);
  await loadOverview();
  loadCharts(expenses);
}

// Fetch expenses from backend and update global list
async function fetchExpenses() {
  try {
    const res = await fetch(`${API_BASE}/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    expenses = await res.json();
  } catch (err) {
    alert('Error loading expenses: ' + err.message);
    expenses = [];
  }
}

// Display expenses list on the page with Edit and Delete buttons
function displayExpenses(expenses) {
  const list = document.getElementById('expenses-list');
  list.innerHTML = '';
  expenses.forEach((exp) => {
    // Create list item with better styling
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center expense-item';
    li.innerHTML = `
      <div>
        <strong>${exp.category}</strong> - ₹${exp.amount.toFixed(2)}<br>
        <small class="text-muted">${exp.date}</small>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-warning me-2" onclick="startEditExpense('${exp._id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense('${exp._id}')">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Handler to start editing an expense
function startEditExpense(id) {
  const expense = expenses.find((e) => e._id === id);
  if (!expense) return alert('Expense not found');

  // Fill form with expense data
  document.getElementById('date').value = expense.date;
  document.getElementById('category').value = expense.category;
  document.getElementById('amount').value = expense.amount;

  editingExpenseId = id; // Store editing ID

  // Change form button text to "Update Expense"
  document.getElementById('add-expense-btn').textContent = 'Update Expense';
}

// Reset form to add mode
function resetForm() {
  document.getElementById('add-expense').reset();
  editingExpenseId = null;
  document.getElementById('add-expense-btn').textContent = 'Add Expense';
}

// Form submission for both Add and Edit mode
document.getElementById('add-expense').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const category = document.getElementById('category').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!date || !category || isNaN(amount) || amount <= 0) {
    return alert('Please enter valid date, category, and amount.');
  }

  try {
    if (editingExpenseId) {
      // Edit mode - send PUT request to update
      const res = await fetch(`${API_BASE}/expenses/${editingExpenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, category, amount }),
      });

      if (!res.ok) throw new Error('Failed to update expense');
      alert('Expense updated successfully');
    } else {
      // Add mode - send POST request to create new expense
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, category, amount }),
      });

      if (!res.ok) throw new Error('Failed to add expense');
      alert('Expense added successfully');
    }

    resetForm();
    await loadDashboard(); // reload all data
  } catch (err) {
    alert(err.message);
  }
});

// Delete expense by ID (Fixed: Added better error handling and logging)
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    console.log('Deleting expense with ID:', id); // Debug log
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Delete response status:', res.status); // Debug log
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete expense: ${res.status} - ${errorText}`);
    }

    alert('Expense deleted successfully');
    await loadDashboard(); // refresh list after deletion
  } catch (err) {
    console.error('Delete error:', err); // Debug log
    alert('Error deleting expense: ' + err.message);
  }
}

// Set income handler
async function setIncome() {
  const income = parseFloat(document.getElementById('income').value);
  if (isNaN(income) || income < 0) {
    return alert('Please enter a valid income');
  }

  try {
    const res = await fetch(`${API_BASE}/expenses/income`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ income }),
    });

    if (!res.ok) throw new Error('Failed to set income');
    alert('Income updated successfully');
    await loadOverview();
  } catch (err) {
    alert(err.message);
  }
}

// Load overview info: income, total expenses, savings, savings rate
async function loadOverview() {
  try {
    const incomeRes = await fetch(`${API_BASE}/expenses/income`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!incomeRes.ok) throw new Error('Failed to fetch income');

    const { income } = await incomeRes.json();

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const savings = income - totalExpenses;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(2) : 0;

    document.getElementById('overview').innerHTML = `
      <p><strong>Monthly Income:</strong> ₹${income.toFixed(2)}</p>
      <p><strong>Total Expenses:</strong> ₹${totalExpenses.toFixed(2)}</p>
      <p><strong>Savings:</strong> ₹${savings.toFixed(2)}</p>
      <p><strong>Savings Rate:</strong> ${savingsRate}%</p>
    `;
  } catch (err) {
    alert('Failed to load overview: ' + err.message);
  }
}

// Draw charts (Fixed for Chart.js v4: Proper destroy and initialization)
function loadCharts(expenses) {
  // Destroy existing charts if they exist (Chart.js v4 compatible)
  if (window.categoryChart && typeof window.categoryChart.destroy === 'function') {
    window.categoryChart.destroy();
  }
  if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
    window.monthlyChart.destroy();
  }

  // Calculate category totals
  const categoryData = {};
  expenses.forEach((exp) => {
    categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
  });

  // Category chart
  const ctxCat = document.getElementById('categoryChart');
  if (ctxCat) {
    window.categoryChart = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          label: 'Expenses by Category (₹)',
          data: Object.values(categoryData),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  // Calculate monthly totals
  const monthlyData = {};
  expenses.forEach((exp) => {
    const month = exp.date.substring(0, 7); // e.g. 2023-10
    monthlyData[month] = (monthlyData[month] || 0) + exp.amount;
  });

  // Monthly chart
  const ctxMon = document.getElementById('monthlyChart');
  if (ctxMon) {
    window.monthlyChart = new Chart(ctxMon, {
      type: 'line',
      data: {
        labels: Object.keys(monthlyData),
        datasets: [{
          label: 'Monthly Expenses (₹)',
          data: Object.values(monthlyData),
          fill: false,
          borderColor: 'rgba(255, 99, 132, 1)',
          tension: 0.1,
        }],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });
  }
}

// Logout user
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}
