import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  QrCode,
  Calendar,
  Heart,
  Globe,
  Lock,
  Phone,
  Printer,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  Watch,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import SurakshaYatraLogo from '../common/SurakshaYatraLogo';

export default function DigitalIdCard({ digitalId, onVerifyClick }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (digitalId?.touristId) {
      const qrPayload = JSON.stringify({
        id: digitalId.touristId,
        name: digitalId.fullName,
        validUntil: digitalId.validUntil,
        kycHash: digitalId.kycHash,
        issuer: 'NORTHEAST_POLICE_TOURISM_CONSORTIUM'
      });

      QRCode.toDataURL(qrPayload, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff'
        }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [digitalId]);

  const handleSimulateScan = async () => {
    if (!digitalId) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyQrCode(digitalId.touristId, 'SIG-VERIFY-CHECKPOINT');
      setVerificationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!digitalId) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500 text-sm">No Digital Tourist ID issued yet.</p>
      </div>
    );
  }

  const isExpired = new Date() > new Date(digitalId.validUntil);

  return (
    <div className="space-y-6">
      {/* 3D Flip Card Container */}
      <div className="perspective-1000 max-w-md mx-auto">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-[300px] rounded-3xl p-6 text-white shadow-xl transition-transform duration-700 cursor-pointer select-none transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          } ${
            isExpired
              ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-amber-500'
              : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 border border-blue-400/30'
          }`}
        >
          {/* Card Holographic Watermark Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:16px_16px] rounded-3xl pointer-events-none"></div>

          {/* FRONT SIDE */}
          {!isFlipped ? (
            <div className="h-full flex flex-col justify-between">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-300">
                      Digital Tourist ID Card
                    </span>
                    <div className="text-[9px] text-slate-300">Govt of India • Sovereign Ledger</div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                  isExpired
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                }`}>
                  {isExpired ? 'EXPIRED' : 'VERIFIED & ACTIVE'}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex items-center space-x-4 my-auto">
                <img
                  src={digitalId.photoUrl}
                  alt={digitalId.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400/60 shadow-md shrink-0"
                />
                <div className="space-y-1">
                  <div className="text-base font-black tracking-tight text-white line-clamp-1">
                    {digitalId.fullName}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-blue-300">
                    {digitalId.touristId}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>{digitalId.nationality}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3 h-3 text-red-400" />
                      <span>{digitalId.bloodGroup}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-end justify-between pt-2 border-t border-blue-400/20 text-[10px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">VALIDITY WINDOW:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(digitalId.validFrom).toLocaleDateString()} — {new Date(digitalId.validUntil).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px]">e-KYC VERIFIED:</span>
                  <span className="font-semibold text-blue-300 font-mono">
                    {digitalId.kycType?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-center text-[9px] text-blue-300/80 mt-1">
                Tap card to flip for QR & Security Hashes ↻
              </div>
            </div>
          ) : (
            /* BACK SIDE */
            <div className="h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-2">
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                  Cryptographic Verification QR
                </span>
                <span className="text-[9px] text-slate-300 font-mono">
                  SHA-256 Anchored
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 my-auto">
                {qrDataUrl && (
                  <div className="p-1.5 bg-white rounded-xl shadow-lg shrink-0">
                    <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
                  </div>
                )}
                <div className="space-y-1.5 text-[10px] flex-1">
                  <div>
                    <span className="text-slate-400 block text-[9px]">BLOCKCHAIN KYC HASH:</span>
                    <span className="font-mono text-[9px] text-blue-300 break-all leading-tight block">
                      {digitalId.kycHash?.substring(0, 32)}...
                    </span>
                  </div>

                  {digitalId.pairedWearableId && (
                    <div className="flex items-center space-x-1.5 text-slate-200">
                      <Watch className="w-3 h-3 text-cyan-400" />
                      <span>Paired IoT Band: <strong className="text-cyan-300 font-mono">{digitalId.pairedWearableId}</strong></span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[9px]">EMERGENCY CONTACT:</span>
                    <span className="text-slate-200 font-medium">
                      {digitalId.emergencyContacts?.[0]?.name || 'Police 112 Command'} ({digitalId.emergencyContacts?.[0]?.phone || '112'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-blue-400/20">
                Authorized for entry at all Assam, Meghalaya, Nagaland & Arunachal Pradesh Checkposts.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors border border-blue-200 shadow-xs"
        >
          <RotateCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Flip Card</span>
        </button>

        <button
          onClick={handleSimulateScan}
          disabled={isVerifying}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{isVerifying ? 'Verifying...' : 'Simulate Police Checkpost Scan'}</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors border border-slate-200 shadow-xs"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print / PDF Badge</span>
        </button>
      </div>

      {/* Simulated Checkpoint QR Scan Result Modal/Alert */}
      {verificationResult && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2 animate-in fade-in duration-200 max-w-md mx-auto shadow-xs">
          <div className="flex items-center justify-between text-blue-900 font-extrabold">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>QR Code Verification Successful</span>
            </span>
            <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">
              {verificationResult.status}
            </span>
          </div>
          <div className="space-y-1 text-slate-700">
            <div>Tourist: <strong>{verificationResult.verifiedDetails?.fullName}</strong> ({verificationResult.verifiedDetails?.nationality})</div>
            <div>ID Status: <strong className="text-emerald-700">Tamper-Proof Authentic</strong></div>
            <div>Issuing Agency: {verificationResult.verifiedDetails?.issuingAgency}</div>
          </div>
        </div>
      )}
    </div>
  );
}
