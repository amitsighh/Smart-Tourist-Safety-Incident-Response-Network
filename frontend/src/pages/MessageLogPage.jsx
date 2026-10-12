import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import {
  MessageSquare,
  ShieldAlert,
  Send,
  RefreshCw,
  Radio,
  CheckCircle,
  Clock,
  XCircle,
  Wifi,
  WifiOff,
  Filter,
  FileText,
  AlertTriangle,
  Play
} from 'lucide-react';

export default function MessageLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [demoNumber, setDemoNumber] = useState('+917307007253');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [simulating, setSimulating] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(offlineStorage.isSimulatedOffline());

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotificationLogs({
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });
      if (res.success) {
        setLogs(res.logs || []);
        setDemoMode(res.demoMode);
        setDemoNumber(res.demoPhoneNumber || '+917307007253');
      }
    } catch (err) {
      console.error('Failed to load message logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [roleFilter, statusFilter]);

  const handleToggleOffline = () => {
    const nextVal = !isOfflineSimulated;
    offlineStorage.setSimulatedOffline(nextVal);
    setIsOfflineSimulated(nextVal);
  };

  const runScenario = async (scenarioType) => {
    setSimulating(scenarioType);
    setSimulationResult(null);
    try {
      const res = await api.simulateScenario({ scenarioType });
      setSimulationResult(res);
      await fetchLogs();
    } catch (err) {
      setSimulationResult({ success: false, message: err.message || 'Simulation error' });
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#172B4D] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DCE7F3] shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-[#172B4D]">Notification & SMS Message Log</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-division dispatch audit, SMS gateway delivery verification, and real-time scenario testbed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleOffline}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                isOfflineSimulated
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isOfflineSimulated ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
              <span>{isOfflineSimulated ? 'Offline Simulation Active' : 'Simulate Offline Mode'}</span>
            </button>

            <button
              onClick={fetchLogs}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {demoMode && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>
                <strong>DEMO MODE ACTIVE:</strong> All outgoing messages across all divisions are safely redirected to your verified demo number: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-300">{demoNumber}</span>
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold uppercase">
              Role Prefixes Applied
            </span>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-[#DCE7F3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span>Scenario Simulator Panel (Runs Real Code Paths)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => runScenario('TRIGGER_SOS_ONLINE')}
              disabled={simulating !== null}
              className="p-3.5 text-left rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300 transition text-xs space-y-1"
            >
              <div className="font-bold text-red-700 flex items-center justify-between">
                <span>1. Trigger SOS (Online)</span>
                {simulating === 'TRIGGER_SOS_ONLINE' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <p className="text-[11px] text-slate-600">Dispatches multi-division notifications to Police, Tourism, and Emergency Contacts.</p>
            </button>

            <button
              onClick={() => runScenario('TRIGGER_SOS_SMS')}
              disabled={simulating !== null}
              className="p-3.5 text-left rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition text-xs space-y-1"
            >
              <div className="font-bold text-blue-700 flex items-center justify-between">
                <span>2. Send SOS by SMS (Inbound)</span>
                {simulating === 'TRIGGER_SOS_SMS' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <p className="text-[11px] text-slate-600">Simulates compact HMAC signed SMS payload, validates replay counter, and creates incident.</p>
            </button>

            <button
              onClick={() => runScenario('GEOFENCE_BREACH')}
              disabled={simulating !== null}
              className="p-3.5 text-left rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition text-xs space-y-1"
            >
              <div className="font-bold text-amber-800 flex items-center justify-between">
                <span>3. Geo-fence Breach</span>
                {simulating === 'GEOFENCE_BREACH' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <p className="text-[11px] text-slate-600">Simulates tourist movement into Sela Pass military buffer polygon and alerts police.</p>
            </button>

            <button
              onClick={() => runScenario('MISSED_CHECKIN')}
              disabled={simulating !== null}
              className="p-3.5 text-left rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition text-xs space-y-1"
            >
              <div className="font-bold text-purple-700 flex items-center justify-between">
                <span>4. Missed Check-ins (Silent)</span>
                {simulating === 'MISSED_CHECKIN' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <p className="text-[11px] text-slate-600">AI Anomaly engine flags inactivity & missed check-ins on remote trek trail.</p>
            </button>

            <button
              onClick={() => runScenario('CREATE_EFIR')}
              disabled={simulating !== null}
              className="p-3.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs space-y-1"
            >
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>5. Create Legal E-FIR</span>
                {simulating === 'CREATE_EFIR' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <p className="text-[11px] text-slate-600">Generates missing-person E-FIR document, blockchain anchor, and dispatches police copy.</p>
            </button>

            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 text-xs flex flex-col justify-center">
              <span className="font-semibold text-slate-700">SMS Inbound Reply '1'</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Officers replying '1' to inbound SMS instantly acknowledge live incident.</p>
            </div>
          </div>

          {simulationResult && (
            <div className={`p-3 rounded-xl text-xs border ${
              simulationResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <strong>Simulation Result:</strong> {simulationResult.message || JSON.stringify(simulationResult)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE7F3] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#DCE7F3] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-700">Filter Dispatches:</span>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
              >
                <option value="">All Roles</option>
                <option value="police">Police Control Room</option>
                <option value="police_unit">Patrol Unit</option>
                <option value="emergency_contact">Emergency Contact</option>
                <option value="tourism_official">Tourism Official</option>
                <option value="medical">Medical Desk</option>
                <option value="disaster_response">Disaster / SDRF</option>
                <option value="tourist">Tourist Confirmation</option>
                <option value="silent_anomaly">Silent Anomaly</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
              >
                <option value="">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="SENT">Sent</option>
                <option value="QUEUED">Queued</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Total Messages: {logs.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F9FF] border-b border-[#DCE7F3] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Intended Role</th>
                  <th className="py-3 px-4">Actual Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Message Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE7F3]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No notification messages dispatched yet. Use the Simulator Panel above to trigger dispatches.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 uppercase text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.intendedRole?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-700">
                          {log.actualRecipient}
                        </div>
                        {log.intendedRecipient !== log.actualRecipient && (
                          <div className="text-[10px] text-slate-400">
                            Intended: {log.intendedRecipient}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-600">{log.channel}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SENT'
                            ? 'bg-blue-100 text-blue-800'
                            : log.status === 'QUEUED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status === 'DELIVERED' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {log.status === 'QUEUED' && <Clock className="w-3 h-3 text-amber-600" />}
                          {log.status === 'FAILED' && <XCircle className="w-3 h-3 text-red-600" />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <pre className="font-mono text-[11px] text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 whitespace-pre-wrap max-w-lg">
                          {log.messageText}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
