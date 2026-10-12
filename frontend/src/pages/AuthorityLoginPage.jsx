import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import SurakshaYatraLogo from '../components/common/SurakshaYatraLogo';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserCheck,
  Building2,
  KeyRound,
  FileCheck2,
  Radio,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Fingerprint,
  ChevronRight,
  Info
} from 'lucide-react';

const OFFICIAL_ROLES = [
  {
    id: 'operator',
    title: 'Police Inspector',
    subtitle: 'Entry Checkpost & Perimeter Field Verification',
    badge: 'ASM-ENTRY-771',
    station: 'Guwahati LGBI Airport Checkpost / Entry Desk',
    defaultEmail: 'operator.airport@surakshayatra.gov.in',
    defaultTargetPage: 'operator-console',
    roleTag: 'OPERATOR',
    icon: UserCheck,
    color: 'from-blue-600 to-indigo-700',
    accentText: 'text-blue-600',
    description: 'Verify Inner Line Permits (ILP), physical checkpost arrivals, biometric QR validation, and field patrol coordination.'
  },
  {
    id: 'police',
    title: 'DSP — Deputy Superintendent of Police',
    subtitle: 'District Command Center & Legal FIR Dispatch',
    badge: 'ASM-POL-009',
    station: 'North-East Integrated Command & Control Center (ICCC)',
    defaultEmail: 'control.room@police.gov.in',
    defaultTargetPage: 'authority-command',
    roleTag: 'COMMAND',
    icon: ShieldCheck,
    color: 'from-indigo-600 to-violet-800',
    accentText: 'text-indigo-600',
    description: 'Lead emergency SOS triage, dispatch Quick Response Vehicles (PCR), broadcast localized advisories, and lodge statutory e-FIRs.'
  },
  {
    id: 'state_cyber',
    roleKey: 'admin',
    title: 'State Cyber Administrator',
    subtitle: 'Cyber Threat Analysis & DPDP 2023 Governance',
    badge: 'CYBER-SEC-042',
    station: 'State Cyber Security Operations Center (CSOC)',
    defaultEmail: 'admin@surakshayatra.gov.in',
    defaultTargetPage: 'admin-audit',
    roleTag: 'CYBER CSOC',
    icon: Fingerprint,
    color: 'from-purple-600 to-slate-900',
    accentText: 'text-purple-600',
    description: 'Audit automated AI anomaly flags, DPDP Act 2023 consent ledgers, PII encryption hashes, and unauthorized access attempts.'
  },
  {
    id: 'sysadmin',
    roleKey: 'admin',
    title: 'System Administrator',
    subtitle: 'Sovereign Blockchain Consensus & Node Telemetry',
    badge: 'SYS-INFRA-001',
    station: 'NIC Cloud Infrastructure & Sovereign Node Command',
    defaultEmail: 'sysadmin@surakshayatra.gov.in',
    defaultTargetPage: 'blockchain',
    roleTag: 'SYSTEM ARCHITECT',
    icon: Server,
    color: 'from-cyan-700 to-slate-900',
    accentText: 'text-cyan-600',
    description: 'Monitor Hyperledger consensus nodes, offline SMS fallback gateways, real-time WebSocket clusters, and cryptographic keys.'
  },
  {
    id: 'tourism_official',
    title: 'Northeast Tourism Board',
    subtitle: 'Regional Tourism Inflow & Public Safety Advisories',
    badge: 'NETB-DIR-012',
    station: 'Directorate of Tourism, Northeast Regional Board',
    defaultEmail: 'director@tourism.gov.in',
    defaultTargetPage: 'geofences',
    roleTag: 'TOURISM BOARD',
    icon: Layers,
    color: 'from-emerald-600 to-teal-800',
    accentText: 'text-emerald-600',
    description: 'Manage seasonal high-risk geofences, monitor interstate tourist density heatmaps, and coordinate with SDRF tourist safety cells.'
  }
];

export default function AuthorityLoginPage({ setActivePage }) {
  const { user, loginWithDemo, completeMfa } = useAuth();
  const { t } = useLanguage();

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState(OFFICIAL_ROLES[1]); // Default DSP

  // Sign-in Form
  const [loginEmail, setLoginEmail] = useState(OFFICIAL_ROLES[1].defaultEmail);
  const [loginPassword, setLoginPassword] = useState('Suraksha@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // MFA Challenge State
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState('');
  const [mfaOtp, setMfaOtp] = useState('123456');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [mfaError, setMfaError] = useState('');

  // Registration Form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('police');
  const [regBadgeNumber, setRegBadgeNumber] = useState('');
  const [regStationName, setRegStationName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAuthKey, setRegAuthKey] = useState('SURAKSHA-GOV-2026');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setLoginEmail(role.defaultEmail);
    setLoginPassword('Suraksha@2026');
    setLoginError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await api.login(loginEmail.trim(), loginPassword);
      if (res.success) {
        if (res.requiresMfa) {
          setMfaTempToken(res.mfaTempToken);
          setIsMfaStep(true);
        } else {
          localStorage.setItem('suraksha_token', res.token);
          window.location.reload();
        }
      } else {
        setLoginError(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setLoginError('Network or server error while connecting to Sovereign Auth Gateway.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setIsVerifyingMfa(true);

    try {
      const res = await api.verifyMfa(mfaTempToken, mfaOtp.trim());
      if (res.success) {
        localStorage.setItem('suraksha_token', res.token);
        if (setActivePage && selectedRole.defaultTargetPage) {
          setActivePage(selectedRole.defaultTargetPage);
        } else {
          window.location.reload();
        }
      } else {
        setMfaError(res.message || 'Invalid MFA authenticator token.');
      }
    } catch (err) {
      setMfaError('Failed to verify multi-factor authorization code.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleInstantSandboxLogin = (role) => {
    loginWithDemo(role.defaultEmail);
    if (setActivePage) {
      setTimeout(() => {
        setActivePage(role.defaultTargetPage);
      }, 300);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 12) {
      setRegError('Security Policy: Officer password must be at least 12 characters.');
      return;
    }

    if (regAuthKey !== 'SURAKSHA-GOV-2026') {
      setRegError('Invalid Department Authorization Key. Enter authorized key or use sandbox key SURAKSHA-GOV-2026.');
      return;
    }

    setIsRegistering(true);

    try {
      const res = await api.register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone,
        badgeNumber: regBadgeNumber,
        stationName: regStationName
      });

      if (res.success) {
        setRegSuccess(true);
        setTimeout(() => {
          setAuthMode('login');
          setLoginEmail(regEmail);
          setLoginPassword(regPassword);
          setRegSuccess(false);
        }, 1800);
      } else {
        setRegError(res.message || 'Registration request declined by gateway.');
      }
    } catch (err) {
      setRegError('Failed to submit official registration record.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Government Portal Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                    Sovereign Law Enforcement Gateway
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold">NIC SECURE MESH</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  Official Authority Access & Command Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Unified Authentication Gateway for Police Inspectors, DSP Command, State Cyber Administrators, System Architects & Northeast Tourism Board.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                onClick={() => setAuthMode('login')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  authMode === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Official Sign-In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  authMode === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Register Officer Account
              </button>
            </div>
          </div>

          {/* Legal Compliance & Audit Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-start space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-slate-800 dark:text-slate-200">Statutory Notice:</strong> This terminal is restricted strictly to designated police, cyber defense, and tourism officials. All access attempts, geospatial dispatches, and FIR lookups are cryptographically signed and stored immutably under Section 43 & Section 66 of the Information Technology Act 2000 and DPDP Act 2023.
            </p>
          </div>
        </div>

        {/* 5 Distinct Roles Selector Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Select Department Role Workstation
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any role to load designated station profile or 1-click sandbox authenticate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {OFFICIAL_ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole.id === role.id;

              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-lg ring-2 ring-blue-500/30'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${role.color} text-white flex items-center justify-center shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {role.roleTag}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                        {role.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {role.subtitle}
                      </p>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 space-y-0.5">
                      <div>Badge: <span className="font-bold text-slate-700 dark:text-slate-300">{role.badge}</span></div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstantSandboxLogin(role);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[10px] font-bold transition-colors flex items-center justify-center space-x-1"
                      title={`Instant demo sign in as ${role.title}`}
                    >
                      <span>1-Click Sign-In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Form Box: Sign-In or Sign-Up */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Panel (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            
            {authMode === 'login' && !isMfaStep && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Official Sign-In: {selectedRole.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Posting: {selectedRole.station}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold">
                    {selectedRole.badge}
                  </span>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Email / Portal Identity
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer.name@police.gov.in"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Sovereign Passphrase
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter security passphrase"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="text-[10px] text-slate-400">
                    Default sandbox credentials password: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">Suraksha@2026</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Officer Credentials...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Sign In & Proceed to MFA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInstantSandboxLogin(selectedRole)}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant 1-Click Access</span>
                  </button>
                </div>
              </form>
            )}

            {/* MFA Verification Challenge Screen */}
            {authMode === 'login' && isMfaStep && (
              <form onSubmit={handleVerifyMfa} className="space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Two-Factor Authentication (MFA)
                    </h2>
                    <p className="text-xs text-slate-500">
                      GovID Authenticator / Sandbox TOTP verification
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Sandbox Authenticator Code</span>
                  </div>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300">
                    For verification of government officials, enter the sandbox MFA code <strong className="font-mono text-blue-950 dark:text-white">123456</strong>.
                  </p>
                </div>

                {mfaError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{mfaError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    6-Digit Security Token (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mfaOtp}
                    onChange={(e) => setMfaOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isVerifyingMfa}
                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {isVerifyingMfa ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating OTP Token...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authorize & Open Workstation</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMfaStep(false)}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {/* Official Registration Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Official Personnel Registration & Onboarding
                  </h2>
                  <p className="text-xs text-slate-500">
                    Provision new police warrant ID or department credential on SurakshaYatra platform
                  </p>
                </div>

                {regSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Officer account registered successfully! Redirecting to sign-in terminal...</span>
                  </div>
                )}

                {regError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Name & Rank
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Inspector Ramesh Borgohain"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Official Gov Email
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. ramesh.b@police.gov.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Official Designation / Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="operator">Police Inspector (Checkpost & Entry)</option>
                      <option value="police">DSP — Deputy Superintendent of Police</option>
                      <option value="admin">State Cyber Administrator (CSOC)</option>
                      <option value="tourism_official">Northeast Tourism Board Official</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Police Badge ID / Officer Warrant No.
                    </label>
                    <input
                      type="text"
                      required
                      value={regBadgeNumber}
                      onChange={(e) => setRegBadgeNumber(e.target.value)}
                      placeholder="e.g. ASM-POL-441"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Police Station / Posting District
                    </label>
                    <input
                      type="text"
                      required
                      value={regStationName}
                      onChange={(e) => setRegStationName(e.target.value)}
                      placeholder="e.g. East Khasi Hills District HQ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Official Mobile Number
                    </label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 94350 XXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    High-Security Password (12+ characters policy)
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Must be at least 12 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <div className="text-[10px] text-slate-400">
                    Must meet government IT security standards: Minimum 12 characters with upper, lower, numbers, and special symbols.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Department Authorization Key
                  </label>
                  <input
                    type="text"
                    required
                    value={regAuthKey}
                    onChange={(e) => setRegAuthKey(e.target.value)}
                    placeholder="SURAKSHA-GOV-2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <div className="text-[10px] text-slate-400">
                    Sandbox pre-authorized secret key: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">SURAKSHA-GOV-2026</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enrolling Officer in Sovereign Ledger...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" />
                        <span>Complete Official Registration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Active Role Specification & Workstation Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Designated Workstation Overview
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/80 dark:to-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedRole.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase font-mono">
                    {selectedRole.roleTag}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedRole.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Station / Unit:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{selectedRole.station}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Badge Credential:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedRole.badge}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Primary Desk:</span>
                    <span className="font-mono text-blue-600 font-bold uppercase">{selectedRole.defaultTargetPage}</span>
                  </div>
                </div>
              </div>

              {/* Direct Workstation Links */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Available Authority Tools:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    onClick={() => {
                      loginWithDemo(selectedRole.defaultEmail);
                      if (setActivePage) setActivePage('authority-command');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span>Safety Hub & GIS</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      loginWithDemo(selectedRole.defaultEmail);
                      if (setActivePage) setActivePage('geofences');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span>Geofence Manager</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      loginWithDemo(selectedRole.defaultEmail);
                      if (setActivePage) setActivePage('operator-console');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span>Checkpost Desk</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      loginWithDemo(selectedRole.defaultEmail);
                      if (setActivePage) setActivePage('admin-audit');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span>Audit & DPDP Logs</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Civilian Help Link */}
            <div className="bg-blue-50 dark:bg-blue-950/40 p-5 rounded-3xl border border-blue-200 dark:border-blue-900/50 text-xs space-y-2">
              <div className="font-extrabold text-blue-900 dark:text-blue-200">
                Are you a Tourist or Family Member?
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Tourists, trekkers, and family members do not require police authority login. You can register for your Digital Tourist ID or access the Safety Hub directly.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setActivePage('register')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700"
                >
                  Get Digital ID
                </button>
                <button
                  onClick={() => setActivePage('dashboard')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] border border-slate-200 dark:border-slate-700"
                >
                  Tourist Safety Hub
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
