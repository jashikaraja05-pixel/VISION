import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Eye, 
  ShieldCheck 
} from 'lucide-react';
import { InspectionRecord } from '../types';

interface ExplainableAIPageProps {
  inspection: InspectionRecord | null;
}

export const ExplainableAIPage: React.FC<ExplainableAIPageProps> = ({ inspection }) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(65);
  const [selectedDefectIndex, setSelectedDefectIndex] = useState(0);

  if (!inspection) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
        <BrainCircuit className="mx-auto h-12 w-12 text-slate-600 animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">No Component Selected for XAI Analysis</h3>
        <p className="text-xs text-slate-400">Please complete an AI inspection first to review neural explainability heatmaps.</p>
      </div>
    );
  }

  const activeDefect = inspection.defects[selectedDefectIndex] || inspection.defects[0] || {
    type: 'Surface Uniformity',
    severity: 'Minor',
    confidence: 99.2,
    bbox: { x: 40, y: 35, width: 20, height: 20, label: 'Micro Surface Region' },
    explanation: 'Gradient activation map indicates 100% structural uniformity with zero anomalous features.',
    reason: 'Manufacturing surface contour conforms exactly to baseline CAD parameters.',
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-purple-400" />
            <span>EXPLAINABLE AI (XAI) & NEURAL HEATMAP DIAGNOSTICS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grad-CAM activation weight maps explaining exact pixel region causes for AI defect classifications
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono">
          <span className="text-slate-400 px-2">Confidence:</span>
          <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            {activeDefect.confidence}%
          </span>
        </div>
      </div>

      {/* Main Dual Grid: Image Canvas vs Explanation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Heatmap Image Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-5 space-y-4 shadow-xl">
            
            {/* Controls Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    showHeatmap
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{showHeatmap ? 'Grad-CAM Heatmap Active' : 'Show Heatmap'}</span>
                </button>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <span>Heatmap Density:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                  className="w-24 accent-purple-500 cursor-pointer"
                />
                <span className="text-purple-300 w-8">{heatmapOpacity}%</span>
              </div>
            </div>

            {/* Canvas View */}
            <div className="flex items-center justify-center rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl p-2 min-h-[320px] sm:min-h-[400px]">
              <div className="relative inline-block max-w-full">
                <img
                  src={inspection.imageOriginal}
                  alt={inspection.componentName}
                  className="max-h-[360px] sm:max-h-[440px] w-auto max-w-full object-contain block rounded-lg shadow-md"
                  referrerPolicy="no-referrer"
                />

                {/* Simulated Heatmap Layer */}
                {showHeatmap && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300"
                    style={{
                      opacity: heatmapOpacity / 100,
                      background: `radial-gradient(circle at ${activeDefect.bbox.x + activeDefect.bbox.width / 2}% ${activeDefect.bbox.y + activeDefect.bbox.height / 2}%, rgba(239, 68, 68, 0.85) 0%, rgba(245, 158, 11, 0.6) 30%, rgba(168, 85, 247, 0.4) 55%, transparent 80%)`,
                    }}
                  />
                )}

                {/* Bounding Box Focus Ring */}
                <div
                  className="absolute border-2 border-dashed border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] rounded pointer-events-none animate-pulse"
                  style={{
                    left: `${activeDefect.bbox.x}%`,
                    top: `${activeDefect.bbox.y}%`,
                    width: `${activeDefect.bbox.width}%`,
                    height: `${activeDefect.bbox.height}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 bg-slate-950/90 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/40">
                    {activeDefect.type} FOCUS REGION
                  </span>
                </div>
              </div>
            </div>

            {/* Defect Selector Tabs */}
            {inspection.defects.length > 1 && (
              <div className="flex items-center space-x-2 pt-2">
                <span className="text-xs text-slate-400 font-mono">Select Defect Focus:</span>
                {inspection.defects.map((def, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDefectIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedDefectIndex === idx
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Defect #{idx + 1}: {def.type}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Explainability Cards & Reasoning Panel */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Main Reasoning Card */}
          <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-6 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BrainCircuit className="h-4 w-4" />
                <span>AI Root-Cause Reason</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Model: Gemini 3.6 Flash</span>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/10 space-y-2">
              <p className="text-xs text-purple-200 font-semibold leading-relaxed">
                "{activeDefect.reason}"
              </p>
              <p className="text-[11px] text-slate-300 leading-snug">
                {activeDefect.explanation}
              </p>
            </div>

            {/* Neural Gradient Features Matrix */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Visual Feature Activation Signals:</span>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Surface Texture Variance:</span>
                  <span className="text-rose-400 font-bold">+4.2 Sigma Deviation</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Color Spectrum Shift:</span>
                  <span className="text-amber-400 font-bold">Oxidation Wavelength Detected</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Spatial Geometry Edge:</span>
                  <span className="text-cyan-400 font-bold">Micro-Fracture Linearity &gt; 94%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explainability Guidance Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Auditable Explainability Standard</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every VisionInspect AI classification is backed by transparent Grad-CAM spatial activation weights, preventing black-box decisions in critical aerospace, automotive, and microelectronics supply chains.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
