const CategoryMapping = require('../models/CategoryMapping');

const categorizeTransaction = async (merchantName, upiId) => {
  const nameToMatch = merchantName ? merchantName.toLowerCase() : '';

  // Step 1: Keyword matching
  if (nameToMatch.includes('swiggy') || nameToMatch.includes('zomato') || nameToMatch.includes('foodpanda')) {
    return 'Food';
  }
  if (nameToMatch.includes('uber') || nameToMatch.includes('ola') || nameToMatch.includes('rapido')) {
    return 'Travel';
  }
  if (nameToMatch.includes('amazon') || nameToMatch.includes('flipkart') || nameToMatch.includes('myntra')) {
    return 'Shopping';
  }
  if (nameToMatch.includes('electricity') || nameToMatch.includes('recharge') || 
      nameToMatch.includes('airtel') || nameToMatch.includes('jio') || nameToMatch.includes('bsnl')) {
    return 'Bills';
  }

  // Step 2: Check CategoryMapping collection by upiId
  if (upiId) {
    const mapping = await CategoryMapping.findOne({ upiId });
    if (mapping) {
      return mapping.category;
    }
  }

  // Step 3: Return Uncategorized if still no match
  return 'Uncategorized';
};

module.exports = { categorizeTransaction };
