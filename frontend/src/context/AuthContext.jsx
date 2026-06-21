import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_ADMIN } from '../mock';

const AuthContext = createContext(null);
const KEY = 'mpt_admin_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [pendingCode, setPendingCode] = useState(null);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch (e) {/* ignore */ }
  }, [user]);

  // MOCK: request a 6-digit verification code (in real backend it will be emailed)
  const requestCode = useCallback(async (email, password) => {
    await new Promise(r => setTimeout(r, 600));
    if (email !== MOCK_ADMIN.email || password !== MOCK_ADMIN.password) {
      return { ok: false, error: 'Invalid email or password' };
    }
    // generate code (mock — in real backend this is sent via email)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingCode({ email, code });
    // For demo only — show code in console (in production: never log!)
    console.info('[MOCK] verification code:', code);
    return { ok: true, demoCode: code };
  }, []);

  const verifyCode = useCallback(async (code) => {
    await new Promise(r => setTimeout(r, 400));
    if (!pendingCode) return { ok: false, error: 'Request a code first' };
    if (pendingCode.code !== code) return { ok: false, error: 'Invalid code' };
    setUser({ email: pendingCode.email, name: 'Yaniv (Owner)', role: 'owner', loginAt: new Date().toISOString() });
    setPendingCode(null);
    return { ok: true };
  }, [pendingCode]);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, requestCode, verifyCode, logout, pendingCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
