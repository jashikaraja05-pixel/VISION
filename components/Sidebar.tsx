import React from 'react';
import { 
  LayoutDashboard, 
  Scan, 
  Gauge, 
  BellRing, 
  FileCheck, 
  Users, 
  History, 
  Sliders,
  Building2,
  TrendingUp,
  ChevronRight,
  MessageSquare,
  FlaskConical,
  X
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'admin-dashboard' as ActiveTab, label: 'Admin Executive Dashboard', icon: Building2, roles: ['Admin'] },
    { id: 'users' as ActiveTab, label: 'Inspector Management & Requests', icon: Users, roles: ['Admin'] },
    { id: 'reports' as ActiveTab, label: 'Inspection Reports', icon: FileCheck, roles: ['Admin'] },
    { id: 'analytics' as ActiveTab, label: 'Analytical & Graphical Trends', icon: TrendingUp, roles: ['Admin'] },
    { id: 'dashboard' as ActiveTab, label: 'Industrial Dashboard & Command Center', icon: LayoutDashboard, roles: ['Inspector'] },
    { id: 'inspection' as ActiveTab, label: 'Live AI Inspection & Scan', icon: Scan, roles: ['Inspector'], highlight: true },
    { id: 'messages' as ActiveTab, label: 'Direct Message', icon: MessageSquare, roles: ['Admin', 'Inspector'] },
    { id: 'history' as ActiveTab, label: 'Inspection History Log', icon: History, roles: ['Admin', 'Inspector'] },
    { id: 'quality-score' as ActiveTab, label: 'Smart Quality Score', icon: Gauge, roles: ['Admin', 'Inspector'] },
    { id: 'evaluation' as ActiveTab, label: 'CV Testing & Evaluation', icon: FlaskConical, roles: ['Admin', 'Inspector'] },
    { id: 'alerts' as ActiveTab, label: 'Real-Time Critical Alerts', icon: BellRing, roles: ['Admin'] },
    { id: 'settings' as ActiveTab, label: 'System Settings', icon: Sliders, roles: ['Admin', 'Inspector'] },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-4 px-3">
      <div className="space-y-6">
        
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="font-mono text-xs font-bold text-cyan-400">NAVIGATION MENU</div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Group Header */}
        <div>
          <div className="px-3 mb-2 font-mono text-[10px] uppercase text-cyan-400 tracking-wider font-semibold">
            Inspection Workflows
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              // Check role permissions
              if (!item.roles.includes(userRole)) return null;

              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 hover:border-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.highlight && (
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                  )}

                  {isActive && !item.highlight && (
                    <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Footer Widget */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950 p-3 text-center space-y-2">
        <div className="flex items-center justify-center space-x-1 text-cyan-400 text-xs font-semibold">
          <Scan className="h-3.5 w-3.5" />
          <span>Live Factory Sync</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Real-time AI inference running across manufacturing sites
        </p>
        <div className="pt-1">
          <span className="inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
            Status: 100% Operational
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/90 flex-col justify-between py-4 px-3 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[80vw] bg-slate-950 border-r border-slate-800 shadow-2xl h-full overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
