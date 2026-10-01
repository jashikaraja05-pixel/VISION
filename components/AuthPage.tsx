import React, { useState, useEffect } from 'react';
import logoImg from '../src/assets/images/regenerated_image_1785947573697.png';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  Building2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  RefreshCw,
  RotateCcw,
  Inbox
} from 'lucide-react';
import { User } from '../types';
import { playSecurityAlarmTone } from '../utils/audioAlert';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  selectedRole?: 'Admin' | 'Inspector' | null;
  onSwitchRole?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  onLoginSuccess, 
  selectedRole = null,
  onSwitchRole 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Forgot & Reset Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Check URL parameters for direct email password reset links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const queryEmail = params.get('email');
    const queryToken = params.get('token');

    if (action === 'reset-password' || (queryEmail && queryToken)) {
      if (queryEmail) setForgotEmail(queryEmail);
      if (queryToken) setResetTokenInput(queryToken);
      setForgotStep('reset');
      setShowForgotPassword(true);
    }
  }, []);

  // Google Sign-In Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleRole, setGoogleRole] = useState<'Admin' | 'Inspector'>('Admin');
  const [activeRole, setActiveRole] = useState<'Admin' | 'Inspector'>(selectedRole === 'Inspector' ? 'Inspector' : 'Admin');
  const [registerRole, setRegisterRole] = useState<'Admin' | 'Inspector'>(selectedRole === 'Inspector' ? 'Inspector' : 'Admin');
  const [registeredCompanies, setRegisteredCompanies] = useState<{ companyName: string; adminName: string; adminEmail: string }[]>([]);

  useEffect(() => {
    if (selectedRole) {
      setActiveRole(selectedRole);
      setRegisterRole(selectedRole);
      setGoogleRole(selectedRole);
    }
  }, [selectedRole]);

  // Fetch registered Admin companies for inspector auto-select
  useEffect(() => {
    fetch('/api/auth/registered-companies')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.companies)) {
          setRegisteredCompanies(data.companies);
        }
      })
      .catch(() => {});
  }, [mode, activeRole]);

  // Real-time Company Check for Administrator and Inspector
  const [companyStatus, setCompanyStatus] = useState<{
    checked?: boolean;
    available?: boolean;
    isTaken?: boolean;
    adminFound?: boolean;
    message?: string;
    error?: string;
    companyName?: string;
    adminName?: string;
    adminEmail?: string;
  } | null>(null);
  const [checkingCompany, setCheckingCompany] = useState(false);

  // Debounced check whenever factoryName or registerRole changes
  useEffect(() => {
    if (mode !== 'register') {
      setCompanyStatus(null);
      return;
    }
    const trimmed = factoryName.trim();
    if (!trimmed || trimmed.length < 2) {
      setCompanyStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingCompany(true);
        const res = await fetch(`/api/auth/check-company?name=${encodeURIComponent(trimmed)}&role=${registerRole}`);
        const data = await res.json();
        setCheckingCompany(false);
        setCompanyStatus(data);
      } catch {
        setCheckingCompany(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [factoryName, registerRole, mode]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingNotice(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data.status === 'Pending Approval') {
          setPendingNotice(data.error || 'Your account is waiting for administrator approval.');
        } else {
          setErrorMessage(data.error || 'Login failed. Please check your credentials.');
          playSecurityAlarmTone();
        }
        return;
      }

      // Always persist session so reloads retain login
      localStorage.setItem('vision_inspect_session', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage('Network error connecting to authentication server.');
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingNotice(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanFactory = factoryName.trim();
    const cleanEmpId = employeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!cleanName || !cleanEmail || !cleanPass) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!cleanFactory) {
      setErrorMessage('Please provide a Company / Factory name.');
      return;
    }

    // Strict validation: Do not allow Admin registration if company name is already taken!
    if (registerRole === 'Admin' && companyStatus?.isTaken) {
      setErrorMessage(
        companyStatus.error || 
        `Company name "${cleanFactory}" is already registered by another Administrator. Please enter another company name.`
      );
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: cleanPass,
          employeeId: cleanEmpId,
          factoryName: cleanFactory,
          role: registerRole,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data.isCompanyAlreadyRegistered) {
          setErrorMessage(data.error || `Company name '${cleanFactory}' is already taken. Please enter another company name.`);
          setCompanyStatus({ isTaken: true, error: data.error });
          return;
        }

        if (data.isAlreadyRegistered) {
          // If already registered, switch to login tab, prefill email, and prompt for password sign in
          setMode('login');
          setErrorMessage(null);
          setPendingNotice(null);
          setPassword('');
          setSuccessNotice(data.error || 'This email is already registered. Please enter your password to sign in.');
          return;
        }

        if (data.status === 'Pending Approval') {
          setPendingNotice(data.error || 'Your account is waiting for administrator approval.');
        } else {
          setErrorMessage(data.error || 'Registration failed.');
        }
        return;
      }

      // User registered successfully! Strictly require them to sign in explicitly as requested by user
      setMode('login');
      setPassword('');
      setErrorMessage(null);
      if (data.status === 'Pending Approval' || registerRole === 'Inspector') {
        setSuccessNotice(null);
        setPendingNotice(data.message || 'Inspector account registration submitted! Your account is in "Pending Approval" status. An administrator must approve your account before you can sign in with your password.');
      } else {
        setPendingNotice(null);
        setSuccessNotice(data.message || `Registration successful for ${registerRole}! Please enter your password to sign in.`);
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error during registration.');
    }
  };

  // Execute Google Authentication with provided email and role
  const executeGoogleAuth = async (googleEmail: string, roleToRequest?: string) => {
    if (!googleEmail || !googleEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google Account email.');
      return;
    }

    setErrorMessage(null);
    setPendingNotice(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: googleEmail.split('@')[0],
          role: roleToRequest || googleRole,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        }),
      });

      const data = await res.json();
      setLoading(false);
      setShowGoogleModal(false);

      if (!res.ok) {
        if (data.status === 'Pending Approval') {
          setPendingNotice('Your account is waiting for administrator approval.');
        } else {
          setErrorMessage(data.error || 'Google Sign In failed.');
        }
        return;
      }

      if (rememberMe) {
        localStorage.setItem('vision_inspect_session', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setLoading(false);
      setShowGoogleModal(false);
      setErrorMessage('Google authentication service error.');
    }
  };

  // Handle Google Sign In button click
  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    setPendingNotice(null);
    const targetRole = selectedRole || googleRole || 'Admin';
    if (email && email.includes('@')) {
      executeGoogleAuth(email, targetRole);
    } else {
      setGoogleEmailInput('');
      setGoogleRole(targetRole);
      setShowGoogleModal(true);
    }
  };

  // Handle Forgot Password Request (Dispatches Email Verification to Admin)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotLoading(false);

      if (res.ok) {
        setEmailData(data);
        if (data.resetCode) setResetTokenInput(data.resetCode);
        setForgotStep('sent');
      } else {
        setForgotError(data.error || 'Failed to dispatch password reset email.');
      }
    } catch {
      setForgotLoading(false);
      setForgotError('Network error connecting to email verification server.');
    }
  };

  // Handle Password Reset Submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail || !resetTokenInput || !newPasswordInput) {
      setForgotError('Please fill in all required verification fields.');
      return;
    }

    if (newPasswordInput.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setForgotError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/confirm-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          resetCode: resetTokenInput,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      setForgotLoading(false);

      if (res.ok) {
        setForgotSuccess(data.message || 'Password reset successfully!');
        // Pre-fill email and password in login form for immediate sign in
        setEmail(forgotEmail);
        setPassword(newPasswordInput);
        setMode('login');
      } else {
        setForgotError(data.error || 'Password reset failed.');
      }
    } catch {
      setForgotLoading(false);
      setForgotError('Network error resetting password.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Admin Reset Database Modal States (Replaces iframe-blocked prompt/confirm/alert)
  const [showResetDbModal, setShowResetDbModal] = useState(false);
  const [resetDbEmail, setResetDbEmail] = useState('');
  const [resetDbPassword, setResetDbPassword] = useState('');
  const [resetDbCode, setResetDbCode] = useState('');
  const [resetDbLoading, setResetDbLoading] = useState(false);
  const [resetDbError, setResetDbError] = useState<string | null>(null);
  const [resetDbSuccess, setResetDbSuccess] = useState<string | null>(null);
  const [resetDbCodeData, setResetDbCodeData] = useState<any>(null);
  const [resetDbCopiedCode, setResetDbCopiedCode] = useState(false);

  // Request Reset Authorization Code for Database Wipe
  const handleRequestResetDbCode = async () => {
    if (!resetDbEmail || !resetDbEmail.trim()) {
      setResetDbError('Please enter the registered Administrator email address.');
      return;
    }

    setResetDbLoading(true);
    setResetDbError(null);
    setResetDbSuccess(null);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetDbEmail.trim() }),
      });
      const data = await res.json();
      setResetDbLoading(false);

      if (res.ok) {
        setResetDbCodeData(data);
        const codeToUse = data.resetCode || data.resetToken;
        if (codeToUse) {
          setResetDbCode(codeToUse);
        }
      } else {
        setResetDbError(data.error || 'Failed to dispatch authorization code to registered Admin email.');
      }
    } catch {
      setResetDbLoading(false);
      setResetDbError('Network error connecting to email verification service.');
    }
  };

  // Execute Complete Database & Login Records Reset
  const handleExecuteResetDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetDbError(null);
    setResetDbSuccess(null);

    if (!resetDbEmail) {
      setResetDbError('Registered Administrator email is required.');
      return;
    }

    if (!resetDbPassword && !resetDbCode) {
      setResetDbError('Please enter either the Administrator password OR the reset authorization code sent to your email.');
      return;
    }

    setResetDbLoading(true);

    try {
      const res = await fetch('/api/auth/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetDbEmail.trim(),
          password: resetDbPassword ? resetDbPassword.trim() : undefined,
          resetCode: resetDbCode ? resetDbCode.trim() : undefined,
        }),
      });

      const data = await res.json();
      setResetDbLoading(false);

      if (res.ok) {
        setResetDbSuccess(data.message || 'System login database reset successfully!');
        setEmail('');
        setPassword('');
        setName('');
        setEmployeeId('');
        setFactoryName('');
        setErrorMessage(null);
        setPendingNotice(null);
      } else {
        setResetDbError(data.error || 'Database reset authorization failed. Please check your credentials.');
      }
    } catch {
      setResetDbLoading(false);
      setResetDbError('Network error executing system database reset.');
    }
  };

  // Reset all database user entries and login records (Opens modern interactive modal)
  const handleResetDatabase = () => {
    setResetDbError(null);
    setResetDbSuccess(null);
    setResetDbCodeData(null);
    setResetDbPassword('');
    setResetDbCode('');
    setShowResetDbModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Decorator Grids & Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.4)] mb-3 overflow-hidden shrink-0">
            <img
              src={logoImg}
              alt="VisionInspect AI Logo"
              className="w-full h-full object-fill rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-wider font-mono">
            VISION<span className="text-cyan-400">INSPECT</span> AI
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {selectedRole ? `${selectedRole} Authentication Portal` : 'AI-Powered Smart Visual Inspection & Quality Management System'}
          </p>

          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              className="mt-3 inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 hover:border-cyan-500/40 transition-all"
            >
              <span>← Switch Role (Current: {selectedRole || 'Any'})</span>
            </button>
          )}
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Direct Role Switching: Administrator Portal vs Certified Inspector Portal */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveRole('Admin');
                setRegisterRole('Admin');
                setErrorMessage(null);
                setPendingNotice(null);
                setSuccessNotice(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 ${
                activeRole === 'Admin'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('Inspector');
                setRegisterRole('Inspector');
                setErrorMessage(null);
                setPendingNotice(null);
                setSuccessNotice(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 ${
                activeRole === 'Inspector'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="h-4 w-4 text-cyan-400" />
              <span>Inspector Portal</span>
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setPendingNotice(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeRole === 'Admin' ? 'Admin Sign In' : 'Inspector Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegisterRole(activeRole);
                setErrorMessage(null);
                setPendingNotice(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeRole === 'Admin' ? 'Register Admin' : 'Register Inspector'}
            </button>
          </div>

          {/* Pending Approval Notice Banner */}
          {pendingNotice && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start space-x-3 text-xs leading-relaxed animate-pulse">
              <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-200 mb-0.5">Approval Required</p>
                <p>{pendingNotice}</p>
                <p className="mt-1.5 text-[11px] text-amber-400/80">
                  Please notify your administrator to review and approve your account.
                </p>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2.5 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice Banner */}
          {successNotice && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start space-x-3 text-xs leading-relaxed">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-200 mb-0.5">Ready to Sign In</p>
                <p>{successNotice}</p>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotSuccess(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Quick Fill Helper for Demo / Screen Recording */}
              {activeRole === 'Admin' ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-300 font-mono">
                  <span>Demo Admin: admin@visioninspect.ai</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@visioninspect.ai');
                      setPassword('password123');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 text-[10px] font-bold transition-all border border-purple-500/40 cursor-pointer"
                  >
                    Quick Fill
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 font-mono">
                  <span>Inspector Login: Enter your approved inspector email &amp; password.</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Authenticate & Access {activeRole} Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM (ADMIN & INSPECTOR) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {registerRole === 'Admin' ? "Admin's Name" : "Full Name"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={registerRole === 'Admin' ? "e.g. Alex Morgan" : "Alex Morgan"}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {registerRole === 'Admin' ? "Admin's Email ID" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={registerRole === 'Admin' ? "admin@company.com" : "inspector@company.com"}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    {registerRole === 'Admin' ? "Admin's Company Name" : "Company / Factory Name (Required)"}
                  </label>
                  {checkingCompany && (
                    <span className="text-[10px] text-cyan-400 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Checking...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder={registerRole === 'Admin' ? "e.g. Acme Industries" : "Must match registered Admin company name"}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                      registerRole === 'Admin' && companyStatus?.isTaken
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : registerRole === 'Admin' && companyStatus?.available
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                    }`}
                  />
                </div>

                {/* Real-time status for Administrator registration */}
                {registerRole === 'Admin' && companyStatus?.isTaken && (
                  <div className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/40 rounded-xl flex items-start gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-rose-200">Company Name Already Taken!</span>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">
                        {companyStatus.error || `Company name "${companyStatus.companyName || factoryName}" is already registered by another Administrator (${companyStatus.adminName || 'Admin'}). Each company can only have one primary registered Admin. Please enter another company name.`}
                      </p>
                    </div>
                  </div>
                )}

                {registerRole === 'Admin' && companyStatus?.available && (
                  <div className="mt-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Company name &quot;{factoryName.trim()}&quot; is available for registration.</span>
                  </div>
                )}

                {/* Real-time status for Inspector registration */}
                {registerRole === 'Inspector' && companyStatus?.adminFound && (
                  <div className="mt-2 p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-start gap-2 text-xs text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-cyan-200">Company Administrator Found:</span>
                      <p className="text-[11px] text-cyan-300/90 mt-0.5">
                        {companyStatus.adminName} ({companyStatus.adminEmail}). Your approval request will be routed directly to this administrator.
                      </p>
                    </div>
                  </div>
                )}

                {registerRole === 'Inspector' && companyStatus && !companyStatus.adminFound && factoryName.trim().length >= 2 && (
                  <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-200">No Administrator Registered for &quot;{factoryName.trim()}&quot; Yet:</span>
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        Notice: Company name mismatch or missing admin. Your account will remain in &quot;Pending Approval&quot; and will not be routed to other admins. An Administrator for &quot;{factoryName.trim()}&quot; must register first before your account can be approved.
                      </p>
                    </div>
                  </div>
                )}

                {registerRole === 'Inspector' && !companyStatus && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Must match an existing registered Admin company name for your administrator to approve your account.
                  </p>
                )}

                {/* Clickable Registered Admin Companies for 1-click select */}
                {registerRole === 'Inspector' && registeredCompanies.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Registered Companies (Click to select):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {registeredCompanies.map((c) => (
                        <button
                          key={c.companyName}
                          type="button"
                          onClick={() => setFactoryName(c.companyName)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                            factoryName.trim().toLowerCase() === c.companyName.toLowerCase()
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white'
                          }`}
                        >
                          🏢 {c.companyName} <span className="text-[9px] text-cyan-400">({c.adminName})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {registerRole === 'Admin' ? "Admin's Password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1"
                    title={showRegisterPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {registerRole === 'Inspector' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-8492"
                    className="w-full px-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              )}

              {registerRole === 'Admin' ? (
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200 space-y-1">
                  <div className="flex items-center font-bold space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    <span>Company Administrator Registration</span>
                  </div>
                  <p className="text-[10px] text-cyan-300/80">
                    Your account will be created with <strong className="text-emerald-400">Approved status</strong>. You will be logged straight into the Admin Portal to manage company operations and review inspector requests.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center text-slate-300 font-semibold space-x-1.5">
                    <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Role: Factory Inspector</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Account status will be set to <strong className="text-amber-400 font-mono">"Pending Approval"</strong>. An administrator must approve access before entry.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>{registerRole === 'Admin' ? 'Register Company Admin & Enter' : 'Submit Inspector Approval Request'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google Sign In Section (Available for Admin; Google account login not required for Inspectors) */}
          {selectedRole !== 'Inspector' ? (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-slate-900 px-3 text-slate-500">Admin Single Sign-On</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800/80 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-3"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Admin Google Sign In</span>
              </button>
            </>
          ) : (
            <div className="mt-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-[11px] text-slate-400 font-mono">
              Note: Google account login is not required for Inspectors. Use your assigned Employee ID or Email above.
            </div>
          )}

        </div>

        {/* System Reset Option - STRICTLY RESTRICTED TO ADMIN ONLY */}
        {selectedRole === 'Admin' && (
          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={handleResetDatabase}
              className="inline-flex items-center space-x-1.5 text-xs text-rose-400/90 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl border border-rose-500/30 transition-all font-mono"
              title="Admin Only: Wipe existing user accounts and reset login system"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
              <span>Admin: Reset System Login Database</span>
            </button>
            <p className="text-[10px] text-slate-500 font-mono">
              Note: Password reset authorization link/code will be sent strictly to the registered Admin email address.
            </p>
          </div>
        )}

        {/* Security badge footer */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 mt-4 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>256-Bit Encrypted TLS Connection</span>
        </div>

      </div>

      {/* Google Sign In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 p-2 shadow-inner">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100">Sign in with Google</h3>
              <p className="text-xs text-slate-400">
                Enter your Google Account email. Registered accounts log directly into their assigned section.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (googleEmailInput) executeGoogleAuth(googleEmailInput, googleRole);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">Google Account Email:</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {!selectedRole ? (
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Role for New Accounts:</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setGoogleRole('Admin')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        googleRole === 'Admin'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Company Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoogleRole('Inspector')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        googleRole === 'Inspector'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Inspector
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Target Section:</span>
                  <span className="font-bold text-cyan-400">
                    {selectedRole === 'Admin' ? 'Company Admin' : 'Factory Inspector'}
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 flex items-center space-x-2"
                >
                  {loading ? (
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <span>Continue with Google</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password & Reset Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {forgotStep === 'request' && 'Forgot Account Password'}
                    {forgotStep === 'sent' && 'Email Verification Sent'}
                    {forgotStep === 'reset' && 'Create New Password'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {forgotStep === 'request' && 'Enter your email to receive a password reset link.'}
                    {forgotStep === 'sent' && 'Password reset verification email dispatched.'}
                    {forgotStep === 'reset' && 'Verify reset code and enter your new password.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotStep('request');
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {forgotError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Success Banner */}
            {forgotSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Password Reset Verified & Saved!</span>
                </div>
                <p className="text-slate-300 text-[11px]">{forgotSuccess}</p>
                <p className="text-slate-400 text-[10px]">
                  Your credentials have been automatically loaded into the login form below.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotStep('request');
                    setForgotSuccess(null);
                  }}
                  className="w-full mt-2 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  Return to Sign In & Enter Portal
                </button>
              </div>
            )}

            {/* STEP 1: REQUEST VERIFICATION EMAIL */}
            {forgotStep === 'request' && !forgotSuccess && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed space-y-1">
                  <p className="font-semibold text-cyan-400 flex items-center space-x-1.5">
                    <Mail className="h-4 w-4" />
                    <span>Administrator & Inspector Password Recovery</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    If you forget your password, enter your registered email address below. A 256-bit encrypted verification code and direct reset link will be generated and dispatched.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 font-medium text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Reset Verification Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: EMAIL DISPATCH PREVIEW / VERIFICATION SUMMARY */}
            {forgotStep === 'sent' && !forgotSuccess && emailData && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-[11px]">
                      <Inbox className="h-4 w-4" />
                      <span>Security Verification Email Dispatched</span>
                    </div>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      Delivered
                    </span>
                  </div>

                  <div className="text-[11px] font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">To:</span>
                      <span className="font-bold text-slate-200">{emailData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account:</span>
                      <span className="text-cyan-300">{emailData.userName} ({emailData.userRole})</span>
                    </div>
                  </div>

                  {/* Verification Token Code Card */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">Password Reset Code:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(emailData.resetToken)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedToken ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedToken ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <div className="text-center py-2 bg-slate-950 rounded-lg border border-cyan-500/40 text-cyan-400 font-mono font-extrabold text-lg tracking-widest shadow-inner">
                      {emailData.resetToken}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Code expires in 15 minutes. Click below to enter your new password.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 font-medium cursor-pointer"
                  >
                    Resend / Change Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep('reset')}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 flex items-center justify-center space-x-1.5 shadow-lg cursor-pointer"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RESET PASSWORD FORM */}
            {forgotStep === 'reset' && !forgotSuccess && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Verification Code (from Email)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <input
                      type="text"
                      required
                      value={resetTokenInput}
                      onChange={(e) => setResetTokenInput(e.target.value.toUpperCase())}
                      placeholder="RST-849201"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new secure password (min 6 chars)"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('sent')}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Back to Code
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify Code & Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Admin Reset System Database Modal */}
      {showResetDbModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Admin System Login Reset
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reset inspector logs & accounts while preserving Administrator access.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowResetDbModal(false);
                  setResetDbError(null);
                  setResetDbSuccess(null);
                  setResetDbCodeData(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {resetDbError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{resetDbError}</span>
              </div>
            )}

            {/* Success Banner */}
            {resetDbSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>System Data Reset Completed</span>
                </div>
                <p className="text-slate-300 text-[11px]">{resetDbSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetDbModal(false);
                    setResetDbSuccess(null);
                    window.location.reload();
                  }}
                  className="w-full mt-2 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  Reload Portal & Continue
                </button>
              </div>
            )}

            {!resetDbSuccess && (
              <form onSubmit={handleExecuteResetDatabase} className="space-y-4">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-200 leading-relaxed">
                  <span className="font-bold">Security Notice:</span> This action resets all inspector login credentials, inspection logs, and alerts back to baseline factory state. Your Administrator credentials remain active.
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Registered Administrator Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={resetDbEmail}
                      onChange={(e) => setResetDbEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {/* Option 1: Admin Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Administrator Password (Option A)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={resetDbPassword}
                      onChange={(e) => setResetDbPassword(e.target.value)}
                      placeholder="Enter Admin account password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-slate-900 px-2 text-slate-500">OR VIA EMAIL VERIFICATION CODE</span>
                  </div>
                </div>

                {/* Option 2: Request Reset Code via Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Reset Authorization Code (Option B)
                    </label>
                    <button
                      type="button"
                      onClick={handleRequestResetDbCode}
                      disabled={resetDbLoading}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded-lg border border-cyan-500/30 font-mono cursor-pointer transition-colors"
                    >
                      {resetDbLoading ? 'Sending...' : 'Request Code via Admin Email'}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <input
                      type="text"
                      value={resetDbCode}
                      onChange={(e) => setResetDbCode(e.target.value)}
                      placeholder="e.g. RST-849201"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Code Dispatched Preview Card */}
                {resetDbCodeData && (
                  <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Admin Authorization Code:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const code = resetDbCodeData.resetCode || resetDbCodeData.resetToken;
                          if (code) {
                            navigator.clipboard.writeText(code);
                            setResetDbCopiedCode(true);
                            setTimeout(() => setResetDbCopiedCode(false), 2000);
                          }
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                      >
                        {resetDbCopiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{resetDbCopiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <div className="text-center py-1.5 bg-slate-900 rounded-lg border border-cyan-500/40 text-cyan-400 font-mono font-extrabold text-base tracking-widest">
                      {resetDbCodeData.resetToken || resetDbCodeData.resetCode}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-mono">
                      Sent to {resetDbCodeData.email} • Code auto-filled above
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetDbModal(false)}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetDbLoading}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-xs rounded-xl hover:from-rose-500 hover:to-rose-600 flex items-center space-x-1.5 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {resetDbLoading ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Confirm Reset System Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
