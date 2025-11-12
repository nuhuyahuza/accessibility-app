import { MD } from '@/constants/MaterialDesign';
import { useAuth } from '@/context/AuthContext';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      const message = 'Please fill in all fields';
      Alert.alert('Missing Information', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      const message = 'Passwords do not match';
      Alert.alert('Password Mismatch', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      const message = 'Password must be at least 6 characters';
      Alert.alert('Weak Password', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      const message = 'Please enter a valid email address';
      Alert.alert('Invalid Email', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signup(email.trim(), password, name.trim());
      
      if (result.success) {
        TTSService.speak(`Welcome ${name}! Your account has been created successfully.`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        const errorMessage = result.error || 'Signup failed';
        Alert.alert('Signup Failed', errorMessage);
        TTSService.speak(errorMessage);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const message = 'An error occurred. Please try again.';
      Alert.alert('Error', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    TTSService.speak('Opening login screen');
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[MD.colors.primary, MD.colors.secondary]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Ionicons name="person-add-outline" size={80} color="#FFFFFF" />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={24} color={MD.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Name input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={24} color={MD.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={24} color={MD.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={MD.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={24} color={MD.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Confirm password input"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={MD.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.signupButton, MD.elevation.level3]}
                onPress={handleSignup}
                disabled={isLoading}
                accessibilityLabel="Sign up button"
              >
                {isLoading ? (
                  <ActivityIndicator color={MD.colors.primary} />
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Sign Up</Text>
                    <Ionicons name="arrow-forward" size={24} color={MD.colors.primary} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: MD.spacing.xl,
    paddingVertical: MD.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: MD.spacing.xxl,
  },
  title: {
    ...MD.typography.h1,
    color: '#FFFFFF',
    marginTop: MD.spacing.lg,
  },
  subtitle: {
    ...MD.typography.body1,
    color: 'rgba(255,255,255,0.9)',
    marginTop: MD.spacing.sm,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.md,
    marginBottom: MD.spacing.lg,
    paddingHorizontal: MD.spacing.md,
    minHeight: MD.touchTarget.comfortable,
    ...MD.elevation.level2,
  },
  inputIcon: {
    marginRight: MD.spacing.sm,
  },
  input: {
    flex: 1,
    ...MD.typography.body1,
    color: MD.colors.textPrimary,
    paddingVertical: MD.spacing.md,
  },
  eyeIcon: {
    padding: MD.spacing.sm,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.md,
    paddingHorizontal: MD.spacing.lg,
    minHeight: MD.touchTarget.comfortable,
    marginTop: MD.spacing.md,
  },
  signupButtonText: {
    ...MD.typography.button,
    color: MD.colors.primary,
    marginRight: MD.spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: MD.spacing.xl,
  },
  loginText: {
    ...MD.typography.body1,
    color: 'rgba(255,255,255,0.9)',
  },
  loginLink: {
    ...MD.typography.body1,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

