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

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      const message = 'Please enter both email and password';
      Alert.alert('Missing Information', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        Alert.alert('Success', 'Login successful! Welcome back.');
        TTSService.speak('Login successful! Welcome back.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        const errorMessage = result.error || 'Login failed';
        Alert.alert('Login Failed', errorMessage);
        TTSService.speak(errorMessage);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = 'An error occurred. Please try again.';
      Alert.alert('Error', message);
      TTSService.speak(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    TTSService.speak('Opening sign up screen');
    router.push('/auth/signup');
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
              <Ionicons name="lock-closed-outline" size={80} color="#FFFFFF" />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.formContainer}>
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

              <TouchableOpacity
                style={[styles.loginButton, MD.elevation.level3]}
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityLabel="Login button"
              >
                {isLoading ? (
                  <ActivityIndicator color={MD.colors.primary} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Login</Text>
                    <Ionicons name="arrow-forward" size={24} color={MD.colors.primary} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navigateToSignup}>
                  <Text style={styles.signupLink}>Sign Up</Text>
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.md,
    paddingHorizontal: MD.spacing.lg,
    minHeight: MD.touchTarget.comfortable,
    marginTop: MD.spacing.md,
  },
  loginButtonText: {
    ...MD.typography.button,
    color: MD.colors.primary,
    marginRight: MD.spacing.sm,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: MD.spacing.xl,
  },
  signupText: {
    ...MD.typography.body1,
    color: 'rgba(255,255,255,0.9)',
  },
  signupLink: {
    ...MD.typography.body1,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

