const express = require('express');
const Expense = require('../models/Expense');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// Get all expenses for user
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add expense
router.post('/', auth, async (req, res) => {
  const { date, category, amount } = req.body;
  try {
    const expense = new Expense({ user: req.user.id, date, category, amount });
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  const { date, category, amount } = req.body;
  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense || expense.user.toString() !== req.user.id) return res.status(404).json({ msg: 'Expense not found' });

    expense.date = date;
    expense.category = category;
    expense.amount = amount;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete expense (Enhanced debugging)
router.delete('/:id', auth, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.id;
    console.log('Delete request - Expense ID:', expenseId, 'User ID:', userId);

    // Validate ID format
    if (!expenseId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format');
      return res.status(400).json({ msg: 'Invalid expense ID' });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      console.log('Expense not found in DB');
      return res.status(404).json({ msg: 'Expense not found' });
    }

    if (expense.user.toString() !== userId) {
      console.log('Unauthorized: Expense belongs to another user');
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await Expense.findByIdAndDelete(expenseId);
    console.log('Expense deleted successfully');
    res.json({ msg: 'Expense removed' });
  } catch (err) {
    console.error('Delete error:', err.message, 'Stack:', err.stack);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user income
router.get('/income', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ income: user.income });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Set user income
router.post('/income', auth, async (req, res) => {
  const { income } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.income = income;
    await user.save();
    res.json({ income: user.income });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;