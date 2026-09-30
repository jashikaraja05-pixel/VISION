import React from 'react';
import { 
  Scan, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  BrainCircuit, 
  Gauge, 
  BellRing, 
  FileText, 
  Factory, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { ActiveTab } from '../types';

interface LandingPageProps {
  setActiveTab: (tab: ActiveTab) => void;
  onLoginClick: () => void;
  isLoggedIn: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setActiveTab,
  onLoginClick,
  isLoggedIn,
}) => {
  const stats = [
    { label: 'Components Inspected', value: '1,284,920+', change: '+12.4% this week', icon: Layers },
    { label: 'AI Detection Accuracy', value: '99.82%', change: 'ISO 9001 Verified', icon: ShieldCheck },
    { label: 'Defects Detected', value: '14,320', change: 'Zero False Passes', icon: TrendingUp },
    { label: 'Factories Connected', value: '48 Global Sites', change: 'Edge AI Nodes', icon: Factory },
  ];

  const features = [
    {
      title: 'AI Defect Detection',
      desc: 'Instant 8K computer vision scanning detects cracks, scratches, dents, rust, missing parts, and surface damage in sub-millisecond speeds.',
      icon: Scan,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    {
      title: 'Defect Classification & Severity',
      desc: 'Automatic multi-class categorization into Critical, Major, and Minor severities with bounding box spatial pinpointing.',
      icon: Cpu,
      color: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    {
      title: 'Explainable AI (XAI)',
      desc: 'Transparent neural heatmaps (Grad-CAM) and root-cause analysis explaining why defects occurred for continuous quality improvement.',
      icon: BrainCircuit,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    {
      title: 'Smart Quality Score Engine',
      desc: '0 to 100 quality score calculation mapping directly to automated decision logic: Excellent, Acceptable, Rework, or Reject.',
      icon: Gauge,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    {
      title: 'Real-Time Alert Dispatch',
      desc: 'Multi-channel critical anomaly notifications over Dashboard tickers, simulated SMS, and Email to trigger automated line pauses.',
      icon: BellRing,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
    },
    {
      title: 'AI Audit Report Generator',
      desc: 'Export official ISO-compliant PDF certificates, print audit sheets, and export Excel datasets with custom inspector signatures.',
      icon: FileText,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    {
      title: 'Enterprise Factory Management',
      desc: 'Centralized control over global factory locations, production lines, camera frame rates, and inspector role permissions.',
      icon: Factory,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
    },
  ];

  const workflowSteps = [
    { step: '01', title: 'Landing Overview', desc: 'System capabilities & live site monitoring' },
    { step: '02', title: 'Role Authentication', desc: 'Admin, Supervisor, or Inspector credentials' },
    { step: '03', title: 'Main Dashboard', desc: 'KPI metrics, defect trends & camera feeds' },
    { step: '04', title: 'AI Inspection', desc: 'Drag-and-drop or select component samples' },
    { step: '05', title: 'Explainable AI', desc: 'Heatmaps, Grad-CAM focus & defect reasons' },
    { step: '06', title: 'Quality Score Meter', desc: 'Automated Pass / Fail decision calculation' },
    { step: '07', title: 'Real-Time Alerts', desc: 'Multi-channel critical defect dispatch' },
    { step: '08', title: 'PDF Audit Report', desc: 'Generate & export official compliance PDF' },
  ];

  return (
    <div className="space-y-12 pb-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900/90 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 rounded-full bg-cyan-500/10 px-3.5 py-1.5 border border-cyan-500/30 text-xs font-mono text-cyan-300">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
              <span>Next-Gen Computer Vision & Neural Defect Detection</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              VISION<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">INSPECT AI</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
              AI-Powered Smart Visual Inspection and Quality Management System. Automate component defect detection, surface crack analysis, explainable reasoning, and compliance auditing in real time.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    onLoginClick();
                  } else {
                    setActiveTab('inspection');
                  }
                }}
                className="group relative inline-flex items-center justify-center space-x-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)]"
              >
                <Scan className="h-5 w-5 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>Start AI Inspection</span>
                <ChevronRight className="h-4 w-4 text-slate-950" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('dashboard');
                }}
                className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-cyan-500/40 hover:bg-slate-800 transition-all"
              >
                <span>Explore Live Dashboard</span>
                <ArrowRight className="h-4 w-4 text-cyan-400" />
              </button>
            </div>

            {/* Quick feature checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>8K Optical Scanning</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Grad-CAM Explainability</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>PDF Audit Export</span>
              </div>
            </div>
          </div>

          {/* Hero Right Banner Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)] group">
              <img
                src="/factory_hero_banner_1785480263415.jpg"
                alt="Futuristic AI Smart Factory"
                className="w-full h-80 object-cover transform group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              {/* Overlay Badge */}
              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-slate-950/80 p-3 border border-slate-800 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-slate-100">Smart Factory Line #104</p>
                    <p className="text-[10px] text-slate-400">Autonomous Optical Laser Grid</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  99.82% ACCURACY
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Key Metrics Statistics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div
              key={i}
              className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-xl transition-all hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{st.label}</span>
                <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-white font-mono">
                  {st.value}
                </div>
                <div className="mt-1 flex items-center text-[11px] text-cyan-400 font-mono">
                  <span>{st.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Platform Features Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-cyan-400 uppercase tracking-widest">
            <Cpu className="h-4 w-4" />
            <span>ENTERPRISE CAPABILITIES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            End-to-End Industrial Quality Automation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Designed for high-throughput manufacturing lines demanding zero defect escape rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`relative rounded-2xl border ${feat.border} bg-slate-900/80 p-6 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] group`}
              >
                <div className={`mb-4 inline-flex rounded-xl bg-slate-950 p-3 ${feat.color} border border-slate-800 shadow-inner group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100">{feat.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed font-light">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Visualization Section */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">AI Inspection Flow</span>
            <h3 className="text-xl font-bold text-white mt-1">Complete System Workflow</h3>
          </div>
          <button
            onClick={() => setActiveTab('inspection')}
            className="inline-flex items-center space-x-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
          >
            <span>Run Inspection Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((wf, idx) => (
            <div
              key={idx}
              className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-cyan-500/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {wf.step}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">{wf.title}</h4>
              <p className="text-[11px] text-slate-400">{wf.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
