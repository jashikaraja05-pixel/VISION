import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Trash2, 
  Activity, 
  FileSpreadsheet
} from 'lucide-react';
import { InspectionRecord, ActiveTab, User } from '../types';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import { downloadInspectionImage, downloadRecordsCSV } from '../utils/downloadHelper';

interface HistoryPageProps {
  inspections: InspectionRecord[];
  onSelectInspection: (record: InspectionRecord) => void;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser?: User | null;
  onDeleteInspection?: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  inspections,
  onSelectInspection,
  setActiveTab,
  currentUser,
  onDeleteInspection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInspections = inspections.filter((insp) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (insp.componentName || '').toLowerCase().includes(term) ||
      (insp.componentCode || '').toLowerCase().includes(term) ||
      (insp.batchNumber || '').toLowerCase().includes(term) ||
      (insp.inspectorName || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || insp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const optimalCount = inspections.filter(i => i.status === 'PASS').length;
  const criticalCount = inspections.filter(i => i.status === 'FAIL').length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <History className="h-6 w-6 text-cyan-400" />
            <span>INSPECTION HISTORY & WORKING CONDITION DATABASE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete auditable repository of all historical visual scans, working conditions, and quality decisions
          </p>
        </div>

        {/* Quick CSV Export Actions (Admin Only) */}
        {currentUser?.role === 'Admin' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => downloadRecordsCSV(inspections, 'All')}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold font-mono transition-all flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export History (CSV)</span>
            </button>
          </div>
        )}
      </div>

      {/* Working Condition Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Working Condition</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active In-Spec Production</span>
          </div>
          <p className="text-[10px] text-slate-500">Optical sensors calibrated</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Optimal Condition Units</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {optimalCount} <span className="text-xs font-normal text-slate-400">PASSED</span>
          </div>
          <p className="text-[10px] text-slate-500">Zero operational defects</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Anomalous / Halt Units</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {criticalCount} <span className="text-xs font-normal text-slate-400">FAILED</span>
          </div>
          <p className="text-[10px] text-slate-500">Requires rework/re-inspection</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Component Title, Code, Batch, or Inspector..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">Filter Status:</span>
          {['All', 'PASS', 'FAIL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* History Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Component & Batch</th>
              <th className="p-4">Facility & Inspector</th>
              <th className="p-4">Working Condition</th>
              <th className="p-4">Quality Score</th>
              <th className="p-4">Decision Status</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {filteredInspections.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No inspection history records match your search criteria.
                </td>
              </tr>
            ) : (
              filteredInspections.map((record) => {
                const condition = record.workingCondition || (
                  record.status === 'PASS' 
                    ? '🟢 Optimal / Normal In-Spec' 
                    : '🔴 Critical Defect / Line Halt'
                );

                return (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={record.imageOriginal}
                          alt={record.componentName}
                          className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700 bg-slate-950"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-100">{record.componentName}</div>
                          <div className="text-[10px] text-cyan-400">{record.componentCode} • {record.batchNumber}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      <div>{record.factoryName}</div>
                      <div className="text-[10px] text-purple-400">{record.inspectorName || 'Certified Inspector'}</div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        record.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {condition}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-white">
                      {record.qualityScore} / 100
                    </td>

                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        record.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {record.status}: {record.decision}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400">{record.timestamp}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            onSelectInspection(record);
                            setActiveTab(currentUser?.role === 'Admin' ? 'reports' : 'inspection');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                          title="View AI Inspection Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {currentUser?.role === 'Admin' ? (
                          <>
                            <button
                              onClick={() => generateInspectionPDF(record)}
                              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                              title="Admin: Export PDF Inspection Report"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => downloadInspectionImage(record.imageOriginal, `${record.componentCode}_image.jpg`)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                              title="Admin: Download Component Image"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            {onDeleteInspection && (
                              <button
                                onClick={() => {
                                  onDeleteInspection(record.id);
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Admin: Delete Record & Image"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
