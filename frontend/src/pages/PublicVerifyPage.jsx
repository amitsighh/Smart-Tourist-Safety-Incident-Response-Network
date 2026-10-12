import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, ShieldAlert, CheckCircle, Clock, XCircle, Search } from 'lucide-react';

export default function PublicVerifyPage() {
  const [touristId, setTouristId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromParam = urlParams.get('id') || window.location.pathname.split('/verify/')[1];
    if (idFromParam) {
      setTouristId(idFromParam);
      verifyId(idFromParam);
    }
  }, []);

  const verifyId = async (idToVerify) => {
    const target = idToVerify || touristId;
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.getPublicVerification(target);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.message || 'ID not found.');
      }
    } catch (err) {
      setError('Verification service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#172B4D] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#DCE7F3] shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            Official Tourist ID Public Verifier
          </h1>
          <p className="text-xs text-slate-500">
            Privacy-preserving verification for checkpoints, hotels, and authorized transport operators.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={touristId}
            onChange={(e) => setTouristId(e.target.value)}
            placeholder="e.g. TID-NE-2026-92868"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => verifyId()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow"
          >
            <Search className="w-4 h-4" />
            <span>Verify</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className={`p-5 rounded-xl border text-center space-y-3 ${
            result.status === 'VALID'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : result.status === 'EXPIRED'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            <div className="flex justify-center">
              {result.status === 'VALID' && <CheckCircle className="w-10 h-10 text-emerald-600" />}
              {result.status === 'EXPIRED' && <Clock className="w-10 h-10 text-amber-600" />}
              {result.status === 'REVOKED' && <ShieldAlert className="w-10 h-10 text-red-600" />}
            </div>

            <div>
              <div className="text-xs font-mono text-slate-500 uppercase">Verification Status</div>
              <div className="text-lg font-extrabold tracking-wider">{result.status}</div>
            </div>

            <div className="bg-white/80 p-3 rounded-lg border border-slate-200 text-xs text-left space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Tourist First Name:</span>
                <span className="font-bold text-slate-800">{result.firstName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered ID:</span>
                <span className="font-mono font-bold text-slate-800">{result.touristId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-bold text-slate-800">
                  {new Date(result.validUntil).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Anchored on Sovereign PoA Blockchain Ledger • Zero PII Exposure Standard
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
