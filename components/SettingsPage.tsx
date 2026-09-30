import React, { useState, useRef } from 'react';
import { Sliders, User, Palette, Check, Upload, RefreshCw, Volume2, Info, Play, Pause, Lock, Music, Cpu, ScanFace, Fingerprint, Smartphone, Key, AlertTriangle } from 'lucide-react';
import { User as UserType } from '../types';
import { createDefaultAvatar } from '../utils/avatar';
import { ALARM_OPTIONS, AlarmTypeId, playAlarmSound } from '../utils/audioAlerts';
import { AdminLockSettingsModal } from './AdminLockSettingsModal';
import { AppLockConfig } from './AdminAppLockModal';
import { 
  MUSIC_PROFILES, 
  MusicProfile, 
  getSelectedMusicProfile, 
  setSelectedMusicProfile,
  isAmbientMusicPlaying, 
  startAmbientMusic, 
  stopAmbientMusic 
} from '../utils/audioAlert';

interface SettingsPageProps {
  currentUser: UserType;
  setCurrentUser: (user: UserType) => void;
  accentTheme: string;
  setAccentTheme: (theme: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  setCurrentUser,
  accentTheme,
  setAccentTheme,
}) => {
  const [userName, setUserName] = useState(currentUser.name);
  const [userEmail, setUserEmail] = useState(currentUser.email);
  const [userAvatar, setUserAvatar] = useState(currentUser.avatar);

  const [aiSensitivity, setAiSensitivity] = useState(88);
  const [autoPauseLineOnCritical, setAutoPauseLineOnCritical] = useState(true);
  const [alertSound, setAlertSound] = useState(() => localStorage.getItem('sound_setting_alarm') !== 'false');
  const [clickSound, setClickSound] = useState(() => localStorage.getItem('sound_setting_click') !== 'false');
  const [aiVoice, setAiVoice] = useState(() => localStorage.getItem('sound_setting_ai_voice') !== 'false');

  const [selectedMusic, setSelectedMusic] = useState<MusicProfile>(getSelectedMusicProfile());
  const [isMusicOn, setIsMusicOn] = useState<boolean>(isAmbientMusicPlaying());

  const [selectedAlarmType, setSelectedAlarmType] = useState<AlarmTypeId>(() => {
    return (localStorage.getItem('vision_inspect_alarm_type') as AlarmTypeId) || 'Siren Alarm';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState<AppLockConfig>(() => {
    try {
      const saved = localStorage.getItem('visioninspect_admin_app_lock');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { enabled: false, method: 'face', pin: '1234', password: 'admin123' };
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle image upload from computer / laptop / gallery
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, JPEG, WEBP) for your profile avatar.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size exceeds 5MB limit. Please choose a smaller file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUserAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDefaultAvatar = () => {
    const defaultSvg = createDefaultAvatar(currentUser.role, userName);
    setUserAvatar(defaultSvg);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserType = {
      ...currentUser,
      name: userName,
      email: userEmail,
      avatar: userAvatar,
    };

    // Attempt backend sync
    try {
      await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          avatar: userAvatar,
        }),
      });
    } catch (err) {
      console.error('Failed to update user profile on server:', err);
    }

    setCurrentUser(updatedUser);

    // Save session, alarm type, and sound toggles
    try {
      localStorage.setItem('vision_inspect_session', JSON.stringify(updatedUser));
      localStorage.setItem('vision_inspect_alarm_type', selectedAlarmType);
      localStorage.setItem('sound_setting_alarm', alertSound ? 'true' : 'false');
      localStorage.setItem('sound_setting_click', clickSound ? 'true' : 'false');
      localStorage.setItem('sound_setting_ai_voice', aiVoice ? 'true' : 'false');
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Sliders className="h-6 w-6 text-cyan-400" />
          <span>SYSTEM PREFERENCES & SETTINGS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure profile details, AI detection sensitivity thresholds, notification channels, and visual themes
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Settings Card & Picture Upload */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                Admin & User Profile Photo & Credentials
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              {currentUser.role} Profile
            </span>
          </div>

          {/* Profile Picture Upload Section */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="relative group">
              <img
                src={userAvatar}
                alt={userName}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-500/50 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Profile Picture</h4>
                <p className="text-[11px] text-slate-400">
                  Upload your own photo from your laptop gallery/file manager, or use the neutral corporate badge.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo from Laptop / Gallery</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaultAvatar}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium hover:bg-slate-700 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset to Official Badge</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Display Name:</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Email Endpoint:</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Visual Accent Theme */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Palette className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              Visual Dashboard Accent Theme
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Select a theme to immediately update the visual color palette and accent glow across the entire platform.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs font-mono">
            {[
              { name: 'Neon Red', desc: 'Fiery Neon Chili Red & Radiant Crimson', color: 'bg-red-500 shadow-[0_0_10px_#ff1e42] animate-pulse' },
              { name: 'Cyber Blue', desc: 'Electric Cyan & Deep Blue', color: 'bg-cyan-400' },
              { name: 'Shiny Pink', desc: 'Shimmering Metallic Neon Pink', color: 'bg-rose-400 animate-pulse' },
              { name: 'Matrix Green', desc: 'Neon Terminal Matrix Green', color: 'bg-emerald-400' },
              { name: 'Deep Purple', desc: 'Royal Purple & Violet Glow', color: 'bg-purple-400' },
              { name: 'Metallic', desc: 'Sleek Chrome & Titanium', color: 'bg-slate-200' },
              { name: 'Solar Gold', desc: 'Industrial Warning Amber', color: 'bg-amber-400' },
            ].map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setAccentTheme(t.name)}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  accentTheme === t.name
                    ? 'bg-slate-800/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-bold text-xs">{t.name}</span>
                  <span className={`h-3 w-3 rounded-full ${t.color} border border-white/20`} />
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Model Sensitivity & System Preferences */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              AI Vision Engine Sensitivity & Safety Controls
            </h3>
          </div>

          <div className="space-y-5 text-xs font-mono">
            
            {/* Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Micro-Defect Detection Sensitivity Threshold:</span>
                <span className="text-cyan-400 font-bold">{aiSensitivity}% Confidence</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={aiSensitivity}
                onChange={(e) => setAiSensitivity(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Higher sensitivity detects micro-scratches but may slightly increase false rejections.
              </p>
            </div>

            {/* Admin Role App Lock Security Feature */}
            {currentUser.role === 'Admin' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-purple-400" />
                      <span className="text-slate-100 font-bold text-sm">Admin App Lock Security</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        lockConfig.enabled ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {lockConfig.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Protect Admin entry with Face Lock (Camera scan), Fingerprint biometric, PIN code, or Security Password.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowLockModal(true)}
                    className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shrink-0 ml-2"
                  >
                    Configure Lock
                  </button>
                </div>

                {lockConfig.enabled ? (
                  <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-lg text-xs text-purple-200 flex items-center justify-between font-mono">
                    <div className="flex items-center space-x-2">
                      {lockConfig.method === 'face' && <ScanFace className="h-4 w-4 text-cyan-400" />}
                      {lockConfig.method === 'fingerprint' && <Fingerprint className="h-4 w-4 text-emerald-400" />}
                      {lockConfig.method === 'pin' && <Smartphone className="h-4 w-4 text-purple-400" />}
                      {lockConfig.method === 'password' && <Key className="h-4 w-4 text-amber-400" />}
                      <span>Active Lock Method: <strong className="uppercase text-white">{lockConfig.method} lock</strong></span>
                    </div>
                    <span className="text-[10px] text-purple-300">Prompted on Admin Login</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
                    💡 If lock is disabled, Admin accesses the dashboard normally without extra prompts.
                  </div>
                )}
              </div>
            )}

            {/* Feature 1: Auto-Pause Line on Critical Anomaly Explanation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-slate-200 font-bold text-sm">Auto-Pause Line on Critical Anomaly</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Triggers an automatic stop signal to halt the conveyor line motor immediately when a severe defect (crack, missing component, structural fracture) is identified during visual scan.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPauseLineOnCritical}
                  onChange={(e) => setAutoPauseLineOnCritical(e.target.checked)}
                  className="h-5 w-5 accent-cyan-500 cursor-pointer mt-0.5"
                />
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
                <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>What it means:</strong> On factory floors, stopping the conveyor line automatically prevents flawed batches from being packaged or moving downstream. An inspector can resume the conveyor after confirming the anomaly.
                </span>
              </div>
            </div>

            {/* Feature 2: Individual Sound & Audio Controls */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-200 font-bold text-sm">Individual Sound & Voice Controls</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Configure audio behaviors individually. Turn off specific sounds like click sounds, alarms, or AI vocal alerts as needed.
                </p>
              </div>

              {/* 3 Individual Sound Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Click Sound Toggle */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-200 block">Button Click Sound</span>
                    <span className="text-[10px] text-slate-400 block">UI tap & button feedback</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clickSound}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setClickSound(val);
                        localStorage.setItem('sound_setting_click', val ? 'true' : 'false');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Alarm Sound Toggle */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-200 block">Alarm & Siren Tones</span>
                    <span className="text-[10px] text-slate-400 block">Defect & anomaly sirens</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSound}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAlertSound(val);
                        localStorage.setItem('sound_setting_alarm', val ? 'true' : 'false');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {/* AI Voice Toggle */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-200 block">AI Voice Guidance</span>
                    <span className="text-[10px] text-slate-400 block">Vocal defect readout</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiVoice}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAiVoice(val);
                        localStorage.setItem('sound_setting_ai_voice', val ? 'true' : 'false');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

              </div>

              {/* Alarm Types Selection Grid */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Select Acoustic Alarm Sound Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ALARM_OPTIONS.map((option) => {
                    const isSelected = selectedAlarmType === option.id;
                    return (
                      <div
                        key={option.id}
                        onClick={() => setSelectedAlarmType(option.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-slate-900 border-rose-500/80 text-white ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100 flex items-center space-x-1.5">
                            <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-rose-400 animate-ping' : 'bg-slate-600'}`} />
                            <span>{option.name}</span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${option.badgeColor}`}>
                            {option.category}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-tight">
                          {option.description}
                        </p>

                        <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 mt-1">
                          <span className="text-[9px] font-mono text-slate-500">
                            {isSelected ? 'Active Selected' : 'Click to Select'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlarmType(option.id);
                              playAlarmSound(option.id);
                            }}
                            className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded-md transition-colors flex items-center space-x-1"
                          >
                            <Play className="h-2.5 w-2.5" />
                            <span>Test Sound</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ambient Music Profiles Selection Grid */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block flex items-center space-x-1.5">
                      <Music className="h-3.5 w-3.5 text-purple-400" />
                      <span>Select Clear & Neat Ambient Background Music Profile:</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Multi-type synthesized focus, soft meditation, and deep work soundscapes
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isMusicOn) {
                        stopAmbientMusic();
                        setIsMusicOn(false);
                      } else {
                        startAmbientMusic(selectedMusic);
                        setIsMusicOn(true);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1.5 ${
                      isMusicOn 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                    }`}
                  >
                    {isMusicOn ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isMusicOn ? 'Pause Music' : 'Play Music'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {MUSIC_PROFILES.map((prof) => {
                    const isSelected = selectedMusic === prof.id;
                    return (
                      <div
                        key={prof.id}
                        onClick={() => {
                          setSelectedMusic(prof.id);
                          setSelectedMusicProfile(prof.id);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-slate-900 border-purple-500/80 text-white ring-1 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100 flex items-center space-x-1.5">
                            <span>{prof.icon}</span>
                            <span>{prof.name}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {prof.category}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-tight">
                          {prof.description}
                        </p>

                        <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 mt-1">
                          <span className="text-[9px] font-mono text-purple-400">
                            {isSelected ? '✓ Active Track' : 'Click to Set'}
                          </span>
                          {isSelected && isMusicOn && (
                            <span className="text-[9px] font-mono text-emerald-400 animate-pulse font-bold">
                              Now Playing
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
                <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Inspector Alert Duty:</strong> Loud distinct tones ensure factory supervisors are instantly notified across ambient machinery noise when severe defects fail quality checks.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <Check className="h-4 w-4" />
              <span>System Settings Saved Successfully!</span>
            </span>
          ) : <div />}

          <button
            type="submit"
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-extrabold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <span>Save System Preferences</span>
          </button>
        </div>

      </form>

      {/* Admin Lock Settings Modal */}
      {showLockModal && (
        <AdminLockSettingsModal
          currentConfig={lockConfig}
          onClose={() => setShowLockModal(false)}
          onSaveConfig={(newConfig) => {
            setLockConfig(newConfig);
            setShowLockModal(false);
          }}
        />
      )}

    </div>
  );
};
