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

function AppContent() {
  const [activePage, setActivePage] = useState('home');

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
