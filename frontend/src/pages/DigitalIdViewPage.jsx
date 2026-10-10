import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import DigitalIdCard from '../components/tourist/DigitalIdCard';
import { ShieldCheck, Lock, QrCode, CheckCircle2, Copy, ExternalLink, Loader2, FileText, UserCheck } from 'lucide-react';

export default function DigitalIdViewPage({ setActivePage }) {
  const { user } = useAuth();
  const [digitalId, setDigitalId] = useState(null);
  const [blockchainHistory, setBlockchainHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getMyDigitalId();
        if (res.success) {
          setDigitalId(res.digitalId);
          setBlockchainHistory(res.blockchainHistory || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 bg-slate-50 min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Retrieving sovereign blockchain records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Sovereign Digital Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Digital Tourist ID & Cryptographic Card
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Tamper-proof, visit-bounded digital credential authorized across all Northeast check-posts, airports, and registered accommodations.
        </p>
      </div>

      {digitalId ? (
        <div className="space-y-8">
          <DigitalIdCard digitalId={digitalId} />

          {/* Cryptographic Verification Proof Banner */}
          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Blockchain-Anchored Inclusion Proofs (FR-1.4)</span>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                PoA Consensus Validated
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">DIGITAL ID REGISTRATION HASH:</span>
                <span className="text-blue-700 break-all font-bold">
                  {digitalId.kycHash}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">OFF-CHAIN ENCRYPTED DOC REFERENCE:</span>
                <span className="text-slate-600 break-all">
                  {digitalId.maskedDocId} (AES-256-GCM Encrypted at Rest)
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-sans">
                <div>Issuing Node: <strong>IN-GOV-NODE-NE-01 (Guwahati Secure Enclave)</strong></div>
                <button
                  onClick={() => setActivePage('blockchain')}
                  className="text-blue-600 font-bold hover:underline flex items-center space-x-1"
                >
                  <span>Open Blockchain Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-blue-100 shadow-sm space-y-4">
          <ShieldCheck className="w-12 h-12 text-blue-300 mx-auto" />
          <h3 className="font-black text-lg text-slate-900">
            No Active Digital Tourist ID Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can generate a visit-limited digital ID with instant e-KYC in under 2 minutes.
          </p>
          <button
            onClick={() => setActivePage('register')}
            className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md"
          >
            Apply for Digital ID Now
          </button>
        </div>
      )}
    </div>
  );
}
