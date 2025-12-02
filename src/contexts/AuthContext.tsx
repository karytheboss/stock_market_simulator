import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  signup: (username: string, email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = (email: string, password: string) => {
    const users = storage.getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (foundUser) {
      setUser(foundUser);
      storage.setCurrentUser(foundUser);
      return { success: true, message: 'Login successful' };
    }

    return { success: false, message: 'Invalid credentials' };
  };

  const signup = (username: string, email: string, password: string) => {
    const users = storage.getUsers();
    
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email already exists' };
    }

    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Username already exists' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      password,
      role: 'user',
      riskIndex: 0,
      balance: 100000, // Starting balance
    };

    storage.addUser(newUser);
    setUser(newUser);
    storage.setCurrentUser(newUser);

    return { success: true, message: 'Signup successful' };
  };

  const logout = () => {
    setUser(null);
    storage.setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isAdmin: user?.role === 'admin' 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
