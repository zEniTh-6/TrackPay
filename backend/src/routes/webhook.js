const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { categorizeTransaction } = require('../utils/categorize');

// POST /api/webhook
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not defined');
      return res.status(500).send('Webhook secret not configured');
    }

    // 1. Verify the Razorpay webhook signature
    // req.body is a raw buffer because of the express.raw() middleware in index.js
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(req.body);
    const digest = shasum.digest('hex');

    const signature = req.headers['x-razorpay-signature'];

    if (digest !== signature) {
      console.error('Webhook signature verification failed');
      return res.status(400).send('Invalid signature');
    }

    // 2. Parse the raw body to JSON after verification
    const payload = JSON.parse(req.body.toString());

    // 3. Handle 'payment.captured' event only
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;

      const amount = paymentEntity.amount / 100; // Convert from paise back to rupees
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const merchantName = (paymentEntity.notes && paymentEntity.notes.merchantName) 
        ? paymentEntity.notes.merchantName 
        : 'Unknown';
      const upiId = (paymentEntity.notes && paymentEntity.notes.upiId) 
        ? paymentEntity.notes.upiId 
        : null;

      // Duplicate transaction check
      const existing = await Transaction.findOne({ razorpayPaymentId });
      if (existing) {
        console.log('Duplicate webhook, skipping');
        return res.status(200).send('Duplicate event ignored');
      }

      // 4. Run auto-categorization logic
      const category = await categorizeTransaction(merchantName, upiId);

      // 5. Create and save a new Transaction document
      const newTransaction = new Transaction({
        amount,
        merchantName,
        upiId,
        category,
        type: 'DEBIT',
        status: 'SUCCESS',
        razorpayOrderId,
        razorpayPaymentId,
        date: new Date()
      });

      await newTransaction.save();
      console.log(`Transaction saved successfully for order: ${razorpayOrderId}`);
    }

    // 6. Return 200 status to Razorpay
    res.status(200).send('Webhook received successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
