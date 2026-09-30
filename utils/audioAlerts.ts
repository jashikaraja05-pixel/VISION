// Web Audio API Synthesizers for Industrial & Vision System Alarms

export type AlarmTypeId = 'Siren Alarm' | 'Pulsing Klaxon' | 'Synthesizer Horn' | 'Gentle AI Chime' | 'Ultrasonic Staccato';

export interface AlarmTypeOption {
  id: AlarmTypeId;
  name: string;
  description: string;
  category: string;
  badgeColor: string;
}

export const ALARM_OPTIONS: AlarmTypeOption[] = [
  {
    id: 'Siren Alarm',
    name: 'Siren Alarm',
    description: 'High-pitch dual-frequency factory emergency sweep siren',
    category: 'Industrial Standard',
    badgeColor: 'bg-rose-500 text-white',
  },
  {
    id: 'Pulsing Klaxon',
    name: 'Pulsing Klaxon',
    description: 'Heavy square-wave submarine klaxon pulse warning',
    category: 'Heavy Machinery',
    badgeColor: 'bg-amber-500 text-slate-950 font-bold',
  },
  {
    id: 'Synthesizer Horn',
    name: 'Synthesizer Horn',
    description: 'Cyberpunk dual-tone multi-oscillator tactical horn',
    category: 'Cyberpunk High-Tech',
    badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
  },
  {
    id: 'Gentle AI Chime',
    name: 'Gentle AI Chime',
    description: 'Soft harmonic sine-wave bell chime sequence for quiet labs',
    category: 'Low Noise',
    badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
  },
  {
    id: 'Ultrasonic Staccato',
    name: 'Ultrasonic Staccato',
    description: 'Rapid high-frequency double-burst alert for busy floors',
    category: 'High Frequency',
    badgeColor: 'bg-purple-500 text-white',
  },
];

export const playAlarmSound = (type: AlarmTypeId | string = 'Siren Alarm') => {
  if (localStorage.getItem('sound_setting_master') === 'false' || localStorage.getItem('sound_setting_alarm') === 'false') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    switch (type) {
      case 'Pulsing Klaxon': {
        // Heavy square-wave klaxon pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        // Pulse 1
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.18);
        
        // Pulse 2
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.45);

        // Pulse 3
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.52);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        break;
      }

      case 'Synthesizer Horn': {
        // Dual oscillator chord (880Hz + 1100Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.setValueAtTime(1100, ctx.currentTime);

        osc1.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.6);
        osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.65);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.7);
        osc2.stop(ctx.currentTime + 0.7);
        break;
      }

      case 'Gentle AI Chime': {
        // Sine wave bell chime arpeggio (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

          gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
        });
        break;
      }

      case 'Ultrasonic Staccato': {
        // High frequency double beep (1760Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(1760, ctx.currentTime);

        gain1.gain.setValueAtTime(0.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.01, ctx.currentTime + 0.08);

        gain1.gain.setValueAtTime(0.25, ctx.currentTime + 0.14);
        gain1.gain.setValueAtTime(0.001, ctx.currentTime + 0.22);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.25);
        break;
      }

      case 'Siren Alarm':
      default: {
        // Factory dual sweep siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.75);
        break;
      }
    }
  } catch (err) {
    console.warn('Could not play alarm sound:', err);
  }
};
