import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { transactionsToCSV } from '../utils/helpers'
import { colors } from '../theme'

export default function SettingsScreen() {
  const { user, logout } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState({ expense: [], income: [] })
  const [budgets, setBudgets] = useState([])
  const [newExpenseCat, setNewExpenseCat] = useState('')
  const [newIncomeCat, setNewIncomeCat] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [tx, expCat, incCat, bud] = await Promise.all([
        api.transactions.list(),
        api.categories.list('expense'),
        api.categories.list('income'),
        api.budgets.list(new Date().getFullYear(), new Date().getMonth() + 1),
      ])
      setTransactions(tx)
      setCategories({ expense: expCat, income: incCat })
      setBudgets(bud)
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const { added } = await api.seed.run()
      fetchData()
      Alert.alert('Success', added > 0 ? `Added ${added} categories` : 'All categories exist')
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setSeeding(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const csv = transactionsToCSV(transactions)
      const filename = `expense-export-${new Date().toISOString().slice(0, 10)}.csv`
      const path = `${FileSystem.cacheDirectory}${filename}`
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      })
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: 'Export expenses as CSV',
        })
      } else {
        Alert.alert('Exported', `File saved to ${path}`)
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const addCategory = async (name, type) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await api.categories.create(trimmed, type)
      if (type === 'expense') setNewExpenseCat('')
      else setNewIncomeCat('')
      fetchData()
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || user?.email?.split('@')[0]}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.btnDisabled]}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.exportBtnText}>Download CSV</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup</Text>
          <TouchableOpacity
            style={[styles.seedBtn, seeding && styles.btnDisabled]}
            onPress={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.seedBtnText}>Load Default Categories</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          <View style={styles.tagRow}>
            {categories.expense.map((c) => (
              <View key={c.id} style={styles.tag}>
                <Text style={styles.tagText}>{c.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="New category"
              placeholderTextColor={colors.textSubtle}
              value={newExpenseCat}
              onChangeText={setNewExpenseCat}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addCategory(newExpenseCat, 'expense')}
              disabled={loading || !newExpenseCat.trim()}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Categories</Text>
          <View style={styles.tagRow}>
            {categories.income.map((c) => (
              <View key={c.id} style={[styles.tag, styles.tagIncome]}>
                <Text style={[styles.tagText, styles.tagTextIncome]}>{c.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="New category"
              placeholderTextColor={colors.textSubtle}
              value={newIncomeCat}
              onChangeText={setNewIncomeCat}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addCategory(newIncomeCat, 'income')}
              disabled={loading || !newIncomeCat.trim()}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 },
  section: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
  row: { marginBottom: 12 },
  label: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 15, color: colors.text, marginTop: 2 },
  exportBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  seedBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  seedBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnDisabled: { opacity: 0.7 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: {
    backgroundColor: colors.expenseBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagIncome: { backgroundColor: colors.incomeBg },
  tagText: { fontSize: 13, color: colors.expense, fontWeight: '500' },
  tagTextIncome: { color: colors.income },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  logoutBtn: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.expense,
  },
  logoutText: { color: colors.expense, fontWeight: '600' },
})
