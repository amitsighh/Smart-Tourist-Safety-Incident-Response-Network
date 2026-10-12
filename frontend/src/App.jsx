import React, { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import HomePage from './pages/HomePage';
import RegisterKycPage from './pages/RegisterKycPage';
import TouristDashboardPage from './pages/TouristDashboardPage';
import DigitalIdViewPage from './pages/DigitalIdViewPage';
import AuthorityCommandPage from './pages/AuthorityCommandPage';
import OperatorConsolePage from './pages/OperatorConsolePage';
import GeofenceManagerPage from './pages/GeofenceManagerPage';
import AnalyticsReportPage from './pages/AnalyticsReportPage';
import BlockchainLedgerPage from './pages/BlockchainLedgerPage';
import AdminAuditPage from './pages/AdminAuditPage';
import HelpFaqGrievancePage from './pages/HelpFaqGrievancePage';
import MessageLogPage from './pages/MessageLogPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import AuthorityLoginPage from './pages/AuthorityLoginPage';

function getPageFromUrl() {
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase().replace('#', '');
  const target = hash || path;

  if (target.includes('dashboard') || target.includes('safety-hub')) return 'dashboard';
  if (target.includes('authority-command') || target.includes('gis') || target.includes('command')) return 'authority-command';
  if (target.includes('geofence')) return 'geofences';
  if (target.includes('authority-login') || target.includes('official-login')) return 'authority-login';
  if (target.includes('operator-console') || target.includes('checkpost')) return 'operator-console';
  if (target.includes('analytics')) return 'analytics';
  if (target.includes('blockchain')) return 'blockchain';
  if (target.includes('admin-audit') || target.includes('audit')) return 'admin-audit';
  if (target.includes('help') || target.includes('grievance') || target.includes('faq')) return 'help';
  if (target.includes('message-log')) return 'message-log';
  if (target.includes('verify')) return 'verify';
  if (target.includes('register') || target.includes('kyc')) return 'register';
  if (target.includes('digital-id')) return 'digital-id';
  return 'home';
}

function AppContent() {
  const [activePage, setActivePageState] = useState(getPageFromUrl);

  const setActivePage = (page) => {
    setActivePageState(page);
    try {
      const newPath = page === 'home' ? '/' : `/${page}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ page }, '', newPath);
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setActivePageState(getPageFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage setActivePage={setActivePage} />;
      case 'register':
        return <RegisterKycPage setActivePage={setActivePage} />;
      case 'dashboard':
        return <TouristDashboardPage setActivePage={setActivePage} />;
      case 'digital-id':
        return <DigitalIdViewPage setActivePage={setActivePage} />;
      case 'authority-command':
        return <AuthorityCommandPage setActivePage={setActivePage} />;
      case 'operator-console':
        return <OperatorConsolePage setActivePage={setActivePage} />;
      case 'geofences':
        return <GeofenceManagerPage setActivePage={setActivePage} />;
      case 'analytics':
        return <AnalyticsReportPage setActivePage={setActivePage} />;
      case 'blockchain':
        return <BlockchainLedgerPage setActivePage={setActivePage} />;
      case 'admin-audit':
        return <AdminAuditPage setActivePage={setActivePage} />;
      case 'help':
        return <HelpFaqGrievancePage setActivePage={setActivePage} />;
      case 'message-log':
        return <MessageLogPage setActivePage={setActivePage} />;
      case 'verify':
        return <PublicVerifyPage setActivePage={setActivePage} />;
      case 'authority-login':
        return <AuthorityLoginPage setActivePage={setActivePage} />;
      default:
        return <HomePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  );
}
