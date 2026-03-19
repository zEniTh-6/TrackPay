const mongoose = require('mongoose');

const categoryMappingSchema = new mongoose.Schema({
  upiId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  merchantName: { 
    type: String 
  },
  merchantKeyword: {
    type: String,
    default: null
  },
  category: { 
    type: String, 
    enum: ['Food', 'Travel', 'Shopping', 'Bills', 'Personal', 'Others'],
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('CategoryMapping', categoryMappingSchema);
