import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Scan, 
  Fingerprint, 
  KeyRound, 
  Check
} from 'lucide-react';
import { AppLockConfig, LockMethod } from './AdminAppLockModal';

interface AdminLockSettingsModalProps {
  onClose: () => void;
  onSaveConfig: (config: AppLockConfig) => void;
  currentConfig: AppLockConfig;
}

export const AdminLockSettingsModal: React.FC<AdminLockSettingsModalProps> = ({
  onClose,
  onSaveConfig,
  currentConfig
}) => {
  const [enabled, setEnabled] = useState(currentConfig.enabled || false);
  const [method, setMethod] = useState<LockMethod>(currentConfig.method || 'face');
  const [pin, setPin] = useState(currentConfig.pin || '1234');
  const [password, setPassword] = useState(currentConfig.password || 'admin123');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: AppLockConfig = {
      enabled,
      method,
      pin,
      password,
      faceRegistered: true,
      fingerprintRegistered: true
    };
    localStorage.setItem('visioninspect_admin_app_lock', JSON.stringify(newConfig));
    try {
      await fetch('/api/admin/app-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (err) {
      console.warn('Could not sync app lock to server:', err);
    }
    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Admin App Lock Security</h3>
              <p className="text-xs text-slate-400">Configure Biometrics (Face & Touch ID), PIN or Password lock for Admin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 bg-slate-800 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Main Toggle: Enable / Disable */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-bold text-sm text-slate-200 block">Enable Admin App Lock</span>
              <p className="text-xs text-slate-400">
                {enabled 
                  ? 'App lock is ACTIVE. Verification will be required when Admin enters.' 
                  : 'App lock is DISABLED. Admin logs in normally.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                enabled ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Lock Configuration Options (Shown when Enabled) */}
          {enabled && (
            <div className="space-y-4">
              
              <label className="text-xs font-mono font-bold text-slate-300 block">
                Select Preferred Verification Method:
              </label>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Option 1: Face Lock */}
                <div
                  onClick={() => setMethod('face')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    method === 'face'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Scan className="h-5 w-5 text-purple-400" />
                    <span className="font-bold text-xs text-slate-200">Face Recognition</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Uses device webcam / phone front camera biometrics scan.
                  </p>
                </div>

                {/* Option 2: Fingerprint */}
                <div
                  onClick={() => setMethod('fingerprint')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    method === 'fingerprint'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Fingerprint className="h-5 w-5 text-purple-400" />
                    <span className="font-bold text-xs text-slate-200">Fingerprint (Touch ID)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Touch sensor biometrics verification area.
                  </p>
                </div>

                {/* Option 3: PIN Code */}
                <div
                  onClick={() => setMethod('pin')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    method === 'pin'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <KeyRound className="h-5 w-5 text-purple-400" />
                    <span className="font-bold text-xs text-slate-200">Security PIN Code</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    4-digit or 6-digit numeric security PIN pad.
                  </p>
                </div>

                {/* Option 4: Password */}
                <div
                  onClick={() => setMethod('password')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    method === 'password'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-purple-400" />
                    <span className="font-bold text-xs text-slate-200">Custom Password</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Administrator security password string.
                  </p>
                </div>

              </div>

              {/* PIN Code Configuration Field */}
              {(method === 'pin') && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Set Admin Security PIN Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 4-digit or 6-digit PIN"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl py-2.5 px-4 text-xs font-mono tracking-widest text-slate-100"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">Default sample PIN: 1234</p>
                </div>
              )}

              {/* Password Configuration Field */}
              {(method === 'password') && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Set Admin Lock Password:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl py-2.5 px-4 text-xs text-slate-100"
                  />
                </div>
              )}

            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Saved Lock Settings ✓</span>
                </>
              ) : (
                <span>Save App Lock Settings</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
