// Main Application Logic
const app = {
    currentUser: null,
    currentDate: new Date(),
    
    // Store chart instances to destroy them before re-rendering
    charts: {
        dashDoughnut: null,
        catChart: null,
        trendChart: null
    },

    // 1. Initialization
    async init() {
        this.attachEventListeners();
        await this.checkSession();
        // Set default date for expense form
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    },

    attachEventListeners() {
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('expense-form').addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        document.getElementById('income-form').addEventListener('submit', (e) => this.saveIncome(e));
        
        // Listen to profile picture upload input if it exists
        const profileInput = document.getElementById('profile-pic-upload');
        if (profileInput) {
            profileInput.addEventListener('change', (e) => this.handleProfileUpload(e));
        }
    },

    getMonthKey(date = this.currentDate) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    },

    // Format currency to Indian Rupees
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    // 4. Notifications
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
        toast.innerHTML = `<i class="ph ${iconClass}"></i> <span>${message}</span>`;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // 5. Authentication Flow
    async checkSession() {
        try {
            const res = await fetch('backend/getUser.php');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success') {
                    this.currentUser = data.user;
                    this.startApp();
                }
            }
        } catch (e) {
            console.error("Session check failed");
        }
    },

    switchAuthMode(mode) {
        if (mode === 'login') {
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('signup-form').classList.add('hidden');
        } else {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('backend/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                this.showToast('Login successful!');
                // Check session immediately to load user setup
                await this.checkSession();
            } else {
                this.showToast(data.message || 'Invalid credentials', 'error');
            }
        } catch (e) {
            this.showToast('Server error', 'error');
        }
    },

    async handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;

        try {
            const res = await fetch('backend/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                this.showToast('Account created successfully! Please log in.');
                document.getElementById('signup-form').reset();
                this.switchAuthMode('login');
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (e) {
            this.showToast('Server error', 'error');
        }
    },

    async logout() {
        try {
            await fetch('backend/logout.php');
        } catch (e) {
            console.error(e);
        }

        this.currentUser = null;
        
        document.getElementById('app-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('login-form').reset();
    },

    // 6. Navigation & View Rendering
    startApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('display-username').textContent = this.currentUser.username;
        
        // Update profile picture if user has one
        this.updateProfilePicDisplay(this.currentUser.profile_pic);
        
        this.updateMonthDisplay();
        this.refreshData();
        this.switchView('dashboard');
    },

    updateProfilePicDisplay(path) {
        const urlOptions = path ? path : 'https://api.dicebear.com/7.x/initials/svg?seed=' + this.currentUser.username;
        const imgEl = document.getElementById('user-avatar-img');
        if (imgEl) {
            imgEl.src = urlOptions;
        }
    },

    async handleProfileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_pic', file);

        try {
            const res = await fetch('backend/uploadProfile.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                this.showToast('Profile picture updated!');
                this.currentUser.profile_pic = data.profile_pic;
                this.updateProfilePicDisplay(data.profile_pic);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (e) {
            this.showToast('Failed to upload', 'error');
        }
    },

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const targetView = document.getElementById(`view-${viewName}`);
        if(targetView) targetView.classList.remove('hidden');
        
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links li[data-view="${viewName}"]`);
        if(activeLink) activeLink.classList.add('active');
        
        if (viewName === 'analytics') {
            // Need data to re-draw
            this.refreshData();
        }
    },

    // 7. Month Management
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateMonthDisplay();
        this.refreshData();
    },

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateMonthDisplay();
        this.refreshData();
    },

    updateMonthDisplay() {
        const options = { month: 'long', year: 'numeric' };
        document.getElementById('current-month-display').textContent = this.currentDate.toLocaleDateString('en-US', options);
    },

    // 8. Income Management
    async editIncome() {
        const monthKey = this.getMonthKey();
        let currentIncome = 0;
        try {
            const res = await fetch(`backend/getIncome.php?month=${monthKey}`);
            const data = await res.json();
            if (data.status === 'success') currentIncome = data.income;
        } catch (e) {}

        document.getElementById('income-input').value = currentIncome || '';
        document.getElementById('modal-month-name').textContent = document.getElementById('current-month-display').textContent;
        document.getElementById('income-modal').classList.remove('hidden');
    },

    closeIncomeModal() {
        document.getElementById('income-modal').classList.add('hidden');
    },

    async saveIncome(e) {
        e.preventDefault();
        const val = parseFloat(document.getElementById('income-input').value);
        if (isNaN(val) || val < 0) {
            this.showToast('Please enter a valid positive number', 'error');
            return;
        }
        
        const monthKey = this.getMonthKey();

        try {
            const res = await fetch('backend/saveIncome.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: monthKey, amount: val })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                this.closeIncomeModal();
                this.refreshData();
                this.showToast('Income updated successfully');
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (e) {
            this.showToast('Server error', 'error');
        }
    },

    // 9. Core Application Data Refreshing via API
    async refreshData() {
        const monthKey = this.getMonthKey();
        
        let income = 0;
        let expenses = [];

        try {
            // Fetch Income parallel with Expenses
            const [incomeRes, expRes] = await Promise.all([
                fetch(`backend/getIncome.php?month=${monthKey}`),
                fetch(`backend/getExpenses.php?month=${monthKey}`)
            ]);
            
            const incomeData = await incomeRes.json();
            if (incomeData.status === 'success') income = parseFloat(incomeData.income);
            
            const expData = await expRes.json();
            if (expData.status === 'success') expenses = expData.expenses;
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
        }
        
        let totalExpenses = 0;
        expenses.forEach(e => totalExpenses += e.amount);
        
        const balance = income - totalExpenses;
        
        // Update DOM stats display using Indian Rupee format
        document.getElementById('display-income').textContent = this.formatCurrency(income);
        document.getElementById('dash-income').textContent = this.formatCurrency(income);
        document.getElementById('dash-expenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('dash-balance').textContent = this.formatCurrency(balance);
        
        if (balance < 0) {
            document.getElementById('dash-balance').style.color = 'var(--danger)';
        } else {
            document.getElementById('dash-balance').style.color = 'var(--text-main)';
        }
        
        // Re-render UI components
        this.renderRecentExpensesDash(expenses);
        this.renderExpensesTable(expenses);
        this.updateCharts(expenses);
    },

    // 10. Expenses CRUD Logic
    async handleExpenseSubmit(e) {
        e.preventDefault();
        
        const idInput = document.getElementById('expense-id').value;
        const title = document.getElementById('expense-title').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const category = document.getElementById('expense-category').value;

        if (amount <= 0 || isNaN(amount)) {
            this.showToast('Amount must be a positive number', 'error');
            return;
        }

        const payload = { title, amount, date, category };
        
        try {
            let endpoint = 'backend/addExpense.php';
            if (idInput) {
                payload.id = idInput;
                endpoint = 'backend/updateExpense.php';
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.status === 'success') {
                this.showToast(idInput ? 'Expense updated' : 'Expense added');
                this.resetExpenseForm();
                this.refreshData();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (e) {
            this.showToast('Failed to save expense', 'error');
        }
    },

    editExpense(id, title, amount, date, category) {
        document.getElementById('expense-id').value = id;
        document.getElementById('expense-title').value = title;
        document.getElementById('expense-amount').value = amount;
        document.getElementById('expense-date').value = date;
        document.getElementById('expense-category').value = category;
        
        document.getElementById('form-title').textContent = 'Edit Expense';
        document.getElementById('save-expense-btn').textContent = 'Update Expense';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';
        
        this.switchView('expenses');
        document.querySelector('.add-expense-panel').scrollIntoView({ behavior: 'smooth' });
    },

    async deleteExpense(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        
        try {
            const res = await fetch('backend/deleteExpense.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const data = await res.json();

            if (data.status === 'success') {
                this.showToast('Expense deleted');
                this.refreshData();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (e) {
            this.showToast('Server error', 'error');
        }
    },

    resetExpenseForm() {
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('form-title').textContent = 'Add Expense';
        document.getElementById('save-expense-btn').textContent = 'Add Expense';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    },

    cancelEdit() {
        this.resetExpenseForm();
    },

    // 11. Custom Rendering
    renderRecentExpensesDash(expenses) {
        const container = document.getElementById('dash-expense-list');
        container.innerHTML = '';
        
        if (expenses.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">No recent expenses found</p>';
            return;
        }
        
        const recent = [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        recent.forEach(exp => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <div class="exp-icon ${exp.category.toLowerCase()}"><i class="ph ph-receipt"></i></div>
                <div class="exp-details">
                    <h4>${exp.title}</h4>
                    <small>${new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</small>
                </div>
                <div class="exp-amount">-${this.formatCurrency(exp.amount)}</div>
            `;
            container.appendChild(div);
        });
    },

    renderExpensesTable(expenses) {
        const tbody = document.getElementById('expenses-table-body');
        tbody.innerHTML = '';
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">No expenses registered for this month</td></tr>';
            return;
        }
        
        const sorted = [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        sorted.forEach(exp => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</td>
                <td><strong>${exp.title}</strong></td>
                <td><span class="badge ${exp.category.toLowerCase()}">${exp.category}</span></td>
                <td class="amount">-${this.formatCurrency(exp.amount)}</td>
                <td class="actions">
                    <button class="btn-icon small text-primary" title="Edit" onclick="app.editExpense('${exp.id}', \`${exp.title.replace(/`/g, "\\`")}\`, ${exp.amount}, '${exp.date}', '${exp.category}')">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="btn-icon small text-danger" title="Delete" onclick="app.deleteExpense('${exp.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // 12. Chart.js Analytics Integrations
    async updateCharts(monthExpenses) {
        const categories = {};
        monthExpenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });
        
        const catLabels = Object.keys(categories);
        const catData = Object.values(categories);
        const bgColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#f472b6', '#06b6d4', '#94a3b8'];

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter, sans-serif';

        // 12.1 Dashboard Quick Doughnut Chart
        if (this.charts.dashDoughnut) this.charts.dashDoughnut.destroy();
        const ctxDash = document.getElementById('dash-doughnut-chart');
        if (ctxDash) {
            const ctxD = ctxDash.getContext('2d');
            if (catData.length === 0) {
                this.charts.dashDoughnut = new Chart(ctxD, {
                    type: 'doughnut',
                    data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#334155'], borderWidth: 0 }] },
                    options: { plugins: { tooltip: { enabled: false }, legend: { display: false } }, responsive:true, maintainAspectRatio:false }
                });
            } else {
                this.charts.dashDoughnut = new Chart(ctxD, {
                    type: 'doughnut',
                    data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: bgColors, borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { color: '#f8fafc', padding: 15 } } } }
                });
            }
        }

        // 12.2 Analytics View Detailed Category Pie Chart
        const ctxCatCanvas = document.getElementById('category-chart');
        if (ctxCatCanvas && !ctxCatCanvas.closest('.hidden')) {
            if (this.charts.catChart) this.charts.catChart.destroy();
            const ctxCat = ctxCatCanvas.getContext('2d');
            
            if (catData.length === 0) {
                this.charts.catChart = new Chart(ctxCat, {
                    type: 'pie',
                    data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#334155'], borderWidth: 0 }] },
                    options: { plugins: { tooltip: { enabled: false }, legend: { display: false } }, responsive:true, maintainAspectRatio:false }
                });
            } else {
                this.charts.catChart = new Chart(ctxCat, {
                    type: 'pie',
                    data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: bgColors, borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc', padding: 20 } } } }
                });
            }
            
            // Re-render multi-month chart if in analytics view
            await this.updateTrendChart();
        }
    },

    async updateTrendChart() {
        const labels = [];
        const incomes = [];
        const expensesData = [];
        
        // Loop over past 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - i, 1);
            const mKey = this.getMonthKey(d);
            labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            
            try {
                // To avoid holding up rendering too much we just fetch sequentially or parallel
                const [incRes, expRes] = await Promise.all([
                    fetch(`backend/getIncome.php?month=${mKey}`),
                    fetch(`backend/getExpenses.php?month=${mKey}`)
                ]);
                
                const incJson = await incRes.json();
                incomes.push(incJson.status === 'success' ? parseFloat(incJson.income) : 0);
                
                const expJson = await expRes.json();
                const expTotal = expJson.status === 'success' ? expJson.expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) : 0;
                expensesData.push(expTotal);

            } catch(e) {
                incomes.push(0);
                expensesData.push(0);
            }
        }

        if (this.charts.trendChart) this.charts.trendChart.destroy();
        const trendCanvas = document.getElementById('trend-chart');
        if (!trendCanvas) return;
        const ctxTrend = trendCanvas.getContext('2d');
        
        this.charts.trendChart = new Chart(ctxTrend, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income (₹)',
                        data: incomes,
                        backgroundColor: '#10b981',
                        borderRadius: 4,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    },
                    {
                        label: 'Expenses (₹)',
                        data: expensesData,
                        backgroundColor: '#ef4444',
                        borderRadius: 4,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: '#f8fafc', usePointStyle: true, boxWidth: 8 } },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                interaction: { mode: 'index', intersect: false }
            }
        });
    }
};

// Bootstrap App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
