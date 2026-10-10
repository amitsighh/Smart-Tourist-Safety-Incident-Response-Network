import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BrainCircuit,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Info
} from 'lucide-react';

export default function AnomalyExplainModal({ isOpen, onClose, touristId, alertId }) {
  const [explainData, setExplainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && touristId) {
      setLoading(true);
      api.getExplainability(touristId)
        .then(res => {
          if (res.success) setExplainData(res.analysis);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, touristId]);

  const handleFeedback = async (isConfirmed) => {
    if (!alertId && !explainData?.touristId) return;
    setIsSubmitting(true);
    try {
      await api.submitAiFeedback(
        alertId || 'ALT-DIRECT',
        isConfirmed,
        feedbackNotes || (isConfirmed ? 'Operator confirmed distress signals valid' : 'False positive weather artifact')
      );
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setFeedbackSubmitted(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-purple-600">
            <BrainCircuit className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              AI Anomaly Detection Signal Explainability (FR-3.7)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="text-xs text-slate-500 font-semibold">Analyzing multi-sensor telemetry signals...</span>
          </div>
        ) : explainData ? (
          <div className="mt-4 space-y-4 text-xs">
            {/* Top Score Banner */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Neural Anomaly Index
                </span>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-100">
                  {explainData.anomalyScore} / 100
                </div>
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Classification: <span className="text-purple-600 font-mono uppercase">{explainData.classification}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Confidence Score:</span>
                <span className="text-lg font-extrabold text-emerald-600">{explainData.confidenceScore}</span>
              </div>
            </div>

            {/* Contributing Signals Breakdown */}
            <div className="space-y-2">
              <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Triggering Signal Breakdown</span>
                <span className="text-[11px] text-slate-500">{explainData.signals?.length || 0} Signal(s) Active</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {explainData.signals?.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    No anomalous signals detected. All telemetry matches baseline nominal patterns.
                  </div>
                ) : (
                  explainData.signals?.map((sig, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{sig.name}</span>
                        </span>
                        <span className="text-[10px] font-extrabold font-mono text-purple-600 bg-purple-100 dark:bg-purple-950 px-2 py-0.2 rounded">
                          +{sig.weight} pts
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {sig.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Human-in-the-Loop Feedback (FR-3.6) */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Human-In-The-Loop Model Retraining Feedback</span>
              </div>

              <input
                type="text"
                placeholder="Operator notes (e.g. verified false alarm due to cell tower outage)"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />

              {feedbackSubmitted ? (
                <div className="p-2 bg-emerald-100 text-emerald-800 text-center font-bold rounded-lg">
                  Feedback recorded! Neural weights updated in validation buffer.
                </div>
              ) : (
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleFeedback(false)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 flex items-center space-x-1"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                    <span>Dismiss as False Positive</span>
                  </button>

                  <button
                    onClick={() => handleFeedback(true)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center space-x-1"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Confirm Anomaly</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
