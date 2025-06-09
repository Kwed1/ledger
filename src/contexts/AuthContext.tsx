import { User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

const dbFirestore = getFirestore();

interface Balance {
  coinId: string;
  amount: number;
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  balances: Balance[];
  has2FA: boolean;
  ledgerConnected: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (userId: string, password: string, validatorPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateBalance: (coinId: string, amount: number) => Promise<void>;
  connectLedger: () => Promise<void>;
  setup2FA: () => Promise<void>;
  verify2FA: (code: string) => Promise<boolean>;
  skip2FA: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const signIn = async (userId: string, password: string, validatorPassword: string) => {
    try {
      // Here you would implement your custom authentication logic
      // For now, we'll just simulate a successful login
      const mockUser = {
        uid: userId,
        email: `${userId}@example.com`,
        displayName: userId,
        photoURL: '',
      };
      setUser(mockUser as User);

      // Fetch or create user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        const newUserData: UserData = {
          id: userId,
          email: `${userId}@example.com`,
          displayName: userId,
          photoURL: '',
          balances: [],
          has2FA: false,
          ledgerConnected: false,
        };
        await setDoc(doc(db, 'users', userId), newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserData(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateBalance = async (coinId: string, amount: number) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as UserData;
        const balances = currentData.balances || [];
        const existingBalance = balances.find(b => b.coinId === coinId);

        if (existingBalance) {
          existingBalance.amount = amount;
        } else {
          balances.push({ coinId, amount });
        }

        await updateDoc(userRef, { balances });
        setUserData({ ...currentData, balances });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  const connectLedger = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { ledgerConnected: true });
      setUserData(prev => prev ? { ...prev, ledgerConnected: true } : null);
    } catch (error) {
      console.error('Error connecting Ledger:', error);
      throw error;
    }
  };

  const setup2FA = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { has2FA: true });
      setUserData(prev => prev ? { ...prev, has2FA: true } : null);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    // Here you would implement your 2FA verification logic
    // For now, we'll just return true to simulate successful verification
    setIsAuthenticated(true);
    return true;
  };

  const skip2FA = async () => {
    if (!user) return;

    try {
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error skipping 2FA:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isAuthenticated,
        signIn,
        signOut,
        updateBalance,
        connectLedger,
        setup2FA,
        verify2FA,
        skip2FA,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 