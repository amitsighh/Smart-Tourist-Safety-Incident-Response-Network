import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LiveGisMap, { REGIONAL_WEATHER_DATA } from '../components/authority/LiveGisMap';
import AlertQueue from '../components/authority/AlertQueue';
import UnitDispatchModal from '../components/authority/UnitDispatchModal';
import EFirModal from '../components/authority/EFirModal';
import AnomalyExplainModal from '../components/authority/AnomalyExplainModal';
import AdvisoryBroadcastModal from '../components/authority/AdvisoryBroadcastModal';
import LiveLocationNewsFeed from '../components/common/LiveLocationNewsFeed';
import LanguageSelector from '../components/common/LanguageSelector';
import AccessibilityBar from '../components/common/AccessibilityBar';
import {
  LayoutDashboard,
  Navigation,
  MapPin,
  Layers,
  ShieldAlert,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Radio,
  Send,
  Download,
  BrainCircuit,
  Bell,
  Search,
  RefreshCw,
  Watch,
  CloudRain,
  ExternalLink,
  ChevronRight,
  Loader2,
  Filter,
  Newspaper
} from 'lucide-react';

const FALLBACK_TOURISTS = [
  {
    touristId: 'TID-NE-2026-88190',
    fullName: 'Priya Sharma',
    nationality: 'Indian',
    bloodGroup: 'B+ Positive',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    hasActiveSos: false,
    optInTracking: true,
    lastLocation: {
      latitude: 25.5788,
      longitude: 91.8933,
      locationName: 'Shillong Peak Eco-Trail, Meghalaya',
      timestamp: new Date().toISOString(),
      batteryLevel: 82
    },
    pairedWearableId: 'WB-NE-089'
  },
  {
    touristId: 'TID-NE-2026-90412',
    fullName: 'John Miller',
    nationality: 'British',
    bloodGroup: 'A+ Positive',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    hasActiveSos: false,
    optInTracking: true,
    lastLocation: {
      latitude: 26.5800,
      longitude: 93.3800,
      locationName: 'Kaziranga National Park (Kohora Range)',
      timestamp: new Date().toISOString(),
      batteryLevel: 65
    },
    pairedWearableId: 'WB-NE-104'
  }
];

const FALLBACK_PATROL_UNITS = [
  {
    id: 'PATROL-GHY-01',
    name: 'Guwahati PCR Alpha-1',
    type: 'QUICK_RESPONSE_VEHICLE',
    officerInCharge: 'Inspector Animesh Roy',
    phone: '+91 94350 11223',
    latitude: 26.1445,
    longitude: 91.7362,
    status: 'AVAILABLE',
    assignedStation: 'Guwahati LGBI Checkpost'
  },
  {
    id: 'PATROL-SHL-02',
    name: 'Shillong Highway Interceptor 4',
    type: 'HIGHWAY_PATROL',
    officerInCharge: 'Sub-Inspector K. Sangma',
    phone: '+91 94361 22334',
    latitude: 25.5788,
    longitude: 91.8933,
    status: 'ON_MISSION',
    assignedStation: 'East Khasi Hills Police Desk'
  },
  {
    id: 'PATROL-TWG-03',
    name: 'SDRF Tawang Mountain Rescue Unit',
    type: 'DISASTER_RESCUE',
    officerInCharge: 'Havildar T. Norbu',
    phone: '+91 94360 44556',
    latitude: 27.5052,
    longitude: 92.1039,
    status: 'AVAILABLE',
    assignedStation: 'Dirang Transit HQ'
  }
];

const FALLBACK_GEOFENCES = [
  {
    id: 'GF-NE-001',
    name: 'Indo-Myanmar Border 5km Buffer Zone',
    category: 'restricted',
    severity: 'CRITICAL',
    type: 'polygon',
    coordinates: [[25.8, 95.0], [25.95, 95.35], [25.4, 95.25], [25.2, 94.9]],
    advisory: 'Strict military restricted border defense corridor.',
    safeRouteSuggestion: 'Redirect towards National Highway 29 (Kohima-Dimapur corridor).',
    isActive: true
  },
  {
    id: 'GF-NE-002',
    name: 'Dzukou Valley Alpine Freezing Night Curfew',
    category: 'curfew',
    severity: 'HIGH',
    type: 'circle',
    center: { lat: 25.5682, lng: 94.0483 },
    radiusMeters: 4500,
    advisory: 'Extreme sub-zero night temperatures & flash fog hazard. Trekking strictly prohibited 18:00 - 05:30.',
    safeRouteSuggestion: 'Retreat immediately to Viswema Base Camp.',
    isActive: true
  },
  {
    id: 'GF-NE-003',
    name: 'Sela Pass Avalanche & Black Ice Zone (13,700 ft)',
    category: 'restricted',
    severity: 'CRITICAL',
    type: 'circle',
    center: { lat: 27.5052, lng: 92.1039 },
    radiusMeters: 5000,
    advisory: 'Heavy snowfall and black ice on NH-13 hairpin bends.',
    safeRouteSuggestion: 'Halt vehicle at Dirang transit gate until BRO clearance.',
    isActive: true
  }
];

export default function AuthorityCommandPage({ setActivePage }) {
  const { user, loginWithDemo, demoPersonas } = useAuth();
  const { t } = useLanguage();
  const { isConnected, liveTelemetryPings } = useSocket();

  // Sidebar navigation state: 'dashboard', 'tracker', 'map-zones', 'alerts', 'digital-ids', 'analytics', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [tourists, setTourists] = useState(FALLBACK_TOURISTS);
  const [patrolUnits, setPatrolUnits] = useState(FALLBACK_PATROL_UNITS);
  const [geofences, setGeofences] = useState(FALLBACK_GEOFENCES);
  const [alerts, setAlerts] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLargeDashboardMap, setIsLargeDashboardMap] = useState(false);

  // Modals
  const [dispatchModalAlert, setDispatchModalAlert] = useState(null);
  const [efirModalAlert, setEfirModalAlert] = useState(null);
  const [explainModalAlert, setExplainModalAlert] = useState(null);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);

  // AI Anomaly Scan state
  const [isScanningAnomaly, setIsScanningAnomaly] = useState(false);
  const [anomalyScanResults, setAnomalyScanResults] = useState(null);

  const isAuthorityRole = ['police', 'operator', 'tourism_official', 'admin'].includes(user?.role);

  const loadData = async () => {
    try {
      const [liveMapRes, alertsRes, touristsRes, geofencesRes] = await Promise.allSettled([
        api.getLiveMapLocations(),
        api.getAlerts(),
        api.getAllTouristIds(),
        api.getGeofences()
      ]);

      let publicFences = [];
      if (geofencesRes.status === 'fulfilled' && geofencesRes.value?.success && geofencesRes.value?.geofences?.length > 0) {
        publicFences = geofencesRes.value.geofences;
      }

      if (liveMapRes.status === 'fulfilled' && liveMapRes.value?.success) {
        setTourists(liveMapRes.value.tourists?.length > 0 ? liveMapRes.value.tourists : FALLBACK_TOURISTS);
        setPatrolUnits(liveMapRes.value.patrolUnits?.length > 0 ? liveMapRes.value.patrolUnits : FALLBACK_PATROL_UNITS);
        setGeofences(liveMapRes.value.geofences?.length > 0 ? liveMapRes.value.geofences : (publicFences.length > 0 ? publicFences : FALLBACK_GEOFENCES));
      } else {
        setTourists(FALLBACK_TOURISTS);
        setPatrolUnits(FALLBACK_PATROL_UNITS);
        if (publicFences.length > 0) {
          setGeofences(publicFences);
        }
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value?.success) {
        setAlerts(alertsRes.value.alerts || []);
      }
    } catch (e) {
      console.error('Authority loadData error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAcknowledge = async (alertId) => {
    try {
      const res = await api.acknowledgeAlert(alertId);
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const res = await api.resolveAlert(alertId, 'Verified safe by patrol unit. Incident resolved.');
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAiScan = async () => {
    setIsScanningAnomaly(true);
    try {
      const res = await api.scanAnomaly();
      if (res.success) {
        setAnomalyScanResults(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningAnomaly(false);
    }
  };

  // Current Zones List matching the screenshot
  const currentZonesList = [
    {
      id: 'Z-1',
      name: 'Guwahati City Center',
      status: 'safe',
      touristCount: 342,
      lat: 26.1445,
      lng: 91.7362,
      weather: '28°C Partly Sunny'
    },
    {
      id: 'Z-2',
      name: 'Kaziranga Visitor Area',
      status: 'safe',
      touristCount: 156,
      lat: 26.5800,
      lng: 93.3800,
      weather: '26°C Humid'
    },
    {
      id: 'Z-3',
      name: 'Shillong Hills',
      status: 'moderate',
      touristCount: 89,
      lat: 25.5788,
      lng: 91.8933,
      weather: '18°C Rain Warning'
    },
    {
      id: 'Z-4',
      name: 'Border Area - Sector 7 (Indo-Myanmar)',
      status: 'restricted',
      touristCount: 0,
      lat: 25.8000,
      lng: 95.0000,
      weather: '22°C Defense Corridor'
    },
    {
      id: 'Z-5',
      name: 'Remote Forest Path (Dzukou Valley)',
      status: 'high_risk',
      touristCount: 3,
      lat: 25.5682,
      lng: 94.0483,
      weather: '8°C Night Curfew'
    }
  ];

  const handleZoneClick = (zone) => {
    setSelectedEntity({
      latitude: zone.lat,
      longitude: zone.lng,
      locationName: zone.name
    });
  };

  const activeAlertsCount = alerts.filter(a => a.status !== 'RESOLVED' && a.status !== 'CLOSED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'CLOSED').length + 24;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* 1. LEFT SIDEBAR: "Safety Control - Authority Portal" matching screenshot */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                Safety Control
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Authority Portal
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'tracker', label: 'Tourist Tracker', icon: Users, badge: `${tourists.length * 12 + 580}` },
              { id: 'map-zones', label: 'Map & Zones', icon: Layers },
              { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle, badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null, badgeColor: 'bg-red-500' },
              { id: 'news', label: 'Location News', icon: Newspaper, badge: 'LIVE', badgeColor: 'bg-blue-600 text-white' },
              { id: 'digital-ids', label: 'Digital IDs', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : (item.badgeColor || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Pill: "Authority User / Police Station" */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
              A
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                {user?.fullName || 'DSP Bimal Das'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">
                {user?.stationName || 'Police Station (ICCC)'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
              Tourist Safety System
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setActiveTab('alerts')}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Active Alerts"
              >
                <Bell className="w-4 h-4" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            </div>

            <LanguageSelector />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Authority Access Verification Banner */}
          {!isAuthorityRole && (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm tracking-wide text-white">
                      OFFICIAL LAW ENFORCEMENT & TOURISM PORTAL — SANDBOX PREVIEW
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase">
                      Civilian Account: {user?.fullName || 'Guest'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    You are previewing the Safety Hub & GIS Command Center. To execute legal E-FIR dispatch, checkpost ILP verification, CSOC telemetry scans, or geofence curfews, sign in with your official badge credentials.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setActivePage('authority-login')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Authority Portal Sign-In</span>
                </button>
                <button
                  onClick={() => loginWithDemo('control.room@police.gov.in')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs transition-all"
                  title="Switch to DSP Bimal Das Command Persona"
                >
                  1-Click DSP Mode
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: MAIN DASHBOARD (matching screenshot) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Title & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Authority Dashboard
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time monitoring of tourist safety and security across all zones
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRunAiScan}
                    disabled={isScanningAnomaly}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
                  >
                    {isScanningAnomaly ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    <span>AI Anomaly Scan</span>
                  </button>

                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-2xs"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Stat KPI Cards (Active Tourists: 2,847 | Safe Zones: 156 | Active Alerts: 7 | Resolved Today: 24) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Tourists Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Active Tourists</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    2,847
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12% from last week</span>
                  </div>
                </div>

                {/* Safe Zones Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Safe Zones</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    156
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+2 from last week</span>
                  </div>
                </div>

                {/* Active Alerts Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Active Alerts</span>
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {activeAlertsCount || 7}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                    <span>-2 from last week</span>
                  </div>
                </div>

                {/* Resolved Today Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Resolved Today</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {resolvedCount}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+6 from last week</span>
                  </div>
                </div>
              </div>

              {/* MAIN 2-COLUMN GRID (Map & Zones on Left, Quick Actions & Score on Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8 cols): Interactive Tourist Map + Current Zones List */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Interactive Tourist Map Card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Interactive Tourist Map & Tactical Radar
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsLargeDashboardMap(!isLargeDashboardMap)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center space-x-1 border border-blue-200 transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>{isLargeDashboardMap ? 'Standard View' : 'Larger Map View'}</span>
                        </button>
                        <span className="hidden sm:inline text-[11px] text-slate-400">
                          Real-time GIS & geo-fencing
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Leaflet GIS Map with Live Weather Radar & Badges */}
                    <LiveGisMap
                      tourists={tourists}
                      patrolUnits={patrolUnits}
                      geofences={geofences}
                      activeAlerts={alerts}
                      selectedEntity={selectedEntity}
                      onSelectEntity={setSelectedEntity}
                      showWeatherLayer={true}
                      heightClass={isLargeDashboardMap ? "h-[680px]" : "h-[450px]"}
                    />
                  </div>

                  {/* Current Zones Card List matching screenshot */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Current Zones
                    </div>

                    <div className="space-y-2.5">
                      {currentZonesList.map((zone) => {
                        const isSafe = zone.status === 'safe';
                        const isMod = zone.status === 'moderate';
                        const isRestricted = zone.status === 'restricted';

                        const bg = isSafe
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                          : isMod
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                          : isRestricted
                          ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
                          : 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/60';

                        const pillColor = isSafe
                          ? 'bg-emerald-600 text-white'
                          : isMod
                          ? 'bg-blue-600 text-white'
                          : isRestricted
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white';

                        return (
                          <div
                            key={zone.id}
                            onClick={() => handleZoneClick(zone)}
                            className={`p-3.5 rounded-2xl border ${bg} flex items-center justify-between cursor-pointer hover:shadow-xs transition-all`}
                          >
                            <div className="flex items-center space-x-3">
                              {isSafe ? (
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : isMod ? (
                                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {zone.name}
                                </span>
                                <div className="text-[10px] text-slate-500">
                                  Weather: {zone.weather}
                                </div>
                              </div>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${pillColor}`}>
                              {zone.touristCount} tourists
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column (4 cols): Safety Score + Quick Actions + Live Alerts */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Safety Score Card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Safety Score</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        85/100
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" /> +5%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[85%] transition-all duration-1000"></div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Overall safety score based on current conditions and tourist behavior patterns.
                    </p>
                  </div>

                  {/* Quick Actions Card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Quick Actions
                    </div>

                    <div className="space-y-2">
                      {/* Primary Blue Button: Generate E-FIR */}
                      <button
                        onClick={() => setEfirModalAlert(alerts[0] || { id: 'INC-EMERGENCY', touristId: 'TID-NE-2026-88190' })}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Generate E-FIR</span>
                      </button>

                      {/* Secondary Light Blue Button: Broadcast Alert */}
                      <button
                        onClick={() => setIsAdvisoryModalOpen(true)}
                        className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Radio className="w-4 h-4" />
                        <span>Broadcast Alert</span>
                      </button>

                      {/* Tertiary Button: Export Report */}
                      <button
                        onClick={() => window.print()}
                        className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                        <span>Export Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Mini Alert Queue / Triage */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>Recent Active Alerts</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 font-mono">
                        {alerts.length} Incidents
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {alerts.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {a.touristName}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              a.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {a.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {a.locationName || 'Location'} • {a.type}
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <button
                              onClick={() => setDispatchModalAlert(a)}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              Dispatch Unit
                            </button>
                            <button
                              onClick={() => setEfirModalAlert(a)}
                              className="text-emerald-600 font-bold hover:underline"
                            >
                              E-FIR
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOURIST TRACKER */}
          {activeTab === 'tracker' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Active Tourist Tracking Registry
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Live GPS coordinates, battery levels, speed, and paired smart band telemetry
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter tourists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Tourist Name & ID</th>
                      <th className="py-2.5 px-3">Last Location</th>
                      <th className="py-2.5 px-3">Battery & Speed</th>
                      <th className="py-2.5 px-3">Safety Status</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {tourists.filter(t => t.fullName?.toLowerCase().includes(searchQuery.toLowerCase())).map((t) => (
                      <tr key={t.touristId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-slate-900 dark:text-white">{t.fullName}</div>
                          <div className="text-[10px] text-emerald-600 font-mono">{t.touristId}</div>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300">
                          {t.lastLocation?.locationName || 'GPS Pin'} ({t.lastLocation?.latitude?.toFixed(4)}, {t.lastLocation?.longitude?.toFixed(4)})
                        </td>
                        <td className="py-3 px-3">
                          {t.lastLocation?.batteryLevel || 85}% • {t.lastLocation?.speedKmh || 0} km/h
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.hasActiveSos ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.hasActiveSos ? '🚨 SOS ACTIVE' : '✓ NOMINAL'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <button
                            onClick={() => {
                              setSelectedEntity(t);
                              setActiveTab('dashboard');
                            }}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Focus on Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MAP & ZONES (FULL VIEW) */}
          {activeTab === 'map-zones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Full Situation GIS Map & Geo-Fence Risk Zones
                </h2>
              </div>
              <LiveGisMap
                tourists={tourists}
                patrolUnits={patrolUnits}
                geofences={geofences}
                activeAlerts={alerts}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                showWeatherLayer={true}
                heightClass="h-[740px]"
              />
            </div>
          )}

          {/* TAB 4: ACTIVE ALERTS */}
          {activeTab === 'alerts' && (
            <AlertQueue
              alerts={alerts}
              onAcknowledge={handleAcknowledge}
              onOpenDispatchModal={(alert) => setDispatchModalAlert(alert)}
              onOpenEfirModal={(alert) => setEfirModalAlert(alert)}
              onOpenExplainModal={(alert) => setExplainModalAlert(alert)}
              onResolveAlert={handleResolve}
              onSelectAlert={(alert) => setSelectedEntity(alert)}
            />
          )}

          {/* TAB 5: DIGITAL IDS */}
          {activeTab === 'digital-ids' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="font-extrabold text-base text-slate-900 dark:text-white border-b pb-2">
                Blockchain-Anchored Digital ID Registry
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tourists.map((t) => (
                  <div key={t.touristId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-sm">{t.fullName}</span>
                      <span className="font-mono text-emerald-600">{t.touristId}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Nationality: {t.nationality} • Blood: {t.bloodGroup} • e-KYC: Verified
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                      ✓ SHA-256 Merkle Block Hash Anchored
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LOCATION NEWS & FIELD BULLETINS */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <LiveLocationNewsFeed showBroadcastButton={true} />
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="font-extrabold text-base text-slate-900 dark:text-white">
                Police & Tourism Safety Analytics
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border space-y-1">
                  <div className="text-slate-400 font-bold uppercase">Average SOS Response</div>
                  <div className="text-2xl font-black text-emerald-600">4.1 seconds</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border space-y-1">
                  <div className="text-slate-400 font-bold uppercase">Patrol Dispatch SLA</div>
                  <div className="text-2xl font-black text-blue-600">3.8 minutes</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border space-y-1">
                  <div className="text-slate-400 font-bold uppercase">AI False Positive Rate</div>
                  <div className="text-2xl font-black text-purple-600">4.8%</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="font-extrabold text-base text-slate-900 dark:text-white border-b pb-2">
                Authority Portal Settings & DPDP Configuration
              </div>
              <p className="text-slate-500">
                Configure dispatch radio channels, DPDP Act 30-day retention policies, and CAD integration gateways.
              </p>
              <button
                onClick={() => api.runDpdpPurge()}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold"
              >
                Execute DPDP Data Minimization Purge
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <UnitDispatchModal
        isOpen={!!dispatchModalAlert}
        onClose={() => setDispatchModalAlert(null)}
        alert={dispatchModalAlert}
        patrolUnits={patrolUnits}
        onUnitDispatched={() => {
          setDispatchModalAlert(null);
          loadData();
        }}
      />

      <EFirModal
        isOpen={!!efirModalAlert}
        onClose={() => setEfirModalAlert(null)}
        alert={efirModalAlert}
      />

      <AnomalyExplainModal
        isOpen={!!explainModalAlert}
        onClose={() => setExplainModalAlert(null)}
        touristId={explainModalAlert?.touristId}
        alertId={explainModalAlert?.id}
      />

      <AdvisoryBroadcastModal
        isOpen={isAdvisoryModalOpen}
        onClose={() => setIsAdvisoryModalOpen(false)}
        onAdvisoryPublished={loadData}
      />
    </div>
  );
}
