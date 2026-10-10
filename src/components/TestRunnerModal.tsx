import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { PhoenixTestSuite } from '../services/testSuite';
import { AutomatedTestResult } from '../types';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<AutomatedTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = PhoenixTestSuite.runAllTests();
      setTestResults(results);
      setIsRunning(false);
    }, 250);
  };

  useEffect(() => {
    if (isOpen && testResults.length === 0) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = testResults.filter((t) => t.status === 'passed').length;
  const totalCount = testResults.length;
  const allPassed = passedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
              <CheckCheck className="h-4 w-4" />
              <span>AUTOMATED VERIFICATION SUITE</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">{totalCount > 0 ? `${totalCount} Invariant Test Cases` : '18 Invariant Test Cases'}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Deterministic Financial &amp; Logic Test Runner</span>
              {totalCount > 0 && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                    allPassed
                      ? 'bg-emerald-100 text-[#0B4632] border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {passedCount}/{totalCount} PASSED
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Re-run All'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
          {testResults.map((test, index) => (
            <div
              key={test.id}
              className={`rounded-lg border p-4 transition-colors ${
                test.status === 'passed'
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-rose-300 bg-rose-50'
              }`}
            >
              {/* Test Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500 font-medium">
                      0{index + 1}. {test.id}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-[11px] text-slate-500">{test.duration_ms}ms</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {test.status === 'passed' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#0B4632] shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{test.title}</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {test.description}
                  </p>
                </div>
              </div>

              {/* Assertions Checklist */}
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 font-mono text-[11px]">
                {test.assertions.map((assertion, aIdx) => (
                  <div
                    key={aIdx}
                    className={`flex items-start justify-between gap-3 p-2 rounded ${
                      assertion.passed ? 'bg-white border border-slate-200 text-slate-700' : 'bg-rose-100 border border-rose-300 text-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={assertion.passed ? 'text-[#0B4632] font-bold' : 'text-rose-600 font-bold'}>
                        {assertion.passed ? '✓' : '✗'}
                      </span>
                      <span>{assertion.check}</span>
                    </div>
                    <div className="text-slate-500 text-right shrink-0">
                      <span>Expected: {assertion.expected}</span> ·{' '}
                      <span className={assertion.passed ? 'text-[#0B4632] font-semibold' : 'text-rose-700 font-semibold'}>
                        Actual: {assertion.actual}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0B4632]" />
            <span>Deterministic financial tests verify absolute calculation integrity.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
