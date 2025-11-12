import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
}

const USERS_KEY = 'users_database';
const SESSION_KEY = 'current_user_session';

class AuthServiceClass {
  private async hashPassword(password: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hash;
  }

  private async getUsers(): Promise<User[]> {
    try {
      const usersData = await AsyncStorage.getItem(USERS_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  private async saveUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
      throw new Error('Failed to save user data');
    }
  }

  async signup(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
    try {
      if (!email || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }

      if (!email.includes('@') || !email.includes('.')) {
        return { success: false, error: 'Invalid email format' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const users = await this.getUsers();
      
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      const passwordHash = await this.hashPassword(password);
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      await this.saveUsers(users);

      const session: UserSession = {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

      console.log('✅ User registered successfully:', newUser.email);
      return { success: true, user: session };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      const users = await this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      const passwordHash = await this.hashPassword(password);
      if (passwordHash !== user.passwordHash) {
        return { success: false, error: 'Invalid email or password' };
      }

      const session: UserSession = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

      console.log('✅ User logged in successfully:', user.email);
      return { success: true, user: session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to login' };
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }
}

export const AuthService = new AuthServiceClass();

