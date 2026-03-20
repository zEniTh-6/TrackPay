import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// ─── Theme Data ───────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Food: '#E5A885',      // Warm Earth
  Travel: '#8DA7C1',    // Muted Sky
  Shopping: '#C79FBA',  // Dusty Rose
  Bills: '#DDC5A2',     // Sand
  Entertainment: '#BFA2D6', // Soft Lilac
  Personal: '#9DBF9E',  // Sage Green
  Others: '#B0B0B0',    // Gray
  Uncategorized: '#1A1A2E', // Dark Navy
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();

// ─── Component ────────────────────────────────────────────────────────────────
const ExpensesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  // States
  const [activeMonthIdx, setActiveMonthIdx] = useState(CURRENT_MONTH);
  const [activeChip, setActiveChip] = useState('All');

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [activeMonthIdx])
  );

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetching all transactions. 
      const res = await axios.get(`${API_BASE_URL}/api/transactions`);
      setData(res.data || []);
    } catch (err) {
      console.log('Error fetching transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Data Transformations ───────────────────────────────────────────────────
  // Filter by currently selected month & debit type only
  const monthlyExpenses = useMemo(() => {
    return data.filter(tx => {
      const d = new Date(tx.date);
      return tx.type === 'DEBIT' && d.getMonth() === activeMonthIdx && d.getFullYear() === CURRENT_YEAR;
    });
  }, [data, activeMonthIdx]);

  // Calculate Summaries
  const summaries = useMemo(() => {
    if (!monthlyExpenses.length) return { total: 0, peak: 0, dailyAvg: 0 };
    
    const total = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Group by day to find peak
    const dailyTotals = {};
    monthlyExpenses.forEach(t => {
      const day = new Date(t.date).getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + t.amount;
    });
    const peak = Math.max(...Object.values(dailyTotals), 0);
    
    // Daily Avg (assuming divided by current day of month)
    const daysPassed = (activeMonthIdx === CURRENT_MONTH) ? new Date().getDate() : 30;
    const dailyAvg = total / (daysPassed || 1);

    return { total, peak, dailyAvg };
  }, [monthlyExpenses, activeMonthIdx]);

  // Category Breakdown
  const categories = useMemo(() => {
    const breakdown = {};
    monthlyExpenses.forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });
    
    return Object.entries(breakdown)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: summaries.total > 0 ? ((amount / summaries.total) * 100).toFixed(0) : 0,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Others
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyExpenses, summaries.total]);

  // Filtered List for Timeline
  const timelineData = useMemo(() => {
    let list = monthlyExpenses;
    if (activeChip !== 'All') {
      list = list.filter(t => t.category === activeChip);
    }
    // Sort descending by date
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [monthlyExpenses, activeChip]);

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const formatCurrency = (val) => {
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${Math.round(val)}`;
  };
  
  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleString('en-US', options);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0EB" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Expenses</Text>
        <View style={s.monthSelector}>
          <TouchableOpacity 
             onPress={() => setActiveMonthIdx(prev => Math.max(0, prev - 1))}
             hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <Text style={s.monthArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthText}>{MONTHS[activeMonthIdx]} {CURRENT_YEAR}</Text>
          <TouchableOpacity 
             onPress={() => setActiveMonthIdx(prev => Math.min(11, prev + 1))}
             hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <Text style={s.monthArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Monthly Summary Row ─────────────────────────────────────────── */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { flex: 1.2 }]}>
            <Text style={s.cardEyebrow}>TOTAL SPENT</Text>
            <Text style={s.cardAmount}>{formatCurrency(summaries.total)}</Text>
          </View>
          <View style={s.summarySpacer} />
          <View style={[s.summaryCard, { flex: 1 }]}>
            <Text style={s.cardEyebrow}>PEAK DAY</Text>
            <Text style={s.cardAmount}>{formatCurrency(summaries.peak)}</Text>
          </View>
          <View style={s.summarySpacer} />
          <View style={[s.summaryCard, { flex: 1 }]}>
            <Text style={s.cardEyebrow}>DAILY AVG</Text>
            <Text style={s.cardAmount}>{formatCurrency(summaries.dailyAvg)}</Text>
          </View>
        </View>

        {/* ── Category Breakdown ──────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SPENDING BY CATEGORY</Text>
          
          <View style={s.card}>
            {categories.length === 0 && (
              <Text style={s.emptyText}>No spending recorded this month.</Text>
            )}
            
            {categories.map((cat, idx) => (
              <TouchableOpacity key={idx} style={s.catRow} activeOpacity={0.6}>
                <View style={s.catHeader}>
                  <Text style={s.catName}>{cat.name}</Text>
                  <Text style={s.catValue}>
                    ₹{cat.amount.toLocaleString('en-IN')} <Text style={s.catPercent}>({cat.percentage}%)</Text>
                  </Text>
                </View>
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Transaction List ────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>TRANSACTIONS</Text>
          
          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipContainer}>
            {['All', 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Personal'].map(chip => (
              <TouchableOpacity
                key={chip}
                style={[s.chip, activeChip === chip && s.chipActive]}
                onPress={() => setActiveChip(chip)}
              >
                <Text style={[s.chipText, activeChip === chip && s.chipTextActive]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* List */}
          <View style={[s.card, { paddingVertical: 10 }]}>
            {loading ? (
              <ActivityIndicator color="#1A1A2E" style={{ marginVertical: 30 }} />
            ) : timelineData.length === 0 ? (
              <Text style={s.emptyText}>No transactions found.</Text>
            ) : (
              timelineData.map((tx, idx) => (
                <View key={tx._id} style={s.txRow}>
                  <View style={[s.txDot, { backgroundColor: CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Others }]} />
                  <View style={s.txInfo}>
                    <Text style={s.txMerchant}>{tx.merchantName}</Text>
                    <Text style={s.txDate}>{formatDate(tx.date)}</Text>
                  </View>
                  <View style={s.txRight}>
                    <Text style={[
                      s.txAmount,
                      tx.type === 'DEBIT' ? { color: '#E05252' } : { color: '#1A1A2E' }
                    ]}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={s.txArrow}>↗</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      {/* ── Floating Add Button ───────────────────────────────────────────── */}
      <TouchableOpacity 
        style={s.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Pay')}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F0EB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C8F84',
    marginHorizontal: 12,
  },
  monthArrow: {
    fontSize: 18,
    color: '#9C8F84',
    lineHeight: 20,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
  },

  // Monthly Summary Row
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  summarySpacer: { width: 10 },
  cardEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#9C8F84',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#9C8F84',
    textTransform: 'uppercase',
    marginBottom: 14,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  emptyText: {
    color: '#9C8F84',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },

  // Category Row
  catRow: {
    marginBottom: 18,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  catValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  catPercent: {
    color: '#9C8F84',
    fontWeight: '400',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F5F0EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Filter Chips
  chipScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  chipContainer: {
    paddingHorizontal: 20,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#1A1A2E',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9C8F84',
  },
  chipTextActive: {
    color: '#F5F0EB',
    fontWeight: '600',
  },

  // Transaction Row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EB',
  },
  txDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txMerchant: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: '#9C8F84',
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginRight: 6,
  },
  txArrow: {
    fontSize: 12,
    color: '#9C8F84',
    fontWeight: '700',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#F5F0EB',
    fontWeight: '300',
    marginTop: -2,
  },
});

export default ExpensesScreen;
