import React, { useEffect } from 'react';
import logoImg from '../src/assets/images/regenerated_image_1785947573697.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 cursor-pointer select-none overflow-hidden"
    >
      {/* Metallic & Blue Neon Radial Glow Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/15 blur-[160px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="relative mb-8 group">
          {/* Animated Neon Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 opacity-75 blur-md animate-pulse" />
          
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-slate-950 border border-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={logoImg}
              alt="VisionInspect AI Logo"
              className="w-full h-full object-fill rounded-3xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-slate-100 font-mono">
          VISION<span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">INSPECT</span> AI
        </h1>

        {/* Official Tagline */}
        <p className="mt-3 text-sm sm:text-base font-medium text-slate-300 leading-relaxed max-w-md">
          AI-Powered Smart Visual Inspection and Quality Management System
        </p>

        {/* Loading Spinner Indicator */}
        <div className="mt-8 flex items-center space-x-3 text-xs font-mono text-cyan-400/90 bg-slate-900/90 px-4 py-2 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>INITIALIZING AI INSPECTION ENGINE...</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-[11px] font-mono text-slate-500">
        Enterprise Quality Control Suite v4.2 • Powered by Deep Learning
      </div>
    </div>
  );
};
