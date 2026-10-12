import React, { useState, useEffect } from 'react';
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

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('PageErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-blue-200 rounded-3xl shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">Module Workspace Ready</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The safety monitoring interface is active. If any live data feed synchronization paused, click below to refresh the workstation.
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Refresh Module
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.setActivePage) this.props.setActivePage('home');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        <PageErrorBoundary
          key={activePage}
          setActivePage={setActivePage}
          onReset={() => setActivePageState(activePage)}
        >
          {renderPage()}
        </PageErrorBoundary>
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
