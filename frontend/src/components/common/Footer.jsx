import React from 'react';
import { PhoneCall, Lock, ShieldCheck, HeartHandshake, FileText, LifeBuoy, MapPin } from 'lucide-react';
import SurakshaYatraLogo from './SurakshaYatraLogo';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      {/* Emergency Helplines Quick Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-b border-red-900/40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-red-300 font-bold">
            <PhoneCall className="w-4 h-4 animate-bounce text-red-400" />
            <span>24/7 National Emergency Helplines:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200">
            <a href="tel:112" className="flex items-center space-x-1.5 hover:text-white bg-red-900/40 px-3 py-1 rounded-md border border-red-700/60 transition-colors">
              <span className="text-red-400 font-black">112</span> <span>National Emergency (ERSS)</span>
            </a>
            <a href="tel:1363" className="flex items-center space-x-1.5 hover:text-white bg-blue-900/40 px-3 py-1 rounded-md border border-blue-700/60 transition-colors">
              <span className="text-blue-400 font-black">1363</span> <span>Tourist Helpline (12 Languages)</span>
            </a>
            <a href="tel:1090" className="flex items-center space-x-1.5 hover:text-white bg-pink-900/40 px-3 py-1 rounded-md border border-pink-700/60 transition-colors">
              <span className="text-pink-400 font-black">1090</span> <span>Women Safety Helpdesk</span>
            </a>
            <a href="tel:108" className="flex items-center space-x-1.5 hover:text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700 transition-colors">
              <span className="text-emerald-400 font-black">108</span> <span>Ambulance & Trauma Care</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & DPDP */}
          <div className="space-y-3">
            <SurakshaYatraLogo size="default" light={true} />
            <p className="text-slate-400 text-xs leading-relaxed pt-2">
              An advanced sovereign safety network safeguarding domestic and international travelers across Northeast India using real-time geofencing, AI anomaly detection, and cryptographic digital IDs.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-blue-300 bg-blue-950/60 px-2.5 py-1.5 rounded border border-blue-900/60">
              <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>DPDP Act 2023 Compliant • Zero PII Leakage</span>
            </div>
          </div>

          {/* Col 2: Tourist Safety Hub */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Tourist Safety Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActivePage('register')} className="hover:text-blue-400 transition-colors">Issue Time-Bound Digital Tourist ID</button></li>
              <li><button onClick={() => setActivePage('dashboard')} className="hover:text-blue-400 transition-colors">Live Dynamic Safety Score & Panic SOS</button></li>
              <li><button onClick={() => setActivePage('digital-id')} className="hover:text-blue-400 transition-colors">View QR Digital ID & Health Info</button></li>
              <li><button onClick={() => setActivePage('help')} className="hover:text-blue-400 transition-colors font-medium text-blue-300">Lost Passport Assistance Desk</button></li>
              <li><button onClick={() => setActivePage('help')} className="hover:text-blue-400 transition-colors">Track Grievance / Case Status</button></li>
            </ul>
          </div>

          {/* Col 3: Command & Verification */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Police & Command Desks
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActivePage('authority-command')} className="hover:text-blue-400 transition-colors">Live GIS Map & Weather Radar</button></li>
              <li><button onClick={() => setActivePage('operator-console')} className="hover:text-blue-400 transition-colors">Airport & Border Checkpost Console</button></li>
              <li><button onClick={() => setActivePage('geofences')} className="hover:text-blue-400 transition-colors">High-Risk & Curfew Geofence Engine</button></li>
              <li><button onClick={() => setActivePage('blockchain')} className="hover:text-blue-400 transition-colors">Blockchain Inclusion Explorer</button></li>
              <li><button onClick={() => setActivePage('admin-audit')} className="hover:text-blue-400 transition-colors">DPDP 2023 Immutable Audit Trail</button></li>
            </ul>
          </div>

          {/* Col 4: Institutional Framework */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-blue-400" />
              Governing Framework
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Ministry of Tourism, Govt. of India</li>
              <li>Northeast Regional Police Command & ERSS</li>
              <li>State Disaster Management Authorities (SDMA)</li>
              <li>Bharatiya Nyaya Sanhita (BNS) 2023 Integration</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              Active Consensus Node: <span className="text-blue-400 font-mono">IN-GOV-NODE-NE-01</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <div>
            © 2026 SurakshaYatra • Smart Tourist Safety Monitoring & Incident Response System.
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <button onClick={() => setActivePage('help')} className="hover:text-slate-300">Privacy & DPDP</button>
            <button onClick={() => setActivePage('help')} className="hover:text-slate-300">Grievance Portal</button>
            <button onClick={() => setActivePage('blockchain')} className="hover:text-slate-300">PoA Ledger Simulation</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
