const apiUrl = 'http://localhost:3000';
let token = '';

const register = async () => {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        alert('Registration successful!');
    } else {
        alert('Registration failed!');
    }
};

const login = async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        const data = await response.json();
        token = data.token;
        localStorage.setItem('token', token);
        document.getElementById('auth').style.display = 'none';
        document.getElementById('expenseManager').style.display = 'block';
        loadExpenses();
    } else {
        alert('Login failed!');
    }
};

const addExpense = async () => {
    const category = document.getElementById('category').value;
    const amount = document.getElementById('amount').value;
    const comments = document.getElementById('comments').value;

    if (!category || !amount) {
        alert('Category and amount are required!');
        return;
    }

    const response = await fetch(`${apiUrl}/expenses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        },
        body: JSON.stringify({ category, amount, comments }),
    });

    if (response.ok) {
        loadExpenses();
        document.getElementById('category').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('comments').value = '';
    } else {
        alert('Failed to add expense!');
    }
};

const loadExpenses = async () => {
    const response = await fetch(`${apiUrl}/expenses`, {
        headers: {
            'x-access-token': token,
        },
    });

    if (response.ok) {
        const expenses = await response.json();
        const expensesTableBody = document.getElementById('expensesTableBody');
        expensesTableBody.innerHTML = '';
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.category}</td>
                <td>${expense.amount}</td>
                <td>${new Date(expense.created_at).toLocaleString()}</td>
                <td>${expense.comments}</td>
                <td>
                    <button onclick="deleteExpense('${expense.id}')">Delete</button>
                </td>
            `;
            expensesTableBody.appendChild(row);
        });
    } else {
        alert('Failed to load expenses!');
    }
};

const deleteExpense = async (id) => {
    const response = await fetch(`${apiUrl}/expenses/${id}`, {
        method: 'DELETE',
        headers: {
            'x-access-token': token,
        },
    });

    if (response.ok) {
        loadExpenses();
    } else {
        alert('Failed to delete expense!');
    }
};

const logout = () => {
    token = '';
    localStorage.removeItem('token');
    document.getElementById('auth').style.display = 'block';
    document.getElementById('expenseManager').style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        token = savedToken;
        document.getElementById('auth').style.display = 'none';
        document.getElementById('expenseManager').style.display = 'block';
        loadExpenses();
    }
});
