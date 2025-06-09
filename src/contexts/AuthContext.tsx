import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserData {
  balances: Array<{
    coinId: string;
    amount: number;
  }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  userData: UserData | null;
  signIn: (credentials: { nodeId: string; password: string; stakerPassword: string }) => Promise<void>;
  signOut: () => void;
  updateBalance: (balances: UserData['balances']) => void;
  selectedWallet: string | null;
  isLedgerConnected: boolean;
  setSelectedWallet: (wallet: string) => void;
  setLedgerConnected: (connected: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLedgerConnected, setLedgerConnected] = useState(false);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('authSession');
    if (session) {
      const { user, userData, timestamp } = JSON.parse(session);
      const now = new Date().getTime();
      if (now - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        setUser(user);
        setUserData(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('authSession');
      }
    }
  }, []);

  const signIn = async (credentials: { nodeId: string; password: string; stakerPassword: string }) => {
    try {
      // Here you would typically make an API call to authenticate
      // For now, we'll just simulate a successful login
      const user = {
        nodeId: credentials.nodeId,
        // Add other user data as needed
      };

      const userData: UserData = {
        balances: [],
        // Add other user data as needed
      };

      setUser(user);
      setUserData(userData);
      setIsAuthenticated(true);

      // Save session to localStorage
      localStorage.setItem('authSession', JSON.stringify({
        user,
        userData,
        timestamp: new Date().getTime()
      }));
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    setUserData(null);
    setIsAuthenticated(false);
    setSelectedWallet(null);
    setLedgerConnected(false);
    localStorage.removeItem('authSession');
  };

  const updateBalance = (balances: UserData['balances']) => {
    setUserData(prev => prev ? {
      ...prev,
      balances
    } : null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      userData,
      signIn,
      signOut,
      updateBalance,
      selectedWallet,
      isLedgerConnected,
      setSelectedWallet,
      setLedgerConnected
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 