import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WORKER_TRANSACTIONS = [
  { id: 1, title: 'Deep Cleaning', customer: 'Michael T.', date: 'Today', amount: 75, type: 'earning', status: 'paid' },
  { id: 2, title: 'Regular Cleaning', customer: 'Jennifer K.', date: 'Yesterday', amount: 50, type: 'earning', status: 'paid' },
  { id: 3, title: 'Move-In Cleaning', customer: 'Sarah M.', date: 'Mar 10', amount: 120, type: 'earning', status: 'paid' },
  { id: 4, title: 'Post-Party Cleaning', customer: 'Lisa R.', date: 'Mar 8', amount: 90, type: 'earning', status: 'paid' },
  { id: 5, title: 'XProHub Fee (10%)', customer: 'Platform', date: 'Mar 8', amount: 9, type: 'fee', status: 'deducted' },
  { id: 6, title: 'Deep Cleaning', customer: 'James W.', date: 'Mar 6', amount: 75, type: 'earning', status: 'paid' },
  { id: 7, title: 'XProHub Fee (10%)', customer: 'Platform', date: 'Mar 6', amount: 7.50, type: 'fee', status: 'deducted' },
  { id: 8, title: 'Payout to Bank', customer: 'Chase Bank', date: 'Mar 5', amount: 240, type: 'payout', status: 'sent' },
];

const CUSTOMER_TRANSACTIONS = [
  { id: 1, title: 'Deep Cleaning', worker: 'Sofia R.', date: 'Today', amount: 82.50, type: 'payment', status: 'escrowed', category: '🧹 Cleaning' },
  { id: 2, title: 'Regular Cleaning', worker: 'Sofia R.', date: 'Yesterday', amount: 55, type: 'payment', status: 'completed', category: '🧹 Cleaning' },
  { id: 3, title: 'Furniture Assembly', worker: 'James L.', date: 'Mar 10', amount: 50, type: 'payment', status: 'completed', category: '🔧 Repairs' },
  { id: 4, title: 'Grocery Delivery', worker: 'Carlos M.', date: 'Mar 8', amount: 25, type: 'payment', status: 'completed', category: '🛒 Errands' },
  { id: 5, title: 'Dog Walking', worker: 'Aisha M.', date: 'Mar 6', amount: 20, type: 'payment', status: 'completed', category: '🐾 Pet Care' },
  { id: 6, title: 'Deep Cleaning', worker: 'Sofia R.', date: 'Mar 4', amount: 82.50, type: 'payment', status: 'completed', category: '🧹 Cleaning' },
  { id: 7, title: 'WiFi Setup', worker: 'James L.', date: 'Mar 2', amount: 45, type: 'payment', status: 'completed', category: '💻 IT Help' },
];

export default function BookkeepingScreen() {
  const [activeMode, setActiveMode] = useState('customer');
  const [activePeriod, setActivePeriod] = useState('month');

  // Worker stats
  const workerGross = WORKER_TRANSACTIONS.filter(t => t.type === 'earning').reduce((s, t) => s + t.amount, 0);
  const workerFees = WORKER_TRANSACTIONS.filter(t => t.type === 'fee').reduce((s, t) => s + t.amount, 0);
  const workerNet = workerGross - workerFees;
  const workerPaidOut = WORKER_TRANSACTIONS.filter(t => t.type === 'payout').reduce((s, t) => s + t.amount, 0);

  // Customer stats
  const customerTotal = CUSTOMER_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  const customerJobs = CUSTOMER_TRANSACTIONS.length;
  const customerAvg = (customerTotal / customerJobs).toFixed(0);
  const customerEscrowed = CUSTOMER_TRANSACTIONS.filter(t => t.status === 'escrowed').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Menu Button */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 52, left: 20, zIndex: 99, backgroundColor: 'rgba(14,14,15,0.8)', borderWidth: 1, borderColor: '#2E2E33', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
        onPress={() => router.push('/dev-menu')}>
        <Text style={{ color: '#888890', fontSize: 12, fontWeight: '600' }}>🛠️ Dev</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookkeeping</Text>
        <Text style={styles.headerIcon}>📊</Text>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, activeMode === 'customer' && styles.modeBtnActive]}
          onPress={() => setActiveMode('customer')}>
          <Text style={[styles.modeBtnText, activeMode === 'customer' && styles.modeBtnTextActive]}>
            📋 As Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, activeMode === 'worker' && styles.modeBtnActive]}
          onPress={() => setActiveMode('worker')}>
          <Text style={[styles.modeBtnText, activeMode === 'worker' && styles.modeBtnTextActive]}>
            💼 As Worker
          </Text>
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
      <View style={styles.periodRow}>
        {['week', 'month', 'year'].map(period => (
          <TouchableOpacity
            key={period}
            style={[styles.periodBtn, activePeriod === period && styles.periodBtnActive]}
            onPress={() => setActivePeriod(period)}>
            <Text style={[styles.periodText, activePeriod === period && styles.periodTextActive]}>
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* CUSTOMER MODE */}
        {activeMode === 'customer' && (
          <View>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCardLarge}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryAmountLarge}>${customerTotal.toFixed(2)}</Text>
                <Text style={styles.summarySubLabel}>This month</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Jobs Hired</Text>
                  <Text style={styles.summaryAmount}>{customerJobs}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Avg Job Cost</Text>
                  <Text style={styles.summaryAmount}>${customerAvg}</Text>
                </View>
              </View>
            </View>

            {/* Escrowed Amount */}
            {customerEscrowed > 0 && (
              <View style={styles.escrowNotice}>
                <Text style={styles.escrowIcon}>🛡️</Text>
                <View style={styles.escrowInfo}>
                  <Text style={styles.escrowTitle}>In Escrow</Text>
                  <Text style={styles.escrowDesc}>Held securely until job completion</Text>
                </View>
                <Text style={styles.escrowAmount}>${customerEscrowed.toFixed(2)}</Text>
              </View>
            )}

            {/* Spending by Category */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SPENDING BY CATEGORY</Text>
              <View style={styles.categoryBreakdown}>
                {[
                  { cat: '🧹 Cleaning', amount: 220, percent: 59 },
                  { cat: '🔧 Repairs', amount: 50, percent: 14 },
                  { cat: '🛒 Errands', amount: 25, percent: 7 },
                  { cat: '🐾 Pet Care', amount: 20, percent: 5 },
                  { cat: '💻 IT Help', amount: 45, percent: 12 },
                ].map((item) => (
                  <View key={item.cat} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{item.cat}</Text>
                    <View style={styles.categoryBarBg}>
                      <View style={[styles.categoryBarFill, { width: `${item.percent}%` }]} />
                    </View>
                    <Text style={styles.categoryAmount}>${item.amount}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Transaction History */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>
              {CUSTOMER_TRANSACTIONS.map((t) => (
                <View key={t.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionIcon}>{t.category.split(' ')[0]}</Text>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{t.title}</Text>
                      <Text style={styles.transactionSub}>👷 {t.worker} · {t.date}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>-${t.amount.toFixed(2)}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: t.status === 'escrowed' ? 'rgba(201,168,76,0.1)' : 'rgba(76,175,122,0.1)' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: t.status === 'escrowed' ? '#C9A84C' : '#4CAF7A' }
                      ]}>
                        {t.status === 'escrowed' ? '🛡️ Escrowed' : '✓ Done'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Export */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>EXPORT</Text>
              <TouchableOpacity style={styles.exportBtn}>
                <Text style={styles.exportIcon}>📄</Text>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Download Spending Report</Text>
                  <Text style={styles.exportDesc}>PDF summary for your records</Text>
                </View>
                <Text style={styles.exportArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn}>
                <Text style={styles.exportIcon}>🧾</Text>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export for Tax Deductions</Text>
                  <Text style={styles.exportDesc}>Business services may be deductible</Text>
                </View>
                <Text style={styles.exportArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* WORKER MODE */}
        {activeMode === 'worker' && (
          <View>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCardLarge}>
                <Text style={styles.summaryLabel}>Net Earnings</Text>
                <Text style={styles.summaryAmountLarge}>${workerNet.toFixed(2)}</Text>
                <Text style={styles.summarySubLabel}>After XProHub fees</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Gross</Text>
                  <Text style={styles.summaryAmount}>${workerGross}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Paid Out</Text>
                  <Text style={styles.summaryAmount}>${workerPaidOut}</Text>
                </View>
              </View>
            </View>

            {/* Fee Breakdown */}
            <View style={styles.feeBreakdown}>
              <Text style={styles.feeTitle}>💡 Fee Breakdown</Text>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Gross Earnings</Text>
                <Text style={styles.feeValue}>${workerGross.toFixed(2)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>XProHub Fee (10%)</Text>
                <Text style={[styles.feeValue, { color: '#FF6B6B' }]}>-${workerFees.toFixed(2)}</Text>
              </View>
              <View style={[styles.feeRow, styles.feeTotal]}>
                <Text style={[styles.feeLabel, { color: '#C9A84C', fontWeight: '800' }]}>Net Earnings</Text>
                <Text style={[styles.feeValue, { color: '#C9A84C', fontWeight: '800' }]}>${workerNet.toFixed(2)}</Text>
              </View>
            </View>

            {/* Weekly Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>EARNINGS THIS WEEK</Text>
              <View style={styles.chart}>
                {[
                  { day: 'Mon', amount: 75, height: 50 },
                  { day: 'Tue', amount: 50, height: 33 },
                  { day: 'Wed', amount: 0, height: 0 },
                  { day: 'Thu', amount: 120, height: 80 },
                  { day: 'Fri', amount: 90, height: 60 },
                  { day: 'Sat', amount: 0, height: 0 },
                  { day: 'Sun', amount: 0, height: 0 },
                ].map((bar) => (
                  <View key={bar.day} style={styles.chartBar}>
                    <View style={styles.chartBarTrack}>
                      <View style={[styles.chartBarFill, { height: `${bar.height}%` }]} />
                    </View>
                    <Text style={styles.chartDay}>{bar.day}</Text>
                    {bar.amount > 0 && <Text style={styles.chartAmount}>${bar.amount}</Text>}
                  </View>
                ))}
              </View>
            </View>

            {/* Transaction History */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>
              {WORKER_TRANSACTIONS.map((t) => (
                <View key={t.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionIcon}>
                      {t.type === 'earning' ? '💰' : t.type === 'fee' ? '📊' : '🏦'}
                    </Text>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{t.title}</Text>
                      <Text style={styles.transactionSub}>
                        {t.type === 'earning' ? `👤 ${t.customer}` : t.customer} · {t.date}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: t.type === 'earning' ? '#4CAF7A' : t.type === 'payout' ? '#5599E0' : '#FF6B6B' }
                    ]}>
                      {t.type === 'earning' ? '+' : t.type === 'payout' ? '→' : '-'}${t.amount.toFixed(2)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: t.type === 'earning' ? 'rgba(76,175,122,0.1)' : t.type === 'payout' ? 'rgba(85,153,224,0.1)' : 'rgba(255,107,107,0.1)' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: t.type === 'earning' ? '#4CAF7A' : t.type === 'payout' ? '#5599E0' : '#FF6B6B' }
                      ]}>
                        {t.type === 'earning' ? '✓ Paid' : t.type === 'payout' ? '→ Sent' : '− Fee'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Export */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>EXPORT</Text>
              <TouchableOpacity style={styles.exportBtn}>
                <Text style={styles.exportIcon}>📄</Text>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export Earnings Report</Text>
                  <Text style={styles.exportDesc}>PDF for your records</Text>
                </View>
                <Text style={styles.exportArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn}>
                <Text style={styles.exportIcon}>📊</Text>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export as CSV</Text>
                  <Text style={styles.exportDesc}>For tax filing and spreadsheets</Text>
                </View>
                <Text style={styles.exportArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: { color: '#888890', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E8E8EA' },
  headerIcon: { fontSize: 20 },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#C9A84C',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#888890' },
  modeBtnTextActive: { color: '#0E0E0F' },

  // Period
  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  periodText: { fontSize: 12, color: '#888890', fontWeight: '600' },
  periodTextActive: { color: '#C9A84C' },

  // Summary
  summaryGrid: { padding: 16, gap: 10 },
  summaryCardLarge: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, color: '#888890', fontWeight: '600', letterSpacing: 1 },
  summaryAmountLarge: { fontSize: 42, fontWeight: '800', color: '#C9A84C', marginVertical: 4 },
  summarySubLabel: { fontSize: 11, color: '#444450' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  summaryAmount: { fontSize: 24, fontWeight: '800', color: '#C9A84C' },

  // Escrow
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  escrowIcon: { fontSize: 22 },
  escrowInfo: { flex: 1 },
  escrowTitle: { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  escrowDesc: { fontSize: 11, color: '#888890', marginTop: 2 },
  escrowAmount: { fontSize: 18, fontWeight: '800', color: '#C9A84C' },

  // Category Breakdown
  section: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 14,
  },
  categoryBreakdown: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryName: { fontSize: 12, color: '#E8E8EA', width: 110 },
  categoryBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#2E2E33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 3,
    opacity: 0.8,
  },
  categoryAmount: { fontSize: 12, color: '#C9A84C', fontWeight: '700', width: 40, textAlign: 'right' },

  // Transactions
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  transactionIcon: { fontSize: 22 },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },
  transactionSub: { fontSize: 11, color: '#888890', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', gap: 4 },
  transactionAmount: { fontSize: 15, fontWeight: '800', color: '#E8E8EA' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Fee Breakdown
  feeBreakdown: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    gap: 10,
  },
  feeTitle: { fontSize: 13, fontWeight: '700', color: '#C9A84C', marginBottom: 4 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeTotal: {
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
    paddingTop: 10,
    marginTop: 4,
  },
  feeLabel: { fontSize: 13, color: '#888890' },
  feeValue: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },

  // Chart
  chart: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    gap: 6,
  },
  chartBar: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1F1F22',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 6,
    opacity: 0.8,
  },
  chartDay: { fontSize: 9, color: '#888890' },
  chartAmount: { fontSize: 8, color: '#C9A84C', fontWeight: '700' },

  // Export
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  exportIcon: { fontSize: 22 },
  exportInfo: { flex: 1 },
  exportTitle: { fontSize: 14, fontWeight: '700', color: '#E8E8EA' },
  exportDesc: { fontSize: 12, color: '#888890', marginTop: 2 },
  exportArrow: { fontSize: 20, color: '#C9A84C' },
});