import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { api, setToken, clearToken, getToken } from '../lib/api';

const AuthContext = createContext(null);
const KEY = 'mpt_admin_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('AuthContext: cannot read session:', e?.message || e);
      return null;
    }
  });
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('AuthContext: cannot persist session:', e?.message || e);
    }
  }, [user]);

  // Validate the stored JWT on boot — if it's been revoked or expired, log out.
  useEffect(() => {
    if (!user || !getToken()) return;
    api.adminMe().catch((err) => {
      if (err?.status === 401) {
        setUser(null);
        clearToken();
      }
    });
  }, [user]);

  // Step 1 — verify email + password, ask backend to send OTP
  const requestCode = useCallback(async (email, password) => {
    try {
      const res = await api.adminLogin(email, password);
      setPendingEmail(email);
      return { ok: true, demoCode: res.demoCode, emailMode: res.email_mode };
    } catch (e) {
      return { ok: false, error: e?.message || 'Login failed' };
    }
  }, []);

  // Step 2 — verify OTP → JWT
  const verifyCode = useCallback(async (code) => {
    if (!pendingEmail) return { ok: false, error: 'Request a code first' };
    try {
      const res = await api.adminVerify(pendingEmail, code);
      setToken(res.token);
      setUser({ email: res.owner.email, name: res.owner.name || 'Owner', role: res.owner.role, loginAt: new Date().toISOString() });
      setPendingEmail(null);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || 'Verification failed' };
    }
  }, [pendingEmail]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Memoised value object — prevents every consumer from re-rendering on each provider render.
  const value = useMemo(
    () => ({ user, requestCode, verifyCode, logout, pendingEmail }),
    [user, requestCode, verifyCode, logout, pendingEmail],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
