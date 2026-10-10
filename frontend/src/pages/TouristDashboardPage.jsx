import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import SafetyScoreGauge from '../components/tourist/SafetyScoreGauge';
import PanicButton from '../components/tourist/PanicButton';
import ItineraryTimeline from '../components/tourist/ItineraryTimeline';
import CheckInModal from '../components/tourist/CheckInModal';
import LiveGisMap from '../components/authority/LiveGisMap';
import LiveLocationNewsFeed from '../components/common/LiveLocationNewsFeed';
import {
  Radio,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  Compass,
  CheckCircle,
  Lock,
  Wifi,
  WifiOff,
  BatteryCharging,
  Sliders,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function TouristDashboardPage({ setActivePage }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { emitTelemetry } = useSocket();

  const [digitalId, setDigitalId] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [safetyScoreData, setSafetyScoreData] = useState({
    safetyScore: 85,
    tier: 'EXCELLENT',
    advisory: 'Your travel conditions are nominal. Stay on designated tourist trails.',
    deductions: []
  });
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [queuedSosList, setQueuedSosList] = useState([]);
  const [activeBreachAlert, setActiveBreachAlert] = useState(null);

  // Simulation controls
  const [simulatedLat, setSimulatedLat] = useState(25.5788);
  const [simulatedLng, setSimulatedLng] = useState(91.8933);
  const [simulatedBattery, setSimulatedBattery] = useState(82);

  // Load Digital ID and geofences
  useEffect(() => {
    async function loadData() {
      try {
        const idRes = await api.getMyDigitalId();
        if (idRes.success && idRes.digitalId) {
          setDigitalId(idRes.digitalId);
          setSimulatedLat(idRes.digitalId.lastLocation?.latitude || 25.5788);
          setSimulatedLng(idRes.digitalId.lastLocation?.longitude || 91.8933);
        }

        const geoRes = await api.getGeofences();
        if (geoRes.success) {
          setGeofences(geoRes.geofences || []);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      }
    }
    loadData();
  }, [user]);

  // Send periodic telemetry ping & evaluate safety score
  const sendPing = async (lat = simulatedLat, lng = simulatedLng, battery = simulatedBattery) => {
    if (!digitalId) return;

    if (offlineMode) {
      // simulate queued buffer
      return;
    }

    try {
      const pingData = {
        touristId: digitalId.touristId,
        latitude: lat,
        longitude: lng,
        batteryLevel: battery,
        speedKmh: 4.5
      };

      const res = await api.submitPing(pingData);
      if (res.success) {
        if (res.safetyScore) setSafetyScoreData(res.safetyScore);
        if (res.geofence?.hasBreach) {
          setActiveBreachAlert(res.geofence.insideBreaches[0]);
        } else {
          setActiveBreachAlert(null);
        }

        // Broadcast real-time telemetry on socket
        emitTelemetry({
          touristId: digitalId.touristId,
          fullName: digitalId.fullName,
          latitude: lat,
          longitude: lng,
          batteryLevel: battery,
          hasActiveSos: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Ping failed:', e);
    }
  };

  // Move GPS to preset test locations
  const handleMoveToPreset = (name, lat, lng) => {
    setSimulatedLat(lat);
    setSimulatedLng(lng);
    sendPing(lat, lng, simulatedBattery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Active Tracking Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block animate-pulse"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('tracking.trackingActive')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                {digitalId?.touristId || 'TID-NE-2026-88190'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sharing live safety telemetry with: <strong>{digitalId?.trackingRecipients === 'police_only' ? 'Police Command' : 'Police & Family Contacts'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Check-in Trigger */}
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>"I'm Safe" Check-In</span>
          </button>

          {/* Offline Toggle */}
          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              offlineMode
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle simulated offline mode"
          >
            {offlineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{offlineMode ? 'Offline Simulated' : 'Online'}</span>
          </button>
        </div>
      </div>

      {/* Geofence Breach Warning Banner (if simulated into danger zone) */}
      {activeBreachAlert && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl flex items-start justify-between gap-4 animate-bounce">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-black uppercase tracking-wider text-sm">
                🚨 RESTRICTED ZONE / CURFEW BREACH: {activeBreachAlert.name}
              </div>
              <p className="opacity-95">{activeBreachAlert.advisory}</p>
              {activeBreachAlert.safeRouteSuggestion && (
                <div className="font-bold text-yellow-300 pt-0.5">
                  Safe Route Advice: {activeBreachAlert.safeRouteSuggestion}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Safety Score Gauge (FR-2.1) */}
      <SafetyScoreGauge
        score={safetyScoreData.safetyScore}
        tier={safetyScoreData.tier}
        advisory={safetyScoreData.advisory}
        deductions={safetyScoreData.deductions}
      />

      {/* Main Grid: SOS Button & Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Panic SOS & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <PanicButton
            tourist={digitalId || { touristId: 'TID-NE-2026-88190', fullName: 'Priya Sharma' }}
            onSosTriggered={(alert) => {
              setSafetyScoreData(prev => ({
                ...prev,
                safetyScore: 20,
                tier: 'CRITICAL',
                advisory: 'Emergency SOS Broadcast Active. Stand by for police unit dispatch.'
              }));
            }}
          />

          {/* Interactive GPS Sandbox / Simulation Controls */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-white">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>GPS Simulation & Anomaly Sandbox</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Testing</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Simulate moving the tourist's GPS into hazard/curfew zones to test live geofence triggers and AI anomaly evaluation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleMoveToPreset("Shillong Safe", 25.5788, 91.8933)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-left border hover:border-emerald-500 transition-all font-semibold"
              >
                <div className="text-emerald-600 font-bold">1. Shillong Safe Sector</div>
                <div className="text-[10px] text-slate-400">Normal Highway • Score ~85</div>
              </button>

              <button
                onClick={() => handleMoveToPreset("Dzukou Curfew", 25.5682, 94.0483)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-left border hover:border-amber-500 transition-all font-semibold"
              >
                <div className="text-amber-600 font-bold">2. Dzukou Alpine Curfew</div>
                <div className="text-[10px] text-slate-400">Night Trek Freezing • Score ~45</div>
              </button>

              <button
                onClick={() => handleMoveToPreset("Kaziranga Flood", 26.6500, 93.3500)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-left border hover:border-red-500 transition-all font-semibold"
              >
                <div className="text-red-600 font-bold">3. Kaziranga Flood Core</div>
                <div className="text-[10px] text-slate-400">High Risk Wetland • Score ~40</div>
              </button>

              <button
                onClick={() => handleMoveToPreset("Sela Pass Avalanche", 27.5052, 92.1039)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-left border hover:border-red-500 transition-all font-semibold"
              >
                <div className="text-red-600 font-bold">4. Sela Pass Snowbound</div>
                <div className="text-[10px] text-slate-400">Blizzard Hazard • Score ~35</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live GIS Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Live Safety Zone & Geo-Fence Radar
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                GPS: {simulatedLat.toFixed(4)}, {simulatedLng.toFixed(4)}
              </span>
            </div>

            <LiveGisMap
              tourists={digitalId ? [{ ...digitalId, lastLocation: { latitude: simulatedLat, longitude: simulatedLng, locationName: 'Tourist Active Position', batteryLevel: simulatedBattery } }] : []}
              geofences={geofences}
            />
          </div>

          {/* Itinerary Waypoints */}
          <ItineraryTimeline
            touristId={digitalId?.touristId || 'TID-NE-2026-88190'}
            itinerary={digitalId?.itinerary || []}
          />
        </div>
      </div>

      {/* Live Sector Location News & Safety Intelligence */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <LiveLocationNewsFeed
          currentLocation={{
            latitude: simulatedLat,
            longitude: simulatedLng,
            locationName: digitalId?.lastLocation?.locationName || 'Shillong Plateau, Meghalaya'
          }}
          showBroadcastButton={['police', 'tourism_official', 'operator', 'admin'].includes(user?.role)}
        />
      </div>

      {/* Safety Check-in Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        touristId={digitalId?.touristId || 'TID-NE-2026-88190'}
      />
    </div>
  );
}
