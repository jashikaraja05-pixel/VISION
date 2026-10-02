import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  UserCheck, 
  UserX, 
  Eye, 
  EyeOff,
  Check,
  Building2, 
  Cpu, 
  Activity, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { User, InspectionRecord } from '../types';

interface AdminDashboardProps {
  currentUser?: User | null;
  onSelectInspection?: (inspection: InspectionRecord) => void;
  onNavigateToUsers?: () => void;
  onDeleteInspection?: (id: string) => void;
  onUpdateUser?: (updatedUser: User) => void;
  inspections?: InspectionRecord[];
  users?: User[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, 
  onSelectInspection,
  onNavigateToUsers,
  onDeleteInspection,
  onUpdateUser,
  inspections: propInspections,
  users: propUsers
}) => {
  // Real Database States
  const [users, setUsers] = useState<User[]>(propUsers || []);
  const [inspections, setInspections] = useState<InspectionRecord[]>(propInspections || []);
  const [loading, setLoading] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Sync with props if provided
  useEffect(() => {
    if (propInspections !== undefined) {
      setInspections(propInspections);
    }
  }, [propInspections]);

  useEffect(() => {
    if (propUsers !== undefined) {
      setUsers(propUsers);
    }
  }, [propUsers]);

  // Fetch real data from backend database API (fetches all records for Admin overview)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, inspRes] = await Promise.all([
        fetch('/api/users').catch(() => null),
        fetch('/api/inspections?all=true').catch(() => null),
      ]);

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json().catch(() => ({}));
        if (usersData && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        }
      }
      if (inspRes && inspRes.ok) {
        const inspData = await inspRes.json().catch(() => ({}));
        if (inspData && Array.isArray(inspData.inspections)) {
          setInspections(inspData.inspections);
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Continuous polling every 2.5s for real-time live dashboard sync
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteInspection = async (id: string) => {
    try {
      setInspections(prev => prev.filter(i => i.id !== id));
      onDeleteInspection?.(id);
      await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      fetchData();
    } catch {
      setInspections(prev => prev.filter(i => i.id !== id));
      onDeleteInspection?.(id);
    }
  };

  const handleApproveInspector = async (inspectorUser: User) => {
    try {
      setApprovalNotice(`Approving account for ${inspectorUser.name}...`);
      const res = await fetch(`/api/users/${inspectorUser.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', adminCompany: currentUser?.factoryName }),
      });
      if (res.ok) {
        const approvedUser = { ...inspectorUser, status: 'Approved' as const };
        setUsers(prev => prev.map(u => u.id === inspectorUser.id ? approvedUser : u));
        onUpdateUser?.(approvedUser);
        setApprovalNotice(`✅ Inspector ${inspectorUser.name} (${inspectorUser.email}) approved! They can now sign in with their password.`);
        setTimeout(() => setApprovalNotice(null), 6000);
        fetchData();
      } else {
        const d = await res.json().catch(() => ({}));
        setApprovalNotice(`❌ Approval failed: ${d.error || 'Server error'}`);
      }
    } catch {
      setApprovalNotice(`❌ Network error approving inspector.`);
    }
  };

  const handleRejectInspector = async (inspectorUser: User) => {
    try {
      const res = await fetch(`/api/users/${inspectorUser.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected', adminCompany: currentUser?.factoryName }),
      });
      if (res.ok) {
        const rejectedUser = { ...inspectorUser, status: 'Rejected' as const };
        setUsers(prev => prev.map(u => u.id === inspectorUser.id ? rejectedUser : u));
        onUpdateUser?.(rejectedUser);
        setApprovalNotice(`Inspector ${inspectorUser.name} rejected.`);
        setTimeout(() => setApprovalNotice(null), 4000);
        fetchData();
      }
    } catch {}
  };

  // Helper string cleaner: trimmed lowercase with normalized spaces for strict exact matching
  const cleanStr = (s?: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

  // Extract all distinct facilities across inspections, users, and currentUser
  const availableFacilities = useMemo(() => {
    const map = new Map<string, number>();
    inspections.forEach(i => {
      const name = (i.factoryName || i.factoryId || 'Plant').trim();
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    // Also include admin company if specified
    if (currentUser?.factoryName && !map.has(currentUser.factoryName)) {
      map.set(currentUser.factoryName.trim(), 0);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [inspections, currentUser?.factoryName]);

  // Company / Facility specific filtering: 'ALL' displays all plants without filtering out records
  const companyInspections = useMemo(() => {
    if (selectedFacility === 'ALL') {
      return inspections;
    }
    const cleanTarget = cleanStr(selectedFacility);
    return inspections.filter(i => cleanStr(i.factoryId || i.factoryName) === cleanTarget);
  }, [inspections, selectedFacility]);

  const inspectorsList = useMemo(() => {
    const list = users.filter(u => u.role === 'Inspector');
    if (selectedFacility === 'ALL') {
      return list;
    }
    const cleanTarget = cleanStr(selectedFacility);
    return list.filter(u => cleanStr(u.factoryName) === cleanTarget);
  }, [users, selectedFacility]);

  // Pending Inspector Registrations awaiting Admin Approval
  const pendingInspectors = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'Inspector' || u.status !== 'Pending Approval') return false;
      if (!currentUser?.factoryName) return true;
      const cleanAdminComp = cleanStr(currentUser.factoryName).replace(/[^a-z0-9]/g, '');
      const cleanUserComp = cleanStr(u.factoryName).replace(/[^a-z0-9]/g, '');
      return cleanAdminComp === cleanUserComp;
    });
  }, [users, currentUser?.factoryName]);

  // Reliable helper to evaluate pass vs fail across any record formatting
  const isFailedRecord = (i: InspectionRecord) => {
    const s = (i.status || '').toString().trim().toUpperCase();
    const d = (i.decision || '').toString().trim().toUpperCase();
    if (s === 'FAIL' || s === 'FAILED' || s === 'DEFECT' || s === 'DEFECTIVE' || s === 'REJECT' || s === 'REJECTED') return true;
    if (d === 'REJECT' || d === 'DEFECT' || d === 'FAIL') return true;
    if (Array.isArray(i.defects) && i.defects.length > 0) return true;
    if (typeof i.qualityScore === 'number' && i.qualityScore < 70) return true;
    return false;
  };

  const isPassedRecord = (i: InspectionRecord) => {
    const s = (i.status || '').toString().trim().toUpperCase();
    const d = (i.decision || '').toString().trim().toUpperCase();
    if (s === 'PASS' || s === 'PASSED' || s === 'GOOD' || s === 'OPTIMAL') return true;
    if (d === 'ACCEPT' || d === 'PASS' || d === 'APPROVE') return true;
    return !isFailedRecord(i);
  };

  // Key KPI Calculations directly from real database records
  const totalScanned = companyInspections.length;
  const passedProducts = companyInspections.filter(isPassedRecord).length;
  const failedProducts = companyInspections.filter(isFailedRecord).length;
  const defectPercentage = totalScanned > 0 ? ((failedProducts / totalScanned) * 100).toFixed(1) : '0.0';
  const passRatePercentage = totalScanned > 0 ? ((passedProducts / totalScanned) * 100).toFixed(1) : '0.0';

  // Inspector Workforce KPI Calculations
  const activeInspectors = inspectorsList.filter(u => u.status === 'Active' || u.status === 'Approved' || u.status === 'On Shift').length;
  const pendingRequests = inspectorsList.filter(u => u.status === 'Pending Approval').length;
  const approvedInspectors = inspectorsList.filter(u => u.status === 'Approved' || u.status === 'Active' || u.status === 'On Shift').length;
  const disabledInspectors = inspectorsList.filter(u => u.status === 'Disabled' || u.status === 'Rejected').length;

  // Recharts Analytics Datasets calculated dynamically from DB
  const passFailPieData = [
    { name: 'Passed', value: passedProducts, color: '#10b981' },
    { name: 'Failed', value: failedProducts, color: '#f43f5e' },
  ];

  // Daily Scans Grouping
  const dailyMap: { [date: string]: { pass: number; fail: number; total: number } } = {};
  companyInspections.forEach(i => {
    const rawDate = i.timestamp ? i.timestamp.split(',')[0].trim() : 'Recent';
    if (!dailyMap[rawDate]) dailyMap[rawDate] = { pass: 0, fail: 0, total: 0 };
    dailyMap[rawDate].total += 1;
    if (isPassedRecord(i)) dailyMap[rawDate].pass += 1;
    else dailyMap[rawDate].fail += 1;
  });

  const dailyChartData = Object.keys(dailyMap).map(date => ({
    date,
    Pass: dailyMap[date].pass,
    Fail: dailyMap[date].fail,
    Total: dailyMap[date].total,
  }));

  // Defect Category Counts dynamically aggregated from DB inspections (both defects array and defectType)
  const defectCounts: { [defect: string]: number } = {};
  companyInspections.forEach(i => {
    if (isFailedRecord(i)) {
      if (Array.isArray(i.defects) && i.defects.length > 0) {
        i.defects.forEach(d => {
          const type = d.type || 'Surface Anomaly';
          defectCounts[type] = (defectCounts[type] || 0) + 1;
        });
      } else if (i.defectType) {
        defectCounts[i.defectType] = (defectCounts[i.defectType] || 0) + 1;
      } else {
        defectCounts['Quality Defect Flagged'] = (defectCounts['Quality Defect Flagged'] || 0) + 1;
      }
    }
  });

  const defectTrendData = Object.keys(defectCounts).map(defect => ({
    defect,
    count: defectCounts[defect],
  }));

  // Inspector Performance Metrics calculated from DB inspections
  const inspectorPerfMap: { [name: string]: { total: number; pass: number; fail: number } } = {};
  companyInspections.forEach(i => {
    const name = i.inspectorName || 'Inspector';
    if (!inspectorPerfMap[name]) inspectorPerfMap[name] = { total: 0, pass: 0, fail: 0 };
    inspectorPerfMap[name].total += 1;
    if (isPassedRecord(i)) inspectorPerfMap[name].pass += 1;
    else inspectorPerfMap[name].fail += 1;
  });

  const inspectorPerfData = Object.keys(inspectorPerfMap).map(name => ({
    name,
    TotalScans: inspectorPerfMap[name].total,
    Passed: inspectorPerfMap[name].pass,
    Failed: inspectorPerfMap[name].fail,
  }));

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Header with Facility Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  ADMIN EXECUTIVE DASHBOARD
                </h1>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LIVE SYNC</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive High-Level Operational Overview & Real-Time Production Line Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Plant Selector & Refresh Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Facility / Plant Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-mono">Plant:</span>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-white outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                🌐 All Plants ({inspections.length} scans)
              </option>
              {availableFacilities.map((fac) => (
                <option key={fac.name} value={fac.name} className="bg-slate-900 text-white">
                  🏢 {fac.name} ({fac.count} scans)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-md cursor-pointer"
            title="Force refresh database"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Facility Filter Banner Notice if viewing a specific plant */}
      {selectedFacility !== 'ALL' && (
        <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-500/30 rounded-2xl px-4 py-2.5 text-xs">
          <div className="flex items-center space-x-2 text-cyan-300">
            <Layers className="h-4 w-4" />
            <span>Filtered to Facility: <strong>{selectedFacility}</strong> ({companyInspections.length} scans)</span>
          </div>
          <button 
            onClick={() => setSelectedFacility('ALL')}
            className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-mono cursor-pointer"
          >
            Reset to All Plants
          </button>
        </div>
      )}

      {/* Dashboard Overview Main Content */}
      <div className="space-y-8">

        {/* Real-time Status Notice */}
        {approvalNotice && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-200 flex items-center justify-between shadow-lg">
            <span>{approvalNotice}</span>
            <button onClick={() => setApprovalNotice(null)} className="text-slate-400 hover:text-white ml-2 text-xs">✕</button>
          </div>
        )}

        {/* PENDING INSPECTOR APPROVAL REQUESTS (Executive Live Queue) */}
        {pendingInspectors.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-5 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
              <div className="flex items-center space-x-2 text-amber-300">
                <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
                <h2 className="text-sm font-black font-mono tracking-wider uppercase">
                  Pending Inspector Approval Requests ({pendingInspectors.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-amber-300/80">
                Company: <strong>{currentUser?.factoryName || 'All Plants'}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-amber-300 border-b border-amber-500/20 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Inspector</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Password</th>
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Company Registered</th>
                    <th className="p-3">Requested At</th>
                    <th className="p-3 text-right">Approval Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/20 bg-slate-900/60">
                  {pendingInspectors.map((insp) => (
                    <tr key={insp.id} className="hover:bg-amber-500/10 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-800 border border-amber-400/40 shrink-0">
                          {insp.avatar ? (
                            <img src={insp.avatar} alt={insp.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-bold text-amber-300">
                              {insp.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span>{insp.name}</span>
                      </td>
                      <td className="p-3 text-slate-300">{insp.email}</td>
                      <td className="p-3 text-cyan-300 font-mono">
                        <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 w-fit">
                          <span className="font-bold select-all">
                            {revealedPasswords[insp.id] ? (insp.password || '••••••••') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPasswords(prev => ({ ...prev, [insp.id]: !prev[insp.id] }))}
                            className="text-slate-400 hover:text-white p-0.5 ml-1 transition-colors"
                            title={revealedPasswords[insp.id] ? "Hide password" : "Show password"}
                          >
                            {revealedPasswords[insp.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-amber-400 font-bold">{insp.employeeId || 'EMP-NEW'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-bold">
                          {insp.factoryName || currentUser?.factoryName || 'Company'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {insp.createdAt ? new Date(insp.createdAt).toLocaleDateString() : 'Just now'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveInspector(insp)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer inline-flex items-center space-x-1.5"
                          title="Approve access (Tick)"
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Approve (Tick)</span>
                        </button>
                        <button
                          onClick={() => handleRejectInspector(insp)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono text-xs transition-all active:scale-95 cursor-pointer inline-flex items-center space-x-1"
                          title="Reject request"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Key Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Products Scanned */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Total Products Scanned</span>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white">{totalScanned}</div>
            <p className="text-[11px] text-slate-500 font-mono">Real-time database volume</p>
          </div>

          {/* Total Passed Products */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Total Passed Products</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">{passedProducts}</div>
            <p className="text-[11px] text-slate-500 font-mono">
              {passRatePercentage}% Overall Pass Rate
            </p>
          </div>

          {/* Total Failed Products */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Total Failed Products</span>
              <XCircle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black font-mono text-rose-400">{failedProducts}</div>
            <p className="text-[11px] text-slate-500 font-mono">Quality anomalies flagged</p>
          </div>

          {/* Defect Percentage */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Defect Rate</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-amber-400">{defectPercentage}%</div>
            <p className="text-[11px] text-slate-500 font-mono">Dynamic failure tolerance</p>
          </div>

        </div>

        {/* Inspector Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Active Inspectors</span>
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">{activeInspectors}</div>
            <p className="text-[11px] text-slate-500 font-mono">Certified plant staff</p>
          </div>

          <div 
            onClick={onNavigateToUsers}
            className={`rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-md ${onNavigateToUsers ? 'cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/60 transition-all' : ''}`}
            title={onNavigateToUsers ? "Click to view and approve inspector accounts" : undefined}
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Pending Approvals</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400">{pendingRequests}</div>
            <p className="text-[11px] text-slate-500 font-mono">
              {pendingRequests > 0 ? 'Click to review & approve' : 'Awaiting verification'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Approved Directory</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">{approvedInspectors}</div>
            <p className="text-[11px] text-slate-500 font-mono">Authorized accounts</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Disabled / Inactive</span>
              <UserX className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-400">{disabledInspectors}</div>
            <p className="text-[11px] text-slate-500 font-mono">Revoked or rejected</p>
          </div>

        </div>

        {/* Executive Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Inspection Volume Trend */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Inspection Activity (Pass vs Fail)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{dailyChartData.length} active dates</span>
            </div>
            {dailyChartData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-slate-500 text-xs font-mono">
                No inspection volume captured in database yet.
              </div>
            ) : (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="Pass" fill="#10b981" radius={[4, 4, 0, 0]} name="Passed" />
                    <Bar dataKey="Fail" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pass vs Fail Ratio */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <PieChartIcon className="h-4 w-4" />
                <span>Overall Quality Pass vs Fail Ratio</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{passRatePercentage}% Quality Score</span>
            </div>
            {totalScanned === 0 ? (
              <div className="h-60 flex items-center justify-center text-slate-500 text-xs font-mono">
                No scan records available to calculate ratio.
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFailPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {passFailPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Defect Trend Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Top Defect Categories Breakdown</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{failedProducts} total defects</span>
            </div>
            {defectTrendData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-500 text-xs font-mono">
                No defect anomalies recorded in database.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectTrendData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="defect" type="category" stroke="#64748b" fontSize={10} width={130} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Defect Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Inspector Performance Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Inspector Volume & Pass Performance</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{inspectorPerfData.length} active staff</span>
            </div>
            {inspectorPerfData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-500 text-xs font-mono">
                No inspector scan activity logged in database yet.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inspectorPerfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="TotalScans" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Scans" />
                    <Bar dataKey="Passed" fill="#10b981" radius={[4, 4, 0, 0]} name="Passed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Recent Scans Real-time Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Recent Database Inspections</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">{companyInspections.length} total records</span>
          </div>

          {companyInspections.length === 0 ? (
            <div className="p-8 text-center border border-slate-800/80 rounded-xl bg-slate-950/60 text-slate-400 text-xs space-y-2 font-mono">
              <p className="font-semibold text-slate-300">Database is ready</p>
              <p>No real AI inspections logged yet for this filter. Complete an inspection on the Inspector workflow to view real-time metrics.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Component</th>
                    <th className="p-3">Facility</th>
                    <th className="p-3">Inspector</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {companyInspections.slice(0, 10).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-cyan-400">{rec.id}</td>
                      <td className="p-3 text-slate-200 font-medium">{rec.componentName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                          {rec.factoryName || 'Plant'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{rec.inspectorName}</td>
                      <td className="p-3 font-bold text-slate-100">{rec.qualityScore}/100</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{rec.timestamp}</td>
                      <td className="p-3 text-right space-x-1">
                        {onSelectInspection && (
                          <button
                            onClick={() => onSelectInspection(rec)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors inline-block cursor-pointer"
                            title="View Full Report in Inspection Workflow"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInspection(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors inline-block cursor-pointer"
                          title="Delete inspection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

