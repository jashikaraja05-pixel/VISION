import React from 'react';
import { ShieldCheck, Scan, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';
import logoImg from '../src/assets/images/regenerated_image_1785947573697.png';

interface RoleSelectionPageProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Background Decorator Grids & Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl z-10 text-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.4)] mb-4 overflow-hidden shrink-0">
            <img
              src={logoImg}
              alt="VisionInspect AI Logo"
              className="w-full h-full object-fill rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-wider font-mono">
            VISION<span className="text-cyan-400">INSPECT</span> AI
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg">
            AI-Powered Smart Visual Inspection & Quality Management System
          </p>
          <div className="mt-4 inline-flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-cyan-300 font-mono">
            <span>Select Operational Role to Proceed</span>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          
          {/* Admin Role Card */}
          <div
            onClick={() => onSelectRole('Admin')}
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  ADMINISTRATOR
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                Admin Portal
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Executive management, inspector approval workflow, comprehensive quality compliance reports, factory settings, and real-time defect analytics.
              </p>

              <div className="mt-6 space-y-2">
                <div className="flex items-center text-xs text-slate-300 space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Inspector Approval & User Control</span>
                </div>
                <div className="flex items-center text-xs text-slate-300 space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Executive Quality Reports & Analytics</span>
                </div>
                <div className="flex items-center text-xs text-slate-300 space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Factory & Line Configuration</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('Admin');
              }}
              className="mt-8 w-full py-3 px-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 group-hover:border-purple-400"
            >
              <span>Login as Administrator</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Inspector Role Card */}
          <div
            onClick={() => onSelectRole('Inspector')}
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Scan className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  INSPECTOR
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                Inspector Workspace
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Perform AI visual scanning, view explainable AI heatmaps, compute smart quality scores, issue real-time defect alerts, and record scan history.
              </p>

              <div className="mt-6 space-y-2">
                <div className="flex items-center text-xs text-slate-300 space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>AI Defect Scanning & Image Upload</span>
                </div>
                <div className="flex items-center text-xs text-slate-300 space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Explainable AI Heatmap & Quality Score</span>
                </div>
                <div className="flex items-center text-xs text-slate-300 space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Real-time Anomaly Alert Notifications</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('Inspector');
              }}
              className="mt-8 w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <span>Login / Register as Inspector</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Security Notice Footer */}
        <div className="mt-8 text-xs text-slate-500 font-mono">
          Only approved inspectors can access the Inspector Workspace.
        </div>

      </div>
    </div>
  );
};
