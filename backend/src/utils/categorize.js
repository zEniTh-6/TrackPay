const CategoryMapping = require('../models/CategoryMapping');

const categorizeTransaction = async (merchantName, upiId) => {
  const stringToSearch = `${merchantName || ''} ${upiId || ''}`.toLowerCase();

  // Step 1: Keyword matching
  if (['swiggy', 'zomato', 'foodpanda', 'dominos', 'mcdonalds', 'kfc', 'subway', 'starbucks', 'blinkit', 'zepto', 'bigbasket', 'grofers', 'instamart', 'dunzo'].some(kw => stringToSearch.includes(kw))) {
    return 'Food';
  }
  if (['uber', 'ola', 'rapido', 'redbus', 'irctc', 'makemytrip', 'goibibo', 'yatra', 'ixigo', 'meru', 'zoomcar'].some(kw => stringToSearch.includes(kw))) {
    return 'Travel';
  }
  if (['amazon', 'flipkart', 'myntra', 'meesho', 'snapdeal', 'nykaa', 'ajio', 'tatacliq', 'jiomart', 'dmart'].some(kw => stringToSearch.includes(kw))) {
    return 'Shopping';
  }
  if (['electricity', 'recharge', 'airtel', 'jio', 'bsnl', 'bescom', 'tatapower', 'adani', 'vodafone', 'fastag', 'lpg', 'mahanagar gas'].some(kw => stringToSearch.includes(kw))) {
    return 'Bills';
  }
  if (['netflix', 'spotify', 'hotstar', 'primevideo', 'youtube', 'zee5', 'sonyliv', 'bookmyshow'].some(kw => stringToSearch.includes(kw))) {
    return 'Entertainment';
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
