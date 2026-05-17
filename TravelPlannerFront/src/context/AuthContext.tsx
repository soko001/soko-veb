import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { ReactNode } from 'react';

interface UserState {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: UserState | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await authService.login(credentials);
    
    const userState: UserState = {
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userState));
    setUser(userState);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role?.toLowerCase() === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};