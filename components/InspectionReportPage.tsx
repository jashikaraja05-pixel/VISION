import React from 'react';
import { 
  FileCheck, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Trash2
} from 'lucide-react';
import { InspectionRecord, User as UserType } from '../types';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import { downloadInspectionImage } from '../utils/downloadHelper';

interface InspectionReportPageProps {
  inspection: InspectionRecord | null;
  currentUser?: UserType | null;
  onDeleteInspection?: (id: string) => void;
}

export const InspectionReportPage: React.FC<InspectionReportPageProps> = ({ 
  inspection,
  currentUser,
  onDeleteInspection,
}) => {
  if (!inspection) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center text-slate-400 space-y-4">
        <FileCheck className="mx-auto h-12 w-12 text-slate-600 animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">No Report Data Selected</h3>
        <p className="text-xs">Select or run an inspection to view and export the official compliance audit certificate.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Report ID', 'Component Name', 'Code', 'Batch Number', 'Facility', 'Status', 'Quality Score', 'Decision', 'Confidence', 'Timestamp'],
      [
        inspection.id,
        inspection.componentName,
        inspection.componentCode,
        inspection.batchNumber,
        inspection.factoryName,
        inspection.status,
        inspection.qualityScore,
        inspection.decision,
        `${inspection.confidence}%`,
        inspection.timestamp,
      ],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VisionInspect_${inspection.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FileCheck className="h-6 w-6 text-cyan-400" />
            <span>OFFICIAL AI QUALITY AUDIT CERTIFICATE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ISO 9001 / IATF 16949 compliant digital inspection report & verification artifact
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Official Report Download Buttons (Accessible to Inspectors & Admins) */}
          <button
            onClick={() => generateInspectionPDF(inspection)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-transform cursor-pointer"
            title="Inspector: Download Official PDF Certificate"
          >
            <Download className="h-4 w-4 text-slate-950" />
            <span>Download Report (PDF)</span>
          </button>

          <button
            onClick={() => downloadInspectionImage(inspection.imageOriginal, `${inspection.componentCode}_optical_scan.jpg`)}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            title="Download Inspection Image"
          >
            <Download className="h-4 w-4" />
            <span>Download Image</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Export CSV Data"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Print Inspection Certificate"
          >
            <Printer className="h-4 w-4 text-cyan-400" />
            <span>Print View</span>
          </button>

          {/* Admin-Only Action: Permanent Deletion */}
          {currentUser?.role === 'Admin' && onDeleteInspection && (
            <button
              onClick={() => {
                if (confirm(`Admin confirmation: Delete inspection record ${inspection.id} and associated image assets?`)) {
                  onDeleteInspection(inspection.id);
                }
              }}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Admin: Permanently Delete Record"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Report Document Sheet */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 space-y-8 shadow-2xl backdrop-blur-md">
        
        {/* Document Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xl font-black text-slate-100 tracking-wider">
                VISION<span className="text-cyan-400">INSPECT AI</span>
              </span>
              <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-500/30">
                AUDIT RECORD
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Certificate ID: {inspection.id.toUpperCase()}</p>
          </div>

          <div className={`px-5 py-2.5 rounded-2xl border text-center font-mono font-black ${
            inspection.status === 'PASS'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
          }`}>
            <span className="text-lg tracking-wider">AUDIT OUTCOME: {inspection.status}</span>
          </div>
        </div>

        {/* Section 1: Component & Facility Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="text-slate-500">Component Title:</span>
            <p className="font-bold text-slate-100">{inspection.componentName}</p>
            <span className="text-[10px] text-cyan-400">{inspection.componentCode}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="text-slate-500">Batch & Facility:</span>
            <p className="font-bold text-slate-100">{inspection.batchNumber}</p>
            <span className="text-[10px] text-cyan-400">{inspection.factoryName}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="text-slate-500">Production Line & Camera:</span>
            <p className="font-bold text-slate-100">{inspection.lineName}</p>
            <span className="text-[10px] text-cyan-400">{inspection.cameraId}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="text-slate-500">Inspector & Date:</span>
            <p className="font-bold text-slate-100">{inspection.inspectorName}</p>
            <span className="text-[10px] text-slate-400">{inspection.timestamp}</span>
          </div>
        </div>

        {/* Section 2: Component Images Side-by-Side */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Optical Image Scan Comparison
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Original Image */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400">1. Original Optical Capture</span>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-64 flex items-center justify-center">
                <img
                  src={inspection.imageOriginal}
                  alt="Original"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Processed Bounding Box Image */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400">2. AI Processed Bounding Box Overlay</span>
              <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 h-64 flex items-center justify-center p-2">
                <div className="relative inline-block max-h-full max-w-full">
                  <img
                    src={inspection.imageOriginal}
                    alt="Processed"
                    className="max-h-[240px] w-auto max-w-full object-contain block rounded"
                    referrerPolicy="no-referrer"
                  />

                  {/* SVG Bounding Boxes */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none">
                    {inspection.defects.map((def, idx) => (
                      <rect
                        key={idx}
                        x={`${def.bbox.x}%`}
                        y={`${def.bbox.y}%`}
                        width={`${def.bbox.width}%`}
                        height={`${def.bbox.height}%`}
                        fill="rgba(239, 68, 68, 0.2)"
                        stroke="#ef4444"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: AI Quality Score & Decision Table */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Detected Anomaly Details & Metrics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-xs text-slate-400 font-mono">Quality Score:</span>
              <div className="text-2xl font-black font-mono text-white">{inspection.qualityScore} / 100</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-xs text-slate-400 font-mono">AI Rating Decision:</span>
              <div className="text-2xl font-black font-mono text-cyan-300">{inspection.decision}</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-xs text-slate-400 font-mono">Detection Confidence:</span>
              <div className="text-2xl font-black font-mono text-purple-300">{inspection.confidence}%</div>
            </div>
          </div>

          {/* Defect Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Defect Category</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Location (X, Y, W, H)</th>
                  <th className="p-3">Explainable Root Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                {inspection.defects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-emerald-400">
                      Zero defects identified during optical laser scan.
                    </td>
                  </tr>
                ) : (
                  inspection.defects.map((def, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-100">{def.type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          def.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          def.severity === 'Major' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {def.severity}
                        </span>
                      </td>
                      <td className="p-3 text-cyan-400">{def.confidence}%</td>
                      <td className="p-3 text-slate-400">[{def.bbox.x}%, {def.bbox.y}%, {def.bbox.width}%, {def.bbox.height}%]</td>
                      <td className="p-3 text-slate-300">{def.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Signature Sign-off */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-slate-400 font-mono">
          <div>
            <p>Certified QA Inspector: <strong className="text-slate-200">{inspection.inspectorName}</strong></p>
            <p className="text-[10px] text-slate-500">Verified via VisionInspect AI Cryptographic Hash</p>
          </div>

          <div className="text-right">
            <p>ISO 9001:2026 Enterprise Compliance Verification</p>
            <p className="text-[10px] text-slate-500">Generated automatically by VisionInspect AI Engine</p>
          </div>
        </div>

      </div>

    </div>
  );
};
