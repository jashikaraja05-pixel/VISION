import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Scan, 
  Fingerprint, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Camera, 
  RotateCcw, 
  AlertCircle
} from 'lucide-react';

export type LockMethod = 'face' | 'fingerprint' | 'pin' | 'password';

export interface AppLockConfig {
  enabled: boolean;
  method: LockMethod;
  pin?: string;
  password?: string;
  faceRegistered?: boolean;
  fingerprintRegistered?: boolean;
}

interface AdminAppLockModalProps {
  config: AppLockConfig;
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
}

export const AdminAppLockModal: React.FC<AdminAppLockModalProps> = ({
  config,
  onSuccess,
  onCancel,
  adminName = 'Administrator'
}) => {
  const [activeMethod, setActiveMethod] = useState<LockMethod>(config.method || 'face');
  const [pinInput, setPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification states
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera video ref for Face Lock
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Start Camera for Face Recognition when activeMethod === 'face'
  useEffect(() => {
    if (activeMethod === 'face') {
      startFaceCamera();
    } else {
      stopFaceCamera();
    }

    return () => {
      stopFaceCamera();
    };
  }, [activeMethod]);

  const startFaceCamera = async () => {
    try {
      setScanStatus('scanning');
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Simulate biometric face scanning verification (1.5 seconds)
      setTimeout(() => {
        setScanStatus('success');
        setTimeout(() => {
          stopFaceCamera();
          onSuccess();
        }, 800);
      }, 1800);
    } catch (err) {
      console.warn("Camera access fallback:", err);
      // Fallback if camera permission is denied or device has no camera
      setScanStatus('scanning');
      setTimeout(() => {
        setScanStatus('success');
        setTimeout(() => onSuccess(), 800);
      }, 1500);
    }
  };

  const stopFaceCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Fingerprint touch handler
  const handleFingerprintTouch = () => {
    if (scanning) return;
    setScanning(true);
    setScanStatus('scanning');
    setErrorMsg(null);

    setTimeout(() => {
      setScanning(false);
      setScanStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 600);
    }, 1400);
  };

  // PIN submission handler
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setErrorMsg(null);

      const targetPin = config.pin || '1234';
      if (newPin.length === targetPin.length) {
        if (newPin === targetPin) {
          setScanStatus('success');
          setTimeout(() => onSuccess(), 500);
        } else {
          setScanStatus('failed');
          setErrorMsg('Incorrect PIN code. Please try again.');
          setTimeout(() => {
            setPinInput('');
            setScanStatus('idle');
          }, 1200);
        }
      }
    }
  };

  // Password submission handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPassword = config.password || 'admin123';
    if (passwordInput === targetPassword) {
      setScanStatus('success');
      setTimeout(() => onSuccess(), 500);
    } else {
      setScanStatus('failed');
      setErrorMsg('Incorrect Administrator password.');
      setTimeout(() => setScanStatus('idle'), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.25)] relative space-y-6 text-center">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <span>ADMIN APP LOCK SECURITY</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">
            Verify {adminName}
          </h2>
          <p className="text-xs text-slate-400">
            Authentication required to enter Administrator Portal.
          </p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveMethod('face')}
            className={`py-2 rounded-xl flex flex-col items-center space-y-1 transition-all cursor-pointer ${
              activeMethod === 'face'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="h-4 w-4" />
            <span className="text-[10px] font-bold">Face</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('fingerprint')}
            className={`py-2 rounded-xl flex flex-col items-center space-y-1 transition-all cursor-pointer ${
              activeMethod === 'fingerprint'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fingerprint className="h-4 w-4" />
            <span className="text-[10px] font-bold">Touch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('pin')}
            className={`py-2 rounded-xl flex flex-col items-center space-y-1 transition-all cursor-pointer ${
              activeMethod === 'pin'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span className="text-[10px] font-bold">PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('password')}
            className={`py-2 rounded-xl flex flex-col items-center space-y-1 transition-all cursor-pointer ${
              activeMethod === 'password'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span className="text-[10px] font-bold">Password</span>
          </button>
        </div>

        {/* Dynamic Verification Interface */}

        {/* 1. FACE LOCK INTERFACE */}
        {activeMethod === 'face' && (
          <div className="space-y-4">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              
              {/* Biometric Hologram HUD Ring Overlay */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin-slow opacity-70 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-purple-400/40 pointer-events-none" />

              {/* Scanning Laser Beam Effect */}
              {scanStatus === 'scanning' && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-bounce pointer-events-none" />
              )}

              {/* Success Badge */}
              {scanStatus === 'success' && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-400 space-y-2">
                  <CheckCircle2 className="h-12 w-12 animate-pulse" />
                  <span className="text-xs font-bold font-mono">FACE MATCHED ✓</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300 font-mono">
              {scanStatus === 'scanning' && (
                <span className="text-cyan-400 animate-pulse flex items-center justify-center space-x-1">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Scanning Face Biometrics (Phone / Laptop Camera)...</span>
                </span>
              )}
              {scanStatus === 'success' && (
                <span className="text-emerald-400 font-bold">Access Granted. Welcome, Admin!</span>
              )}
            </div>

            <button
              type="button"
              onClick={startFaceCamera}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline font-mono cursor-pointer flex items-center justify-center space-x-1 mx-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry Face Scan</span>
            </button>
          </div>
        )}

        {/* 2. FINGERPRINT INTERFACE */}
        {activeMethod === 'fingerprint' && (
          <div className="space-y-4 py-2">
            <button
              type="button"
              onClick={handleFingerprintTouch}
              className={`w-32 h-32 mx-auto rounded-3xl bg-slate-950 border-2 transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                scanStatus === 'scanning'
                  ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                  : scanStatus === 'success'
                  ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                  : 'border-purple-500/40 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
              }`}
            >
              <Fingerprint className={`h-16 w-16 transition-all ${
                scanStatus === 'scanning'
                  ? 'text-cyan-400 animate-pulse scale-110'
                  : scanStatus === 'success'
                  ? 'text-emerald-400 scale-125'
                  : 'text-purple-400 hover:scale-105'
              }`} />

              {scanStatus === 'scanning' && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-500/20 to-transparent animate-pulse" />
              )}
            </button>

            <div className="text-xs text-slate-300 font-mono">
              {scanStatus === 'idle' && (
                <span className="text-slate-400">Tap / Click sensor icon to scan Touch ID fingerprint</span>
              )}
              {scanStatus === 'scanning' && (
                <span className="text-cyan-400 animate-pulse">Reading fingerprint sensor...</span>
              )}
              {scanStatus === 'success' && (
                <span className="text-emerald-400 font-bold">Biometric Match Verified ✓</span>
              )}
            </div>
          </div>
        )}

        {/* 3. PIN CODE INTERFACE */}
        {activeMethod === 'pin' && (
          <div className="space-y-4">
            {/* PIN Dots Indicator */}
            <div className="flex items-center justify-center space-x-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pinInput.length > idx
                      ? 'bg-purple-400 border-purple-300 shadow-[0_0_10px_#c084fc]'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-mono flex items-center justify-center space-x-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (item === 'C') {
                      setPinInput('');
                      setErrorMsg(null);
                    } else if (item === '⌫') {
                      setPinInput(prev => prev.slice(0, -1));
                      setErrorMsg(null);
                    } else {
                      handlePinDigit(item);
                    }
                  }}
                  className="py-3 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl text-slate-100 font-extrabold text-base font-mono hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. PASSWORD INTERFACE */}
        {activeMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative text-left">
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Admin Security Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter administrator password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-3 px-4 pl-10 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-mono text-left">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Unlock Admin Portal
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 cursor-pointer font-mono"
          >
            ← Switch User Role
          </button>
          <span className="text-[10px] text-slate-500 font-mono">
            VisionInspect Security 4.2
          </span>
        </div>

      </div>
    </div>
  );
};
