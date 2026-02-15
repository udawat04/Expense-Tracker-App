import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { formatCurrency, getMonthlyReport } from '../utils/helpers'
import { colors } from '../theme'

export default function ReportsScreen() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const list = await api.transactions.list()
      setTransactions(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const report = getMonthlyReport(transactions, year, month + 1)
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const currentLabel = `${monthNames[month]} ${year}`

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    const now = new Date()
    if (month === now.getMonth() && year === now.getFullYear()) return
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  if (loading) {
    return (
      <View style={[styles.center, styles.container]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const entries = Object.entries(report.categoryTotals).sort((a, b) => b[1] - a[1])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Reports</Text>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth}>
            <Text style={styles.monthNavBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{currentLabel}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            disabled={month === new Date().getMonth() && year === new Date().getFullYear()}
          >
            <Text
              style={[
                styles.monthNavBtn,
                month === new Date().getMonth() && year === new Date().getFullYear() && styles.monthNavDisabled,
              ]}
            >
              →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Income</Text>
            <Text style={[styles.cardValue, { color: colors.income }]}>{formatCurrency(report.totalIncome)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Expenses</Text>
            <Text style={[styles.cardValue, { color: colors.expense }]}>{formatCurrency(report.totalExpense)}</Text>
          </View>
        </View>
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Net</Text>
            <Text style={[styles.cardValue, { color: report.netSavings >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(report.netSavings)}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Top Spend</Text>
            <Text style={styles.cardValueSmall} numberOfLines={1}>
              {report.highestSpendingCategory
                ? `${report.highestSpendingCategory.name}`
                : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No expenses this month</Text>
          ) : (
            entries.map(([name, amount]) => {
              const pct = report.totalExpense > 0 ? (amount / report.totalExpense) * 100 : 0
              return (
                <View key={name} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{name}</Text>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` }]} />
                    </View>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 20 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthNavBtn: { fontSize: 24, color: colors.primary, padding: 8 },
  monthNavDisabled: { opacity: 0.4 },
  monthLabel: { fontSize: 18, fontWeight: '600', color: colors.text },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 12, color: colors.textMuted },
  cardValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  cardValueSmall: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 4 },
  section: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: 20 },
  categoryRow: { marginBottom: 16 },
  categoryName: { fontSize: 14, fontWeight: '500', color: colors.text },
  categoryRight: { marginTop: 6 },
  categoryAmount: { fontSize: 14, color: colors.textMuted },
  barBg: {
    height: 6,
    backgroundColor: colors.bg,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
})
