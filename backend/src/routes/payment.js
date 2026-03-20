const express = require('express');
const router = express.Router();
const razorpayInstance = require('../utils/razorpay');

// POST /api/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, merchantName, upiId } = req.body;

    if (!amount || !merchantName) {
      return res.status(400).json({ error: 'amount and merchantName are required' });
    }

    // Razorpay uses paise, so multiply by 100
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        merchantName,
        upiId: upiId || ''
      }
    };

    const order = await razorpayInstance.orders.create(options);
    
    res.status(200).json({
      ...order,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

module.exports = router;
