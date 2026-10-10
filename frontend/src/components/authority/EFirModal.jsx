import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Lock,
  Download,
  MapPin,
  Clock,
  User,
  Shield
} from 'lucide-react';

export default function EFirModal({ isOpen, onClose, alert, touristId }) {
  const [efirData, setEfirData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleGenerateEfir = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateEfir(
        alert?.touristId || touristId,
        alert?.id,
        {
          name: 'DSP Bimal Das',
          badge: 'ASM-POL-009',
          station: 'North-East Integrated Command & Control Center (ICCC)'
        }
      );

      if (res.success) {
        setEfirData(res.efir);
        setIsLoaded(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                Automated Legal Electronic FIR (E-FIR) Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Bharatiya Nyaya Sanhita (BNS) 2023 & CCTNS Indian Police Integration (FR-4.4)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Generator state */}
        {!isLoaded ? (
          <div className="py-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Generate Court-Admissible E-FIR
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Compiles verified Aadhaar/Passport KYC cryptographic hash, last known cell-tower GPS triangulation, anomaly telemetry timeline, and legal rescue search directives.
              </p>
            </div>

            <button
              onClick={handleGenerateEfir}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>{isGenerating ? 'Compiling & Mining Blockchain Legal Seal...' : 'Auto-Generate & Register Legal E-FIR'}</span>
            </button>
          </div>
        ) : (
          /* Official E-FIR Document Preview */
          <div className="mt-4 space-y-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-800 font-sans text-xs space-y-6 printable-document">
              {/* Official Govt Document Header */}
              <div className="text-center border-b-2 border-slate-300 dark:border-slate-800 pb-4 space-y-1">
                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  Government of India • Ministry of Home Affairs / Tourism
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  FIRST INFORMATION REPORT (E-FIR)
                </h2>
                <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                  {efirData.firNumber}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Registered: {new Date(efirData.registeredAt).toLocaleString()} • Status: <strong className="text-emerald-600">REGISTERED & DISPATCHED</strong>
                </div>
              </div>

              {/* Jurisdiction Grid */}
              <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Police Station & District:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{efirData.jurisdiction?.policeStation} ({efirData.jurisdiction?.district})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Investigating Officer:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{efirData.jurisdiction?.investigatingOfficer} (Badge: {efirData.jurisdiction?.badgeNumber})</span>
                </div>
              </div>

              {/* Tourist Identity Section */}
              <div className="space-y-2">
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-1">
                  1. Subject / Tourist Identity Record
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Full Name:</span>
                    <strong className="text-slate-900 dark:text-white">{efirData.touristDetails?.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Digital ID:</span>
                    <span className="font-mono font-bold text-emerald-600">{efirData.touristDetails?.touristId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Nationality:</span>
                    <span>{efirData.touristDetails?.nationality}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Blood Group:</span>
                    <span className="text-red-500 font-bold">{efirData.touristDetails?.bloodGroup}</span>
                  </div>
                </div>
              </div>

              {/* Last Known Coordinates & Cell Triangulation */}
              <div className="space-y-2">
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-1">
                  2. Telemetry & Last Known Location Fix
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px]">GPS Coordinates:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {efirData.incidentDetails?.lastKnownCoordinates?.latitude}, {efirData.incidentDetails?.lastKnownCoordinates?.longitude}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Sector: {efirData.incidentDetails?.lastKnownCoordinates?.sectorName}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Cell Tower Triangulation:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      CID: {efirData.incidentDetails?.cellTowerTriangulation?.primaryCID} • LAC: {efirData.incidentDetails?.cellTowerTriangulation?.lac}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Accuracy Radius: ~{efirData.incidentDetails?.cellTowerTriangulation?.accuracyRadiusMeters} meters
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Timeline */}
              <div className="space-y-2">
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-1">
                  3. Incident Timeline & Automated Anomaly Chain
                </div>
                <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500 text-[11px]">
                  {efirData.evidenceTimeline?.map((ev, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-slate-400 font-mono text-[10px] shrink-0">
                        {new Date(ev.time).toLocaleTimeString()}:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {ev.event}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicable Legal Acts */}
              <div className="space-y-1.5">
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-1">
                  4. Applicable Legal Acts & Directives
                </div>
                {efirData.legalActs?.map((act, i) => (
                  <div key={i} className="text-[11px] bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                    <strong className="text-slate-900 dark:text-white">{act.act} — {act.section}: </strong>
                    <span className="text-slate-600 dark:text-slate-400">{act.description}</span>
                  </div>
                ))}
              </div>

              {/* Digital Certificate Seal */}
              <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-emerald-600 font-extrabold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographically Certified by Sovereign Police Authority</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[9px]">
                    Cert Thumbprint: {efirData.digitalSignature?.certificateThumbprint}
                  </div>
                </div>

                <div className="text-center sm:text-right font-mono text-[10px] text-slate-600">
                  [DIGITALLY SIGNED & SEALED]
                  <div className="text-[9px] text-slate-400">Govt of India CCTNS Node</div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Legal Document</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
