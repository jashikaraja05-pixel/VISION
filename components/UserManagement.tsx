import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit2, Lock, Eye, EyeOff, Copy, Check, X, Download, FileSpreadsheet, AlertTriangle, Key, Calendar, User as UserIcon } from 'lucide-react';
import { User, UserRole, InspectionRecord } from '../types';
import { downloadRecordsCSV, downloadInspectorDirectoryCSV } from '../utils/downloadHelper';

interface UserManagementProps {
  users: User[];
  currentUser?: User | null;
  onAddUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  inspections?: InspectionRecord[];
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
  inspections = [],
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Visible Password Toggle Map for Admin
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Inspector');
  const [factoryName, setFactoryName] = useState(currentUser?.factoryName || 'Factory Alpha');
  const [employeeId, setEmployeeId] = useState('');

  const isAdmin = currentUser?.role === 'Admin';
  const cleanStr = (s?: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const adminCompany = cleanStr(currentUser?.factoryName);

  // Filter out Admins: Only Inspectors are displayed in Inspector Directory, matched STRICTLY to the Admin's company (Exact match only)
  const filteredUsers = users.filter(usr => {
    if (usr.role === 'Admin') return false; // Exclude admin login details
    if (!adminCompany) return true;
    const userCompany = cleanStr(usr.factoryName);
    return userCompany === adminCompany; // Strict exact match! No partial or substring match (e.g. "industry" does NOT match "industryy")
  });

  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*';
    let res = 'Insp!';
    for (let i = 0; i < 3; i++) res += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    for (let i = 0; i < 3; i++) res += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    for (let i = 0; i < 2; i++) res += numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 0; i < 2; i++) res += symbols.charAt(Math.floor(Math.random() * symbols.length));
    return res;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  // Prevent Print / Screenshot key combinations for Inspector
  useEffect(() => {
    if (isAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen, Ctrl+P, Cmd+P, Ctrl+Shift+S, Cmd+Shift+S
      if (
        e.key === 'PrintScreen' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        alert('Security Alert: Screenshot and document capture capabilities are strictly restricted for Certified Inspector accounts.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  const togglePasswordVisibility = (userId: string) => {
    if (!isAdmin) return;
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDownloadRegistry = () => {
    downloadInspectorDirectoryCSV(users);
  };

  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Permission Denied: User provisioning is restricted to Administrators.');
      return;
    }
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword(generateSecurePassword());
    setRole('Inspector');
    setFactoryName(currentUser?.factoryName || 'Factory Alpha');
    setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    if (!isAdmin) {
      alert('Permission Denied: User editing is restricted to Administrators.');
      return;
    }
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword((user as any).password || 'P@ssword2026!');
    setRole(user.role);
    setFactoryName(user.factoryName || currentUser?.factoryName || 'Factory Alpha');
    setEmployeeId(user.employeeId || 'EMP-1024');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const formattedCreatedAt = new Date().toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (editingUser) {
      const updatedData = {
        name,
        email,
        password,
        role,
        factoryName,
        employeeId,
      };
      try {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        if (res.ok) {
          const data = await res.json();
          onEditUser(data.user || { ...editingUser, ...updatedData });
        } else {
          onEditUser({ ...editingUser, ...updatedData });
        }
      } catch {
        onEditUser({ ...editingUser, ...updatedData });
      }
    } else {
      const newData = {
        name,
        email,
        password,
        role,
        employeeId,
        factoryName,
        status: 'Approved' as const,
      };
      try {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData),
        });
        if (res.ok) {
          const data = await res.json();
          onAddUser(data.user || {
            id: `usr-${Date.now()}`,
            name,
            email,
            password,
            role,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            factoryId: 'fac-1',
            factoryName,
            employeeId,
            status: 'Approved',
            lastActive: 'Just now',
            createdAt: formattedCreatedAt,
          });
        } else {
          onAddUser({
            id: `usr-${Date.now()}`,
            name,
            email,
            password,
            role,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            factoryId: 'fac-1',
            factoryName,
            employeeId,
            status: 'Approved',
            lastActive: 'Just now',
            createdAt: formattedCreatedAt,
          });
        }
      } catch {
        onAddUser({
          id: `usr-${Date.now()}`,
          name,
          email,
          password,
          role,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          factoryId: 'fac-1',
          factoryName,
          employeeId,
          status: 'Approved',
          lastActive: 'Just now',
          createdAt: formattedCreatedAt,
        });
      }
    }
    setShowAddModal(false);
  };

  const handleApproveUser = async (user: User) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', adminCompany: currentUser?.factoryName }),
      });
      if (res.ok) {
        const data = await res.json();
        onEditUser(data.user || { ...user, status: 'Approved' });
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error) alert(data.error);
        onEditUser({ ...user, status: 'Approved' });
      }
    } catch {
      onEditUser({ ...user, status: 'Approved' });
    }
  };

  const handleToggleDisableUser = async (user: User) => {
    if (!isAdmin) return;
    const nextStatus = user.status === 'Disabled' || user.status === 'Rejected' ? 'Approved' : 'Disabled';
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, adminCompany: currentUser?.factoryName }),
      });
      if (res.ok) {
        const data = await res.json();
        onEditUser(data.user || { ...user, status: nextStatus });
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error) alert(data.error);
        onEditUser({ ...user, status: nextStatus });
      }
    } catch {
      onEditUser({ ...user, status: nextStatus });
    }
  };

  const handleDeleteUserClick = async (usr: User) => {
    if (!isAdmin) {
      alert('Security Alert: Only Administrators can delete accounts.');
      return;
    }
    if (usr.role === 'Admin') {
      alert('Security Protection: Administrator accounts cannot be deleted.');
      return;
    }
    if (window.confirm(`Admin Confirmation: Are you sure you want to permanently delete inspector account "${usr.name}" (${usr.email})? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/users/${usr.id}`, { method: 'DELETE' });
        if (res.ok) {
          onDeleteUser(usr.id);
        } else {
          onDeleteUser(usr.id);
        }
      } catch {
        onDeleteUser(usr.id);
      }
    }
  };

  const handlePurgeRejected = async () => {
    if (!isAdmin) return;
    const inactiveUsers = filteredUsers.filter(u => u.status === 'Disabled' || u.status === 'Rejected');
    if (inactiveUsers.length === 0) return;
    if (window.confirm(`Confirm Purge: Permanently delete all ${inactiveUsers.length} rejected/disabled inspector accounts?`)) {
      for (const u of inactiveUsers) {
        try {
          await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
          onDeleteUser(u.id);
        } catch {
          onDeleteUser(u.id);
        }
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="h-6 w-6 text-purple-400" />
            <span>INSPECTOR & USER DIRECTORY MANAGEMENT</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete registry of certified factory inspectors, credentials, registration timestamps, and authorization status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Purge Rejected/Disabled Accounts (if any exist) */}
          {isAdmin && filteredUsers.some(u => u.status === 'Disabled' || u.status === 'Rejected') && (
            <button
              onClick={handlePurgeRejected}
              className="inline-flex items-center space-x-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all border bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
              title="Delete all rejected and disabled inspector accounts"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Purge Rejected ({filteredUsers.filter(u => u.status === 'Disabled' || u.status === 'Rejected').length})</span>
            </button>
          )}

          {/* Download Registry Option - Enabled for Admin, Disabled for Inspector */}
          <button
            onClick={handleDownloadRegistry}
            disabled={!isAdmin}
            className={`inline-flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all border ${
              isAdmin
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer'
                : 'bg-slate-900 text-slate-600 border-slate-800 opacity-60 cursor-not-allowed'
            }`}
            title={isAdmin ? 'Download Full Inspector Directory CSV' : 'Download Option Disabled for Inspector Accounts'}
          >
            {isAdmin ? <Download className="h-4 w-4 text-emerald-400" /> : <Lock className="h-4 w-4 text-slate-500" />}
            <span>Download Inspector Directory (CSV)</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-transform"
            >
              <UserPlus className="h-4 w-4" />
              <span>Provision New Inspector</span>
            </button>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <Lock className="h-4 w-4 text-amber-400" />
              <span>Inspector Mode: Read-Only Access</span>
            </div>
          )}
        </div>
      </div>

      {/* Record Downloads & Export Bar */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs">
            <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
            <span>DIRECT DATA DOWNLOADS & RECORD EXPORTS (REAL DATABASE)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {inspections.length} Inspection Logs • {filteredUsers.length} Certified Inspectors
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => downloadInspectorDirectoryCSV(users)}
            className="px-3 py-2.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
            title="Download full inspector user directory as CSV"
          >
            <Download className="h-4 w-4 text-purple-300" />
            <span>Inspector Directory (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => downloadRecordsCSV(inspections, 'Daily')}
            className="px-3 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
            title="Export 24-hour daily inspection logs"
          >
            <Download className="h-4 w-4 text-cyan-300" />
            <span>Export Daily Records (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => downloadRecordsCSV(inspections, 'Weekly')}
            className="px-3 py-2.5 rounded-xl bg-blue-500/20 text-blue-200 border border-blue-500/40 hover:bg-blue-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
            title="Export past 7 days inspection logs"
          >
            <Download className="h-4 w-4 text-blue-300" />
            <span>Export Weekly Records (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => downloadRecordsCSV(inspections, 'Monthly')}
            className="px-3 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
            title="Export past 30 days inspection logs"
          >
            <Download className="h-4 w-4 text-emerald-300" />
            <span>Export Monthly Records (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => downloadRecordsCSV(inspections, 'All')}
            className="px-3 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm col-span-2 sm:col-span-1"
            title="Export all database inspection records"
          >
            <Download className="h-4 w-4 text-indigo-300" />
            <span>Export All Records (CSV)</span>
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Notice:</strong> You are viewing Inspector Management as a Certified Inspector. Account creation, password modification, approval status updates, and account deletions are strictly restricted to Administrators.
          </span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono min-w-[900px]">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Inspector & Employee ID</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Password Credential</th>
                <th className="p-4">Registration Date & Time</th>
                <th className="p-4">Role & Facility</th>
                <th className="p-4">Approval Status</th>
                <th className="p-4 text-right">Admin Action Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3 py-6">
                      <div className="h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-purple-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-200">No Inspector Accounts Found</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        When an inspector registers under company <span className="text-cyan-400 font-bold">{currentUser?.factoryName || 'Apex'}</span>, their account will appear here in <span className="text-amber-400 font-bold">Pending Approval</span> status for authorization or deletion.
                      </p>
                      {isAdmin && (
                        <button
                          onClick={handleOpenAdd}
                          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Provision New Inspector</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((usr) => {
                const usrPassword = (usr as any).password || 'P@ssword2026!';
                const isPassVisible = visiblePasswords[usr.id] || false;
                const regDate = usr.createdAt ? new Date(usr.createdAt).toLocaleString() : 'Aug 01, 2026 at 08:30:00 AM';

                return (
                  <tr key={usr.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Name & ID */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                          <img
                            src={usr.avatar}
                            alt={usr.name}
                            className="w-full h-full object-cover rounded-lg scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-sm">{usr.name}</div>
                          <div className="text-[10px] text-purple-400 font-mono">{usr.employeeId || 'EMP-1092'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-slate-200 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span>{usr.email}</span>
                        <button
                          onClick={() => copyToClipboard(usr.email, 'Inspector Email')}
                          className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                          title="Copy Email Address"
                        >
                          <Key className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Password */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-cyan-300 font-bold text-xs select-all">
                          {isPassVisible ? usrPassword : '••••••••••••'}
                        </span>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => togglePasswordVisibility(usr.id)}
                              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                              title={isPassVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(usrPassword, 'Inspector Password')}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                              title="Copy Password Credential"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Registration Date & Time */}
                    <td className="p-4 text-slate-300 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{regDate}</span>
                      </div>
                    </td>

                    {/* Facility */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {usr.role}
                        </span>
                        <div className="text-[10px] text-slate-400">{usr.factoryName || 'Factory Alpha'}</div>
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        usr.status === 'Approved' || usr.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        usr.status === 'Pending Approval' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          usr.status === 'Approved' || usr.status === 'Active' ? 'bg-emerald-400 animate-pulse' :
                          usr.status === 'Pending Approval' ? 'bg-amber-400 animate-ping' :
                          'bg-rose-400'
                        }`} />
                        <span>{usr.status}</span>
                      </span>
                    </td>

                    {/* Action Controls: Tick, Wrong, Edit, Delete */}
                    <td className="p-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* 1. Tick Button (Approve / Enable) */}
                          <button
                            onClick={() => handleApproveUser(usr)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold flex items-center space-x-1 cursor-pointer transition-all"
                            title="Tick / Approve Inspector Account"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[11px]">Tick</span>
                          </button>

                          {/* 2. Wrong Button (Reject / Disable) */}
                          <button
                            onClick={() => handleToggleDisableUser(usr)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold border flex items-center space-x-1 cursor-pointer transition-all ${
                              usr.status === 'Disabled' || usr.status === 'Rejected'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                            title={usr.status === 'Disabled' || usr.status === 'Rejected' ? 'Enable Inspector' : 'Wrong / Disable Inspector'}
                          >
                            <X className="h-3.5 w-3.5 text-rose-400" />
                            <span className="text-[11px]">Wrong</span>
                          </button>

                          {/* 3. Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(usr)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 hover:bg-slate-700 font-bold flex items-center space-x-1 cursor-pointer transition-all"
                            title="Edit Inspector Credentials"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-[11px]">Edit</span>
                          </button>

                          {/* 4. Delete Button */}
                          <button
                            onClick={() => handleDeleteUserClick(usr)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 text-rose-200 border border-rose-500/50 hover:bg-rose-600/50 font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                            title="Delete Inspector Account"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-300" />
                            <span className="text-[11px]">Delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-400 text-[10px]">
                          <Lock className="h-3 w-3 text-slate-500" />
                          <span>Admin Control Only</span>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-purple-400" />
                <span>{editingUser ? 'Edit Inspector Credentials' : 'Provision Certified Inspector'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Full Inspector Name:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Inspector David Vance"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. david.vance@factory.ai"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password Credential:</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-cyan-300 focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="e.g. SecurePass#2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Employee ID:</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Role Assignment:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Inspector">Inspector (AI Visual Scans)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Manufacturing Facility:</label>
                <input
                  type="text"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  {editingUser ? 'Save Inspector Changes' : 'Provision Inspector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

