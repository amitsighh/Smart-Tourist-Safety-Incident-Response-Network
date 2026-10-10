import React, { useState } from 'react';
import { Radio, Send, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function AdvisoryBroadcastModal({ isOpen, onClose, onAdvisoryPublished }) {
  const [title, setTitle] = useState('Flash Flood Warning: Heavy Rains in Cherrapunji Gorges');
  const [region, setRegion] = useState('East Khasi Hills (Cherrapunji / Dawki)');
  const [severity, setSeverity] = useState('WARNING');
  const [message, setMessage] = useState('Sudden water level rise in Wah Umngot & canyon waterfalls. All root bridge treks suspended until 08:00 AM tomorrow.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.broadcastAdvisory({ title, region, severity, message });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          if (onAdvisoryPublished) onAdvisoryPublished(res.advisory);
          onClose();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-amber-600">
            <Radio className="w-5 h-5 animate-pulse" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Broadcast Emergency Safety Advisory (FR-4.8)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Advisory Broadcast Dispatched!
            </div>
            <p className="text-xs text-slate-500">
              Pushed to all active tourist apps and operator portals in {region}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Advisory Headline / Subject
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target District / Sector
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="East Khasi Hills (Cherrapunji / Dawki)">East Khasi Hills (Cherrapunji / Dawki)</option>
                  <option value="Tawang & Sela Pass Corridor">Tawang & Sela Pass Corridor</option>
                  <option value="Kohima (Dzukou Valley)">Kohima (Dzukou Valley)</option>
                  <option value="Kaziranga National Park">Kaziranga National Park</option>
                  <option value="All North-East Tourism Sectors">All North-East Tourism Sectors</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="INFO">Informational Notice</option>
                  <option value="WARNING">Weather / Hazard Warning</option>
                  <option value="CRITICAL">Critical Night Curfew / Evacuation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Advisory Message & Tourist Action Instructions
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-sm flex items-center space-x-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Push Broadcast to Tourists</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
