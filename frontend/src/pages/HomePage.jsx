import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  Radio,
  Lock,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Users,
  AlertTriangle,
  ChevronRight,
  Compass,
  FileQuestion,
  HelpCircle,
  FileCheck2,
  Building2,
  Bell
} from 'lucide-react';
import SurakshaYatraLogo from '../components/common/SurakshaYatraLogo';
import LiveLocationNewsFeed from '../components/common/LiveLocationNewsFeed';

export default function HomePage({ setActivePage }) {
  const { t } = useLanguage();
  const { user, loginWithDemo, demoPersonas } = useAuth();
  const [stats, setStats] = useState({
    totalTourists: 14,
    totalGeofences: 5,
    medianResponse: '4.1s',
    totalBlocks: 8
  });
  const [advisories, setAdvisories] = useState([]);

  useEffect(() => {
    api.getAdminStats().then(res => {
      if (res.success && res.summary) {
        setStats({
          totalTourists: res.summary.totalTourists || 14,
          totalGeofences: res.summary.totalGeofences || 5,
          medianResponse: res.responseKpis?.medianSosToAckSeconds ? `${res.responseKpis.medianSosToAckSeconds}s` : '4.1s',
          totalBlocks: 8
        });
      }
    }).catch(console.error);

    api.getAdvisories().then(res => {
      if (res.success) setAdvisories(res.advisories || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-12 pb-16 bg-slate-50/50">
      
      {/* HERO SECTION - Deep Navy & Royal Blue Backdrop */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white rounded-b-3xl border-b border-blue-900/40 shadow-xl">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            
            {/* National Safety Framework Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-blue-200 text-xs font-bold backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Government of India • Ministry of Tourism & State Police Initiative</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white font-sans">
              Smart Tourist Safety & Incident Response Network
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-2xl mx-auto">
              Empowering domestic & international travelers across Northeast India with tamper-proof Digital IDs, automated geofence boundary alerts, AI anomaly safety scoring, and dedicated lost document assistance.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setActivePage('register')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Issue Digital Tourist ID</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActivePage('dashboard')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold uppercase tracking-wider border border-white/20 backdrop-blur-md transition-all flex items-center space-x-2"
              >
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Tourist Safety Hub</span>
              </button>

              <button
                onClick={() => setActivePage('help')}
                className="px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs sm:text-sm font-bold uppercase tracking-wider border border-amber-400/30 backdrop-blur-md transition-all flex items-center space-x-2"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Lost Passport & Grievance Desk</span>
              </button>

              <button
                onClick={() => setActivePage('authority-command')}
                className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold uppercase tracking-wider border border-slate-700 transition-all flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Safety Hub & GIS</span>
              </button>

              <button
                onClick={() => setActivePage('authority-login')}
                className="px-5 py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs sm:text-sm font-bold uppercase tracking-wider border border-indigo-400/40 backdrop-blur-md transition-all flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Authority Official Login</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Persona Switcher Strip */}
          <div className="mt-10 max-w-4xl mx-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Demo Persona Switcher (Try all perspectives):
              </span>
              <span className="text-[11px] text-blue-400 font-medium">Click to login & switch view</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {demoPersonas.map((p) => {
                const isCurrent = user?.email === p.email;
                return (
                  <button
                    key={p.email || p.role}
                    onClick={() => {
                      loginWithDemo(p.email);
                      if (p.role === 'tourist') setActivePage('dashboard');
                      else if (p.role === 'operator') setActivePage('operator-console');
                      else if (p.role === 'police' || p.role === 'tourism_official') setActivePage('authority-command');
                      else if (p.role === 'admin') setActivePage('admin-audit');
                    }}
                    className={`p-2.5 rounded-xl text-left transition-all border ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md font-bold ring-2 ring-blue-400/40'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/90 text-xs'
                    }`}
                  >
                    <div className="text-xs font-bold truncate text-white">{p.name}</div>
                    <div className="text-[10px] text-blue-300 uppercase tracking-wider font-mono mt-0.5">{p.role}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* KPI METRIC CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm text-center space-y-1 hover:border-blue-300 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-blue-600">
              {stats.totalTourists}+
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t('stats.verifiedTourists')}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm text-center space-y-1 hover:border-blue-300 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600">
              {stats.totalGeofences} Monitored
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t('stats.activeGeofences')}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm text-center space-y-1 hover:border-blue-300 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-red-600">
              {stats.medianResponse}
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t('stats.medianResponse')}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm text-center space-y-1 hover:border-blue-300 transition-colors">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              100%
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              DPDP 2023 Compliant
            </div>
          </div>
        </div>
      </section>

      {/* FOUR CORE SYSTEM CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Unified Safety Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Engineered for High-Trust Tourist Protection
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: Digital ID & e-KYC */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Digital Tourist ID & e-KYC
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Issues visit-bounded, QR-verifiable digital IDs with Aadhaar e-KYC and passport sandbox integration. DPDP-compliant AES-256 encryption protects personal identity.
              </p>
            </div>
            <button
              onClick={() => setActivePage('register')}
              className="pt-2 text-xs font-bold text-blue-600 flex items-center space-x-1 hover:text-blue-700"
            >
              <span>Issue Digital ID</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 2: Dynamic Geofences */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Dynamic Geo-Fencing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Autonomous boundary monitoring for Indo-Myanmar border defense zones, alpine night curfews (Dzukou Valley), and flood corridors with instant alternate safe routing.
              </p>
            </div>
            <button
              onClick={() => setActivePage('geofences')}
              className="pt-2 text-xs font-bold text-amber-600 flex items-center space-x-1 hover:text-amber-700"
            >
              <span>Inspect Monitored Zones</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 3: AI Anomaly & Incident Response */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                AI Anomaly & Auto E-FIR
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-signal neural anomaly detector flagging unexpected signal dropouts, prolonged trail inactivity, and itinerary deviations. Generates court-admissible legal E-FIRs under BNS 2023.
              </p>
            </div>
            <button
              onClick={() => setActivePage('authority-command')}
              className="pt-2 text-xs font-bold text-indigo-600 flex items-center space-x-1 hover:text-indigo-700"
            >
              <span>Open Command Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 4: Lost Passport Assistance & Grievance */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Lost Passport & Grievances
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive consular guidance for foreign and Indian travelers. File Lost Document Reports, track grievance resolution in real-time, and access verified embassy contacts.
              </p>
            </div>
            <button
              onClick={() => setActivePage('help')}
              className="pt-2 text-xs font-bold text-emerald-600 flex items-center space-x-1 hover:text-emerald-700"
            >
              <span>Access Help Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ADVISORIES & WEATHER NOTICES */}
      {advisories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Active Regional Tourism & Safety Advisories
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advisories.map((adv) => (
              <div
                key={adv.id}
                className="p-4 rounded-2xl bg-white border border-blue-200 text-xs space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {adv.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                    {adv.severity}
                  </span>
                </div>
                <div className="text-[11px] text-blue-800 font-semibold">
                  Region: {adv.region} • Authority: {adv.issuedBy}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {adv.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LIVE LOCATION NEWS & SITUATION BULLETINS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LiveLocationNewsFeed showBroadcastButton={['police', 'tourism_official', 'operator', 'admin'].includes(user?.role)} />
      </section>

      {/* BLOCKCHAIN AUDIT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Permissioned Sovereign PoA Consensus Ledger (Simulation)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Cryptographically Verifiable Safety Records
            </h3>
            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              Every digital tourist ID issuance, safety check-in, and emergency alert timestamp is anchored into a cryptographic SHA-256 Merkle blockchain block, preventing retrospective log tampering.
            </p>
          </div>
          <button
            onClick={() => setActivePage('blockchain')}
            className="shrink-0 px-5 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-extrabold uppercase tracking-wider shadow-md transition-colors"
          >
            Open Blockchain Ledger
          </button>
        </div>
      </section>

    </div>
  );
}
