import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSocket } from '../../contexts/SocketContext';
import LanguageSelector from './LanguageSelector';
import AccessibilityBar from './AccessibilityBar';
import SurakshaYatraLogo from './SurakshaYatraLogo';
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  MapPin,
  FileText,
  Layers,
  BarChart3,
  Lock,
  HelpCircle,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  ExternalLink,
  LifeBuoy,
  MessageSquare
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, loginWithDemo, demoPersonas } = useAuth();
  const { t } = useLanguage();
  const { isConnected, incomingSosAlert, clearIncomingSos } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const role = user?.role || 'tourist';

  // Core navigation items
  const mainNavLinks = [
    { id: 'home', label: t('nav.home') || 'Home', icon: ShieldCheck },
    { id: 'register', label: t('nav.register') || 'Get Digital ID', icon: UserCheck },
    { id: 'dashboard', label: t('nav.myDashboard') || 'Safety Hub', icon: Radio },
    { id: 'digital-id', label: t('nav.digitalId') || 'My Digital ID', icon: ShieldCheck },
    { id: 'blockchain', label: t('nav.blockchain') || 'Blockchain Ledger', icon: Lock },
    { id: 'help', label: t('nav.help') || 'Help & Grievance', icon: LifeBuoy }
  ];

  // Authority-specific navigation items
  const authorityNavLinks = [
    { id: 'authority-command', label: 'Safety Hub & GIS', icon: MapPin, roles: ['police', 'operator', 'tourism_official', 'admin'], badge: 'LIVE' },
    { id: 'geofences', label: 'Geofences', icon: Layers, roles: ['police', 'tourism_official', 'admin'] },
    { id: 'operator-console', label: 'Checkpost Desk', icon: UserCheck, roles: ['operator', 'admin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['police', 'tourism_official', 'admin'] },
    { id: 'admin-audit', label: 'Audit Logs', icon: FileText, roles: ['admin'] },
    { id: 'message-log', label: 'Message Log', icon: MessageSquare, roles: ['police', 'operator', 'tourism_official', 'medical', 'disaster_response', 'admin'], badge: 'DEMO' }
  ].filter(l => l.roles.includes(role));

  const isAuthorityRole = ['police', 'operator', 'tourism_official', 'admin'].includes(role);

  return (
    <>
      {/* Real-time Emergency SOS Broadcast Banner (Active when live SOS arrives) */}
      {incomingSosAlert && (
        <div className="bg-red-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between animate-pulse z-50">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>CRITICAL SOS: Distress trigger received from {incomingSosAlert.touristName || 'Tourist'} ({incomingSosAlert.locationName || 'GPS Location'})!</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActivePage('authority-command');
                clearIncomingSos();
              }}
              className="bg-white text-red-700 px-3 py-1 rounded-md text-xs font-black hover:bg-red-50 uppercase shadow-xs"
            >
              Open Incident Dispatch
            </button>
            <button onClick={clearIncomingSos} className="text-white/80 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Official Utility Header */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="font-semibold text-slate-200 truncate">
            Government of India & Northeast States Tourism Consortium
          </span>
          <span className="hidden lg:inline text-slate-600">|</span>
          <span className="hidden lg:inline text-slate-400 text-[11px]">
            DPDP Act 2023 Compliant Sovereign Safety Platform
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[10px] font-mono text-slate-300">{isConnected ? 'MESH ONLINE' : 'CONNECTING...'}</span>
          </div>
          <div className="hidden sm:block">
            <AccessibilityBar />
          </div>
        </div>
      </div>

      {/* Main Navbar: Crisp Light-Blue + White Theme */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div
              className="cursor-pointer transition-transform active:scale-98"
              onClick={() => setActivePage('home')}
            >
              <SurakshaYatraLogo size="default" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {mainNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activePage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActivePage(link.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              {/* Authority Console Links if user has authority role */}
              {isAuthorityRole && authorityNavLinks.length > 0 && (
                <div className="flex items-center space-x-1 pl-2 ml-2 border-l border-slate-200">
                  {authorityNavLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = activePage === link.id;
                    return (
                      <button
                        key={link.id}
                        onClick={() => setActivePage(link.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="ml-1 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white animate-pulse">
                            {link.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* Right Action Bar: Language + Persona Switcher */}
            <div className="flex items-center space-x-2">
              <LanguageSelector />

              {/* Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                  title="Switch Demo Role Persona"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline capitalize">
                    {user?.role ? user.role.replace('_', ' ') : 'Tourist'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>

                {personaDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Switch Role Persona (Instant Demo)
                    </div>
                    <div className="p-1.5 space-y-1">
                      {demoPersonas.map((p) => {
                        const isCurrent = user?.email === p.email;
                        return (
                          <button
                            key={p.role}
                            onClick={() => {
                              loginWithDemo(p.email);
                              setPersonaDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                              isCurrent
                                ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900">{p.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase font-mono">
                                {p.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Drawer Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-blue-100 px-4 py-3 space-y-1">
            <div className="pb-2 mb-2 border-b border-slate-100">
              <AccessibilityBar />
            </div>
            {mainNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActivePage(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span>{link.label}</span>
                  </div>
                </button>
              );
            })}

            {isAuthorityRole && authorityNavLinks.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1">Authority Tools</div>
                {authorityNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = activePage === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        setActivePage(link.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-indigo-600" />
                        <span>{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white">
                          {link.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
