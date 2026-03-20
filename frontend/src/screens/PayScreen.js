import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import API_BASE_URL from '../config/api';
import QRScanner from '../components/QRScanner';

// ─── Keypad config ────────────────────────────────────────────────────────────
const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

// ─── Component ────────────────────────────────────────────────────────────────
const PayScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('0');
  const [receiverName, setReceiverName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [receiverConfirmed, setReceiverConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  // ── Keypad handler ──────────────────────────────────────────────────────────
  const handleKey = (key) => {
    if (key === '⌫') {
      setAmount(prev => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }
    if (key === '.' && amount.includes('.')) return;

    let nextAmount = amount;
    if (amount === '0' && key !== '.') {
      nextAmount = key;
    } else {
      // Limit to 2 decimal places
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      nextAmount = amount + key;
    }

    // Check maximum limit
    if (parseFloat(nextAmount) > 100000) {
      Alert.alert('Limit Exceeded', 'You cannot send more than ₹1,00,000 per transaction.');
      return;
    }

    setAmount(nextAmount);
  };

  // ── Confirm receiver ────────────────────────────────────────────────────────
  const handleConfirmReceiver = () => {
    if (!receiverName.trim() && !upiId.trim()) {
      Alert.alert('Missing Info', 'Please enter a receiver name or UPI ID.');
      return;
    }
    setReceiverConfirmed(true);
  };

  // ── Handle QR Scan ──────────────────────────────────────────────────────────
  const handleQRScanned = (qrData) => {
    setScannerVisible(false); // dismiss camera first

    const params = {};
    const queryString = qrData.split('?')[1] || '';
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });

    const pa = params['pa'] || '';
    const pn = params['pn'] || '';

    if (!pa && !pn) {
      Alert.alert('Invalid QR', 'This QR does not contain a valid UPI link.');
      return;
    }

    setUpiId(pa);
    setReceiverName(pn);
    setReceiverConfirmed(true); // auto-confirm
  };

  // ── Pay via Razorpay ────────────────────────────────────────────────────────
  const handlePay = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!receiverConfirmed || (!receiverName.trim() && !upiId.trim())) {
      Alert.alert('Receiver Required', 'Please confirm a receiver before paying.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Razorpay order on backend
      const { data: order } = await axios.post(`${API_BASE_URL}/api/create-order`, {
        amount: numericAmount,
        merchantName: receiverName || upiId,
      });

      // Step 2: Open Razorpay checkout
      const options = {
        description: `Payment to ${receiverName || upiId}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: order.key_id,
        amount: order.amount,
        order_id: order.id,
        name: 'TrackPay',
        prefill: {
          email: 'user@trackpay.app',
          contact: '9999999999',
          name: 'Aryan',
        },
        theme: { color: '#4DA6FF' },
      };

      const paymentData = await RazorpayCheckout.open(options);
      // Payment success
      Alert.alert('Payment Successful! 🎉', `Payment ID: ${paymentData.razorpay_payment_id}`);
      navigation.navigate('Home');
    } catch (error) {
      if (error.code === 2) {
        // User dismissed the checkout
        console.log('Checkout dismissed');
      } else {
        Alert.alert('Payment Failed', error.description || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0EB" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Payment</Text>
        <View style={s.headerRight} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Receiver Card ───────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardEyebrow}>PAYING TO</Text>

          {receiverConfirmed ? (
            /* Confirmed receiver display */
            <View style={s.receiverRow}>
              <View style={s.receiverAvatar}>
                <Text style={s.receiverAvatarText}>
                  {(receiverName || upiId).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={s.receiverInfo}>
                <Text style={s.receiverName}>{receiverName || 'Unknown'}</Text>
                <Text style={s.receiverUpi}>{upiId || 'No UPI ID'}</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiverConfirmed(false)}>
                <Text style={s.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Receiver input form */
            <>
              <View style={s.inputRow}>
                <View style={s.inputIcon}><Text style={s.inputIconText}>◎</Text></View>
                <TextInput
                  style={s.input}
                  placeholder="Receiver name"
                  placeholderTextColor="#9C8F84"
                  value={receiverName}
                  onChangeText={setReceiverName}
                />
              </View>

              <View style={s.inputRow}>
                <View style={s.inputIcon}><Text style={s.inputIconText}>⊕</Text></View>
                <TextInput
                  style={s.input}
                  placeholder="UPI ID (e.g. name@upi)"
                  placeholderTextColor="#9C8F84"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirmReceiver}>
                <Text style={s.confirmBtnText}>CONFIRM RECEIVER →</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Scan QR */}
              <TouchableOpacity style={s.scanBtn} onPress={() => setScannerVisible(true)}>
                <Text style={s.scanIcon}>⊞</Text>
                <Text style={s.scanText}>Scan QR Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Amount Display ──────────────────────────────────────────────── */}
        <View style={s.amountSection}>
          <View style={s.amountRow}>
            <Text style={s.currencySymbol}>₹</Text>
            <Text style={s.amountText}>{amount}</Text>
          </View>
          <Text style={s.amountLabel}>ENTER AMOUNT</Text>
        </View>

        {/* ── Numeric Keypad ──────────────────────────────────────────────── */}
        <View style={s.keypad}>
          {KEYS.map((row, rIdx) => (
            <View key={rIdx} style={s.keyRow}>
              {row.map((key, kIdx) => (
                <TouchableOpacity
                  key={kIdx}
                  style={s.key}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                >
                  <Text style={key === '⌫' ? s.keyBackspace : s.keyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── Pay Button (fixed bottom) ───────────────────────────────────── */}
      <View style={s.payContainer}>
        <TouchableOpacity
          style={[s.payBtn, loading && { opacity: 0.7 }]}
          onPress={handlePay}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.payBtnText}>
              PAY ₹{parseFloat(amount) > 0 ? parseFloat(amount).toLocaleString('en-IN') : '0'} →
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <QRScanner
        visible={scannerVisible}
        onScanned={handleQRScanned}
        onClose={() => setScannerVisible(false)}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  backIcon: { fontSize: 20, color: '#1A1A2E', marginTop: -2 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700',
    color: '#1A1A2E', letterSpacing: -0.3,
  },
  headerRight: { width: 38 },

  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  // Receiver Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, padding: 20, marginBottom: 0,
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 28, elevation: 4,
  },
  cardEyebrow: {
    fontSize: 10, letterSpacing: 2.5, color: '#9C8F84',
    textTransform: 'uppercase', marginBottom: 14,
  },
  receiverRow: { flexDirection: 'row', alignItems: 'center' },
  receiverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  receiverAvatarText: { fontSize: 18, fontWeight: '700', color: '#F5F0EB' },
  receiverInfo: { flex: 1 },
  receiverName: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  receiverUpi: { fontSize: 13, color: '#9C8F84' },
  editBtn: { fontSize: 14, fontWeight: '600', color: '#4DA6FF' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#EDE8E3',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12, backgroundColor: '#FDFBF9',
  },
  inputIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0ECE8', justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  inputIconText: { fontSize: 14, color: '#9C8F84' },
  input: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },

  confirmBtn: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  confirmBtnText: {
    fontSize: 12, fontWeight: '700',
    color: '#F5F0EB', letterSpacing: 1.5,
  },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EDE8E3' },
  dividerText: { fontSize: 13, color: '#9C8F84', marginHorizontal: 12 },

  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#4DA6FF',
    borderRadius: 14, paddingVertical: 13,
  },
  scanIcon: { fontSize: 18, color: '#4DA6FF', marginRight: 8 },
  scanText: { fontSize: 14, fontWeight: '600', color: '#4DA6FF' },

  // Amount display
  amountSection: { alignItems: 'center', paddingVertical: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start' },
  currencySymbol: {
    fontSize: 24, fontWeight: '300', color: '#9C8F84',
    marginTop: 10, marginRight: 4,
  },
  amountText: {
    fontSize: 60, fontWeight: '700', color: '#1A1A2E',
    letterSpacing: -2,
  },
  amountLabel: {
    fontSize: 10, letterSpacing: 2.5, color: '#9C8F84',
    textTransform: 'uppercase', marginTop: 6,
  },

  // Keypad
  keypad: { marginTop: 4 },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    flex: 1, marginHorizontal: 6,
    height: 64, borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  keyText: { fontSize: 26, fontWeight: '600', color: '#1A1A2E' },
  keyBackspace: { fontSize: 20, fontWeight: '700', color: '#9C8F84' },

  // Pay button
  payContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 30,
    paddingTop: 12,
    backgroundColor: '#F5F0EB',
  },
  payBtn: {
    backgroundColor: '#1A1A2E',
    height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  payBtnText: {
    fontSize: 14, fontWeight: '700',
    color: '#F5F0EB',
    letterSpacing: 1.8,
  },
});

export default PayScreen;
