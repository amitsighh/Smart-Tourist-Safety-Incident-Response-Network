import React, { useState } from 'react';
import { Send, MapPin, Shield, X, Loader2, Phone } from 'lucide-react';
import { api } from '../../services/api';

export default function UnitDispatchModal({ isOpen, onClose, alert, patrolUnits = [], onUnitDispatched }) {
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [notes, setNotes] = useState('High priority rescue dispatch. Bring trauma medical kit and mountain satellite relay.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnitId) return;
    setIsSubmitting(true);

    try {
      const res = await api.assignUnit(alert.id, selectedUnitId, notes);
      if (res.success) {
        if (onUnitDispatched) onUnitDispatched(res);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUnits = patrolUnits.filter(u => u.status === 'AVAILABLE' || u.status === 'PATROLLING');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-blue-600">
            <Send className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Dispatch Police Patrol Unit
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Summary */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Incident #{alert.id} ({alert.type})</span>
            <span className="text-red-600 font-bold uppercase">{alert.severity}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            Tourist: <strong>{alert.touristName}</strong> ({alert.touristId})
          </div>
          <div className="text-slate-500 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Target GPS: {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)} ({alert.locationName})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Nearest Response Unit
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableUnits.length === 0 ? (
                <div className="p-3 text-center text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  No available units on standby.
                </div>
              ) : (
                availableUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedUnitId === unit.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="patrolUnit"
                        value={unit.id}
                        checked={selectedUnitId === unit.id}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold">{unit.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {unit.officerInCharge} • {unit.currentSector}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono">
                      <span className="text-emerald-600 font-bold uppercase">{unit.status}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dispatch Orders & Field Directives
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedUnitId}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Confirm & Dispatch Vehicle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
