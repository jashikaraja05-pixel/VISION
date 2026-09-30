import React, { useState, useEffect } from 'react';
import logoImg from '../src/assets/images/regenerated_image_1785947573697.png';
import { 
  Bell, 
  LogOut, 
  ChevronDown, 
  Activity, 
  Settings as SettingsIcon,
  Menu,
  X,
  Music,
  Lock,
  Volume2,
  VolumeX,
  MessageSquare
} from 'lucide-react';
import { User, ActiveTab, DirectMessage } from '../types';
import { 
  isAmbientMusicPlaying, 
  getSelectedMusicProfile, 
  MUSIC_PROFILES,
  subscribeMusicState,
  startAmbientMusic,
  stopAmbientMusic,
  playClickSound
} from '../utils/audioAlert';
import { AdminLockSettingsModal } from './AdminLockSettingsModal';
import { AppLockConfig } from './AdminAppLockModal';
import { MusicPlayerSelectorModal } from './MusicPlayerSelectorModal';

interface NavbarProps {
  currentUser: User;
  setCurrentUser?: (user: User) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadAlertCount: number;
  onLogout: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  onOpenLockSettings?: () => void;
  onOpenChatWithUser?: (userId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  unreadAlertCount,
  onLogout,
  mobileMenuOpen = false,
  setMobileMenuOpen,
  onOpenChatWithUser
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(isAmbientMusicPlaying());
  const [currentProfile, setCurrentProfile] = useState(getSelectedMusicProfile());
  const [showLockModal, setShowLockModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);

  // Poll real-time messages for live notification badge
  useEffect(() => {
    if (!currentUser) return;
    const fetchNavbarMessages = async () => {
      try {
        const url = currentUser.factoryName 
          ? `/api/messages?factoryName=${encodeURIComponent(currentUser.factoryName)}`
          : '/api/messages';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch {}
    };

    fetchNavbarMessages();
    const interval = setInterval(fetchNavbarMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.factoryName, currentUser?.id]);

  // Unread messages addressed to the current logged-in user
  const unreadMessages = messages.filter(
    m => m.recipientId === currentUser?.id && !m.read
  );
  const unreadMessageCount = unreadMessages.length;

  // Recent messages for notification dropdown
  const recentIncomingMessages = React.useMemo(() => {
    return messages
      .filter(m => m.recipientId === currentUser?.id)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [messages, currentUser?.id]);

  // Listen to music state dynamically across components
  useEffect(() => {
    const unsub = subscribeMusicState((playing, profile) => {
      setIsPlaying(playing);
      setCurrentProfile(profile);
    });
    return () => unsub();
  }, []);

  const handleQuickToggleMusic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    if (isPlaying) {
      stopAmbientMusic();
    } else {
      await startAmbientMusic(currentProfile);
    }
  };

  const currentLockConfig: AppLockConfig = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('visioninspect_admin_app_lock');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { enabled: false, method: 'face', pin: '1234', password: 'admin123' };
  }, [showLockModal]);

  const currentProfileInfo = MUSIC_PROFILES.find(p => p.id === currentProfile) || MUSIC_PROFILES[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand & Logo & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(currentUser.role === 'Admin' ? 'admin-dashboard' : 'dashboard')}>
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 border border-cyan-500/50 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.35)] shrink-0">
              <img
                src={logoImg}
                alt="VisionInspect AI Logo"
                className="w-full h-full object-fill rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-100">
                  VISION<span className="text-cyan-400">INSPECT</span>
                </span>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                  AI v4.2
                </span>
              </div>
              <p className="hidden text-[10px] text-slate-400 sm:block">
                AI-Powered Smart Visual Inspection & Quality Management System
              </p>
            </div>
          </div>
        </div>

        {/* Live System Indicators & Audio Controls */}
        <div className="hidden md:flex items-center space-x-3">

          {/* DEDICATED SOUND ON / OFF CONTROLLER & SELECTOR */}
          <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-sm">
            {/* Quick Toggle Button */}
            <button
              onClick={handleQuickToggleMusic}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isPlaying
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isPlaying ? 'Click to turn Sound OFF' : 'Click to turn Sound ON'}
            >
              {isPlaying ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>Sound: <strong className="text-emerald-300">ON</strong></span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Sound: <strong className="text-slate-300">OFF</strong></span>
                </>
              )}
            </button>

            {/* Open Full Music Soundscapes Selector */}
            <button
              onClick={() => setShowMusicModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-950/40 transition-colors ml-1"
              title="Change Background Music & Audio Settings"
            >
              <Music className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden xl:inline">{currentProfileInfo.name.split(' ')[0]}</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                Music
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2 rounded-full bg-slate-900/90 px-3 py-1 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">AI Vision: ACTIVE</span>
          </div>

          <div className="flex items-center space-x-2 rounded-full bg-slate-900/90 px-3 py-1 border border-slate-800 text-xs">
            <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300 font-mono text-[11px]">Latency: 12ms</span>
          </div>
        </div>

        {/* Right Action Icons & User Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Direct Message Icon with Notification Badge */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMessagesDropdown(!showMessagesDropdown);
                setShowRoleDropdown(false);
              }}
              className={`relative rounded-xl p-2 transition-all border ${
                showMessagesDropdown || activeTab === 'messages'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-cyan-400 border-transparent hover:border-cyan-500/30'
              }`}
              title="Direct Messages"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse">
                  {unreadMessageCount}
                </span>
              )}
            </button>

            {/* Direct Messages Notification Dropdown */}
            {showMessagesDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/98 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden divide-y divide-slate-800/80">
                {/* Header */}
                <div className="p-3.5 bg-slate-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white tracking-wide">Direct Messages</span>
                    <span className="text-[10px] text-slate-400 font-medium">({currentUser.factoryName})</span>
                  </div>
                  {unreadMessageCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      {unreadMessageCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">All caught up</span>
                  )}
                </div>

                {/* Incoming Messages List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                  {recentIncomingMessages.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
                      <p className="text-slate-300 font-medium">No incoming messages yet</p>
                      <p className="mt-1 text-[11px] text-slate-500">Send a direct message or voice note to colleagues.</p>
                      <button
                        onClick={() => {
                          setShowMessagesDropdown(false);
                          setActiveTab('messages');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-medium transition"
                      >
                        Start Direct Message
                      </button>
                    </div>
                  ) : (
                    recentIncomingMessages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          if (onOpenChatWithUser) {
                            onOpenChatWithUser(msg.senderId);
                          }
                          setActiveTab('messages');
                          setShowMessagesDropdown(false);
                          // mark message as read
                          fetch(`/api/messages/${msg.id}/read`, { method: 'PUT' }).catch(() => {});
                        }}
                        className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                          !msg.read ? 'bg-indigo-950/30 hover:bg-indigo-950/50' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                              {msg.senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {!msg.read && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{msg.senderName}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              msg.senderRole === 'Admin' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {msg.senderRole}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 truncate mt-0.5">
                            {msg.audioUrl ? '🎤 Voice Note' : msg.content}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                            <span>{msg.timestamp || 'Just now'}</span>
                            {!msg.read && <span className="text-cyan-400 font-semibold text-[9px]">Unread</span>}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer Link */}
                <div className="p-2.5 bg-slate-950/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowMessagesDropdown(false);
                      setActiveTab('messages');
                    }}
                    className="w-full text-center py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
                  >
                    Open Direct Message Hub
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Realtime Alert Bell (Admin Only) */}
          {currentUser.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('alerts')}
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-cyan-400 transition-colors border border-transparent hover:border-cyan-500/30"
              title="Real-Time Alerts"
            >
              <Bell className="h-5 w-5" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          )}

          {/* Settings Quick Link */}
          <button
            onClick={() => setActiveTab('settings')}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-cyan-400 transition-colors border border-transparent hover:border-cyan-500/30"
            title="System Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>

          {/* User Profile & Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center space-x-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 hover:border-cyan-500/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-cyan-500/50"
                referrerPolicy="no-referrer"
              />
              <div className="text-left hidden sm:flex flex-col justify-center">
                <div className="text-xs font-semibold text-slate-200 whitespace-nowrap">{currentUser.name}</div>
                <div className="flex items-center space-x-1.5 mt-0.5 whitespace-nowrap">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                    currentUser.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {currentUser.role}
                  </span>
                  {currentUser.role !== 'Admin' && (
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      ID: {currentUser.employeeId || currentUser.id}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-2xl z-50">
                <div className="pb-3 border-b border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-slate-100">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                  <div className="pt-1 flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      currentUser.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUser.role} Account
                    </span>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setShowMusicModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Music className="h-4 w-4 text-purple-400" />
                      <span>Sound & Music Player</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isPlaying ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isPlaying ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setShowLockModal(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-purple-400" />
                        <span>Admin App Lock</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">
                        {currentLockConfig.enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Admin App Lock Settings Modal */}
      {showLockModal && (
        <AdminLockSettingsModal
          currentConfig={currentLockConfig}
          onClose={() => setShowLockModal(false)}
          onSaveConfig={() => {
            setShowLockModal(false);
          }}
        />
      )}

      {/* Music Selection Modal */}
      <MusicPlayerSelectorModal
        isOpen={showMusicModal}
        onClose={() => {
          setShowMusicModal(false);
        }}
      />
    </header>
  );
};
