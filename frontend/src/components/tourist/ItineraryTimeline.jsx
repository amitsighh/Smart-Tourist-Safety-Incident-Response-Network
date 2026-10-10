import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Plus, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function ItineraryTimeline({ touristId, itinerary = [], onItineraryUpdated }) {
  const [items, setItems] = useState(itinerary);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('25.2702');
  const [newLng, setNewLng] = useState('91.7323');
  const [newDate, setNewDate] = useState('2026-10-14');
  const [isSaving, setIsSaving] = useState(false);
  const [blockchainHash, setBlockchainHash] = useState(null);

  const handleAddWaypoint = async (e) => {
    e.preventDefault();
    if (!newName) return;
    setIsSaving(true);

    const updated = [
      ...items,
      {
        name: newName,
        lat: parseFloat(newLat),
        lng: parseFloat(newLng),
        arrivalDate: newDate,
        status: 'UPCOMING'
      }
    ];

    try {
      const res = await api.updateItinerary(touristId, updated);
      if (res.success) {
        setItems(res.itinerary);
        setBlockchainHash(res.blockchainAnchor?.blockHash);
        setIsAdding(false);
        setNewName('');
        if (onItineraryUpdated) onItineraryUpdated(res.itinerary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Travel Itinerary & Route Corridor</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable travel waypoints anchored to sovereign blockchain ledger (FR-1.6)
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Waypoint</span>
        </button>
      </div>

      {blockchainHash && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-mono">
          <span className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Block Hash: {blockchainHash.substring(0, 24)}...</span>
          </span>
          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded font-sans font-bold">
            Anchored
          </span>
        </div>
      )}

      {/* Add Waypoint Form */}
      {isAdding && (
        <form onSubmit={handleAddWaypoint} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-3 animate-in fade-in duration-150">
          <div className="font-bold text-slate-800 dark:text-slate-200">Add New Destination Waypoint</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Destination / Hotel / Attraction</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Cherrapunji Root Bridges"
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Estimated Arrival Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center space-x-1"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Save & Mine Block</span>
            </button>
          </div>
        </form>
      )}

      {/* Timeline Waypoints List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {items.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Step Icon */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
              item.status === 'COMPLETED'
                ? 'bg-emerald-500 border-emerald-400 text-white'
                : item.status === 'IN_PROGRESS'
                ? 'bg-amber-500 border-amber-400 text-white animate-pulse'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
            }`}>
              {item.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="text-[9px] font-bold">{idx + 1}</span>
              )}
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>{item.name}</span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase ${
                    item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    item.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  GPS: {item.lat?.toFixed(4)}, {item.lng?.toFixed(4)} • Arrival: {item.arrivalDate || 'TBD'}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 shrink-0">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Leg #{idx + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
