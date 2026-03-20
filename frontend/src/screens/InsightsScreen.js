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
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const { width } = Dimensions.get('window');

// ─── Theme Data ───────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Food: '#E5A885',      // Warm Earth
  Travel: '#8DA7C1',    // Muted Sky
  Shopping: '#C79FBA',  // Dusty Rose
  Bills: '#DDC5A2',     // Sand
  Personal: '#9DBF9E',  // Sage Green
  Others: '#B0B0B0',    // Gray
  Uncategorized: '#1A1A2E', // Dark Navy
};

// ─── SVG Arc Helpers ─────────────────────────────────────────────────────────
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  // Prevent 360 degree issues by drawing two arcs if it's 360
  if (endAngle - startAngle >= 360) {
    const p1 = describeArc(x, y, radius, 0, 180);
    const p2 = describeArc(x, y, radius, 180, 360);
    return `${p1} ${p2}`;
  }
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

// ─── Component ────────────────────────────────────────────────────────────────
const InsightsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  // States
  const [activeTab, setActiveTab] = useState('Monthly'); // Weekly, Monthly, Yearly

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [activeTab])
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

  // ─── Data Transformations ───────────────────────────────────────────────────
  // Filter for Debits, and filter by selected timeframe relative to NOW
  const filteredData = useMemo(() => {
    const debits = data.filter(tx => tx.type === 'DEBIT');
    const now = new Date();
    
    return debits.filter(tx => {
      const d = new Date(tx.date);
      if (activeTab === 'Weekly') {
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      } else if (activeTab === 'Monthly') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (activeTab === 'Yearly') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [data, activeTab]);

  const totalSpent = useMemo(() => {
    return filteredData.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredData]);

  // 1. Line Chart Data (Trend)
  const lineChartData = useMemo(() => {
    if (!filteredData.length) return { points: [], maxAmount: 0 };
    
    // Group by Day (for Weekly/Monthly) or Month (for Yearly)
    const grouped = {};
    filteredData.forEach(tx => {
      const d = new Date(tx.date);
      let key = '';
      if (activeTab === 'Yearly') {
        key = d.toLocaleString('en-US', { month: 'short' });
      } else {
        key = d.getDate().toString();
      }
      grouped[key] = (grouped[key] || 0) + tx.amount;
    });

    // Create an ordered sequence based on activeTab
    let sequence = [];
    const now = new Date();
    
    if (activeTab === 'Weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        sequence.push(d.getDate().toString());
      }
    } else if (activeTab === 'Monthly') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        sequence.push(i.toString());
      }
    } else {
      sequence = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    const values = sequence.map(label => ({
      label,
      value: grouped[label] || 0
    }));

    const maxAmount = Math.max(...values.map(v => v.value), 100);
    return { sequence: values, maxAmount };
  }, [filteredData, activeTab]);

  // 2. Donut Chart Data (Categories)
  const donutData = useMemo(() => {
    const breakdown = {};
    filteredData.forEach(tx => {
      breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.amount;
    });
    
    let total = 0;
    const slices = Object.entries(breakdown).map(([name, amount]) => {
      total += amount;
      return { name, amount, color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Others };
    }).sort((a, b) => b.amount - a.amount);

    // Calculate angles
    let currentAngle = 0;
    const chartSlices = slices.map(slice => {
      const percentage = (slice.amount / total);
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;
      
      return { ...slice, percentage: (percentage * 100).toFixed(0), startAngle, endAngle };
    });

    return { slices: chartSlices, total };
  }, [filteredData]);

  // Top Category Insight
  const topCategory = donutData.slices[0];

  // ─── SVG Calculations ────────────────────────────────────────────────────────
  // Line Chart Math
  const CHART_WIDTH = width - 80;
  const CHART_HEIGHT = 160;
  
  const linePath = useMemo(() => {
    if (!lineChartData.sequence) return '';
    const { sequence, maxAmount } = lineChartData;
    if (sequence.length === 0) return '';
    
    const xStep = CHART_WIDTH / Math.max(sequence.length - 1, 1);
    
    const points = sequence.map((p, i) => {
      const x = i * xStep;
      // Invert Y axis
      const y = CHART_HEIGHT - ((p.value / maxAmount) * CHART_HEIGHT);
      return `${x},${y}`;
    });

    const d = points.map((p, i) => 
      i === 0 ? `M ${p}` : `L ${p}`
    ).join(' ');
    
    return d;
  }, [lineChartData]);
  
  // Create area path for gradient
  const areaPath = useMemo(() => {
    if (!linePath) return '';
    return `${linePath} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;
  }, [linePath, CHART_WIDTH]);

  // Donut Math
  const DONUT_SIZE = 220;
  const DONUT_RADIUS = 80;
  const DONUT_CENTER = DONUT_SIZE / 2;

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const formatCurrency = (val) => {
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${Math.round(val)}`;
  };

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1A1A2E" />
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0EB" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Insights</Text>
        
        {/* Toggle */}
        <View style={s.tabContainer}>
          {['Weekly', 'Monthly', 'Yearly'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={s.tabBtn}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Spending Trend Chart ────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SPENDING TREND</Text>
          <View style={s.card}>
            {filteredData.length === 0 ? (
              <Text style={s.emptyText}>No spending data for this period.</Text>
            ) : (
              <View style={s.chartContainer}>
                {/* Y Axis Labels Minimal */}
                <View style={s.yAxis}>
                  <Text style={s.axisText}>{formatCurrency(lineChartData.maxAmount)}</Text>
                  <Text style={s.axisText}>{formatCurrency(lineChartData.maxAmount / 2)}</Text>
                  <Text style={s.axisText}>₹0</Text>
                </View>
                
                <View style={s.svgWrapper}>
                  <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    <Defs>
                      <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#1A1A2E" stopOpacity="0.15" />
                        <Stop offset="1" stopColor="#1A1A2E" stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    {/* Area */}
                    <Path d={areaPath} fill="url(#grad)" />
                    {/* Line */}
                    <Path d={linePath} fill="none" stroke="#1A1A2E" strokeWidth="3" strokeLinejoin="round" />
                  </Svg>
                  
                  {/* X Axis Labels Minimal */}
                  <View style={s.xAxis}>
                    <Text style={s.axisText}>{lineChartData.sequence[0].label}</Text>
                    <Text style={s.axisText}>{lineChartData.sequence[Math.floor(lineChartData.sequence.length / 2)].label}</Text>
                    <Text style={s.axisText}>{lineChartData.sequence[lineChartData.sequence.length - 1].label}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Category Donut Chart ────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CATEGORY SPLIT</Text>
          <View style={s.card}>
            {donutData.slices.length === 0 ? (
              <Text style={s.emptyText}>No category data available.</Text>
            ) : (
              <>
                <View style={s.donutContainer}>
                  <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                    {/* Full grey circle as base in case of gaps (optional) */}
                    <Circle cx={DONUT_CENTER} cy={DONUT_CENTER} r={DONUT_RADIUS} fill="none" stroke="#F5F0EB" strokeWidth="26" />
                    
                    {/* Slices */}
                    {donutData.slices.map((slice, idx) => {
                      // Adjust to leave tiny gaps between slices
                      const gap = donutData.slices.length > 1 ? 1.5 : 0;
                      if (slice.endAngle - slice.startAngle <= gap) return null;
                      
                      const d = describeArc(DONUT_CENTER, DONUT_CENTER, DONUT_RADIUS, slice.startAngle + gap, slice.endAngle - gap);
                      return (
                        <Path 
                          key={idx} 
                          d={d} 
                          fill="none" 
                          stroke={slice.color} 
                          strokeWidth="26" 
                          strokeLinecap="round" 
                        />
                      );
                    })}
                  </Svg>
                  
                  {/* Center Text */}
                  <View style={s.donutCenterText}>
                    <Text style={s.donutTotalAmount}>₹{donutData.total.toLocaleString('en-IN')}</Text>
                    <Text style={s.donutTotalLabel}>Total Spent</Text>
                  </View>
                </View>

                {/* Legend */}
                <View style={s.legend}>
                  {donutData.slices.map((slice, idx) => (
                    <View key={idx} style={s.legendRow}>
                      <View style={[s.legendDot, { backgroundColor: slice.color }]} />
                      <Text style={s.legendName}>{slice.name}</Text>
                      <Text style={s.legendAmount}>₹{slice.amount.toLocaleString('en-IN')} <Text style={s.legendPercent}>({slice.percentage}%)</Text></Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Smart Insight Card ──────────────────────────────────────────── */}
        {topCategory && topCategory.amount > 0 && (
          <View style={s.insightCard}>
            <View style={[s.insightBorder, { backgroundColor: topCategory.color }]} />
            <Text style={s.insightIcon}>✨</Text>
            <Text style={s.insightText}>
              <Text style={{fontWeight: '700'}}>{topCategory.name}</Text> is your highest spending category this period, making up {topCategory.percentage}% of your total expenses.
            </Text>
          </View>
        )}

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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tabBtn: {
    marginRight: 24,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9C8F84',
  },
  tabTextActive: {
    color: '#1A1A2E',
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Sections
  section: {
    marginBottom: 32,
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
    padding: 24,
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

  // Trend Chart
  chartContainer: {
    flexDirection: 'row',
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 10,
    paddingBottom: 20, // offset for xAxis height
  },
  axisText: {
    fontSize: 10,
    color: '#9C8F84',
    fontWeight: '500',
  },
  svgWrapper: {
    flex: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  // Donut Chart
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  donutTotalLabel: {
    fontSize: 12,
    color: '#9C8F84',
    marginTop: 2,
  },

  // Legend
  legend: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F5F0EB',
    paddingTop: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  legendPercent: {
    color: '#9C8F84',
    fontWeight: '400',
  },

  // Insight Card
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  insightBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  insightIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 20,
  },
});

export default InsightsScreen;
