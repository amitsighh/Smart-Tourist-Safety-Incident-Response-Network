import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText,
  Lock,
  Trash2,
  CheckCircle2,
  Users,
  Search,
  RefreshCw,
  Shield,
  Loader2,
  Filter
} from 'lucide-react';

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [purgeResult, setPurgeResult] = useState(null);
  const [isPurging, setIsPurging] = useState(false);

  const loadData = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        api.getAuditLogs({ userRole: roleFilter, action: searchAction }),
        api.getAdminUsers()
      ]);
      if (logsRes.success) setAuditLogs(logsRes.logs || []);
      if (usersRes.success) setUsers(usersRes.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, searchAction]);

  const handleRunPurge = async () => {
    setIsPurging(true);
    try {
      const res = await api.runDpdpPurge();
      setPurgeResult(res);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
            DPDP Act 2023 Governance (FR-7.3, FR-7.4)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            System Security & Immutable DPDP Audit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Mandatory audit logging for every access to sensitive tourist records, identity hashes, and emergency dispatches.
          </p>
        </div>

        <button
          onClick={handleRunPurge}
          disabled={isPurging}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          {isPurging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          <span>Run DPDP Auto-Retention Purge</span>
        </button>
      </div>

      {purgeResult && (
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-xs space-y-1 animate-in fade-in">
          <div className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>DPDP Retention Scan Executed</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Evaluated records post 30-day visit expiration threshold. {purgeResult.anonymizedCount} expired record(s) anonymized.
          </p>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Immutable Security Audit Trail ({auditLogs.length} Records)</span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              <option value="">All Roles</option>
              <option value="police">Police</option>
              <option value="operator">Operator</option>
              <option value="tourist">Tourist</option>
              <option value="admin">Admin</option>
            </select>

            <input
              type="text"
              placeholder="Search action..."
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Security Action</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <strong className="text-slate-900 dark:text-white">{log.userName || log.userId}</strong>
                    <span className="text-[10px] text-slate-400 block uppercase">{log.userRole}</span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {log.targetResource}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {log.ipAddress}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">
                    ✓ {log.statusCode || 200}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
