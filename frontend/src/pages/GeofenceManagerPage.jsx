import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import LiveGisMap from '../components/authority/LiveGisMap';

const PRESET_ZONES = [
  {
    name: 'Sela Pass Avalanche Defense Corridor (13,700 ft)',
    category: 'restricted',
    severity: 'CRITICAL',
    type: 'polygon',
    coordinates: [
      [27.49, 92.08],
      [27.53, 92.08],
      [27.53, 92.13],
      [27.49, 92.13]
    ],
    advisory: 'Zero visibility blizzard active. Heavy black ice on NH-13 hairpin curves.',
    safeRouteSuggestion: 'Halt vehicle convoy at Dirang transit gate until BRO clearance.'
  },
  {
    name: 'Dzukou Valley Alpine Curfew Zone',
    category: 'curfew',
    severity: 'HIGH',
    type: 'polygon',
    coordinates: [
      [25.54, 94.02],
      [25.58, 94.02],
      [25.58, 94.07],
      [25.54, 94.07]
    ],
    advisory: 'Sub-zero temperatures post 17:00 IST. Night trekking prohibited without registered SDRF guide.',
    safeRouteSuggestion: 'Check into registered SDRF Viswema base camp.'
  },
  {
    name: 'Kaziranga Core Wildlife Corridor',
    category: 'high_risk',
    severity: 'HIGH',
    type: 'circle',
    centerLat: '26.6500',
    centerLng: '93.3500',
    radiusMeters: '4500',
    advisory: 'Elephant and rhino migration corridor crossing national highway. Night speed limit 40 km/h.',
    safeRouteSuggestion: 'Follow guided convoy lane without stopping vehicle.'
  },
  {
    name: 'Nathu La Snowbound Border Buffer (14,140 ft)',
    category: 'restricted',
    severity: 'CRITICAL',
    type: 'circle',
    centerLat: '27.3867',
    centerLng: '88.8317',
    radiusMeters: '3500',
    advisory: 'Extreme high-altitude border security zone. Special Army/Civilian ILP permit mandatory.',
    safeRouteSuggestion: 'Exit via Sherathang transit checkpost before 15:30.'
  }
];

export default function GeofenceManagerPage() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isFullMap, setIsFullMap] = useState(false);
  const [selectedFence, setSelectedFence] = useState(null);

  // Form State
  const [name, setName] = useState('Kamakhya Pilgrim Security Perimeter');
  const [category, setCategory] = useState('high_risk');
  const [severity, setSeverity] = useState('HIGH');
  const [type, setType] = useState('circle');
  const [centerLat, setCenterLat] = useState('26.1664');
  const [centerLng, setCenterLng] = useState('91.7056');
  const [radiusMeters, setRadiusMeters] = useState('2000');
  const [advisory, setAdvisory] = useState('High crowd density sector. Maintain contact with tourist police.');
  const [safeRouteSuggestion, setSafeRouteSuggestion] = useState('Use primary VIP road ascent.');
  const [hasCurfew, setHasCurfew] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('06:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGeofences = async () => {
    try {
      const res = await api.getGeofences();
      if (res.success && res.geofences && res.geofences.length > 0) {
        setGeofences(res.geofences);
      } else {
        // Initialize with default presets if DB empty
        setGeofences(PRESET_ZONES.map((z, idx) => ({
          ...z,
          id: `GEOFENCE-0${idx + 1}`,
          isActive: true
        })));
      }
    } catch {
      setGeofences(PRESET_ZONES.map((z, idx) => ({
        ...z,
        id: `GEOFENCE-0${idx + 1}`,
        isActive: true
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeofences();
  }, []);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setCategory(preset.category);
    setSeverity(preset.severity);
    setType(preset.type);
    if (preset.centerLat) setCenterLat(preset.centerLat);
    if (preset.centerLng) setCenterLng(preset.centerLng);
    if (preset.radiusMeters) setRadiusMeters(preset.radiusMeters);
    setAdvisory(preset.advisory);
    setSafeRouteSuggestion(preset.safeRouteSuggestion);
    setIsCreating(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        category,
        severity,
        type,
        center: { lat: parseFloat(centerLat), lng: parseFloat(centerLng) },
        radiusMeters: parseInt(radiusMeters, 10),
        advisory,
        safeRouteSuggestion,
        schedule: hasCurfew ? { allDay: false, startTime, endTime } : { allDay: true }
      };

      const res = await api.createGeofence(payload);
      if (res.success) {
        setIsCreating(false);
        loadGeofences();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.toggleGeofence(id);
      if (res.success) {
        loadGeofences();
      } else {
        setGeofences(prev => prev.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g));
      }
    } catch {
      setGeofences(prev => prev.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate and remove this geofence zone?')) return;
    try {
      const res = await api.deleteGeofence(id);
      if (res.success) loadGeofences();
      else setGeofences(prev => prev.filter(g => g.id !== id));
    } catch {
      setGeofences(prev => prev.filter(g => g.id !== id));
    }
  };

  const focusZoneOnMap = (zone) => {
    setSelectedFence(zone);
    if (zone.type === 'circle' && zone.center) {
      // scroll to map or select
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#172B4D]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DCE7F3] shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Geospatial Defense & Geofence Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure polygon exclusion corridors, high-altitude hazard perimeters, wildlife crossings, and night curfews across Northeast sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFullMap(!isFullMap)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-xs"
          >
            {isFullMap ? <Minimize2 className="w-4 h-4 text-slate-600" /> : <Maximize2 className="w-4 h-4 text-blue-600" />}
            <span>{isFullMap ? 'Standard View' : 'Expanded Map Canvas'}</span>
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Geofence Zone</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Fill Templates */}
      <div className="bg-white p-5 rounded-2xl border border-[#DCE7F3] shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Quick Preset Templates (Tap to pre-fill official Northeast sectors):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {PRESET_ZONES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 transition space-y-1"
            >
              <div className="font-bold text-slate-900 truncate">{preset.name.split('(')[0]}</div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                <span className={`font-bold uppercase ${preset.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>
                  {preset.category}
                </span>
                <span>•</span>
                <span>{preset.type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-lg space-y-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Define New Geofence Perimeter</span>
            </h2>
            <span className="text-[11px] text-slate-500">Coordinates evaluate live on device</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Zone Designation Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Risk Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="restricted">Military / Border Defense Restricted</option>
                <option value="high_risk">Terrain / Cliff Hazard</option>
                <option value="curfew">Night Trek Curfew Zone</option>
                <option value="weather_hazard">Flood & Avalanche Hazard</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alert Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="CRITICAL">Critical (Immediate Alert & Police Flag)</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Caution</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Center Latitude</label>
              <input
                type="number"
                step="any"
                value={centerLat}
                onChange={(e) => setCenterLat(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Center Longitude</label>
              <input
                type="number"
                step="any"
                value={centerLng}
                onChange={(e) => setCenterLng(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Radius (Meters)</label>
              <input
                type="number"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tourist Warning Advisory</label>
              <input
                type="text"
                value={advisory}
                onChange={(e) => setAdvisory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recommended Safe Bypass Route</label>
              <input
                type="text"
                value={safeRouteSuggestion}
                onChange={(e) => setSafeRouteSuggestion(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center space-x-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={hasCurfew}
                onChange={(e) => setHasCurfew(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Time-Based Active Curfew Schedule (e.g. 18:00 to 06:00 Night Curfew)</span>
            </label>

            {hasCurfew && (
              <div className="flex items-center space-x-4 pt-1">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Start Time:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="p-2 rounded-lg bg-white border text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">End Time:</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="p-2 rounded-lg bg-white border text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              <span>Save & Broadcast Geofence</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Full Expansive GIS Map & Side List */}
      <div className={`grid grid-cols-1 ${isFullMap ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-6`}>
        {/* Left Side: Geofence List */}
        {!isFullMap && (
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between font-bold text-sm text-[#172B4D]">
              <span className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Active Safety Boundaries ({geofences.length})</span>
              </span>
              <span className="text-xs text-slate-500">Live Polygons</span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {geofences.map((g) => (
                <div
                  key={g.id}
                  onClick={() => focusZoneOnMap(g)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedFence?.id === g.id
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100 shadow-sm'
                      : 'bg-white border-[#DCE7F3] hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${g.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      <strong className="text-slate-900 font-bold text-xs">{g.name}</strong>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{g.id}</span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {g.advisory}
                  </p>

                  {g.safeRouteSuggestion && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <strong>Safe Route:</strong> {g.safeRouteSuggestion}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold uppercase ${g.category === 'restricted' ? 'text-red-600' : 'text-amber-600'}`}>
                        {g.category}
                      </span>
                      <span>•</span>
                      <span>{g.type === 'circle' ? `${g.radiusMeters}m radius` : 'Polygon Corridor'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(g.id);
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        {g.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(g.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right / Full View: Large GIS Map Canvas */}
        <div className={isFullMap ? 'lg:col-span-12' : 'lg:col-span-7'}>
          <div className="bg-white p-4 rounded-3xl border border-[#DCE7F3] shadow-md space-y-3">
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Tactical GIS Geofence Layer</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Pulsing red = Restricted • Amber = Curfew • Blue = Warning
              </span>
            </div>

            <LiveGisMap
              geofences={geofences}
              selectedEntity={selectedFence}
              heightClass={isFullMap ? "h-[740px]" : "h-[620px]"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
