import React, { useState } from 'react';
import { Cpu, Lock, Mail, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { playSecurityAlarmTone } from '../utils/audioAlert';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid credentials. Please check your email and password.');
        playSecurityAlarmTone();
        return;
      }

      onLoginSuccess(data.user);
    } catch {
      setLoading(false);
      setErrorMessage('Network error connecting to login authentication server.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/40 bg-slate-900 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-6">
        
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <Cpu className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl font-black text-white tracking-wider font-mono">
            VISION<span className="text-cyan-400">INSPECT AI</span>
          </h2>
          <p className="text-xs text-slate-400">Secure Role-Based Authentication Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-mono">
          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-[11px] text-center">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Email Endpoint:</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password:</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
