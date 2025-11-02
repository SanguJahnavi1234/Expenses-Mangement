const expenseList = document.getElementById('expense-list');
const summaryList = document.getElementById('summary-list');
const form = document.getElementById('expense-form');

let currentDate = new Date();
let currentMonth = currentDate.getMonth() + 1; 
let currentYear = currentDate.getFullYear();

let pieChart, lineChart;

function loadExpenses(month, year) {
  fetch(`/expenses?month=${month}&year=${year}`)
    .then((res) => res.json())
    .then((data) => {
      displayExpenses(data);
      updateSummary(data);

      const { categoryTotals, dailyTotals } = prepareChartData(data);
      renderPieChart(categoryTotals);
      renderLineChart(dailyTotals);
    });
}
function displayExpenses(expenses) {
  expenseList.innerHTML = '';

  if (expenses.length === 0) {
    expenseList.innerHTML = `<tr><td colspan="5" style="text-align:center;">No expenses found for this month.</td></tr>`;
    return;
  }

  expenses.forEach((exp) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>₹${parseFloat(exp.amount).toFixed(2)}</td>
      <td>${exp.title || ''}</td>
      <td class="actions">
        <button class="edit" data-id="${exp.id}">Edit</button>
        <button class="delete" data-id="${exp.id}">Delete</button>
      </td>
    `;
    expenseList.appendChild(tr);
  });
  document.querySelectorAll('button.delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteExpense(id);
    });
  });
}

function updateSummary(expenses) {
  const totals = {};
  let totalSum = 0;

  expenses.forEach((exp) => {
    totals[exp.category] = (totals[exp.category] || 0) + parseFloat(exp.amount);
  });

  let html = '';
  Object.keys(totals).forEach((cat) => {
    html += `<li><strong>${cat}:</strong> ₹${totals[cat].toFixed(2)}</li>`;
    totalSum += totals[cat];
  });

  html = `<li><strong>Total Expenses:</strong> ₹${totalSum.toFixed(2)}</li>` + html;

  summaryList.innerHTML = html;
}
function prepareChartData(expenses) {
  const categoryTotals = {};
  const dailyTotals = {};

  expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount);
    dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + parseFloat(exp.amount);
  });

  return { categoryTotals, dailyTotals };
}

function renderPieChart(categoryTotals) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f1c40f',
            '#9b59b6',
            '#34495e',
            '#95a5a6',
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });
}

function renderLineChart(dailyTotals) {
  const ctx = document.getElementById('lineChart').getContext('2d');
  const dates = Object.keys(dailyTotals).sort();
  const data = dates.map((date) => dailyTotals[date]);

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Daily Spending (₹)',
          data,
          fill: false,
          borderColor: '#3498db',
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Amount (₹)' }, beginAtZero: true },
      },
    },
  });
}
function deleteExpense(id) {
  fetch(`/delete-expense/${id}`, { method: 'DELETE' })
    .then((res) => res.json())
    .then(() => {
      loadExpenses(currentMonth, currentYear);
    });
}
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value;

  if (!amount || !category || !date) {
    alert('Please fill in all required fields.');
    return;
  }

  
  const payload = {
    title: description,
    amount: amount,
    category: category,
    date: date,
  };

  fetch('/add-expense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      form.reset();
      loadExpenses(currentMonth, currentYear);
    });
});
loadExpenses(currentMonth, currentYear);
