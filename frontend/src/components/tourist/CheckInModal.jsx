import React, { useState } from 'react';
import { api } from '../../services/api';
import { CheckCircle, Clock, MapPin, X, Loader2, Heart } from 'lucide-react';

export default function CheckInModal({ isOpen, onClose, touristId, onCheckInSuccess }) {
  const [note, setNote] = useState('Everything is fine. Taking a scenic rest break.');
  const [locationName, setLocationName] = useState('Shillong Peak Rest Point');
  const [scheduleNextMinutes, setScheduleNextMinutes] = useState(180);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.submitCheckIn(touristId, {
        note,
        locationName,
        latitude: 25.5788,
        longitude: 91.8933,
        scheduleNextMinutes: Number(scheduleNextMinutes),
        trekName: 'East Khasi Hills Mountain Route'
      });

      if (res.success) {
        setSuccessMsg('Safety Check-In Logged! Family and Police Command notified.');
        setTimeout(() => {
          if (onCheckInSuccess) onCheckInSuccess(res);
          onClose();
          setSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              "I'm Safe" Safety Check-In
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{successMsg}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Location / Landmark
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Safety Note (Visible to Family & Police)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Next Mountain Trek Check-In (FR-2.6)
              </label>
              <select
                value={scheduleNextMinutes}
                onChange={(e) => setScheduleNextMinutes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value={60}>In 1 hour (High risk mountain trek)</option>
                <option value={120}>In 2 hours (Moderate trek)</option>
                <option value={180}>In 3 hours (Standard daytime travel)</option>
                <option value={360}>In 6 hours (City / resort transit)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                If check-in is missed past deadline, AI Anomaly Engine automatically alerts control room.
              </p>
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
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm flex items-center space-x-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Confirm "I'm Safe"</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
