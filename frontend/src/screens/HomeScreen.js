import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import CategoryPopup from '../components/CategoryPopup';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const CATEGORY_META = {
  Food:          { color: '#FFF4EC', letter: 'F', accent: '#E8873A' },
  Travel:        { color: '#EFF6FF', letter: 'T', accent: '#3B82F6' },
  Shopping:      { color: '#F5F3FF', letter: 'S', accent: '#7C3AED' },
  Bills:         { color: '#FFF1F2', letter: 'B', accent: '#E11D48' },
  Personal:      { color: '#F0FDF4', letter: 'P', accent: '#16A34A' },
  Others:        { color: '#F8FAFC', letter: 'O', accent: '#64748B' },
  Uncategorized: { color: '#F8FAFC', letter: '?', accent: '#94A3B8' },
};

const CONTACTS = [
  { id: '1', name: 'Sameer', initials: 'SK', bg: '#E8F0FE' },
  { id: '2', name: 'Priya',  initials: 'PA', bg: '#FCE8E9' },
  { id: '3', name: 'Rahul',  initials: 'RK', bg: '#FEF6E0' },
  { id: '4', name: 'Ananya', initials: 'AN', bg: '#E6F4EA' },
];

const ACTIONS = [
  { id: '1', label: 'Send',    symbol: '↗',  route: 'Pay',      bg: '#EEF2FF' },
  { id: '2', label: 'Receive', symbol: '↙',  route: 'Pay',      bg: '#F0FDF4' },
  { id: '3', label: 'Scan QR', symbol: '⊞',  route: 'Pay',      bg: '#F5F3FF' },
  { id: '4', label: 'History', symbol: '≡',  route: 'Expenses', bg: '#FFF7ED' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [uncategorizedTx, setUncategorizedTx] = useState(null);
  const balance = 12450.75;

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/transactions`);
      setTransactions(res.data);
      
      const uncategorized = res.data.find(tx => tx.category === 'Uncategorized');
      if (uncategorized) {
        setUncategorizedTx(uncategorized);
        setPopupVisible(true);
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const todaySpent = transactions
    .filter(tx => tx.type === 'DEBIT' && new Date(tx.date).toDateString() === new Date().toDateString())
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0EB" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.greetLabel}>{getGreeting()}</Text>
            <Text style={s.greetName}>Aryan</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconPill}>
              <Text style={s.iconPillText}>🔔</Text>
            </TouchableOpacity>
            <View style={s.avatar}>
              <Text style={s.avatarText}>AR</Text>
            </View>
          </View>
        </View>

        {/* ── Balance Card ────────────────────────────────────────────────── */}
        <View style={s.card}>
          {/* Decorative blurred orb */}
          <View style={s.orb} />

          <Text style={s.cardEyebrow}>TOTAL BALANCE</Text>

          <View style={s.balanceRow}>
            <Text style={s.balanceSymbol}>₹</Text>
            <Text style={s.balanceMain}>12,450</Text>
            <Text style={s.balanceCents}>.75</Text>
          </View>

          <View style={s.balanceDivider} />

          <View style={s.cardFooter}>
            <View>
              <Text style={s.cardFooterLabel}>TODAY SPENT</Text>
              <Text style={s.cardFooterValue}>₹{todaySpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.growthPill}>
              <Text style={s.growthText}>↑ 2.4% this month</Text>
            </View>
          </View>

          {/* Sparkline */}
          <View style={s.sparkRow}>
            {[18, 30, 22, 44, 36, 54, 42].map((h, i) => (
              <View key={i} style={[s.sparkBar, { height: h, opacity: 0.18 + i * 0.12 }]} />
            ))}
          </View>
        </View>

        {/* ── Quick Actions ───────────────────────────────────────────────── */}
        <View style={s.actionsCard}>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.id}
              style={s.actionBtn}
              onPress={() => navigation.navigate(a.route)}
              activeOpacity={0.75}
            >
              <View style={[s.actionIcon, { backgroundColor: a.bg }]}>
                <Text style={s.actionSymbol}>{a.symbol}</Text>
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Transfers ────────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Recent Transfers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pay')}>
              <Text style={s.sectionLink}>Manage</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={s.contact} onPress={() => navigation.navigate('Pay')}>
              <View style={[s.contactAvatar, s.contactAvatarNew]}>
                <Text style={s.contactNewIcon}>＋</Text>
              </View>
              <Text style={s.contactName}>New</Text>
            </TouchableOpacity>
            {CONTACTS.map(c => (
              <TouchableOpacity key={c.id} style={s.contact}>
                <View style={[s.contactAvatar, { backgroundColor: c.bg }]}>
                  <Text style={s.contactInitials}>{c.initials}</Text>
                </View>
                <Text style={s.contactName}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Recent Transactions ─────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={s.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#1A1A2E" size="large" style={{ marginTop: 24 }} />
          ) : transactions.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>No transactions yet</Text>
              <Text style={s.emptyBody}>Complete a payment to see your history here.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Pay')}>
                <Text style={s.emptyBtnText}>MAKE A PAYMENT →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.slice(0, 5).map(tx => {
              const meta = CATEGORY_META[tx.category] || CATEGORY_META.Others;
              const isDebit = tx.type === 'DEBIT';
              return (
                <View key={tx._id} style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: meta.color }]}>
                    <Text style={[s.txLetter, { color: meta.accent }]}>{meta.letter}</Text>
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txName}>{tx.merchantName}</Text>
                    <Text style={s.txMeta}>
                      {tx.category}  ·  {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[s.txAmount, { color: isDebit ? '#E11D48' : '#16A34A' }]}>
                    {isDebit ? '−' : '+'} ₹{tx.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      <CategoryPopup 
        visible={popupVisible}
        transactionId={uncategorizedTx?._id}
        amount={uncategorizedTx?.amount}
        merchantName={uncategorizedTx?.merchantName}
        onClose={() => setPopupVisible(false)}
        onCategorized={() => {
          setPopupVisible(false);
          fetchTransactions();
        }}
      />
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
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 52 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  greetLabel: { fontSize: 12, letterSpacing: 1.8, color: '#9C8F84', textTransform: 'uppercase', marginBottom: 3 },
  greetName: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconPill: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  iconPillText: { fontSize: 16 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#F5F0EB', letterSpacing: 0.5 },

  // Balance Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
  orb: {
    position: 'absolute', right: -50, top: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#F5F0EB',
    opacity: 0.9,
  },
  cardEyebrow: {
    fontSize: 10, letterSpacing: 2.5, color: '#9C8F84',
    textTransform: 'uppercase', marginBottom: 10,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  balanceSymbol: { fontSize: 22, fontWeight: '300', color: '#1A1A2E', marginTop: 6, marginRight: 2 },
  balanceMain: { fontSize: 44, fontWeight: '700', color: '#1A1A2E', letterSpacing: -1.5 },
  balanceCents: { fontSize: 22, fontWeight: '300', color: '#9C8F84', marginTop: 18 },
  balanceDivider: { height: 1, backgroundColor: '#F0ECE8', marginVertical: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  cardFooterLabel: { fontSize: 10, letterSpacing: 1.8, color: '#9C8F84', textTransform: 'uppercase', marginBottom: 4 },
  cardFooterValue: { fontSize: 18, fontWeight: '600', color: '#1A1A2E' },
  growthPill: {
    backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  growthText: { fontSize: 12, fontWeight: '600', color: '#16A34A' },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  sparkBar: { width: 7, backgroundColor: '#1A1A2E', borderRadius: 4 },

  // Actions
  actionsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 28,
    justifyContent: 'space-between',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 50, height: 50, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionSymbol: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  actionLabel: { fontSize: 11, fontWeight: '500', color: '#6B7280', letterSpacing: 0.3 },

  // Sections
  section: { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', letterSpacing: -0.2 },
  sectionLink: { fontSize: 13, fontWeight: '600', color: '#6B7280', letterSpacing: 0.3 },

  // Contacts
  contact: { alignItems: 'center', marginRight: 18 },
  contactAvatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginBottom: 7,
  },
  contactAvatarNew: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#D1C7BE', borderStyle: 'dashed',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  contactNewIcon: { fontSize: 20, color: '#9C8F84', fontWeight: '300' },
  contactInitials: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  contactName: { fontSize: 11, fontWeight: '500', color: '#9C8F84' },

  // Transactions
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 15, marginBottom: 10,
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  txIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txLetter: { fontSize: 16, fontWeight: '700' },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  txMeta: { fontSize: 12, color: '#9C8F84' },
  txAmount: { fontSize: 15, fontWeight: '700' },

  // Empty state
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, padding: 32,
    alignItems: 'center',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  emptyBody: { fontSize: 13, color: '#9C8F84', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#1A1A2E', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 11, fontWeight: '700', color: '#F5F0EB', letterSpacing: 1.5 },
});

export default HomeScreen;
