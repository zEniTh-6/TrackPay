import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Toggles state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/transactions`);
      setData(res.data || []);
    } catch (err) {
      console.log('Error fetching transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Stats Calculations ───────────────────────────────────────────────────
  // Debits only for spending stats
  const debits = data.filter(tx => tx.type === 'DEBIT');

  const totalTxns = data.length;
  const totalSpent = debits.reduce((sum, tx) => sum + tx.amount, 0);

  const thisMonthSpent = debits.filter(tx => {
    const d = new Date(tx.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, tx) => sum + tx.amount, 0);

  // Formatting helper
  const formatCurrency = (val) => {
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0EB" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Card ────────────────────────────────────────────────── */}
        <View style={s.profileContainer}>
          <View style={s.avatarWrapper}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>IS</Text>
            </View>
            <TouchableOpacity style={s.editBadge} activeOpacity={0.8}>
              <Text style={s.editBadgeIcon}>✎</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.profileName}>Ishaan</Text>
          <Text style={s.profileEmail}>ishaan@trackpay.app</Text>
        </View>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statEyebrow}>TOTAL TXNS</Text>
            {loading ? (
              <ActivityIndicator color="#1A1A2E" size="small" />
            ) : (
              <Text style={s.statValue}>{totalTxns}</Text>
            )}
          </View>
          <View style={s.statSpacer} />

          <View style={s.statCard}>
            <Text style={s.statEyebrow}>TOTAL SPENT</Text>
            {loading ? (
              <ActivityIndicator color="#1A1A2E" size="small" />
            ) : (
              <Text style={s.statValue}>{formatCurrency(totalSpent)}</Text>
            )}
          </View>
          <View style={s.statSpacer} />

          <View style={s.statCard}>
            <Text style={s.statEyebrow}>THIS MONTH</Text>
            {loading ? (
              <ActivityIndicator color="#1A1A2E" size="small" />
            ) : (
              <Text style={s.statValue}>{formatCurrency(thisMonthSpent)}</Text>
            )}
          </View>
        </View>

        {/* ── Settings Section ────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PREFERENCES</Text>

          <View style={s.settingsCard}>
            {/* Notifications */}
            <View style={s.settingRow}>
              <View style={s.settingIconWrapper}>
                <Text style={s.settingIcon}>🔔</Text>
              </View>
              <Text style={s.settingLabel}>Notifications</Text>
              <Switch
                trackColor={{ false: '#E0DFDC', true: '#1A1A2E' }}
                thumbColor={'#FFFFFF'}
                onValueChange={setNotificationsEnabled}
                value={notificationsEnabled}
              />
            </View>

            <View style={s.settingDivider} />

            {/* Dark Mode */}
            <View style={s.settingRow}>
              <View style={s.settingIconWrapper}>
                <Text style={s.settingIcon}>🌙</Text>
              </View>
              <Text style={s.settingLabel}>Dark Mode</Text>
              <Switch
                trackColor={{ false: '#E0DFDC', true: '#1A1A2E' }}
                thumbColor={'#FFFFFF'}
                onValueChange={setDarkModeEnabled}
                value={darkModeEnabled}
              />
            </View>

            <View style={s.settingDivider} />

            {/* Currency */}
            <View style={s.settingRow}>
              <View style={s.settingIconWrapper}>
                <Text style={s.settingIcon}>💰</Text>
              </View>
              <Text style={s.settingLabel}>Currency</Text>
              <Text style={s.settingValueText}>INR (₹)</Text>
            </View>
          </View>
        </View>

        {/* ── Support Section ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SUPPORT</Text>

          <View style={s.settingsCard}>
            {/* Help */}
            <TouchableOpacity style={s.settingRow} activeOpacity={0.6}>
              <View style={s.settingIconWrapper}>
                <Text style={s.settingIcon}>❓</Text>
              </View>
              <Text style={s.settingLabel}>Help & FAQ</Text>
              <Text style={s.settingChevron}>›</Text>
            </TouchableOpacity>

            <View style={s.settingDivider} />

            {/* Rate */}
            <TouchableOpacity style={s.settingRow} activeOpacity={0.6}>
              <View style={s.settingIconWrapper}>
                <Text style={s.settingIcon}>⭐</Text>
              </View>
              <Text style={s.settingLabel}>Rate the App</Text>
              <Text style={s.settingChevron}>›</Text>
            </TouchableOpacity>

            <View style={s.settingDivider} />

            {/* Contact */}
            <TouchableOpacity style={s.settingRow} activeOpacity={0.6}>
              <View style={s.settingIconWrapper}>
                <Text style={s.settingIcon}>📧</Text>
              </View>
              <Text style={s.settingLabel}>Contact Us</Text>
              <Text style={s.settingChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── App Info ────────────────────────────────────────────────────── */}
        <View style={s.appInfoContainer}>
          <Text style={s.appInfoText}>TrackPay v1.0.0</Text>
        </View>

      </ScrollView>
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
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Profile
  profileContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F5F0EB',
    letterSpacing: 1,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editBadgeIcon: {
    fontSize: 16,
    color: '#1A1A2E',
    marginTop: -2,
    marginLeft: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9C8F84',
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: 36,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  statSpacer: { width: 12 },
  statEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#9C8F84',
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.5,
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
    marginBottom: 12,
    marginLeft: 8,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIcon: {
    fontSize: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  settingValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C8F84',
  },
  settingChevron: {
    fontSize: 20,
    color: '#D1C7BE',
    lineHeight: 20,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F0ECE8',
    marginLeft: 72,
  },

  // App Info
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9C8F84',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
