import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  Play, 
  Pause, 
  Sliders, 
  Volume1, 
  Music, 
  Power, 
  MousePointerClick, 
  AlertTriangle, 
  Mic, 
  BellRing
} from 'lucide-react';
import { 
  MusicProfile, 
  MUSIC_PROFILES, 
  getSelectedMusicProfile, 
  isAmbientMusicPlaying, 
  startAmbientMusic, 
  stopAmbientMusic, 
  getMusicVolume, 
  setMusicVolume,
  subscribeMusicState,
  isMasterSoundEnabled,
  setMasterSoundEnabled,
  isClickSoundEnabled,
  setClickSoundEnabled,
  isAlarmSoundEnabled,
  setAlarmSoundEnabled,
  isAiVoiceEnabled,
  setAiVoiceEnabled,
  subscribeSoundSettings,
  playTestSound,
  playClickSound,
  playAlertTone,
  speakVocalAlert,
  playNotificationTone
} from '../utils/audioAlert';

interface MusicPlayerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPlayerSelectorModal: React.FC<MusicPlayerSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'music' | 'controls'>('music');
  const [masterSound, setMasterSound] = useState<boolean>(isMasterSoundEnabled());
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(isAmbientMusicPlaying());
  const [clickSound, setClickSoundState] = useState<boolean>(isClickSoundEnabled());
  const [alarmSound, setAlarmSoundState] = useState<boolean>(isAlarmSoundEnabled());
  const [aiVoice, setAiVoiceState] = useState<boolean>(isAiVoiceEnabled());
  
  const [selectedProfile, setSelectedProfile] = useState<MusicProfile>(getSelectedMusicProfile());
  const [volume, setVolume] = useState<number>(getMusicVolume());
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Lo-Fi' | 'Calm' | 'Focus' | 'Electronic' | 'Acoustic'>('All');
  
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Sync state with audio engine
  useEffect(() => {
    const unsubMusic = subscribeMusicState((playing, profile) => {
      setIsPlayingMusic(playing);
      setSelectedProfile(profile);
    });

    const unsubSettings = subscribeSoundSettings(() => {
      setMasterSound(isMasterSoundEnabled());
      setClickSoundState(isClickSoundEnabled());
      setAlarmSoundState(isAlarmSoundEnabled());
      setAiVoiceState(isAiVoiceEnabled());
    });

    setVolume(getMusicVolume());
    setMasterSound(isMasterSoundEnabled());
    setClickSoundState(isClickSoundEnabled());
    setAlarmSoundState(isAlarmSoundEnabled());
    setAiVoiceState(isAiVoiceEnabled());
    setSelectedProfile(getSelectedMusicProfile());
    setIsPlayingMusic(isAmbientMusicPlaying());

    return () => {
      unsubMusic();
      unsubSettings();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Master Sound Handler
  const handleToggleMasterSound = (turnOn: boolean) => {
    playClickSound();
    setMasterSound(turnOn);
    setMasterSoundEnabled(turnOn);
    if (!turnOn) {
      setIsPlayingMusic(false);
    }
  };

  // Music Handlers
  const handleTurnMusicOn = async () => {
    playClickSound();
    if (!masterSound) {
      setMasterSound(true);
      setMasterSoundEnabled(true);
    }
    await startAmbientMusic(selectedProfile);
    setIsPlayingMusic(true);
  };

  const handleTurnMusicOff = () => {
    playClickSound();
    stopAmbientMusic();
    setIsPlayingMusic(false);
  };

  // Track Selector
  const handleSelectProfile = async (profileId: MusicProfile) => {
    playClickSound();
    setSelectedProfile(profileId);
    if (!masterSound) {
      setMasterSound(true);
      setMasterSoundEnabled(true);
    }
    await startAmbientMusic(profileId);
    setIsPlayingMusic(true);
  };

  // Click Sound Handler
  const handleToggleClickSound = (turnOn: boolean) => {
    setClickSoundEnabled(turnOn);
    setClickSoundState(turnOn);
    if (turnOn) {
      setTimeout(() => playClickSound(), 50);
    }
  };

  // Alarm Sound Handler
  const handleToggleAlarmSound = (turnOn: boolean) => {
    playClickSound();
    setAlarmSoundEnabled(turnOn);
    setAlarmSoundState(turnOn);
  };

  // AI Voice Handler
  const handleToggleAiVoice = (turnOn: boolean) => {
    playClickSound();
    setAiVoiceEnabled(turnOn);
    setAiVoiceState(turnOn);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMusicVolume(val);
  };

  // Sound Testers
  const testSoundAction = (type: string, fn: () => void) => {
    setActiveTest(type);
    fn();
    setTimeout(() => setActiveTest(null), 700);
  };

  const filteredProfiles = categoryFilter === 'All' 
    ? MUSIC_PROFILES 
    : MUSIC_PROFILES.filter(p => p.category === categoryFilter);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex min-h-screen items-center justify-center p-2 sm:p-4 font-sans animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-xl max-h-[86vh] flex flex-col rounded-2xl border border-purple-500/40 bg-slate-900 shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. Modal Header (Always Visible at top) */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-800 bg-slate-950/95 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center border transition-all ${
              isPlayingMusic 
                ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Music className={`h-5 w-5 ${isPlayingMusic ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Sound & Ambient Music Studio
                </h2>
                <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                  masterSound 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {masterSound ? 'AUDIO ON' : 'MUTED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live multi-track audio for Administrator & Inspector
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors border border-slate-700 cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* 2. Top Tab Controller (Always Visible) */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 p-1.5 sm:p-2 gap-2 shrink-0">
          <button
            onClick={() => { playClickSound(); setActiveTab('music'); }}
            className={`flex-1 py-1.5 sm:py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'music'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>Music Soundscapes</span>
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab('controls'); }}
            className={`flex-1 py-1.5 sm:py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Click & Alert Sounds</span>
          </button>
        </div>

        {/* 3. TAB 1: MUSIC SOUNDSCAPES */}
        {activeTab === 'music' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* POWER CONTROL: Explicit ON / OFF buttons */}
            <div className="p-3 sm:p-3.5 bg-slate-950/70 border-b border-slate-800 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Power className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-[11px] sm:text-xs">BACKGROUND MUSIC POWER:</span>
                </span>
                <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isPlayingMusic 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {isPlayingMusic ? '● PLAYING (ON)' : '○ STOPPED (OFF)'}
                </span>
              </div>

              {/* Dedicated ON and OFF buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleTurnMusicOn}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-sm active:scale-98 cursor-pointer ${
                    isPlayingMusic
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/50'
                      : 'bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <Play className={`h-3.5 w-3.5 ${isPlayingMusic ? 'fill-current' : ''}`} />
                  <span>TURN ON MUSIC</span>
                  {isPlayingMusic && <Check className="h-3.5 w-3.5 ml-0.5" />}
                </button>

                <button
                  onClick={handleTurnMusicOff}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-sm active:scale-98 cursor-pointer ${
                    !isPlayingMusic
                      ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/50'
                      : 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-500/50'
                  }`}
                >
                  <Pause className={`h-3.5 w-3.5 ${!isPlayingMusic ? 'fill-current' : ''}`} />
                  <span>TURN OFF MUSIC</span>
                  {!isPlayingMusic && <Check className="h-3.5 w-3.5 ml-0.5" />}
                </button>
              </div>

              {/* Volume Slider & Test Speaker */}
              <div className="pt-1.5 flex items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2 flex-1">
                  <Volume2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                    title="Volume Slider"
                  />
                  <span className="text-[11px] font-mono text-purple-300 w-8 text-right font-bold shrink-0">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => testSoundAction('music', playTestSound)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all shrink-0 flex items-center space-x-1 cursor-pointer ${
                    activeTest === 'music'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 scale-95' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Volume1 className="h-3 w-3" />
                  <span>{activeTest === 'music' ? 'Testing...' : 'Test Speaker'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800/60 flex items-center space-x-1.5 text-xs overflow-x-auto shrink-0">
              <span className="text-slate-400 text-[11px] mr-1 shrink-0 font-medium">Filter:</span>
              {(['All', 'Lo-Fi', 'Calm', 'Focus', 'Electronic', 'Acoustic'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => { playClickSound(); setCategoryFilter(cat); }}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-colors shrink-0 font-medium cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Track Selector List (Scrollable) */}
            <div className="p-3 sm:p-3.5 space-y-2 overflow-y-auto flex-1 bg-slate-900/40 max-h-[300px]">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>SELECT MUSIC TRACK (TAP TO SWITCH & PLAY):</span>
                <span className="text-purple-400 font-mono">8 Tracks Available</span>
              </div>

              {filteredProfiles.map((p) => {
                const isSelected = selectedProfile === p.id;
                const isThisPlaying = isSelected && isPlayingMusic;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'border-purple-500/80 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${p.color} border border-slate-700/60`}>
                        {p.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-purple-200' : 'text-slate-100 group-hover:text-purple-300'} transition-colors`}>
                            {p.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-purple-300 border border-slate-700 font-medium">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {isThisPlaying && (
                        <div className="flex items-end space-x-0.5 h-3.5 mr-1">
                          <div className="w-1 bg-emerald-400 rounded-full h-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1 bg-emerald-400 rounded-full h-2/3 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1 bg-emerald-400 rounded-full h-4/5 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}

                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                        isThisPlaying
                          ? 'bg-emerald-600 text-white shadow'
                          : isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-purple-600/30 group-hover:text-purple-200'
                      }`}>
                        {isThisPlaying ? (
                          <>
                            <Volume2 className="h-3 w-3" />
                            <span>Playing</span>
                          </>
                        ) : isSelected ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <span>Play</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. TAB 2: INDIVIDUAL SOUND CONTROLS */}
        {activeTab === 'controls' && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 bg-slate-900/40 max-h-[360px]">
            
            {/* MASTER SOUND CONTROLLER */}
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Power className="h-3.5 w-3.5 text-purple-400" />
                    <span className="font-bold text-xs sm:text-sm text-slate-100">Master Sound Power</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Master switch for all system audio</p>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                  masterSound ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {masterSound ? 'MASTER ON' : 'MASTER OFF'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => handleToggleMasterSound(true)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    masterSound 
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>ALL SOUND: ON</span>
                </button>

                <button
                  onClick={() => handleToggleMasterSound(false)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    !masterSound 
                      ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <VolumeX className="h-3 w-3" />
                  <span>ALL SOUND: OFF</span>
                </button>
              </div>
            </div>

            {/* SOUND TYPE 1: BUTTON / UI CLICK SOUND */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
                    <MousePointerClick className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">Clicking Sound Feedback</span>
                    <span className="text-[10px] text-slate-400 block">Tactile click when pressing buttons</span>
                  </div>
                </div>

                <button
                  onClick={() => testSoundAction('click', playClickSound)}
                  className="px-2 py-0.5 text-[11px] font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  Test Click
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleClickSound(true)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    clickSound
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>CLICK: ON</span>
                </button>

                <button
                  onClick={() => handleToggleClickSound(false)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    !clickSound
                      ? 'bg-rose-600/80 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <VolumeX className="h-3 w-3" />
                  <span>CLICK: OFF</span>
                </button>
              </div>
            </div>

            {/* SOUND TYPE 2: DEFECT & ANOMALY ALARM SIRENS */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">Defect & Siren Alarms</span>
                    <span className="text-[10px] text-slate-400 block">Audible horn & klaxon alerts on failures</span>
                  </div>
                </div>

                <button
                  onClick={() => testSoundAction('alarm', () => playAlertTone('Critical'))}
                  className="px-2 py-0.5 text-[11px] font-mono bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  Test Siren
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleAlarmSound(true)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    alarmSound
                      ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>ALARM: ON</span>
                </button>

                <button
                  onClick={() => handleToggleAlarmSound(false)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    !alarmSound
                      ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <VolumeX className="h-3 w-3" />
                  <span>ALARM: OFF</span>
                </button>
              </div>
            </div>

            {/* SOUND TYPE 3: AI VOCAL SPEECH GUIDANCE */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
                    <Mic className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">AI Vocal Announcements</span>
                    <span className="text-[10px] text-slate-400 block">Real-time voice reading scan results</span>
                  </div>
                </div>

                <button
                  onClick={() => testSoundAction('voice', () => speakVocalAlert('AI Vision Quality Verification System Online.'))}
                  className="px-2 py-0.5 text-[11px] font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  Test Voice
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleAiVoice(true)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    aiVoice
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>AI VOICE: ON</span>
                </button>

                <button
                  onClick={() => handleToggleAiVoice(false)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all border cursor-pointer ${
                    !aiVoice
                      ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  <VolumeX className="h-3 w-3" />
                  <span>AI VOICE: OFF</span>
                </button>
              </div>
            </div>

            {/* SOUND TYPE 4: NOTIFICATION CHIMES */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                  <BellRing className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-200 block">Notification Chimes</span>
                  <span className="text-[10px] text-slate-400 block">Bell chime on passed inspections</span>
                </div>
              </div>

              <button
                onClick={() => testSoundAction('chime', playNotificationTone)}
                className="px-2 py-0.5 text-[11px] font-mono bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
              >
                Test Chime
              </button>
            </div>

          </div>
        )}

        {/* 5. Footer (Always Visible at bottom) */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>High-Fidelity Audio Synthesizer Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
