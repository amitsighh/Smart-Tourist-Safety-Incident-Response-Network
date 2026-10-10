import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  FileText,
  UserCheck,
  ChevronRight,
  Filter,
  BrainCircuit
} from 'lucide-react';

export default function AlertQueue({
  alerts = [],
  onAcknowledge,
  onOpenDispatchModal,
  onOpenEfirModal,
  onOpenExplainModal,
  onResolveAlert,
  onSelectAlert
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Emergency Alert Queue & Incident Triage (FR-4.3)
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
            {filteredAlerts.length} Active
          </span>
        </div>

        {/* Severity & Status Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New / Unacknowledged</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900 dark:text-white">All Clear in Sector</div>
            <p className="text-xs text-slate-500">No active incidents matching current filters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isNew = alert.status === 'NEW';
            const isDispatched = alert.status === 'DISPATCHED';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  isCritical
                    ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Alert Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        alert.severity === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                        alert.severity === 'HIGH' ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {alert.severity}
                      </span>

                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{alert.id}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        alert.status === 'NEW' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                        alert.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        alert.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {alert.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-extrabold text-sm text-slate-900 dark:text-white">
                      <span>{alert.touristName || 'Tourist'}</span>
                      <span className="text-xs font-normal text-slate-500 font-mono">
                        ({alert.touristId})
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{alert.locationName || 'GPS Waypoint'} ({alert.district || 'Assam'})</span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{alert.notes || alert.emergencyNote}"
                    </p>

                    {alert.assignedUnitName && (
                      <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5 pt-0.5">
                        <Send className="w-3 h-3" />
                        <span>Dispatched: {alert.assignedUnitName} (ETA ~{alert.estimatedEtaMinutes || 6}m)</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Triage Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Explainability Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExplainModal(alert);
                      }}
                      className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold border border-purple-200 dark:border-purple-800"
                      title="View AI Anomaly Explainability Breakdown"
                    >
                      <BrainCircuit className="w-4 h-4" />
                    </button>

                    {/* Acknowledge Button */}
                    {alert.status === 'NEW' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledge(alert.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {/* Dispatch Unit Button */}
                    {alert.status !== 'RESOLVED' && alert.status !== 'CLOSED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDispatchModal(alert);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Patrol</span>
                      </button>
                    )}

                    {/* E-FIR Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEfirModal(alert);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Legal E-FIR</span>
                    </button>

                    {/* Resolve Button */}
                    {alert.status !== 'RESOLVED' && alert.status !== 'CLOSED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolveAlert(alert.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
