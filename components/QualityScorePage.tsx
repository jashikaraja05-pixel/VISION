import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Award, 
  UserCheck 
} from 'lucide-react';
import { InspectionRecord, User } from '../types';

interface QualityScorePageProps {
  inspection: InspectionRecord | null;
  currentUser?: User | null;
  inspections?: InspectionRecord[];
}

export const QualityScorePage: React.FC<QualityScorePageProps> = ({ 
  inspection, 
  currentUser, 
  inspections: propInspections 
}) => {
  const [allInspections, setAllInspections] = useState<InspectionRecord[]>(propInspections || []);
  const [inspectorsList, setInspectorsList] = useState<User[]>([]);

  useEffect(() => {
    if (propInspections) {
      setAllInspections(propInspections);
    }
  }, [propInspections]);

  useEffect(() => {
    // Fetch live database for total facility score and per-inspector calculations
    const fetchLiveScores = async () => {
      try {
        const facQuery = currentUser?.factoryName ? `?factoryName=${encodeURIComponent(currentUser.factoryName)}` : '';
        const [inspRes, userRes] = await Promise.all([
          fetch(`/api/inspections${facQuery}`).catch(() => null),
          fetch('/api/users').catch(() => null),
        ]);

        if (inspRes && inspRes.ok) {
          const data = await inspRes.json();
          if (data && Array.isArray(data.inspections)) setAllInspections(data.inspections);
        }
        if (userRes && userRes.ok) {
          const data = await userRes.json();
          if (data && Array.isArray(data.users)) setInspectorsList(data.users);
        }
      } catch (e) {
        console.warn('Error fetching quality score metrics:', e);
      }
    };

    fetchLiveScores();
    const timer = setInterval(fetchLiveScores, 3000);
    return () => clearInterval(timer);
  }, [currentUser?.factoryName]);

  // Helper to reject unwanted mock names (Elena Rostova, Marcus Holloway, Dr. Sarah Vance)
  const isMockName = (name?: string) => {
    const s = (name || '').toLowerCase();
    return (
      s.includes('elena') ||
      s.includes('rostova') ||
      s.includes('marcus') ||
      s.includes('holloway') ||
      s.includes('sarah vance') ||
      s.includes('dr. sarah')
    );
  };

  // Only consider real inspections, purge mock seed data
  const realInspections = allInspections.filter(i => !isMockName(i.inspectorName) && !i.id?.startsWith('insp-seed-'));

  // If logged in as Inspector, restrict view strictly to the logged-in inspector's ID & audits
  const isInspector = currentUser?.role === 'Inspector';
  const displayInspections = isInspector
    ? realInspections.filter(
        i => (i.inspectorId && i.inspectorId === currentUser?.id) ||
             (i.inspectorName && i.inspectorName.toLowerCase() === (currentUser?.name || '').toLowerCase())
      )
    : realInspections;

  // Compute Facility / Inspector Quality Score
  const totalAudits = displayInspections.length;
  const totalScoreSum = displayInspections.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0);
  const totalAverageScore = totalAudits > 0 ? (totalScoreSum / totalAudits).toFixed(1) : '100.0';
  const totalPassed = displayInspections.filter(i => i.status === 'PASS').length;
  const totalPassRate = totalAudits > 0 ? ((totalPassed / totalAudits) * 100).toFixed(1) : '100.0';

  // Compute Per-Inspector Quality Scores
  let inspectorScores: Array<{
    name: string;
    email: string;
    id: string;
    scans: number;
    passed: number;
    failed: number;
    totalScore: number;
    avgScore: number;
    passRate: number;
  }> = [];

  if (isInspector && currentUser) {
    // STRICT REQUIREMENT: Only the logged-in inspector profile is shown, no unwanted mock data
    const myInspections = displayInspections;
    const scans = myInspections.length;
    const passed = myInspections.filter(i => i.status === 'PASS').length;
    const failed = myInspections.filter(i => i.status === 'FAIL').length;
    const totalScore = myInspections.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0);
    const avgScore = scans > 0 ? Math.round(totalScore / scans) : 100;
    const passRate = scans > 0 ? Math.round((passed / scans) * 100) : 100;

    inspectorScores = [
      {
        name: currentUser.name || 'Inspector',
        email: currentUser.email || '',
        id: currentUser.employeeId || currentUser.id || 'EMP-202',
        scans,
        passed,
        failed,
        totalScore,
        avgScore,
        passRate,
      },
    ];
  } else {
    // Admin View: Only real registered inspectors belonging to current facility, completely free of mock personas
    const inspectorMap: Record<string, { name: string; email: string; id: string; scans: number; passed: number; failed: number; totalScore: number }> = {};
    const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const userFac = cleanStr(currentUser?.factoryName);

    inspectorsList
      .filter(u => u.role === 'Inspector' && !isMockName(u.name) && !isMockName(u.email))
      .filter(u => {
        if (!userFac) return true;
        const uf = cleanStr(u.factoryName);
        return !uf || uf === userFac || (userFac.length >= 3 && uf.includes(userFac)) || (uf.length >= 3 && userFac.includes(uf));
      })
      .forEach(insp => {
        inspectorMap[insp.name] = {
          name: insp.name,
          email: insp.email,
          id: insp.employeeId || insp.id || 'EMP-1001',
          scans: 0,
          passed: 0,
          failed: 0,
          totalScore: 0,
        };
      });

    realInspections.forEach(insp => {
      const name = insp.inspectorName;
      if (!name || isMockName(name)) return;
      if (!inspectorMap[name]) {
        inspectorMap[name] = {
          name,
          email: '',
          id: insp.inspectorId || 'EMP-1001',
          scans: 0,
          passed: 0,
          failed: 0,
          totalScore: 0,
        };
      }
      inspectorMap[name].scans += 1;
      inspectorMap[name].totalScore += (insp.qualityScore || 0);
      if (insp.status === 'PASS') inspectorMap[name].passed += 1;
      else inspectorMap[name].failed += 1;
    });

    inspectorScores = Object.values(inspectorMap).map(insp => {
      const avg = insp.scans > 0 ? Math.round(insp.totalScore / insp.scans) : 100;
      const rate = insp.scans > 0 ? Math.round((insp.passed / insp.scans) * 100) : 100;
      return { ...insp, avgScore: avg, passRate: rate };
    });
  }

  // Selected item score details
  const currentRecord = inspection || (displayInspections.length > 0 ? displayInspections[0] : null);
  const score = currentRecord ? currentRecord.qualityScore : 100;
  const decision = currentRecord ? currentRecord.decision : 'Excellent';
  const status = currentRecord ? currentRecord.status : 'PASS';
  const currentInspectorName = currentRecord ? (currentRecord.inspectorName || currentUser?.name || 'Certified Inspector') : (currentUser?.name || 'Chief Inspector');

  const defects = currentRecord?.defects || [];
  const criticalCount = defects.filter(d => d.severity === 'Critical').length;
  const majorCount = defects.filter(d => d.severity === 'Major').length;
  const minorCount = defects.filter(d => d.severity === 'Minor').length;

  // Determine score color theme
  let scoreColor = '#10b981'; // emerald
  let scoreText = 'text-emerald-400';
  let badgeBorder = 'border-emerald-500/40 bg-emerald-500/10';

  if (score < 50) {
    scoreColor = '#ef4444';
    scoreText = 'text-rose-400';
    badgeBorder = 'border-rose-500/40 bg-rose-500/10';
  } else if (score < 75) {
    scoreColor = '#f59e0b';
    scoreText = 'text-amber-400';
    badgeBorder = 'border-amber-500/40 bg-amber-500/10';
  } else if (score < 90) {
    scoreColor = '#06b6d4';
    scoreText = 'text-cyan-400';
    badgeBorder = 'border-cyan-500/40 bg-cyan-500/10';
  }

  // Calculate SVG Circle Stroke Offset
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const decisionRanges = [
    { range: '90 - 100', label: 'Excellent', status: 'PASS', color: 'text-emerald-400', desc: 'Zero defects. Perfect CAD dimensional alignment.' },
    { range: '75 - 89', label: 'Acceptable', status: 'PASS', color: 'text-cyan-400', desc: 'Minor superficial scuffs within manufacturing tolerance.' },
    { range: '50 - 74', label: 'Rework Required', status: 'FAIL', color: 'text-amber-400', desc: 'Major defects present. Requires manual operator rework.' },
    { range: '0 - 49', label: 'Reject', status: 'FAIL', color: 'text-rose-400', desc: 'Critical structural fracture or missing essential component.' },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Gauge className="h-6 w-6 text-cyan-400" />
          <span>QUALITY SCORE MONITOR & INSPECTOR PERFORMANCE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Displays Total System Quality Score, Individual Inspector Scores, and Selected Component Audits
        </p>
      </div>

      {/* TOP COMPARISON: TOTAL SCORE VS INSPECTOR SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        
        {/* TOTAL SYSTEM QUALITY SCORE */}
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-6 space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Award className="h-4 w-4" />
              <span>TOTAL SYSTEM QUALITY SCORE</span>
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
              Facility Average
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-5xl font-black text-white">{totalAverageScore}</span>
            <span className="text-sm text-slate-400">/ 100 Total Quality Index</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800">
            <div>
              <span className="text-slate-400">Total Facility Audits:</span>
              <div className="text-slate-100 font-bold">{totalAudits} Components</div>
            </div>
            <div>
              <span className="text-slate-400">Overall Pass Rate:</span>
              <div className="text-emerald-400 font-bold">{totalPassRate}%</div>
            </div>
          </div>
        </div>

        {/* SELECTED / ACTIVE INSPECTOR QUALITY SCORE */}
        <div className="rounded-2xl border border-purple-500/40 bg-slate-900/90 p-6 space-y-4 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
              <UserCheck className="h-4 w-4" />
              <span>INSPECTOR'S SCORE ({currentInspectorName})</span>
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
              Inspector Score
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-5xl font-black text-purple-300">
              {score}
            </span>
            <span className="text-sm text-slate-400">/ 100 Current Audit Score</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800">
            <div>
              <span className="text-slate-400">Component Tested:</span>
              <div className="text-slate-100 font-bold truncate">
                {currentRecord?.componentName || 'Precision Spur Gear'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Inspector Decision:</span>
              <div className={`font-bold ${status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {decision} ({status})
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* INDIVIDUAL INSPECTOR QUALITY SCORES & RANKINGS TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              INDIVIDUAL INSPECTOR QUALITY SCORES & AUDIT VOLUMES
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {isInspector
              ? `Logged-In Inspector: ${currentUser?.name} (ID: ${currentUser?.employeeId || currentUser?.id})`
              : `${inspectorScores.length} Certified Inspector Profiles`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Inspector Name & ID</th>
                <th className="p-3">Quality Score Average</th>
                <th className="p-3">Audits Completed</th>
                <th className="p-3">Passed Units</th>
                <th className="p-3">Failed Units</th>
                <th className="p-3">Pass Rate</th>
                <th className="p-3 text-right">Performance Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {inspectorScores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-mono text-xs">
                    No certified inspectors registered yet for this company.
                  </td>
                </tr>
              ) : (
                inspectorScores.map((insp, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-100 flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                      {insp.name.charAt(0)}
                    </div>
                    <div>
                      <div>{insp.name}</div>
                      <div className="text-[10px] text-slate-400">{insp.id}</div>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-cyan-300 text-sm">
                    {insp.avgScore} / 100
                  </td>
                  <td className="p-3 text-slate-300">{insp.scans} units</td>
                  <td className="p-3 text-emerald-400 font-bold">{insp.passed}</td>
                  <td className="p-3 text-rose-400 font-bold">{insp.failed}</td>
                  <td className="p-3 text-slate-200">{insp.passRate}%</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      insp.avgScore >= 90
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {insp.avgScore >= 95 ? 'GRADE A+' : insp.avgScore >= 90 ? 'GRADE A' : 'GRADE B+'}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTED COMPONENT QUALITY GAUGE & DEFECTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Large Circular Gauge Card */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 space-y-6 shadow-2xl text-center">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            SELECTED COMPONENT SCORE GAUGE
          </span>

          {/* SVG Circular Meter */}
          <div className="relative mx-auto h-56 w-56 flex items-center justify-center">
            <svg className="h-full w-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r={radius}
                stroke="#1e293b"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r={radius}
                stroke={scoreColor}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
              <span className={`text-4xl font-black font-mono tracking-tight ${scoreText}`}>
                {score}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">out of 100</span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border mt-0.5 ${badgeBorder} ${scoreText}`}>
                {decision.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <div className={`inline-flex items-center space-x-2 rounded-xl px-4 py-2 border text-xs font-bold font-mono ${badgeBorder}`}>
              {status === 'PASS' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span>AUDIT VERDICT: {status}</span>
            </div>
          </div>
        </div>

        {/* Defect Breakdown Matrix */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
              Defect Severity Impact Breakdown
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-center space-y-1">
                <span className="text-[10px] font-mono text-rose-300 uppercase font-semibold">Critical Defects</span>
                <div className="text-2xl font-black font-mono text-rose-400">{criticalCount}</div>
                <span className="text-[9px] text-slate-400">-50 pts impact</span>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center space-y-1">
                <span className="text-[10px] font-mono text-amber-300 uppercase font-semibold">Major Defects</span>
                <div className="text-2xl font-black font-mono text-amber-400">{majorCount}</div>
                <span className="text-[9px] text-slate-400">-25 pts impact</span>
              </div>

              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-center space-y-1">
                <span className="text-[10px] font-mono text-cyan-300 uppercase font-semibold">Minor Defects</span>
                <div className="text-2xl font-black font-mono text-cyan-400">{minorCount}</div>
                <span className="text-[9px] text-slate-400">-10 pts impact</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-3 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
              Decision Threshold Rules
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              {decisionRanges.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-cyan-300">{item.range}:</span>
                  <span className={`font-semibold ${item.color}`}>{item.label}</span>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
