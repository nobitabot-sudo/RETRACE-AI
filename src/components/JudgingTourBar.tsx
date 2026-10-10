import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface JudgingTourBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAgentWithPrompt: (prompt: string) => void;
  onResetDemoData: () => Promise<void>;
  isResetting: boolean;
}

interface TourStep {
  id: number;
  actTitle: string;
  tab: ActiveTab;
  headline: string;
  cueText: string;
  actionText: string;
  agentPrompt?: string;
  sku?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    actTitle: 'Act 1 · Problem',
    tab: 'executive',
    headline: 'Command Centre: Triage 3 Critical Operational Findings',
    cueText:
      'Spot the 3 core problems: (1) 24 Headphones eligible for ₹20,160 credit, (2) 70% defect cluster on Batch HB-09, (3) Demand risk of blind refurbishment.',
    actionText: 'View Command Centre',
  },
  {
    id: 2,
    actTitle: 'Act 2 · Evidence',
    tab: 'detective',
    headline: 'Return Detective: Inspect 70% Defect Clustering in Batch HB-09',
    cueText:
      'Review exactly 28 of 40 returned headphones sharing fault DEF-01 ("Right Hinge Fracture"). Note the statistical rigor: 70% returned concentration vs 8% total sold failure rate.',
    actionText: 'Inspect Forensic Evidence',
  },
  {
    id: 3,
    actTitle: 'Act 3 · Opportunity',
    tab: 'deadlines',
    headline: 'Deadline Hunter: Verify 24 Eligible Units (₹20,160 at Risk)',
    cueText:
      'Identify 24 units within SoundCraft 30-day window (₹840 credit/unit = ₹20,160 potential credit). The remaining 16 units are expired (>30d).',
    actionText: 'Check Vendor Windows',
  },
  {
    id: 4,
    actTitle: 'Act 4 · Comparison',
    tab: 'optimizer',
    headline: 'Recovery Optimizer: 4-Route Financial Proof (Split vs Baselines)',
    cueText:
      'Compare Refurbish All (₹55,000 net, ₹10k bench cost, 60-day stock risk), Liquidate All (₹19,600), Return All (₹20,160), and Optimized Split (24 RTV + 16 Refurb = ₹46,160).',
    actionText: 'Compare Financial Routes',
    sku: 'WH-NEO-01',
  },
  {
    id: 5,
    actTitle: 'Act 5 · Approval',
    tab: 'approvals',
    headline: 'Approval Centre: Authorize Controlled Manager Decision',
    cueText:
      'Review staged proposal for 40x AcoustiQ Neo Headphones. Confirm manager sign-off with audit notes. See the status transition to "Approved — Awaiting Execution".',
    actionText: 'Review Staged Proposal',
  },
  {
    id: 6,
    actTitle: 'Act 6 · AI Reasoning',
    tab: 'approvals', // Keeps on screen while opening drawer
    headline: 'AI Assistant: "Why are you recommending this split?"',
    cueText:
      'Run the judge query to inspect Gemini/deterministic tool execution trace (get_return_data → detect_quality_risk → find_expiring_vendor_windows → optimize_batch_allocation).',
    actionText: 'Ask AI Agent',
    agentPrompt:
      'Why are you recommending this recovery split and what evidence supports it?',
  },
];

export const JudgingTourBar: React.FC<JudgingTourBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAgentWithPrompt,
  onResetDemoData,
  isResetting,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Map activeTab to closest tour step
  const currentStepIndex = TOUR_STEPS.findIndex((s) => s.tab === activeTab);
  const activeStep = currentStepIndex >= 0 ? TOUR_STEPS[currentStepIndex] : TOUR_STEPS[0];

  const handleStepClick = (step: TourStep) => {
    setActiveTab(step.tab);
    if (step.agentPrompt) {
      onOpenAgentWithPrompt(step.agentPrompt);
    }
  };

  const handleNextStep = () => {
    const nextIdx = (currentStepIndex + 1) % TOUR_STEPS.length;
    handleStepClick(TOUR_STEPS[nextIdx]);
  };

  const handlePrevStep = () => {
    const prevIdx = (currentStepIndex - 1 + TOUR_STEPS.length) % TOUR_STEPS.length;
    handleStepClick(TOUR_STEPS[prevIdx]);
  };

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Top Line: Mode Label, Stepper Pills, Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                <Compass className="h-3 w-3" />
                <span>Judging Tour · 3-Min Walkthrough</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                Demo Dataset: <strong className="text-slate-200">WH-NEO-01 (HB-09)</strong>
              </span>
            </div>

            {/* Steps Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {TOUR_STEPS.map((step, idx) => {
                const isCurrent =
                  step.id === 6
                    ? false // step 6 is agent action
                    : step.tab === activeTab;
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step)}
                    title={step.headline}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-[#0B4632] text-white font-semibold ring-1 ring-emerald-400'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">
                      {step.id}
                    </span>
                    <span className="hidden md:inline">{step.actTitle.split('·')[1]?.trim()}</span>
                  </button>
                );
              })}
            </div>

            {/* Tour Controls & Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isResetting}
                title="Reset demonstration dataset to original benchmark state"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden lg:inline">Reset Demo</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Collapse Tour Details' : 'Expand Tour Details'}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Step Guide Card */}
          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-300">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-[11px]">
                    {activeStep.actTitle}:
                  </span>
                  <span className="font-semibold text-white text-xs">{activeStep.headline}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-4xl">
                  {activeStep.cueText}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={handlePrevStep}
                  className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="Previous Act"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() =>
                    onOpenAgentWithPrompt(
                      'Why are you recommending this recovery split and what evidence supports it?'
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>Ask AI Judge Query</span>
                </button>

                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-[11px] bg-[#0B4632] hover:bg-[#083626] text-white shadow-xs transition-colors"
                >
                  <span>Next Act</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Demonstration Dataset?</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  This will restore the local SQLite ledger and memory state to the initial RETRACE AI Hackathon judging benchmark:
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 font-mono text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>· Headphones (WH-NEO-01):</span>
                <strong className="text-slate-900">40 units returned</strong>
              </div>
              <div className="flex justify-between">
                <span>· Batch HB-09 DEF-01 Cluster:</span>
                <strong className="text-slate-900">28 units (70.0%)</strong>
              </div>
              <div className="flex justify-between">
                <span>· Contractual RTV Window:</span>
                <strong className="text-[#0B4632]">24 eligible / 16 expired</strong>
              </div>
              <div className="flex justify-between">
                <span>· Pending Manager Approvals:</span>
                <strong className="text-slate-900">1 pending proposal</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await onResetDemoData();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-lg shadow-xs transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
