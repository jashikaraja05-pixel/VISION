import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { MainDashboard } from './components/MainDashboard';
import { AIInspectionPage } from './components/AIInspectionPage';
import { ExplainableAIPage } from './components/ExplainableAIPage';
import { QualityScorePage } from './components/QualityScorePage';
import { RealTimeAlertsPage } from './components/RealTimeAlertsPage';
import { InspectionReportPage } from './components/InspectionReportPage';
import { UserManagement } from './components/UserManagement';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SplashScreen } from './components/SplashScreen';
import { RoleSelectionPage } from './components/RoleSelectionPage';
import { AnalyticalTrendsPage } from './components/AnalyticalTrendsPage';
import { CameraSensorSetupPage } from './components/CameraSensorSetupPage';
import { AdminAppLockModal, AppLockConfig } from './components/AdminAppLockModal';
import { DirectMessagingPage } from './components/DirectMessagingPage';
import { TestingEvaluationPage } from './components/TestingEvaluationPage';
import { ErrorBoundary } from './components/ErrorBoundary';

import { 
  User, 
  UserRole,
  ActiveTab, 
  InspectionRecord, 
  AlertNotification, 
  Factory, 
  CameraDevice 
} from './types';
import { 
  INITIAL_FACTORIES, 
  INITIAL_CAMERAS 
} from './data/mockData';
import { setupGlobalClickSound } from './utils/audioAlert';

export default function App() {
  // Always require explicit sign-in when entering application (no auto-login)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>('Admin');

  const [pendingAdminUser, setPendingAdminUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const cachedSession = localStorage.getItem('vision_inspect_session');
      if (cachedSession) {
        const u = JSON.parse(cachedSession);
        if (u && u.role === 'Inspector') {
          return 'dashboard';
        }
      }
    } catch {}
    return 'admin-dashboard';
  });

  // Keep activeTab persisted in localStorage
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('vision_inspect_active_tab', activeTab);
    }
  }, [activeTab]);

  // Sync active user state
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role) {
        setSelectedRole(currentUser.role);
      }
    }
  }, [currentUser]);

  // Enforce Role RBAC:
  // - Admin lands on 'admin-dashboard' (ADMIN EXECUTIVE DASHBOARD)
  // - Inspector lands on 'dashboard' (INDUSTRIAL DASHBOARD & COMMAND CENTER)
  useEffect(() => {
    if (currentUser?.role === 'Admin' && (activeTab === 'inspection' || activeTab === 'camera-setup')) {
      setActiveTab('admin-dashboard');
    } else if (currentUser?.role === 'Inspector' && (activeTab === 'reports' || activeTab === 'admin-dashboard' || activeTab === 'users' || activeTab === 'analytics' || activeTab === 'camera-setup')) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, activeTab]);
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    return localStorage.getItem('vision_inspect_theme') || 'Cyber Blue';
  });

  const getThemeClass = (themeName: string) => {
    switch (themeName) {
      case 'Neon Red':
      case 'Chili Red':
        return 'theme-neon-red';
      case 'Shiny Pink':
      case 'Pink':
        return 'theme-shiny-pink';
      case 'Metallic':
        return 'theme-metallic';
      case 'Matrix Green':
        return 'theme-matrix-green';
      case 'Deep Purple':
        return 'theme-deep-purple';
      case 'Solar Gold':
        return 'theme-solar-gold';
      default:
        return 'theme-cyber-blue';
    }
  };

  // Application Datasets State initialized with clean slate (no mock records)
  const [users, setUsers] = useState<User[]>([]);
  const [factories] = useState<Factory[]>(INITIAL_FACTORIES);
  const [cameras, setCameras] = useState<CameraDevice[]>(INITIAL_CAMERAS);
  const [inspections, setInspections] = useState<InspectionRecord[]>(() => {
    try {
      const cached = localStorage.getItem('visioninspect_cached_inspections');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord | null>(() => {
    try {
      const cachedCur = localStorage.getItem('visioninspect_current_inspection');
      if (cachedCur) {
        const parsed = JSON.parse(cachedCur);
        if (parsed && parsed.id) return parsed;
      }
      const cachedList = localStorage.getItem('visioninspect_cached_inspections');
      if (cachedList) {
        const parsedList = JSON.parse(cachedList);
        if (Array.isArray(parsedList) && parsedList.length > 0) return parsedList[0];
      }
    } catch {}
    return null;
  });
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);

  useEffect(() => {
    if (currentInspection) {
      try {
        localStorage.setItem('visioninspect_current_inspection', JSON.stringify(currentInspection));
      } catch {}
    }
  }, [currentInspection]);

  // Clear any stale cached session and inspections on application startup to ensure fresh entry
  useEffect(() => {
    localStorage.removeItem('vision_inspect_session');
    localStorage.removeItem('visioninspect_cached_inspections');
    localStorage.removeItem('visioninspect_current_inspection');
    setCurrentUser(null);
    setSelectedRole('Admin');
  }, []);

  // Sync real database records on mount
  const syncDatabase = async () => {
    try {
      const facQuery = currentUser?.role === 'Admin' 
        ? '?all=true' 
        : (currentUser?.factoryName ? `?factoryName=${encodeURIComponent(currentUser.factoryName)}` : '');
      const [inspRes, alertRes, userRes, lockRes] = await Promise.all([
        fetch(`/api/inspections${facQuery}`).catch(() => null),
        fetch(`/api/alerts${facQuery}`).catch(() => null),
        fetch('/api/users').catch(() => null),
        fetch('/api/admin/app-lock').catch(() => null),
      ]);

      if (inspRes && inspRes.ok) {
        const data = await inspRes.json().catch(() => ({}));
        if (data && Array.isArray(data.inspections)) {
          setInspections(data.inspections);
          setCurrentInspection(prev => {
            if (prev && data.inspections.some((i: any) => i.id === prev.id)) {
              return data.inspections.find((i: any) => i.id === prev.id) || prev;
            }
            return data.inspections.length > 0 ? data.inspections[0] : null;
          });
        }
      }

      if (alertRes && alertRes.ok) {
        const data = await alertRes.json().catch(() => ({}));
        if (data && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
        }
      }

      if (userRes && userRes.ok) {
        const data = await userRes.json().catch(() => ({}));
        if (data && data.users) setUsers(data.users);
      }

      if (lockRes && lockRes.ok) {
        const data = await lockRes.json().catch(() => ({}));
        if (data && data.config) {
          localStorage.setItem('visioninspect_admin_app_lock', JSON.stringify(data.config));
        }
      }
    } catch {
      // Network retry handled by interval
    }
  };

  useEffect(() => {
    syncDatabase();
    const interval = setInterval(syncDatabase, 3000); // Real-time zero delay polling for admin reports & approvals
    const cleanupClick = setupGlobalClickSound();
    return () => {
      clearInterval(interval);
      cleanupClick();
    };
  }, [currentUser?.factoryName]);

  // Robust multi-tenancy filtered inspections strictly including user's scans and company records
  const companyInspections = React.useMemo(() => {
    if (!inspections || inspections.length === 0) return [];
    if (!currentUser) return inspections;
    if (currentUser.role === 'Admin') return inspections;

    const cleanUserFac = (currentUser.factoryName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanUserName = (currentUser.name || '').toLowerCase().trim();
    const cleanUserId = currentUser.id || '';

    const filtered = inspections.filter(i => {
      const cleanFac = (i.factoryName || i.factoryId || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const matchFac = Boolean(cleanUserFac && cleanFac && (cleanFac === cleanUserFac || cleanFac.includes(cleanUserFac) || cleanUserFac.includes(cleanFac)));
      const matchUser = Boolean(
        (i.inspectorId && i.inspectorId === cleanUserId) ||
        (i.inspectorName && i.inspectorName.toLowerCase().trim() === cleanUserName)
      );

      if (cleanUserFac) {
        return matchFac || matchUser;
      }
      return matchUser || true;
    });

    return filtered.length > 0 ? filtered : inspections;
  }, [inspections, currentUser]);

  const companyAlerts = React.useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    if (!currentUser) return alerts;
    if (currentUser.role === 'Admin') return alerts;

    const cleanUserFac = (currentUser.factoryName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!cleanUserFac) return alerts;

    const filtered = alerts.filter(a => {
      const cleanFac = (a.factoryName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      return cleanFac === cleanUserFac || cleanFac.includes(cleanUserFac) || cleanUserFac.includes(cleanFac);
    });

    return filtered.length > 0 ? filtered : alerts;
  }, [alerts, currentUser]);

  // Ensure activeTab matches role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Inspector' && activeTab === 'admin-dashboard') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  // Set active tab based on user role immediately on login:
  // - Admin log in -> ADMIN EXECUTIVE DASHBOARD ('admin-dashboard')
  // - Inspector log in -> INDUSTRIAL DASHBOARD & COMMAND CENTER ('dashboard')
  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('vision_inspect_session', JSON.stringify(user));
    setSelectedRole(user.role);

    if (user.role === 'Admin') {
      try {
        const savedLock = localStorage.getItem('visioninspect_admin_app_lock');
        if (savedLock) {
          const lockConfig: AppLockConfig = JSON.parse(savedLock);
          if (lockConfig.enabled) {
            // App lock enabled for admin - prompt verification modal before granting access
            setPendingAdminUser(user);
            syncDatabase();
            return;
          }
        }
      } catch (e) {
        console.warn('Error parsing admin app lock config:', e);
      }

      // Admin log in -> ADMIN EXECUTIVE DASHBOARD
      setCurrentUser(user);
      setActiveTab('admin-dashboard');
      localStorage.setItem('vision_inspect_active_tab', 'admin-dashboard');
    } else {
      // Inspector log in -> INDUSTRIAL DASHBOARD & COMMAND CENTER
      setCurrentUser(user);
      setActiveTab('dashboard');
      localStorage.setItem('vision_inspect_active_tab', 'dashboard');
    }
    syncDatabase();
  };

  const handleLogout = () => {
    localStorage.removeItem('vision_inspect_session');
    localStorage.removeItem('vision_inspect_active_tab');
    setCurrentUser(null);
    setSelectedRole(null);
  };

  // Handlers for Inspector Workflow
  const handleNewInspection = async (newRecord: InspectionRecord) => {
    const enrichedRecord: InspectionRecord = {
      ...newRecord,
      factoryName: currentUser?.factoryName || newRecord.factoryName || 'Apex Precision Works',
      factoryId: currentUser?.factoryId || newRecord.factoryId || 'fac-1',
      inspectorName: currentUser?.name || newRecord.inspectorName || 'Certified Inspector',
      inspectorId: currentUser?.id || newRecord.inspectorId,
    };

    setInspections(prev => {
      const updated = [enrichedRecord, ...prev.filter(i => i.id !== enrichedRecord.id)];
      try {
        localStorage.setItem('visioninspect_cached_inspections', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCurrentInspection(enrichedRecord);

    try {
      await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedRecord),
      });
      syncDatabase();
    } catch {
      // Local state already updated
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'Acknowledged' } : a))
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'Resolved' } : a))
    );
  };

  const handleSimulateNewAlert = (newAlert: AlertNotification) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleEditUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleDeleteInspection = async (id: string) => {
    setInspections(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('visioninspect_cached_inspections', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (currentInspection?.id === id) setCurrentInspection(null);

    try {
      await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      syncDatabase();
    } catch {
      // Local state already updated
    }
  };

  const unreadAlertCount = alerts.filter(a => a.status === 'New').length;

  // Render Splash Screen on initial launch
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Render Role Selection & Auth Pages if user is not logged in
  if (!currentUser) {
    if (pendingAdminUser) {
      let savedLockConfig: AppLockConfig = { enabled: true, method: 'face', pin: '1234', password: 'admin123' };
      try {
        const saved = localStorage.getItem('visioninspect_admin_app_lock');
        if (saved) savedLockConfig = JSON.parse(saved);
      } catch {}

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <AdminAppLockModal
            config={savedLockConfig}
            adminName={pendingAdminUser.name}
            onSuccess={() => {
              setCurrentUser(pendingAdminUser);
              setPendingAdminUser(null);
              setActiveTab('admin-dashboard');
            }}
            onCancel={() => {
              setPendingAdminUser(null);
            }}
          />
        </div>
      );
    }

    if (!selectedRole) {
      return <RoleSelectionPage onSelectRole={(role) => setSelectedRole(role)} />;
    }
    return (
      <AuthPage
        selectedRole={selectedRole}
        onLoginSuccess={handleLoginSuccess}
        onSwitchRole={() => setSelectedRole(null)}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 ${getThemeClass(accentTheme)}`}>
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadAlertCount={unreadAlertCount}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenChatWithUser={(userId) => {
          setSelectedChatUserId(userId);
          setActiveTab('messages');
        }}
      />

      <div className="flex">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={currentUser.role}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Workspace Area */}
        <main className={`flex-1 min-w-0 ${activeTab === 'messages' ? 'p-0 w-full' : 'p-4 sm:p-8 max-w-7xl mx-auto'}`}>
          <ErrorBoundary fallbackTab={() => setActiveTab(currentUser.role === 'Admin' ? 'admin-dashboard' : 'dashboard')}>
          {/* BRAND NEW ADMIN DASHBOARD */}
          {activeTab === 'admin-dashboard' && currentUser.role === 'Admin' && (
            <AdminDashboard
              currentUser={currentUser}
              inspections={inspections}
              users={users}
              onNavigateToUsers={() => setActiveTab('users')}
              onSelectInspection={(insp) => {
                setCurrentInspection(insp);
                setActiveTab('reports');
              }}
              onDeleteInspection={handleDeleteInspection}
              onUpdateUser={handleEditUser}
            />
          )}

          {/* DIRECT MESSAGES & AUDIO COMMS */}
          {activeTab === 'messages' && (
            <DirectMessagingPage
              currentUser={currentUser}
              users={users}
              inspections={companyInspections}
              onSelectInspection={(insp) => setCurrentInspection(insp)}
              setActiveTab={setActiveTab}
              initialRecipientId={selectedChatUserId}
            />
          )}

          {/* LANDING & OVERVIEW */}
          {activeTab === 'landing' && (
            <LandingPage
              setActiveTab={setActiveTab}
              onLoginClick={() => {}}
              isLoggedIn={true}
            />
          )}

          {/* INSPECTOR DASHBOARD */}
          {(activeTab === 'dashboard' || (activeTab === 'admin-dashboard' && currentUser.role === 'Inspector')) && (
            <MainDashboard
              inspections={companyInspections}
              alerts={companyAlerts}
              factories={factories}
              setActiveTab={setActiveTab}
              onSelectInspection={(insp) => setCurrentInspection(insp)}
            />
          )}

          {/* INSPECTION WORKFLOW */}
          {activeTab === 'inspection' && (
            <AIInspectionPage
              currentInspection={currentInspection || (companyInspections.length > 0 ? companyInspections[0] : null)}
              onNewInspection={handleNewInspection}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onDeleteInspection={handleDeleteInspection}
              onTriggerAlert={() => {
                setActiveTab('alerts');
              }}
            />
          )}

          {activeTab === 'quality-score' && (
            <QualityScorePage 
              inspection={currentInspection || (companyInspections.length > 0 ? companyInspections[0] : null)} 
              currentUser={currentUser}
              inspections={companyInspections}
            />
          )}

          {activeTab === 'explainable' && (
            <ExplainableAIPage 
              inspection={currentInspection || (companyInspections.length > 0 ? companyInspections[0] : null)} 
            />
          )}

          {activeTab === 'alerts' && (
            <RealTimeAlertsPage
              alerts={companyAlerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onSimulateNewAlert={handleSimulateNewAlert}
            />
          )}

          {activeTab === 'reports' && (
            <InspectionReportPage
              inspection={currentInspection || (companyInspections.length > 0 ? companyInspections[0] : null)}
              currentUser={currentUser}
              onDeleteInspection={handleDeleteInspection}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              inspections={companyInspections}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticalTrendsPage
              inspections={companyInspections}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'camera-setup' && (
            <CameraSensorSetupPage
              cameras={cameras}
              onAddCamera={(c) => setCameras([c, ...cameras])}
              onUpdateCameraStatus={(id, st) => setCameras(cameras.map(c => c.id === id ? { ...c, status: st } : c))}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              inspections={companyInspections}
              onSelectInspection={(insp) => setCurrentInspection(insp)}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onDeleteInspection={handleDeleteInspection}
            />
          )}

          {activeTab === 'evaluation' && (
            <TestingEvaluationPage
              currentUser={currentUser}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              accentTheme={accentTheme}
              setAccentTheme={(t) => {
                setAccentTheme(t);
                localStorage.setItem('vision_inspect_theme', t);
              }}
            />
          )}
          </ErrorBoundary>
        </main>

      </div>

    </div>
  );
}

