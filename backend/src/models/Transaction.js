const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  merchantName: { 
    type: String, 
    required: true 
  },
  upiId: { 
    type: String // Optional, but useful for categorization
  },
  category: { 
    type: String, 
    enum: ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Personal', 'Others', 'Uncategorized'], 
    default: 'Uncategorized' 
  },
  type: { 
    type: String, 
    enum: ['CREDIT', 'DEBIT'], 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED'], 
    required: true 
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
