import React, { useState } from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Filter, 
  Clock, 
  Plus, 
  Radio, 
  Volume2
} from 'lucide-react';
import { AlertNotification, SeverityLevel, DefectType } from '../types';
import { speakVocalAlert, triggerDefectVoiceAlert } from '../utils/audioAlert';

interface RealTimeAlertsPageProps {
  alerts: AlertNotification[];
  onAcknowledgeAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onSimulateNewAlert: (alert: AlertNotification) => void;
}

export const RealTimeAlertsPage: React.FC<RealTimeAlertsPageProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onSimulateNewAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  const [simDefectType, setSimDefectType] = useState<DefectType>('Crack');
  const [simSeverity, setSimSeverity] = useState<SeverityLevel>('Critical');
  const [simMessage, setSimMessage] = useState(
    'CRITICAL ANOMALY: Sub-surface stress fracture identified on Line Alpha Heavy Gear Assembly.'
  );

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'All') return true;
    return a.severity === filterSeverity;
  });

  const handleCreateSimulatedAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: AlertNotification = {
      id: `alt-${Date.now()}`,
      inspectionId: `insp-sim-${Date.now()}`,
      defectType: simDefectType,
      severity: simSeverity,
      message: simMessage,
      timestamp: new Date().toLocaleString(),
      status: 'New',
      channels: ['dashboard', 'email', 'sms'],
      factoryName: 'Apex Precision Works',
      lineName: 'Line Alpha - Heavy Gear Assembly',
    };

    onSimulateNewAlert(newAlert);
    triggerDefectVoiceAlert(
      [{ type: simDefectType, severity: simSeverity, explanation: simMessage }],
      'Manufacturing Line Component'
    );
    setShowSimulateModal(false);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <BellRing className="h-6 w-6 text-rose-400 animate-bounce" />
            <span>REAL-TIME MULTI-CHANNEL ALERT SYSTEM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Instant anomaly dispatch across Dashboard Tickers, Simulated Email & SMS channels
          </p>
        </div>

        <button
          onClick={() => setShowSimulateModal(true)}
          className="inline-flex items-center space-x-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors shadow-[0_0_20px_rgba(244,63,94,0.3)]"
        >
          <Plus className="h-4 w-4" />
          <span>Simulate Critical Anomaly Alert</span>
        </button>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        
        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-mono">Filter Severity:</span>
          {['All', 'Critical', 'Major', 'Minor'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                filterSeverity === sev
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Live Channel Status Pills */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Dashboard: LIVE</span>
          </div>
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <Mail className="h-3.5 w-3.5" />
            <span>Email Gateway: READY</span>
          </div>
          <div className="flex items-center space-x-1.5 text-purple-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>SMS Gateway: READY</span>
          </div>
        </div>

      </div>

      {/* Alert Feed List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="text-sm font-semibold">No active alerts matching filter criteria!</p>
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isCritical = alt.severity === 'Critical';
            const isMajor = alt.severity === 'Major';

            return (
              <div
                key={alt.id}
                className={`rounded-2xl border p-5 space-y-3 transition-all ${
                  isCritical
                    ? 'border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : isMajor
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-block font-mono text-xs font-bold px-2.5 py-0.5 rounded border ${
                      isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      isMajor ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {alt.severity.toUpperCase()} • {alt.defectType}
                    </span>

                    <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{alt.timestamp}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      alt.status === 'New' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      alt.status === 'Acknowledged' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {alt.status}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {alt.message}
                </p>

                {/* Facility & Channels Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                  <div className="font-mono">
                    Facility: <strong className="text-slate-200">{alt.factoryName}</strong> ({alt.lineName})
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Dispatched Channel Badges */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono text-slate-500">Dispatched via:</span>
                      <span className="p-1 rounded bg-slate-950 border border-slate-800 text-cyan-400" title="Dashboard Alert">
                        <Radio className="h-3 w-3" />
                      </span>
                      <span className="p-1 rounded bg-slate-950 border border-slate-800 text-purple-400" title="Simulated Email Sent">
                        <Mail className="h-3 w-3" />
                      </span>
                      <span className="p-1 rounded bg-slate-950 border border-slate-800 text-emerald-400" title="Simulated SMS Sent">
                        <MessageSquare className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <button
                      onClick={() => speakVocalAlert(`Attention: ${alt.severity} ${alt.defectType} detected on ${alt.lineName}`)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold hover:bg-cyan-500/30 transition-colors"
                      title="Play Vocal Speech Alert"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Play Vocal Speech Alert</span>
                    </button>

                    {alt.status === 'New' && (
                      <button
                        onClick={() => onAcknowledgeAlert(alt.id)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold hover:bg-amber-500/30 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alt.status !== 'Resolved' && (
                      <button
                        onClick={() => onResolveAlert(alt.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold hover:bg-emerald-500/30 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Simulate New Alert Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span>Simulate Anomaly Alert Dispatch</span>
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSimulatedAlert} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Defect Category:</label>
                <select
                  value={simDefectType}
                  onChange={(e) => setSimDefectType(e.target.value as DefectType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Crack">Crack</option>
                  <option value="Scratch">Scratch</option>
                  <option value="Dent">Dent</option>
                  <option value="Rust">Rust</option>
                  <option value="Missing Part">Missing Part</option>
                  <option value="Surface Damage">Surface Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Severity Level:</label>
                <select
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(e.target.value as SeverityLevel)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Alert Message:</label>
                <textarea
                  rows={3}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                >
                  Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
