// Web Audio API Sound Effects, Vocal Alerts, and Multi-Profile High-Fidelity Music Synthesizer

export type MusicProfile = 
  | 'lofi-focus'
  | 'soft-zen' 
  | 'deep-work' 
  | 'oceanic-waves' 
  | 'cyberpunk-pulse'
  | 'piano-reflections'
  | 'celestial-chimes'
  | 'rainforest-mist';

export interface MusicProfileInfo {
  id: MusicProfile;
  name: string;
  category: 'Lo-Fi' | 'Calm' | 'Focus' | 'Electronic' | 'Acoustic';
  description: string;
  icon: string;
  color: string;
}

export const MUSIC_PROFILES: MusicProfileInfo[] = [
  {
    id: 'lofi-focus',
    name: 'Lo-Fi Productivity Chill',
    category: 'Lo-Fi',
    description: 'Warm 7th chord electric keys with mellow rhythm for deep inspection focus.',
    icon: '☕',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-300'
  },
  {
    id: 'soft-zen',
    name: 'Soft Zen Sanctuary',
    category: 'Calm',
    description: 'Singing bowl chords, calming temple chimes, and tranquil harmonic pads.',
    icon: '🌸',
    color: 'from-rose-500/20 to-pink-500/20 text-pink-300'
  },
  {
    id: 'deep-work',
    name: 'Deep Work (10Hz Alpha Focus)',
    category: 'Focus',
    description: 'Alpha-frequency binaural harmonics & ambient synth arpeggios to boost focus.',
    icon: '💼',
    color: 'from-blue-500/20 to-indigo-500/20 text-indigo-300'
  },
  {
    id: 'oceanic-waves',
    name: 'Oceanic Horizon Waves',
    category: 'Calm',
    description: 'Harmonic coastal surf swells paired with relaxing aquatic musical chimes.',
    icon: '🌊',
    color: 'from-cyan-500/20 to-teal-500/20 text-cyan-300'
  },
  {
    id: 'cyberpunk-pulse',
    name: 'Industrial Precision Groove',
    category: 'Electronic',
    description: 'Upbeat electronic synth sequence tuned to manufacturing cadence.',
    icon: '⚡',
    color: 'from-purple-500/20 to-fuchsia-500/20 text-purple-300'
  },
  {
    id: 'piano-reflections',
    name: 'Acoustic Piano Reflections',
    category: 'Acoustic',
    description: 'Gentle acoustic piano chord arpeggios sweeping smoothly across the soundstage.',
    icon: '🎹',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300'
  },
  {
    id: 'celestial-chimes',
    name: 'Celestial Chimes & Aura',
    category: 'Calm',
    description: 'Crystalline harmonic wind chimes and uplifting ambient shimmer melodies.',
    icon: '✨',
    color: 'from-yellow-500/20 to-amber-500/20 text-amber-300'
  },
  {
    id: 'rainforest-mist',
    name: 'Rainforest Ambient Calm',
    category: 'Calm',
    description: 'Soothing woodwind & bamboo flute notes with resonant warm nature pads.',
    icon: '🍃',
    color: 'from-green-500/20 to-emerald-500/20 text-emerald-300'
  }
];

// ================= AUDIO SETTINGS CONTROLLERS =================

// Master Sound Switch: If false, NO sounds will play
export function isMasterSoundEnabled(): boolean {
  return localStorage.getItem('sound_setting_master') !== 'false';
}

export function setMasterSoundEnabled(enabled: boolean) {
  localStorage.setItem('sound_setting_master', enabled ? 'true' : 'false');
  if (!enabled && isMusicActive) {
    stopAmbientMusic();
  }
  notifySoundSettingsListeners();
}

// Click Sound Switch: If false, UI click sounds will not play
export function isClickSoundEnabled(): boolean {
  return isMasterSoundEnabled() && localStorage.getItem('sound_setting_click') !== 'false';
}

export function setClickSoundEnabled(enabled: boolean) {
  localStorage.setItem('sound_setting_click', enabled ? 'true' : 'false');
  notifySoundSettingsListeners();
}

// Alarm & Defect Siren Sound Switch
export function isAlarmSoundEnabled(): boolean {
  return isMasterSoundEnabled() && localStorage.getItem('sound_setting_alarm') !== 'false';
}

export function setAlarmSoundEnabled(enabled: boolean) {
  localStorage.setItem('sound_setting_alarm', enabled ? 'true' : 'false');
  notifySoundSettingsListeners();
}

// AI Vocal Speech Alerts Switch
export function isAiVoiceEnabled(): boolean {
  return isMasterSoundEnabled() && localStorage.getItem('sound_setting_ai_voice') !== 'false';
}

export function setAiVoiceEnabled(enabled: boolean) {
  localStorage.setItem('sound_setting_ai_voice', enabled ? 'true' : 'false');
  notifySoundSettingsListeners();
}

// Music Profiles & Volume
export function getSelectedMusicProfile(): MusicProfile {
  const saved = localStorage.getItem('visioninspect_music_profile') as MusicProfile;
  const valid = MUSIC_PROFILES.some(p => p.id === saved);
  return valid ? saved : 'lofi-focus';
}

export function setSelectedMusicProfile(profile: MusicProfile) {
  localStorage.setItem('visioninspect_music_profile', profile);
  if (isMusicActive) {
    startAmbientMusic(profile);
  } else {
    notifyMusicListeners();
  }
}

export function getMusicVolume(): number {
  const saved = localStorage.getItem('visioninspect_music_volume');
  return saved !== null ? Math.max(0.05, Math.min(1.0, parseFloat(saved))) : 0.45;
}

export function setMusicVolume(vol: number) {
  const clamped = Math.max(0.05, Math.min(1.0, vol));
  localStorage.setItem('visioninspect_music_volume', clamped.toString());
  if (ambientGainNode && ambientAudioCtx) {
    try {
      ambientGainNode.gain.cancelScheduledValues(ambientAudioCtx.currentTime);
      ambientGainNode.gain.setValueAtTime(ambientGainNode.gain.value, ambientAudioCtx.currentTime);
      ambientGainNode.gain.linearRampToValueAtTime(clamped, ambientAudioCtx.currentTime + 0.1);
    } catch {}
  }
}

// Global Audio Settings Listeners
type SoundSettingsListener = () => void;
const soundSettingsListeners = new Set<SoundSettingsListener>();

export function subscribeSoundSettings(listener: SoundSettingsListener): () => void {
  soundSettingsListeners.add(listener);
  return () => soundSettingsListeners.delete(listener);
}

function notifySoundSettingsListeners() {
  soundSettingsListeners.forEach(l => {
    try { l(); } catch {}
  });
}

// Master AudioContext helper that unlocks audio on user interaction
function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

// UI Click Sound: crisp mechanical click
export function playClickSound() {
  if (!isMasterSoundEnabled() || !isClickSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {}
}

// Notification chime
export function playNotificationTone() {
  if (!isMasterSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.18, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.3);
    });
  } catch {}
}

// Alarm & Alert Tone for QA Defects
export function playAlertTone(severity: 'Critical' | 'Major' | 'Minor' = 'Critical') {
  if (!isMasterSoundEnabled() || !isAlarmSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'Critical' ? 'sawtooth' : severity === 'Major' ? 'square' : 'sine';
    const startFreq = severity === 'Critical' ? 880 : severity === 'Major' ? 660 : 440;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);

    if (severity === 'Critical') {
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.45);
    } else if (severity === 'Major') {
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
    }

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

// AI Speech Synthesis Alert
export function speakVocalAlert(text: string) {
  if (!isMasterSoundEnabled() || !isAiVoiceEnabled()) return;
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Male')));
    if (engVoice) {
      utterance.voice = engVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {}
}

export function triggerInspectionVoiceAlert(record: {
  status: string;
  qualityScore?: number;
  defects?: { type: string; severity?: string; explanation?: string; reason?: string }[];
  componentName?: string;
}) {
  const isPass = record.status === 'PASS' || !record.defects || record.defects.length === 0;
  
  if (isPass) {
    playNotificationTone();
    speakVocalAlert("Good One! Quality check passed with zero defects.");
  } else {
    const highestSeverity = record.defects?.some(d => (d.severity || '').toLowerCase() === 'critical') ? 'Critical' : 'Major';
    playAlertTone(highestSeverity);

    const defectTypes = (record.defects || []).map(d => d.type).filter(Boolean);
    const uniqueTypes = Array.from(new Set(defectTypes));
    
    let voiceMessage = "";
    if (uniqueTypes.some(t => t.toLowerCase().includes('rust'))) {
      voiceMessage = "Critical Alert! Rusting object detected on component surface.";
    } else if (uniqueTypes.some(t => t.toLowerCase().includes('bent') || t.toLowerCase().includes('break') || t.toLowerCase().includes('crack') || t.toLowerCase().includes('damage'))) {
      voiceMessage = "Critical Alert! Bent or broken item detected in assembly structure.";
    } else if (uniqueTypes.length > 0) {
      voiceMessage = `Critical Alert! Defect detected: ${uniqueTypes.join(', ')}.`;
    } else {
      voiceMessage = "Critical Alert! Manufacturing defect detected.";
    }

    speakVocalAlert(voiceMessage);
  }
}

export function triggerDefectVoiceAlert(
  defects: { type: string; severity: string; explanation?: string; reason?: string }[],
  componentName: string = 'Component'
) {
  if (!defects || defects.length === 0) {
    speakVocalAlert('Inspection result: PASSED. Good quality item.');
    return;
  }
  triggerInspectionVoiceAlert({ status: 'FAIL', defects, componentName });
}

// Security alarm tone
export function playSecurityAlarmTone() {
  if (!isMasterSoundEnabled() || !isAlarmSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
}

// ================= AUDIBLE MULTI-TRACK REALTIME MUSIC SYNTHESIZER =================
let ambientAudioCtx: AudioContext | null = null;
let ambientNodes: any[] = [];
let ambientGainNode: GainNode | null = null;
let rhythmicTimer: number | null = null;
let isMusicActive = false;

// Listeners for UI state syncing
type MusicStateListener = (playing: boolean, profile: MusicProfile) => void;
const musicListeners = new Set<MusicStateListener>();

export function subscribeMusicState(listener: MusicStateListener): () => void {
  musicListeners.add(listener);
  listener(isMusicActive, getSelectedMusicProfile());
  return () => musicListeners.delete(listener);
}

function notifyMusicListeners() {
  const profile = getSelectedMusicProfile();
  musicListeners.forEach(l => {
    try { l(isMusicActive, profile); } catch {}
  });
}

export function toggleAmbientMusic(): boolean {
  if (isMusicActive) {
    stopAmbientMusic();
    return false;
  } else {
    startAmbientMusic();
    return true;
  }
}

export function isAmbientMusicPlaying(): boolean {
  return isMusicActive;
}

export async function startAmbientMusic(profileToPlay?: MusicProfile): Promise<boolean> {
  if (!isMasterSoundEnabled()) {
    setMasterSoundEnabled(true);
  }

  try {
    // 1. Immediately clean up previous sound playback & intervals
    stopAmbientMusicInternal();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported.');
      return false;
    }

    const profile = profileToPlay || getSelectedMusicProfile();
    localStorage.setItem('visioninspect_music_profile', profile);
    const volume = getMusicVolume();

    ambientAudioCtx = new AudioContextClass();
    
    // Unlock AudioContext for browser autoplay policies
    if (ambientAudioCtx.state === 'suspended') {
      await ambientAudioCtx.resume();
    }

    // Master Low-pass Filter for warmth and acoustic clarity
    const masterFilter = ambientAudioCtx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(2800, ambientAudioCtx.currentTime);
    masterFilter.Q.setValueAtTime(1.0, ambientAudioCtx.currentTime);

    // Master Gain Node
    ambientGainNode = ambientAudioCtx.createGain();
    ambientGainNode.gain.setValueAtTime(0.001, ambientAudioCtx.currentTime);
    ambientGainNode.gain.linearRampToValueAtTime(volume, ambientAudioCtx.currentTime + 0.3);

    masterFilter.connect(ambientGainNode);
    ambientGainNode.connect(ambientAudioCtx.destination);

    ambientNodes = [masterFilter, ambientGainNode];

    const ctx = ambientAudioCtx;
    const now = ctx.currentTime;

    // ================= TRACK 1: LO-FI FOCUS =================
    if (profile === 'lofi-focus') {
      const chords = [
        [130.81, 196.00, 246.94, 293.66], // Cmaj7
        [110.00, 164.81, 220.00, 261.63], // Am9
        [146.83, 220.00, 261.63, 329.63], // Dm7
        [98.00, 146.83, 196.00, 246.94],  // G7
      ];

      // Warm background pad
      [130.81, 196.00, 261.63].forEach((f) => {
        const osc = ctx.createOscillator();
        const padGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        padGain.gain.setValueAtTime(0.08 / 3, now);
        osc.connect(padGain);
        padGain.connect(masterFilter);
        osc.start(now);
        ambientNodes.push(osc, padGain);
      });

      let step = 0;
      const playLoFiChord = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const chord = chords[step % chords.length];
        const chordTime = ambientAudioCtx.currentTime;

        chord.forEach((freq, i) => {
          if (!ambientAudioCtx) return;
          const osc = ambientAudioCtx.createOscillator();
          const gain = ambientAudioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, chordTime + i * 0.05);

          gain.gain.setValueAtTime(0.001, chordTime + i * 0.05);
          gain.gain.linearRampToValueAtTime(0.22, chordTime + i * 0.05 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, chordTime + i * 0.05 + 2.5);

          osc.connect(gain);
          gain.connect(masterFilter);
          osc.start(chordTime + i * 0.05);
          osc.stop(chordTime + i * 0.05 + 2.8);
        });

        step++;
      };

      playLoFiChord();
      rhythmicTimer = window.setInterval(playLoFiChord, 2800);

    // ================= TRACK 2: SOFT ZEN SANCTUARY =================
    } else if (profile === 'soft-zen') {
      const zenChords = [
        [174.61, 261.63, 329.63, 440.00], // Fmaj7
        [196.00, 293.66, 392.00, 493.88], // G6
        [220.00, 261.63, 329.63, 523.25], // Am7
        [164.81, 246.94, 329.63, 392.00], // Em7
      ];

      let zenStep = 0;
      const playZenBowl = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const chord = zenChords[zenStep % zenChords.length];
        const t = ambientAudioCtx.currentTime;

        chord.forEach((freq, i) => {
          if (!ambientAudioCtx) return;
          const osc = ambientAudioCtx.createOscillator();
          const gain = ambientAudioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.1);

          gain.gain.setValueAtTime(0.001, t + i * 0.1);
          gain.gain.linearRampToValueAtTime(0.24, t + i * 0.1 + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 3.2);

          osc.connect(gain);
          gain.connect(masterFilter);
          osc.start(t + i * 0.1);
          osc.stop(t + i * 0.1 + 3.5);
        });

        zenStep++;
      };

      playZenBowl();
      rhythmicTimer = window.setInterval(playZenBowl, 3200);

    // ================= TRACK 3: DEEP WORK (10Hz ALPHA FOCUS) =================
    } else if (profile === 'deep-work') {
      // 10Hz Binaural Pulse Carrier
      const baseFreq = 144;
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gL = ctx.createGain();
      const gR = ctx.createGain();

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(baseFreq, now);
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(baseFreq + 10, now); // +10Hz Alpha differential

      gL.gain.setValueAtTime(0.12, now);
      gR.gain.setValueAtTime(0.12, now);

      oscL.connect(gL);
      oscR.connect(gR);
      gL.connect(masterFilter);
      gR.connect(masterFilter);

      oscL.start(now);
      oscR.start(now);
      ambientNodes.push(oscL, oscR, gL, gR);

      // Deep Focus Harmonic Notes
      const focusNotes = [288, 360, 432, 576, 432, 360];
      let fStep = 0;
      const playFocusPulse = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const note = focusNotes[fStep % focusNotes.length];
        const t = ambientAudioCtx.currentTime;

        const osc = ambientAudioCtx.createOscillator();
        const g = ambientAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, t);

        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        osc.connect(g);
        g.connect(masterFilter);
        osc.start(t);
        osc.stop(t + 1.4);

        fStep++;
      };

      playFocusPulse();
      rhythmicTimer = window.setInterval(playFocusPulse, 1200);

    // ================= TRACK 4: OCEANIC HORIZON WAVES =================
    } else if (profile === 'oceanic-waves') {
      const oceanChords = [
        [196.00, 246.94, 293.66, 392.00], // G major
        [164.81, 220.00, 261.63, 329.63], // Am
        [220.00, 277.18, 329.63, 440.00], // A major
        [146.83, 196.00, 246.94, 293.66], // G/D
      ];

      let oStep = 0;
      const playOceanSwell = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const chord = oceanChords[oStep % oceanChords.length];
        const t = ambientAudioCtx.currentTime;

        chord.forEach((freq, idx) => {
          if (!ambientAudioCtx) return;
          const osc = ambientAudioCtx.createOscillator();
          const gain = ambientAudioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.15);

          // Slow swell like an ocean wave
          gain.gain.setValueAtTime(0.001, t + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.24, t + idx * 0.15 + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.15 + 3.6);

          osc.connect(gain);
          gain.connect(masterFilter);
          osc.start(t + idx * 0.15);
          osc.stop(t + idx * 0.15 + 3.8);
        });

        oStep++;
      };

      playOceanSwell();
      rhythmicTimer = window.setInterval(playOceanSwell, 3600);

    // ================= TRACK 5: INDUSTRIAL PRECISION GROOVE =================
    } else if (profile === 'cyberpunk-pulse') {
      const bassNotes = [110.00, 110.00, 146.83, 130.81];
      const leadNotes = [440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 392.00, 440.00];

      let grooveStep = 0;
      const playGroove = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const t = ambientAudioCtx.currentTime;

        // Bass Pulse
        const bassNote = bassNotes[Math.floor(grooveStep / 2) % bassNotes.length];
        const bassOsc = ambientAudioCtx.createOscillator();
        const bassGain = ambientAudioCtx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNote, t);

        bassGain.gain.setValueAtTime(0.001, t);
        bassGain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        bassOsc.connect(bassGain);
        bassGain.connect(masterFilter);
        bassOsc.start(t);
        bassOsc.stop(t + 0.3);

        // Synth Arp Note
        const leadNote = leadNotes[grooveStep % leadNotes.length];
        const leadOsc = ambientAudioCtx.createOscillator();
        const leadGain = ambientAudioCtx.createGain();

        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadNote, t);

        leadGain.gain.setValueAtTime(0.001, t);
        leadGain.gain.linearRampToValueAtTime(0.12, t + 0.02);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        leadOsc.connect(leadGain);
        leadGain.connect(masterFilter);
        leadOsc.start(t);
        leadOsc.stop(t + 0.25);

        grooveStep++;
      };

      playGroove();
      rhythmicTimer = window.setInterval(playGroove, 280);

    // ================= TRACK 6: ACOUSTIC PIANO REFLECTIONS =================
    } else if (profile === 'piano-reflections') {
      const pianoChords = [
        [164.81, 246.94, 329.63, 415.30, 493.88], // Emaj7
        [138.59, 207.65, 277.18, 329.63, 415.30], // C#m7
        [110.00, 164.81, 220.00, 277.18, 329.63], // Amaj7
        [123.47, 185.00, 246.94, 311.13, 369.99], // B7
      ];

      let pStep = 0;
      const playPianoSweep = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const chord = pianoChords[pStep % pianoChords.length];
        const t = ambientAudioCtx.currentTime;

        chord.forEach((freq, idx) => {
          if (!ambientAudioCtx) return;
          const osc = ambientAudioCtx.createOscillator();
          const g = ambientAudioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + idx * 0.07);

          g.gain.setValueAtTime(0.001, t + idx * 0.07);
          g.gain.linearRampToValueAtTime(0.24, t + idx * 0.07 + 0.04);
          gainEnvelope(g, t + idx * 0.07 + 0.04, 3.0);

          osc.connect(g);
          g.connect(masterFilter);
          osc.start(t + idx * 0.07);
          osc.stop(t + idx * 0.07 + 3.2);
        });

        pStep++;
      };

      const gainEnvelope = (gainNode: GainNode, startTime: number, duration: number) => {
        try {
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        } catch {}
      };

      playPianoSweep();
      rhythmicTimer = window.setInterval(playPianoSweep, 3000);

    // ================= TRACK 7: CELESTIAL CHIMES & AURA =================
    } else if (profile === 'celestial-chimes') {
      const chimeScales = [
        [587.33, 659.25, 739.99, 880.00], // D F# A
        [659.25, 739.99, 880.00, 987.77], // E G# B
        [523.25, 659.25, 783.99, 1046.50], // C E G C
        [440.00, 554.37, 659.25, 880.00],  // A C# E
      ];

      let cStep = 0;
      const playChimes = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const scale = chimeScales[cStep % chimeScales.length];
        const t = ambientAudioCtx.currentTime;

        scale.forEach((freq, idx) => {
          if (!ambientAudioCtx) return;
          const osc = ambientAudioCtx.createOscillator();
          const g = ambientAudioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.12);

          g.gain.setValueAtTime(0.001, t + idx * 0.12);
          g.gain.linearRampToValueAtTime(0.22, t + idx * 0.12 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 2.0);

          osc.connect(g);
          g.connect(masterFilter);
          osc.start(t + idx * 0.12);
          osc.stop(t + idx * 0.12 + 2.2);
        });

        cStep++;
      };

      playChimes();
      rhythmicTimer = window.setInterval(playChimes, 2200);

    // ================= TRACK 8: RAINFOREST AMBIENT CALM =================
    } else if (profile === 'rainforest-mist') {
      const fluteMelodies = [
        [392.00, 440.00, 523.25, 587.33, 659.25], // G pentatonic
        [440.00, 523.25, 587.33, 659.25, 783.99],
        [329.63, 392.00, 440.00, 523.25, 587.33],
        [392.00, 523.25, 659.25, 783.99, 880.00],
      ];

      let rStep = 0;
      const playRainforestFlute = () => {
        if (!ambientAudioCtx || ambientAudioCtx.state === 'closed' || !isMusicActive) return;
        const melody = fluteMelodies[rStep % fluteMelodies.length];
        const t = ambientAudioCtx.currentTime;

        melody.forEach((freq, idx) => {
          if (!ambientAudioCtx) return;
          const osc = ambientAudioCtx.createOscillator();
          const g = ambientAudioCtx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, t + idx * 0.2);

          g.gain.setValueAtTime(0.001, t + idx * 0.2);
          g.gain.linearRampToValueAtTime(0.20, t + idx * 0.2 + 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.2 + 1.8);

          osc.connect(g);
          g.connect(masterFilter);
          osc.start(t + idx * 0.2);
          osc.stop(t + idx * 0.2 + 2.0);
        });

        rStep++;
      };

      playRainforestFlute();
      rhythmicTimer = window.setInterval(playRainforestFlute, 2600);
    }

    isMusicActive = true;
    notifyMusicListeners();
    return true;
  } catch (err) {
    console.warn('Ambient music audio error:', err);
    isMusicActive = false;
    notifyMusicListeners();
    return false;
  }
}

function stopAmbientMusicInternal() {
  if (rhythmicTimer !== null) {
    clearInterval(rhythmicTimer);
    rhythmicTimer = null;
  }

  ambientNodes.forEach((node: any) => {
    try {
      if (node && typeof node.stop === 'function') node.stop();
      if (node && typeof node.disconnect === 'function') node.disconnect();
    } catch {}
  });
  ambientNodes = [];

  if (ambientAudioCtx && ambientAudioCtx.state !== 'closed') {
    try {
      ambientAudioCtx.close();
    } catch {}
  }
  ambientAudioCtx = null;
  ambientGainNode = null;
  isMusicActive = false;
}

export function stopAmbientMusic() {
  try {
    if (ambientGainNode && ambientAudioCtx && ambientAudioCtx.state !== 'closed') {
      try {
        ambientGainNode.gain.cancelScheduledValues(ambientAudioCtx.currentTime);
        ambientGainNode.gain.setValueAtTime(ambientGainNode.gain.value, ambientAudioCtx.currentTime);
        ambientGainNode.gain.linearRampToValueAtTime(0.0001, ambientAudioCtx.currentTime + 0.15);
      } catch {}
    }

    setTimeout(() => {
      stopAmbientMusicInternal();
      notifyMusicListeners();
    }, 160);
  } catch {
    stopAmbientMusicInternal();
    notifyMusicListeners();
  }
}

// Quick Audio Test Sound to verify device speakers
export function playTestSound() {
  if (!isMasterSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major Chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch {}
}

// Global Click Sound Handler Installer
export function setupGlobalClickSound() {
  if (typeof window === 'undefined') return () => {};

  const handleGlobalClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const interactive = target.closest('button, a, input, select, textarea, [role="button"], [role="tab"], [role="menuitem"], .cursor-pointer');
    if (interactive) {
      playClickSound();
    }
  };

  window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
  return () => {
    window.removeEventListener('click', handleGlobalClick, { capture: true });
  };
}
