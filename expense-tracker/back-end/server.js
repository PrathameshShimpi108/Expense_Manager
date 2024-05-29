


const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();
const PORT = 3000;
const SECRET_KEY = 'expenseTracker';

app.use(cors());
app.use(bodyParser.json());

let users = [];
let expenses = [];

if (fs.existsSync('back-end/data.json')) {
    const data = JSON.parse(fs.readFileSync('back-end/data.json'));
    users = data.users;
    expenses = data.expenses;
}

const saveData = () => {
    fs.writeFileSync('back-end/data.json', JSON.stringify({ users, expenses }));
};

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = { id: Date.now().toString(), email, password: hashedPassword };
    users.push(user);
    saveData();
    res.status(201).send(user);
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send({ message: 'Invalid email or password!' });
    }
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.send({ token });
});

const authenticate = (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        next();
    });
};

app.post('/expenses', authenticate, (req, res) => {
    const { category, amount, comments } = req.body;
    if (!category || !amount) {
        return res.status(400).send({ message: 'Category and amount are required!' });
    }

    const expense = { id: Date.now().toString(), category, amount, comments, userId: req.userId, created_at: new Date() };
    expenses.push(expense);
    saveData();
    res.status(201).send(expense);
});

app.get('/expenses', authenticate, (req, res) => {
    const userExpenses = expenses.filter(e => e.userId === req.userId);
    res.send(userExpenses);
});

app.put('/expenses/:id', authenticate, (req, res) => {
    const expense = expenses.find(e => e.id === req.params.id && e.userId === req.userId);
    if (!expense) {
        return res.status(404).send({ message: 'Expense not found!' });
    }
    Object.assign(expense, req.body);
    saveData();
    res.send(expense);
});

app.delete('/expenses/:id', authenticate, (req, res) => {
    const expenseIndex = expenses.findIndex(e => e.id === req.params.id && e.userId === req.userId);
    if (expenseIndex === -1) {
        return res.status(404).send({ message: 'Expense not found!' });
    }
    expenses.splice(expenseIndex, 1);
    saveData();
    res.send({ message: 'Expense deleted successfully!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
