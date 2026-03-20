import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const CATEGORIES = [
  { name: 'Food', icon: '🍔' },
  { name: 'Travel', icon: '🚕' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Bills', icon: '💡' },
  { name: 'Personal', icon: '👤' },
  { name: 'Others', icon: '📦' },
];

const CategoryPopup = ({
  visible,
  transactionId,
  amount,
  merchantName,
  onClose,
  onCategorized,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setSelectedCategory(null);
      setLoading(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/categorize`, {
        transactionId,
        category: selectedCategory,
      });
      // Trigger parent callback on success to close and refresh list
      onCategorized();
    } catch (error) {
      console.log('Error categorizing:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        {/* Transparent touchable to dismiss modal when clicking outside */}
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        
        {/* Bottom Sheet Context */}
        <View style={s.bottomSheet}>
          
          {/* ── Drag Handle ── */}
          <View style={s.handleContainer}>
            <View style={s.dragHandle} />
          </View>

          {/* ── Header ── */}
          <Text style={s.title}>What was this for?</Text>
          <Text style={s.subtitle}>
            ₹{amount ? amount.toLocaleString('en-IN') : '0'} · {merchantName}
          </Text>

          {/* ── Category Grid (2x3) ── */}
          <View style={s.grid}>
            {CATEGORIES.map((cat, idx) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <View key={idx} style={s.gridItem}>
                  <TouchableOpacity
                    style={[s.catCard, isSelected && s.catCardSelected]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Text style={s.catIcon}>{cat.icon}</Text>
                    <Text style={[s.catName, isSelected && s.catNameSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* ── Confirm Button ── */}
          <TouchableOpacity
            style={[s.confirmBtn, !selectedCategory && s.confirmBtnDisabled]}
            disabled={!selectedCategory || loading}
            activeOpacity={0.8}
            onPress={handleConfirm}
          >
            {loading ? (
              <ActivityIndicator color="#F5F0EB" />
            ) : (
              <Text style={s.confirmBtnText}>CONFIRM CATEGORY →</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.4)', // Dimmed #1A1A2E
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#F5F0EB', // Warm cream
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingBottom: 40,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  
  // Handle
  handleContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  dragHandle: {
    width: 48,
    height: 6,
    backgroundColor: '#DDC5A2', // Sand from theme
    borderRadius: 3,
  },

  // Typography
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#9C8F84',
    marginBottom: 32,
    fontWeight: '500',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  catCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catCardSelected: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  catIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  catNameSelected: {
    color: '#F5F0EB',
  },

  // Button
  confirmBtn: {
    backgroundColor: '#1A1A2E',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    marginTop: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#E0DFDC', // Disabled gray
    shadowOpacity: 0,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F0EB',
    letterSpacing: 1.5,
  },
});

export default CategoryPopup;
