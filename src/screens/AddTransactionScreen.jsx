import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../services/api'
import { formatCurrency } from '../utils/helpers'
import { colors } from '../theme'

const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Paytm', 'Google Pay', 'PhonePe', 'BHIM', 'Amazon Pay',
  'Credit Card', 'Debit Card', 'Net Banking', 'Bank Transfer', 'Cheque', 'Other',
]

export default function AddTransactionScreen({ route, navigation }) {
  const { type = 'expense', transaction, onDone } = route.params || {}
  const isEdit = !!transaction

  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCat, setLoadingCat] = useState(true)
  const [categoryModal, setCategoryModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const list = await api.categories.list(type)
        setCategories(list)
      } catch (err) {
        Alert.alert('Error', err.message)
      } finally {
        setLoadingCat(false)
      }
    })()
  }, [type])

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount))
      setCategoryId(transaction.categoryId || '')
      setCategoryName(transaction.categoryName || '')
      setNote(transaction.note || '')
      setDate(
        typeof transaction.date === 'string'
          ? transaction.date.slice(0, 10)
          : new Date(transaction.date).toISOString().slice(0, 10)
      )
      setPaymentMethod(transaction.paymentMethod || '')
    }
  }, [transaction])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount')
      return
    }
    if (!categoryId) {
      Alert.alert('Error', 'Select a category')
      return
    }
    setLoading(true)
    try {
      const payload = {
        type,
        amount: amt,
        categoryId,
        categoryName: categoryName || 'Uncategorized',
        note: note.trim(),
        date,
        paymentMethod: paymentMethod.trim(),
      }
      if (isEdit) {
        await api.transactions.update(transaction.id, payload)
      } else {
        await api.transactions.create(payload)
      }
      onDone?.()
      navigation.goBack()
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCat = categories.find((c) => c.id === categoryId)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit' : 'Add'} {type}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={colors.textSubtle}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity
          style={styles.select}
          onPress={() => setCategoryModal(true)}
          disabled={loadingCat || loading}
        >
          <Text style={selectedCat ? styles.selectText : styles.selectPlaceholder}>
            {selectedCat?.name || 'Select category'}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSubtle}
          editable={!loading}
        />

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          placeholderTextColor={colors.textSubtle}
          value={note}
          onChangeText={setNote}
          editable={!loading}
        />

        {type === 'expense' && (
          <>
            <Text style={styles.label}>Payment Method</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setPaymentModal(true)}
              disabled={loading}
            >
              <Text style={paymentMethod ? styles.selectText : styles.selectPlaceholder}>
                {paymentMethod || 'Select (optional)'}
              </Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isEdit ? 'Save' : 'Add'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={categoryModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoryId(item.id)
                    setCategoryName(item.name)
                    setCategoryModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={paymentModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment method</Text>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.modalItem}
                onPress={() => {
                  setPaymentMethod(m)
                  setPaymentModal(false)
                }}
              >
                <Text style={styles.modalItemText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  cancelText: { color: colors.primary, fontSize: 16, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  form: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  select: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { fontSize: 16, color: colors.text },
  selectPlaceholder: { fontSize: 16, color: colors.textSubtle },
  chevron: { fontSize: 12, color: colors.textMuted },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: { fontSize: 16, color: colors.text },
})
