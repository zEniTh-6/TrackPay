const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const CategoryMapping = require('../models/CategoryMapping');

// GET /api/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { category, type, limit = 20 } = req.query;
    
    // Build query object
    const query = {};
    if (category) query.category = category;
    if (type) query.type = type;

    if (req.query.period) {
      const now = new Date();
      if (req.query.period === 'daily') {
        query.date = {
          $gte: new Date(now.setHours(0,0,0,0))
        };
      } else if (req.query.period === 'monthly') {
        query.date = {
          $gte: new Date(now.getFullYear(), 
                         now.getMonth(), 1)
        };
      }
    }

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .sort({ date: -1 }) // Newest first
      .limit(parseInt(limit, 10));

    res.status(200).json(transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/categorize
router.post('/categorize', async (req, res) => {
  try {
    const { transactionId, category } = req.body;

    if (!transactionId || !category) {
      return res.status(400).json({ error: 'transactionId and category are required' });
    }

    if (!category || category.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Category must be at least 2 characters' 
      });
    }

    // Update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { category },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If transaction has upiId, save/update CategoryMapping
    if (transaction.upiId) {
      await CategoryMapping.findOneAndUpdate(
        { upiId: transaction.upiId },
        { 
          category,
          merchantName: transaction.merchantName 
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error('Error categorizing transaction:', error);
    res.status(500).json({ error: 'Failed to categorize transaction' });
  }
});

module.exports = router;
