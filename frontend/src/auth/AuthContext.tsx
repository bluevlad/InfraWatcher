import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AuthUser } from './api';
import { fetchMe, logout as apiLogout, verifyGoogleCredential } from './api';
import LoginModal from './LoginModal';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  loginModalOpen: boolean;
  openLoginModal: (onSuccess?: () => void) => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const pendingCallback = useRef<(() => void) | undefined>(undefined);

  const refresh = useCallback(async () => {
    setLoading(true);
    const me = await fetchMe();
    setUser(me);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const u = await verifyGoogleCredential(credential);
    setUser(u);
    setLoginModalOpen(false);
    if (u.is_admin && pendingCallback.current) {
      const cb = pendingCallback.current;
      pendingCallback.current = undefined;
      // Defer so search-param updates and re-renders settle first
      setTimeout(cb, 0);
    } else {
      pendingCallback.current = undefined;
    }
    return u;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    window.google?.accounts.id.disableAutoSelect();
  }, []);

  const openLoginModal = useCallback((onSuccess?: () => void) => {
    pendingCallback.current = onSuccess;
    setLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    pendingCallback.current = undefined;
    setLoginModalOpen(false);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: !!user?.is_admin,
    loginWithGoogle,
    logout,
    refresh,
    loginModalOpen,
    openLoginModal,
    closeLoginModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal />
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
