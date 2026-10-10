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
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import LiveGisMap from '../components/authority/LiveGisMap';

export default function GeofenceManagerPage() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('Kamakhya Temple Hilltop Perimeter');
  const [category, setCategory] = useState('high_risk'); // 'restricted', 'high_risk', 'curfew', 'weather_hazard'
  const [severity, setSeverity] = useState('MEDIUM');
  const [type, setType] = useState('circle');
  const [centerLat, setCenterLat] = useState('26.1664');
  const [centerLng, setCenterLng] = useState('91.7056');
  const [radiusMeters, setRadiusMeters] = useState('1500');
  const [advisory, setAdvisory] = useState('Crowded pilgrimage sector. Maintain group contact and watch footing.');
  const [safeRouteSuggestion, setSafeRouteSuggestion] = useState('Use primary VIP road ascent.');
  const [hasCurfew, setHasCurfew] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('06:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGeofences = async () => {
    try {
      const res = await api.getGeofences();
      if (res.success) setGeofences(res.geofences || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeofences();
  }, []);

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
      if (res.success) loadGeofences();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this geofence zone?')) return;
    try {
      const res = await api.deleteGeofence(id);
      if (res.success) loadGeofences();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            Geospatial Safety Zones (FR-4.5)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Geo-Fence Boundary & Curfew Manager
          </h1>
          <p className="text-xs text-slate-500">
            Configure polygon defense corridors, flood risk zones, night trekking curfews, and safe bypass routes.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Geo-Fence Zone</span>
        </button>
      </div>

      {/* Geofence Creator Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs animate-in fade-in duration-150">
          <div className="font-extrabold text-base text-slate-900 dark:text-white border-b pb-2">
            Create New Geo-Fence Danger / Curfew Zone
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Zone Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="restricted">Military / Border Defense Restricted</option>
                <option value="high_risk">Terrain / Cliff Hazard</option>
                <option value="curfew">Night Trek Curfew Zone</option>
                <option value="weather_hazard">Flood & Landslide Prone Area</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="CRITICAL">Critical (Immediate Alert)</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Caution</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Center Latitude</label>
              <input
                type="number"
                step="any"
                value={centerLat}
                onChange={(e) => setCenterLat(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Center Longitude</label>
              <input
                type="number"
                step="any"
                value={centerLng}
                onChange={(e) => setCenterLng(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Radius (Meters)</label>
              <input
                type="number"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Warning Advisory Message</label>
              <input
                type="text"
                value={advisory}
                onChange={(e) => setAdvisory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Recommended Safe Bypass Route</label>
              <input
                type="text"
                value={safeRouteSuggestion}
                onChange={(e) => setSafeRouteSuggestion(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="flex items-center space-x-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={hasCurfew}
                onChange={(e) => setHasCurfew(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Enable Time-Based Active Curfew Schedule (e.g. Night Restrictions)</span>
            </label>

            {hasCurfew && (
              <div className="flex items-center space-x-4 pt-1">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Start Time:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">End Time:</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center space-x-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              <span>Save & Activate Geofence</span>
            </button>
          </div>
        </form>
      )}

      {/* Geofences List & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-4">
          <div className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Active Geofence Boundaries ({geofences.length})</span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto">
            {geofences.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${g.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <strong className="text-slate-900 dark:text-white font-bold">{g.name}</strong>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{g.id}</span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {g.advisory}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px] text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold uppercase text-red-600">{g.category}</span>
                    <span>•</span>
                    <span>{g.type === 'circle' ? `Radius: ${g.radiusMeters}m` : 'Polygon Polygon'}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggle(g.id)}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      {g.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Preview */}
        <div className="lg:col-span-6">
          <LiveGisMap geofences={geofences} />
        </div>
      </div>
    </div>
  );
}
