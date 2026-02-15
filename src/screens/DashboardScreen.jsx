import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { formatCurrency, formatDate, getMonthlyReport } from '../utils/helpers'
import { colors, IMAGES } from '../theme'

const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Paytm', 'Google Pay', 'PhonePe', 'BHIM', 'Amazon Pay',
  'Credit Card', 'Debit Card', 'Net Banking', 'Bank Transfer', 'Cheque', 'Other',
]

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [filterType, setFilterType] = useState('all')

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [tx, cat, bud, alt] = await Promise.all([
        api.transactions.list(),
        api.categories.list(),
        api.budgets.list(new Date().getFullYear(), new Date().getMonth() + 1),
        api.budgets.alerts(),
      ])
      setTransactions(tx)
      setCategories(cat)
      setBudgets(bud)
      setAlerts(alt)
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const now = new Date()
  const report = getMonthlyReport(transactions, now.getFullYear(), now.getMonth() + 1)
  const recent = transactions
    .filter((t) => filterType === 'all' || t.type === filterType)
    .slice(0, 15)

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.transactions.delete(id)
          fetchData()
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={[styles.center, styles.container]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || 'User'}</Text>
            <Text style={styles.subtitle}>Here's your overview</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Image source={{ uri: IMAGES.dashboard }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>Balance</Text>
            <Text style={styles.heroAmount}>{formatCurrency(report.netSavings)}</Text>
            <Text style={styles.heroSub}>This month</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              {formatCurrency(report.totalIncome)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              {formatCurrency(report.totalExpense)}
            </Text>
          </View>
        </View>

        {alerts.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Budget Alert</Text>
            <Text style={styles.alertText}>
              {alerts.some((a) => a.type === 'exceeded')
                ? `${alerts.filter((a) => a.type === 'exceeded').map((a) => a.categoryName).join(', ')} exceeded`
                : `${alerts.map((a) => a.categoryName).join(', ')} approaching limit`}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.income }]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'income', onDone: fetchData })}
          >
            <Text style={styles.actionBtnText}>+ Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.expense }]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense', onDone: fetchData })}
          >
            <Text style={styles.actionBtnText}>+ Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <View style={styles.filterRow}>
              {['all', 'income', 'expense'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.filterBtn, filterType === t && styles.filterBtnActive]}
                  onPress={() => setFilterType(t)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filterType === t && styles.filterTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySub}>Add your first income or expense</Text>
            </View>
          ) : (
            recent.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.transactionRow}
                onPress={() =>
                  navigation.navigate('AddTransaction', {
                    type: t.type,
                    transaction: t,
                    onDone: fetchData,
                  })
                }
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionCat}>{t.categoryName || 'Uncategorized'}</Text>
                  <Text style={styles.transactionNote}>{t.note || formatDate(t.date)}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      t.type === 'income' ? styles.incomeText : styles.expenseText,
                    ]}
                  >
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(t.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  heroCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.primary,
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.3 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 118, 110, 0.85)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  heroAmount: { fontSize: 28, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  alertBox: {
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertTitle: { fontSize: 14, fontWeight: '600', color: colors.warning },
  alertText: { fontSize: 13, color: colors.text, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  section: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.bg,
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.textMuted },
  emptySub: { fontSize: 13, color: colors.textSubtle, marginTop: 4 },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionLeft: { flex: 1 },
  transactionCat: { fontSize: 15, fontWeight: '600', color: colors.text },
  transactionNote: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 15, fontWeight: '600' },
  incomeText: { color: colors.income },
  expenseText: { color: colors.expense },
  deleteText: { fontSize: 12, color: colors.expense, marginTop: 4 },
})
