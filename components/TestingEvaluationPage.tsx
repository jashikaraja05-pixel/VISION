import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink,
  Cpu,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { TestCaseRecord, User, ActiveTab } from '../types';
import { validateAndPreprocessImageWithOpenCV } from '../utils/opencvQuality';

interface TestingEvaluationPageProps {
  currentUser: User | null;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectInspectionForReview?: (inspectionId: string) => void;
}

export const TestingEvaluationPage: React.FC<TestingEvaluationPageProps> = ({
  currentUser,
  setActiveTab,
}) => {
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'WARNING'>('ALL');
  
  // Custom test recording modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInputType, setNewInputType] = useState('SMT Circuit Board');
  const [newExpected, setNewExpected] = useState<'PASS' | 'FAIL'>('FAIL');
  const [newNotes, setNewNotes] = useState('');
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [evaluatingCustom, setEvaluatingCustom] = useState(false);

  // Load test cases on mount
  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluation/tests');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.testCases)) {
          setTestCases(data.testCases);
        }
      }
    } catch (e) {
      console.warn('Error loading evaluation tests:', e);
    } finally {
      setLoading(false);
    }
  };

  // Run a real-time live evaluation verification on a test case
  const handleRunLiveTest = async (testCase: TestCaseRecord) => {
    setRunningTestId(testCase.id);
    const startOverall = performance.now();

    try {
      let imageToTest = testCase.sampleImageUrl;
      if (!imageToTest) {
        // Fallback to sample PCB or Gear
        imageToTest = testCase.inputType.toLowerCase().includes('gear')
          ? '/sample_gear_defect_1785480278517.jpg'
          : '/sample_pcb_defect_1785480291504.jpg';
      }

      // Step 1: Real OpenCV Preprocessing & Quality Check
      const cvQuality = await validateAndPreprocessImageWithOpenCV(imageToTest);
      
      let aiResult: 'PASS' | 'FAIL' = 'PASS';
      let observedDetails = '';
      let defectName = 'None';
      let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';

      // Step 2: If quality passes, run AI inspection
      if (cvQuality.status !== 'FAILED') {
        const res = await fetch('/api/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: cvQuality.preprocessedImageUrl || imageToTest,
            componentName: testCase.title,
            forceRecheck: false,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data) {
            const d = resData.data;
            aiResult = d.status === 'FAIL' ? 'FAIL' : 'PASS';
            if (d.defects && d.defects.length > 0) {
              defectName = d.defects[0].type || 'Anomaly';
              severity = d.defects[0].severity || 'Major';
              observedDetails = `AI detected ${defectName} (${severity}). OpenCV sharpness: ${cvQuality.blurScore}, luma: ${cvQuality.brightness}.`;
            } else {
              observedDetails = `Verified Pass: Component surface nominal within specs. OpenCV sharpness: ${cvQuality.blurScore}.`;
            }
          }
        }
      } else {
        aiResult = 'FAIL';
        observedDetails = `OpenCV Gate: Image rejected before AI stage (${cvQuality.rejectionReason})`;
        defectName = 'Unsuitable Image Quality';
        severity = 'Critical';
      }

      const totalTime = Math.round(performance.now() - startOverall);
      const verdict = aiResult === testCase.expectedResult ? 'PASS' : 'FAIL';

      const updatedRecord: TestCaseRecord = {
        ...testCase,
        imageQualityStatus: cvQuality.status,
        blurScore: cvQuality.blurScore,
        brightness: cvQuality.brightness,
        aiResult,
        observedResult: observedDetails,
        defectName,
        severity,
        processingTimeMs: totalTime,
        verdict,
        timestamp: new Date().toLocaleString()
      };

      // Save updated result to backend
      await fetch('/api/evaluation/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });

      setTestCases(prev => prev.map(tc => tc.id === testCase.id ? updatedRecord : tc));
    } catch (err: any) {
      console.error('Test execution error:', err);
    } finally {
      setRunningTestId(null);
    }
  };

  // Handle Recording New Custom Test Observation
  const handleSaveCustomTest = async () => {
    if (!newTitle.trim() || !customImageBase64) return;
    setEvaluatingCustom(true);

    try {
      const startOverall = performance.now();
      // Step 1: Run real OpenCV
      const cvQuality = await validateAndPreprocessImageWithOpenCV(customImageBase64);
      
      let aiResult: 'PASS' | 'FAIL' = 'PASS';
      let observedDetails = '';
      let defectName = 'None';
      let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';

      if (cvQuality.status !== 'FAILED') {
        const res = await fetch('/api/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: cvQuality.preprocessedImageUrl || customImageBase64,
            componentName: newTitle,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data) {
            const d = resData.data;
            aiResult = d.status === 'FAIL' ? 'FAIL' : 'PASS';
            if (d.defects && d.defects.length > 0) {
              defectName = d.defects[0].type || 'Anomaly';
              severity = d.defects[0].severity || 'Major';
              observedDetails = `AI detected ${defectName} (${severity}). OpenCV sharpness: ${cvQuality.blurScore}.`;
            } else {
              observedDetails = `Clean component verified by AI vision.`;
            }
          }
        }
      } else {
        aiResult = 'FAIL';
        observedDetails = `Rejected by OpenCV Quality Check: ${cvQuality.rejectionReason}`;
      }

      const totalTime = Math.round(performance.now() - startOverall);
      const verdict = aiResult === newExpected ? 'PASS' : 'FAIL';

      const newRecord: TestCaseRecord = {
        id: `tc-${Date.now()}`,
        testCaseId: `TC-0${testCases.length + 1}`,
        title: newTitle.trim(),
        inputType: newInputType,
        sampleImageUrl: customImageBase64,
        imageQualityStatus: cvQuality.status,
        blurScore: cvQuality.blurScore,
        brightness: cvQuality.brightness,
        aiResult,
        expectedResult: newExpected,
        observedResult: observedDetails,
        defectName,
        severity,
        processingTimeMs: totalTime,
        verdict,
        notes: newNotes.trim() || 'Recorded during live system evaluation test session.',
        timestamp: new Date().toLocaleString()
      };

      await fetch('/api/evaluation/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });

      setTestCases(prev => [newRecord, ...prev]);
      setShowAddModal(false);
      setNewTitle('');
      setCustomImageBase64(null);
      setNewNotes('');
    } catch (e) {
      console.error('Error saving custom test case:', e);
    } finally {
      setEvaluatingCustom(false);
    }
  };

  const filteredCases = testCases.filter(tc => {
    if (activeFilter === 'PASS') return tc.verdict === 'PASS';
    if (activeFilter === 'FAIL') return tc.verdict === 'FAIL';
    if (activeFilter === 'WARNING') return tc.imageQualityStatus === 'WARNING';
    return true;
  });

  const totalTests = testCases.length;
  const passedTests = testCases.filter(tc => tc.verdict === 'PASS').length;
  const accuracyRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '100.0';
  const avgProcessingTime = totalTests > 0 
    ? Math.round(testCases.reduce((acc, c) => acc + (c.processingTimeMs || 0), 0) / totalTests) 
    : 0;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FlaskConical className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              CV & AI TESTING & EVALUATION BENCHMARK
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real test verification and benchmark evaluations for competition validation
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span>Record Test Observation</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Benchmark Tests</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalTests} Cases
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Standardized Industrial Evaluation Matrix
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pipeline Match Rate</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {accuracyRate}%
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">
            {passedTests} of {totalTests} Expected Verifications Passed
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Pipeline Latency</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {avgProcessingTime} ms
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            OpenCV Preprocessing + Gemini AI Vision
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">OpenCV Quality Gate</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            Active
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Laplacian Variance & Dynamic Luma
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {(['ALL', 'PASS', 'FAIL', 'WARNING'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Test Cases' : tab === 'PASS' ? 'Passed Verdicts' : tab === 'FAIL' ? 'Failed Verdicts' : 'Quality Warnings'}
            </button>
          ))}
        </div>

        <button
          onClick={loadTestCases}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-mono hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Test Matrix</span>
        </button>
      </div>

      {/* Benchmark Matrix Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>Real Evaluation Test Observations</span>
            </h3>
            <p className="text-[11px] text-slate-400">Actual test runs recording OpenCV quality metrics, Gemini inspection, expected vs observed outcome</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[10px] uppercase text-slate-400">
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Input Type & Title</th>
                <th className="py-3 px-4">OpenCV Quality Check</th>
                <th className="py-3 px-4 text-center">Expected</th>
                <th className="py-3 px-4 text-center">AI Result</th>
                <th className="py-3 px-4">Observed Outcome</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-center">Verdict</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCases.map((tc) => {
                const isRunning = runningTestId === tc.id;
                return (
                  <tr key={tc.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Test ID */}
                    <td className="py-3.5 px-4 font-bold text-cyan-400 whitespace-nowrap">
                      {tc.testCaseId}
                    </td>

                    {/* Input Type */}
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-bold text-slate-100 text-xs">{tc.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tc.inputType}</div>
                    </td>

                    {/* OpenCV Quality Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          tc.imageQualityStatus === 'PASSED' ? 'bg-emerald-400' :
                          tc.imageQualityStatus === 'WARNING' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <span className={`text-[11px] font-bold ${
                          tc.imageQualityStatus === 'PASSED' ? 'text-emerald-400' :
                          tc.imageQualityStatus === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {tc.imageQualityStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Blur Var: {tc.blurScore} • Luma: {tc.brightness}
                      </div>
                    </td>

                    {/* Expected */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tc.expectedResult === 'PASS' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {tc.expectedResult}
                      </span>
                    </td>

                    {/* AI Result */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tc.aiResult === 'PASS' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {tc.aiResult}
                      </span>
                    </td>

                    {/* Observed Result */}
                    <td className="py-3.5 px-4 font-sans text-xs max-w-xs">
                      <div className="text-slate-300 line-clamp-2">{tc.observedResult}</div>
                      {tc.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">Note: {tc.notes}</div>
                      )}
                    </td>

                    {/* Processing Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 text-[11px]">
                      {tc.processingTimeMs ? `${tc.processingTimeMs} ms` : '—'}
                    </td>

                    {/* Verdict */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tc.verdict === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {tc.verdict === 'PASS' ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>VERIFIED</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>MISMATCH</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleRunLiveTest(tc)}
                        disabled={isRunning}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                          isRunning
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Live Run</span>
                          </>
                        )}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Custom Test Observation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FlaskConical className="h-4 w-4 text-cyan-400" />
                <span>Record Real Test Observation</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Test Case Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. SMT Solder Bridge Verification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-sans focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Input Component Type
                  </label>
                  <select
                    value={newInputType}
                    onChange={(e) => setNewInputType(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="SMT Circuit Board">SMT Circuit Board</option>
                    <option value="Precision Gear">Precision Gear</option>
                    <option value="Fastener Bolt">Fastener Bolt</option>
                    <option value="Turbine Blade">Turbine Blade</option>
                    <option value="Optical Sensor Lens">Optical Sensor Lens</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Expected Result
                  </label>
                  <select
                    value={newExpected}
                    onChange={(e) => setNewExpected(e.target.value as 'PASS' | 'FAIL')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="FAIL">FAIL (Defect Present)</option>
                    <option value="PASS">PASS (Nominal / Clean)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Component Test Image (Upload or select)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setCustomImageBase64(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400"
                />
                {customImageBase64 && (
                  <div className="mt-2 h-24 w-full rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                    <img src={customImageBase64} alt="Preview" className="h-full object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Evaluation Notes / Test Conditions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tested under 6500K ring light with 25mm telecentric lens setup..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomTest}
                disabled={evaluatingCustom || !newTitle || !customImageBase64}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 transition-all ${
                  evaluatingCustom || !newTitle || !customImageBase64
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
              >
                {evaluatingCustom ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing CV & AI...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Run & Record Observation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
