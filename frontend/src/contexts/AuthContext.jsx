import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const DEMO_PERSONAS = [
  {
    role: 'tourist',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    desc: 'Domestic Tourist trekking in Shillong / Dzukou'
  },
  {
    role: 'operator',
    name: 'Inspector Animesh Roy',
    email: 'operator.airport@surakshayatra.gov.in',
    desc: 'Guwahati Airport Checkpoint Operator'
  },
  {
    role: 'police',
    name: 'DSP Bimal Das',
    email: 'control.room@police.gov.in',
    desc: 'Command Center Dispatch & FIR Officer'
  },
  {
    role: 'tourism_official',
    name: 'Dr. R. K. Hazarika',
    email: 'director@tourism.gov.in',
    desc: 'Northeast Tourism Board Official'
  },
  {
    role: 'admin',
    name: 'State Cyber Administrator',
    email: 'admin@surakshayatra.gov.in',
    desc: 'Platform Admin & DPDP Governance'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('suraksha_token'));
  const [loading, setLoading] = useState(true);
  const [mfaPendingData, setMfaPendingData] = useState(null);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          logout();
        }
      } else {
        // Automatically sign in as default demo tourist for immediate frictionless experience
        loginWithDemo('priya.sharma@example.com');
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      if (res.requiresMfa) {
        setMfaPendingData({
          mfaTempToken: res.mfaTempToken,
          email,
          user: res.user
        });
        return { requiresMfa: true, message: res.message };
      } else {
        localStorage.setItem('suraksha_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
    } else {
      return { success: false, message: res.message };
    }
  };

  const completeMfa = async (otp) => {
    if (!mfaPendingData) return { success: false, message: 'No MFA session active.' };
    const res = await api.verifyMfa(mfaPendingData.mfaTempToken, otp);
    if (res.success) {
      localStorage.setItem('suraksha_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setMfaPendingData(null);
      return { success: true };
    } else {
      return { success: false, message: res.message };
    }
  };

  const loginWithDemo = async (email) => {
    setLoading(true);
    try {
      const res = await api.login(email, 'Suraksha@2026');
      if (res.success) {
        if (res.requiresMfa) {
          // auto-verify sandbox MFA for instantaneous persona switching
          const mfaRes = await api.verifyMfa(res.mfaTempToken, '123456');
          if (mfaRes.success) {
            localStorage.setItem('suraksha_token', mfaRes.token);
            setToken(mfaRes.token);
            setUser(mfaRes.user);
            setMfaPendingData(null);
          }
        } else {
          localStorage.setItem('suraksha_token', res.token);
          setToken(res.token);
          setUser(res.user);
        }
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('suraksha_token');
    setToken(null);
    setUser(null);
    setMfaPendingData(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      mfaPendingData,
      login,
      completeMfa,
      loginWithDemo,
      logout,
      demoPersonas: DEMO_PERSONAS
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
