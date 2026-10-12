import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Maximize2
} from 'lucide-react';

const DEFAULT_DEMO_TOURIST = {
  touristId: 'TID-NE-2026-88190',
  fullName: 'Priya Sharma',
  nationality: 'Indian',
  bloodGroup: 'B+ Positive',
  phone: '+91 98765 43210',
  trackingRecipients: 'police_and_contacts',
  validUntil: '2026-10-28T23:59:59.000Z',
  itinerary: [
    { day: 1, name: 'Guwahati Transit Hub', lat: 26.1445, lng: 91.7362, status: 'COMPLETED' },
    { day: 2, name: 'Umiam Lake Viewpoint', lat: 25.6667, lng: 91.8833, status: 'COMPLETED' },
    { day: 3, name: 'Shillong Peak & Laitkor', lat: 25.5788, lng: 91.8933, status: 'ACTIVE' },
    { day: 4, name: 'Cherrapunji Living Root Bridges', lat: 25.2505, lng: 91.6850, status: 'UPCOMING' },
    { day: 5, name: 'Dawki Umngot River Border', lat: 25.1856, lng: 92.0191, status: 'UPCOMING' }
  ],
  lastLocation: {
    latitude: 25.5788,
    longitude: 91.8933,
    locationName: 'Shillong Peak Ridge Sector',
    batteryLevel: 84
  }
};

const DEFAULT_GEOFENCES = [
  {
    id: 'GEOFENCE-01',
    name: 'Sela Pass Avalanche & Snowbound Corridor',
    category: 'restricted',
    severity: 'CRITICAL',
    type: 'polygon',
    isActive: true,
    coordinates: [
      [27.49, 92.08],
      [27.53, 92.08],
      [27.53, 92.13],
      [27.49, 92.13]
    ],
    advisory: 'Zero visibility blizzard active. Heavy black ice on NH-13 hairpin curves.',
    safeRouteSuggestion: 'Halt vehicle convoy at Dirang transit gate until BRO green clearance.'
  },
  {
    id: 'GEOFENCE-02',
    name: 'Dzukou Valley Alpine Curfew Zone',
    category: 'curfew',
    severity: 'HIGH',
    type: 'polygon',
    isActive: true,
    coordinates: [
      [25.54, 94.02],
      [25.58, 94.02],
      [25.58, 94.07],
      [25.54, 94.07]
    ],
    advisory: 'Sub-zero temperatures post 17:00 IST. Strict night trekking curfew enforced.',
    safeRouteSuggestion: 'Check into registered SDRF Viswema base camp.'
  },
  {
    id: 'GEOFENCE-03',
    name: 'Kaziranga Core Elephant & Rhino Corridor',
    category: 'high_risk',
    severity: 'HIGH',
    type: 'circle',
    isActive: true,
    center: { lat: 26.6500, lng: 93.3500 },
    radiusMeters: 4000,
    advisory: 'Wildlife migration crossing highway. Night speed limit 40 km/h enforced by forest sensors.',
    safeRouteSuggestion: 'Maintain single-lane highway convoy without honking.'
  }
];

export default function TouristDashboardPage({ setActivePage }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { emitTelemetry } = useSocket();

  const [digitalId, setDigitalId] = useState(DEFAULT_DEMO_TOURIST);
  const [geofences, setGeofences] = useState(DEFAULT_GEOFENCES);
  const [safetyScoreData, setSafetyScoreData] = useState({
    safetyScore: 85,
    tier: 'EXCELLENT',
    advisory: 'Your travel conditions are nominal. Stay on designated tourist trails.',
    deductions: []
  });
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeBreachAlert, setActiveBreachAlert] = useState(null);
  const [isLargeMap, setIsLargeMap] = useState(false);

  const [simulatedLat, setSimulatedLat] = useState(25.5788);
  const [simulatedLng, setSimulatedLng] = useState(91.8933);
  const [simulatedBattery, setSimulatedBattery] = useState(84);
  const [currentLocationName, setCurrentLocationName] = useState('Shillong Peak Ridge Sector');

  useEffect(() => {
    async function loadData() {
      try {
        const idRes = await api.getMyDigitalId();
        if (idRes.success && idRes.digitalId) {
          setDigitalId(idRes.digitalId);
          if (idRes.digitalId.lastLocation?.latitude) {
            setSimulatedLat(idRes.digitalId.lastLocation.latitude);
            setSimulatedLng(idRes.digitalId.lastLocation.longitude);
            setCurrentLocationName(idRes.digitalId.lastLocation.locationName || 'Shillong Sector');
          }
        }
      } catch {
        // Keep default demo tourist
      }

      try {
        const geoRes = await api.getGeofences();
        if (geoRes.success && geoRes.geofences && geoRes.geofences.length > 0) {
          setGeofences(geoRes.geofences);
        }
      } catch {
        // Keep default geofences
      }
    }
    loadData();
  }, [user]);

  const evaluateLocalBreach = (lat, lng) => {
    if (!Array.isArray(geofences)) return null;
    for (const fence of geofences) {
      if (!fence || !fence.isActive) continue;
      if (fence.type === 'circle') {
        const cLat = fence.center?.lat ?? fence.centerLat;
        const cLng = fence.center?.lng ?? fence.centerLng;
        if (cLat !== undefined && cLng !== undefined) {
          const dist = Math.hypot(parseFloat(cLat) - lat, parseFloat(cLng) - lng) * 111;
          if (dist <= (parseFloat(fence.radiusMeters) || 3000) / 1000) {
            return fence;
          }
        }
      } else if (fence.type === 'polygon' && Array.isArray(fence.coordinates) && fence.coordinates.length >= 3) {
        let inside = false;
        const coords = fence.coordinates.map(pt => {
          if (Array.isArray(pt)) return [parseFloat(pt[0]), parseFloat(pt[1])];
          if (pt && typeof pt === 'object') return [parseFloat(pt.lat), parseFloat(pt.lng)];
          return null;
        }).filter(Boolean);

        if (coords.length >= 3) {
          for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const [latI, lngI] = coords[i];
            const [latJ, lngJ] = coords[j];
            const intersect = ((latI > lat) !== (latJ > lat)) &&
              (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI);
            if (intersect) inside = !inside;
          }
          if (inside) return fence;
        }
      }
    }
    return null;
  };

  const sendPing = async (lat = simulatedLat, lng = simulatedLng, locName = currentLocationName) => {
    const breach = evaluateLocalBreach(lat, lng);
    setActiveBreachAlert(breach);

    let score = 85;
    let tier = 'EXCELLENT';
    let advisory = 'Your travel conditions are nominal. Stay on designated trails.';
    let deductions = [];

    if (breach) {
      if (breach.severity === 'CRITICAL') {
        score = 35;
        tier = 'CRITICAL';
        advisory = `Entered restricted zone: ${breach.name}. Police dispatch alerted.`;
        deductions = [{ reason: `Restricted Zone Breach (${breach.name})`, points: -50 }];
      } else {
        score = 50;
        tier = 'MODERATE';
        advisory = `Caution: Active curfew or hazard in ${breach.name}.`;
        deductions = [{ reason: `Hazard Zone Warning (${breach.name})`, points: -35 }];
      }
    }

    setSafetyScoreData({ safetyScore: score, tier, advisory, deductions });

    try {
      emitTelemetry({
        touristId: digitalId?.touristId || 'TID-NE-2026-88190',
        fullName: digitalId?.fullName || 'Priya Sharma',
        latitude: lat,
        longitude: lng,
        batteryLevel: simulatedBattery,
        hasActiveSos: breach?.severity === 'CRITICAL',
        timestamp: new Date().toISOString()
      });

      if (!offlineMode) {
        await api.submitPing({
          touristId: digitalId?.touristId || 'TID-NE-2026-88190',
          latitude: lat,
          longitude: lng,
          locationName: locName,
          batteryLevel: simulatedBattery,
          speedKmh: 4.5
        });
      }
    } catch (e) {
      console.warn('Ping sync background notice:', e.message);
    }
  };

  const handleMoveToPreset = (name, lat, lng) => {
    setSimulatedLat(lat);
    setSimulatedLng(lng);
    setCurrentLocationName(name);
    sendPing(lat, lng, name);
  };

  const touristsOnMap = useMemo(() => [{
    touristId: digitalId?.touristId || 'TID-NE-2026-88190',
    fullName: digitalId?.fullName || 'Priya Sharma',
    nationality: digitalId?.nationality || 'Indian',
    phone: digitalId?.phone || '+91 98765 43210',
    lastLocation: {
      latitude: Number(simulatedLat) || 25.5788,
      longitude: Number(simulatedLng) || 91.8933,
      locationName: currentLocationName || 'Shillong Peak Ridge Sector',
      batteryLevel: Number(simulatedBattery) || 84,
      timestamp: new Date().toISOString()
    }
  }], [digitalId, simulatedLat, simulatedLng, currentLocationName, simulatedBattery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Active Tracking Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-[#DCE7F3] shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block animate-pulse"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-[#172B4D] uppercase tracking-wider">
                {t('tracking.trackingActive')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                {digitalId?.touristId || 'TID-NE-2026-88190'}
              </span>
              <span className="text-xs font-semibold text-slate-600">({digitalId?.fullName || 'Priya Sharma'})</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live Location: <strong className="text-slate-800">{currentLocationName}</strong> ({Number(simulatedLat || 0).toFixed(4)}, {Number(simulatedLng || 0).toFixed(4)}) • Sharing with: <strong>Police Command & Emergency Contacts</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-300 flex items-center space-x-1.5 shadow-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>"I'm Safe" Check-In</span>
          </button>

          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              offlineMode
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Toggle simulated offline mode"
          >
            {offlineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{offlineMode ? 'Offline Simulated' : 'Online Sync'}</span>
          </button>
        </div>
      </div>

      {/* Geofence Breach Warning Banner (Live Danger Alarm) */}
      {activeBreachAlert && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl flex items-start justify-between gap-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-black uppercase tracking-wider text-sm flex items-center space-x-2">
                <span>RESTRICTED / HAZARD ZONE BREACH DETECTED: {activeBreachAlert.name}</span>
              </div>
              <p className="opacity-95 text-xs">{activeBreachAlert.advisory}</p>
              {activeBreachAlert.safeRouteSuggestion && (
                <div className="font-bold text-yellow-200 pt-0.5">
                  Safe Route Advice: {activeBreachAlert.safeRouteSuggestion}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Safety Score Gauge */}
      <SafetyScoreGauge
        score={safetyScoreData.safetyScore}
        tier={safetyScoreData.tier}
        advisory={safetyScoreData.advisory}
        deductions={safetyScoreData.deductions}
      />

      {/* Main Grid: Panic SOS & Live Radar Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Panic SOS & Interactive Testing Sandbox */}
        <div className="lg:col-span-5 space-y-6">
          <PanicButton
            tourist={digitalId}
            onSosTriggered={(alert) => {
              setSafetyScoreData({
                safetyScore: 20,
                tier: 'CRITICAL',
                advisory: 'Emergency SOS Broadcast Transmitted. Police unit dispatched.',
                deductions: [{ reason: 'Emergency SOS Active', points: -65 }]
              });
            }}
          />

          {/* Interactive GPS Simulation Controls */}
          <div className="p-5 rounded-3xl bg-white border border-[#DCE7F3] shadow-sm space-y-3.5 text-xs">
            <div className="flex items-center justify-between font-bold text-[#172B4D]">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>GPS Telemetry & Geofence Testbed</span>
              </span>
              <span className="text-[10px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Interactive Test
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Tap any location preset below to move the tourist's GPS in real-time, recalculating safety scores and testing geofence alerts:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleMoveToPreset("Shillong Safe Sector", 25.5788, 91.8933)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  currentLocationName.includes('Shillong')
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                    : 'bg-white hover:border-emerald-400'
                }`}
              >
                <div className="text-emerald-700 font-bold">1. Shillong Safe Sector</div>
                <div className="text-[10px] text-slate-500">Normal highway • Score: 85</div>
              </button>

              <button
                onClick={() => handleMoveToPreset("Dzukou Alpine Curfew Zone", 25.5600, 94.0400)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  currentLocationName.includes('Dzukou')
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                    : 'bg-white hover:border-amber-400'
                }`}
              >
                <div className="text-amber-800 font-bold">2. Dzukou Alpine Curfew</div>
                <div className="text-[10px] text-slate-500">Night trek freezing • Score: 50</div>
              </button>

              <button
                onClick={() => handleMoveToPreset("Kaziranga Wildlife Corridor", 26.6500, 93.3500)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  currentLocationName.includes('Kaziranga')
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                    : 'bg-white hover:border-amber-400'
                }`}
              >
                <div className="text-amber-700 font-bold">3. Kaziranga Corridor</div>
                <div className="text-[10px] text-slate-500">Wildlife crossing • Score: 50</div>
              </button>

              <button
                onClick={() => handleMoveToPreset("Sela Pass Avalanche Restricted", 27.5052, 92.1039)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  currentLocationName.includes('Sela Pass')
                    ? 'border-red-500 bg-red-50/60 ring-2 ring-red-200'
                    : 'bg-white hover:border-red-400'
                }`}
              >
                <div className="text-red-700 font-bold">4. Sela Pass Restricted</div>
                <div className="text-[10px] text-slate-500">Blizzard hazard • Score: 35</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Tactical GIS Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-[#DCE7F3] shadow-md space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-[#172B4D]">
                  Live Safety Zone & Geo-Fence Radar
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLargeMap(!isLargeMap)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center space-x-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{isLargeMap ? 'Compact Map' : 'Larger Map View'}</span>
                </button>
                <span className="text-xs font-mono text-slate-500">
                  {Number(simulatedLat || 0).toFixed(4)}, {Number(simulatedLng || 0).toFixed(4)}
                </span>
              </div>
            </div>

            <LiveGisMap
              tourists={touristsOnMap}
              geofences={geofences}
              heightClass={isLargeMap ? "h-[680px]" : "h-[480px]"}
            />
          </div>

          {/* Itinerary Waypoints */}
          <ItineraryTimeline
            touristId={digitalId?.touristId || 'TID-NE-2026-88190'}
            itinerary={digitalId?.itinerary || []}
          />
        </div>
      </div>

      {/* Live Field Intelligence Feed */}
      <div className="pt-4 border-t border-[#DCE7F3]">
        <LiveLocationNewsFeed
          currentLocation={{
            latitude: Number(simulatedLat) || 25.5788,
            longitude: Number(simulatedLng) || 91.8933,
            locationName: currentLocationName || 'Shillong Peak Ridge Sector'
          }}
          showBroadcastButton={['police', 'tourism_official', 'operator', 'admin'].includes(user?.role)}
        />
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        touristId={digitalId?.touristId || 'TID-NE-2026-88190'}
      />
    </div>
  );
}
