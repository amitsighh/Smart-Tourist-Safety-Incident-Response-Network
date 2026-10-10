import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UserCheck,
  Watch,
  QrCode,
  ShieldCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  Loader2,
  Phone,
  Lock
} from 'lucide-react';

export default function OperatorConsolePage({ setActivePage }) {
  const [tourists, setTourists] = useState([]);
  const [wearables, setWearables] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrScanInput, setQrScanInput] = useState('TID-NE-2026-88190');
  const [qrScanResult, setQrScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Pairing Modal State
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [selectedWearableId, setSelectedWearableId] = useState('');
  const [isPairing, setIsPairing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [touristsRes, wearablesRes] = await Promise.all([
        api.getAllTouristIds(),
        api.getWearables()
      ]);
      if (touristsRes.success) setTourists(touristsRes.touristIds || []);
      if (wearablesRes.success) setWearables(wearablesRes.wearables || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyQr = async () => {
    if (!qrScanInput) return;
    setIsScanning(true);
    try {
      const res = await api.verifyQrCode(qrScanInput.trim(), 'SIG-OPERATOR-CHECKPOINT');
      setQrScanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePairBand = async (e) => {
    e.preventDefault();
    if (!selectedTourist || !selectedWearableId) return;
    setIsPairing(true);
    try {
      const res = await api.pairWearable(selectedWearableId, selectedTourist.touristId);
      if (res.success) {
        setSelectedTourist(null);
        setSelectedWearableId('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPairing(false);
    }
  };

  const handleUnpairBand = async (wearableId) => {
    try {
      const res = await api.unpairWearable(wearableId);
      if (res.success) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTourists = tourists.filter(t =>
    t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.touristId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Airport / Checkpost Entry Console (FR-1.1, FR-5.3)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Tourist Verification & IoT Wearable Station
          </h1>
          <p className="text-xs text-slate-500">
            Station: Lokpriya Gopinath Bordoloi International Airport (Guwahati Checkpost-01)
          </p>
        </div>

        <button
          onClick={() => setActivePage('register')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New In-Person Registration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Rapid QR Checkpoint Scanner */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Rapid QR Code Verification Scanner</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Offline-Capable</span>
            </div>

            <p className="text-slate-500 text-[11px]">
              Scan tourist digital pass or enter Digital Tourist ID to verify cryptographic blockchain credentials:
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={qrScanInput}
                onChange={(e) => setQrScanInput(e.target.value)}
                placeholder="e.g. TID-NE-2026-88190"
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
              <button
                onClick={handleVerifyQr}
                disabled={isScanning}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center space-x-1"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify</span>
              </button>
            </div>

            {/* QR Scan Result */}
            {qrScanResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>AUTHENTIC DIGITAL ID</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded font-bold">
                    {qrScanResult.status}
                  </span>
                </div>

                <div className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                  <div>Tourist: <strong>{qrScanResult.verifiedDetails?.fullName}</strong> ({qrScanResult.verifiedDetails?.nationality})</div>
                  <div>Blood Group: <strong>{qrScanResult.verifiedDetails?.bloodGroup}</strong></div>
                  <div>Validity: {new Date(qrScanResult.verifiedDetails?.validFrom).toLocaleDateString()} — {new Date(qrScanResult.verifiedDetails?.validUntil).toLocaleDateString()}</div>
                  <div className="text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                    ✓ Sovereign Blockchain Proof Validated
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* IoT Smart Band Inventory */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <Watch className="w-4 h-4 text-cyan-600" />
                <span>IoT Smart Safety Band Inventory (FR-5.1)</span>
              </div>
              <span className="text-[10px] text-cyan-600 font-bold">LoRa + Fall Detection</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {wearables.map((band) => (
                <div
                  key={band.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span className="font-mono text-cyan-600">{band.id}</span>
                      <span className="text-[10px] text-slate-500">({band.model})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Battery: {band.batteryPct}% • {band.assignedTouristId ? `Assigned to ${band.assignedTouristId}` : 'Available at counter'}
                    </div>
                  </div>

                  <div>
                    {band.assignedTouristId ? (
                      <button
                        onClick={() => handleUnpairBand(band.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-300"
                      >
                        Return / Unpair
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold">
                        AVAILABLE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Registered Tourists & Device Pairing */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Registered Tourists Registry</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tourist name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredTourists.map((t) => (
              <div
                key={t.touristId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{t.fullName}</strong>
                    <span className="font-mono text-emerald-600 font-bold">{t.touristId}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t.nationality} • Blood: <strong>{t.bloodGroup}</strong> • KYC: {t.kycType}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Valid: {new Date(t.validFrom).toLocaleDateString()} — {new Date(t.validUntil).toLocaleDateString()}
                  </div>
                  {t.pairedWearableId && (
                    <div className="text-[10px] text-cyan-600 font-bold flex items-center space-x-1">
                      <Watch className="w-3 h-3" />
                      <span>Paired Smart Band: {t.pairedWearableId}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {!t.pairedWearableId && (
                    <button
                      onClick={() => setSelectedTourist(t)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-700 flex items-center space-x-1"
                    >
                      <Watch className="w-3.5 h-3.5" />
                      <span>Issue Smart Band</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pairing Modal */}
      {selectedTourist && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="font-extrabold text-base text-slate-900 dark:text-white border-b pb-2">
              Pair Smart Band to {selectedTourist.fullName}
            </div>

            <form onSubmit={handlePairBand} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Available Smart Band (BLE/LoRa)
                </label>
                <select
                  value={selectedWearableId}
                  onChange={(e) => setSelectedWearableId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  required
                >
                  <option value="">-- Choose Band --</option>
                  {wearables.filter(w => !w.assignedTouristId).map(w => (
                    <option key={w.id} value={w.id}>{w.id} (Battery: {w.batteryPct}%)</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTourist(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPairing || !selectedWearableId}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700"
                >
                  {isPairing ? 'Pairing...' : 'Confirm Device Handout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
