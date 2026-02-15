import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../services/api'

export default function ResetPasswordScreen({ route, navigation }) {
  const { token } = route.params || {}
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'Invalid reset link')
      return
    }
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.auth.resetPassword(token, password)
      Alert.alert('Success', 'Password reset successful. You can now sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ])
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password below.</Text>

        <TextInput
          style={styles.input}
          placeholder="New password (min 6 characters)"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#94A3B8"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 24, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
