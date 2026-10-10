import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface JudgingWalkthroughChecklistProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSkuForOptimizer: (sku: string) => void;
  onOpenAgentWithPrompt: (prompt: string) => void;
  onResetDemoData: () => Promise<void>;
  isResettingDemo: boolean;
}

export const JudgingWalkthroughChecklist: React.FC<JudgingWalkthroughChecklistProps> = ({
  activeTab,
  setActiveTab,
  onSelectSkuForOptimizer,
  onOpenAgentWithPrompt,
  onResetDemoData,
  isResettingDemo,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const steps: Array<{
    id: number;
    timing: string;
    label: string;
    actTitle: string;
    tabTarget: ActiveTab;
    description: string;
    action: () => void;
  }> = [
    {
      id: 1,
      timing: '0:00–0:25',
      label: 'Act 1 · Command Centre',
      actTitle: 'Show the 3 Business Problems',
      tabTarget: 'executive',
      description: 'Surface the 3 core findings: ₹20,160 supplier credit, 70% defect cluster (Batch HB-09), and 60-day demand trap.',
      action: () => setActiveTab('executive'),
    },
    {
      id: 2,
      timing: '0:25–0:55',
      label: 'Act 2 · Return Detective',
      actTitle: 'Show the Forensic Evidence',
      tabTarget: 'detective',
      description: 'Inspect Batch HB-09: 28 of 40 returned headphones share DEF-01 hinge fracture (70.0% concentration vs 8.0% sold defect rate).',
      action: () => setActiveTab('detective'),
    },
    {
      id: 3,
      timing: '0:55–1:15',
      label: 'Act 3 · Deadline Hunter',
      actTitle: 'Show the Supplier Opportunity',
      tabTarget: 'deadlines',
      description: 'Identify 24 units within 30-day SLA window. Calculate potential gross supplier credit: 24 × ₹840 = ₹20,160.',
      action: () => setActiveTab('deadlines'),
    },
    {
      id: 4,
      timing: '1:15–2:05',
      label: 'Act 4 · Recovery Optimiser',
      actTitle: 'Show the Financial Decision',
      tabTarget: 'optimizer',
      description: 'Compare all 3 routes (RTV, Refurb, Liquidation). Inspect the calculated 24 RTV + 16 Refurb batch split yielding ₹46,160 net.',
      action: () => {
        onSelectSkuForOptimizer('WH-NEO-01');
        setActiveTab('optimizer');
      },
    },
    {
      id: 5,
      timing: '2:05–2:30',
      label: 'Act 5 · Approval Centre',
      actTitle: 'Show Controlled Action',
      tabTarget: 'approvals',
      description: 'Authorize the staged proposal. Persist decision with timestamp, manager ID, and immutable audit event into SQLite.',
      action: () => setActiveTab('approvals'),
    },
    {
      id: 6,
      timing: '2:30–3:00',
      label: 'Act 6 · Agent Workspace',
      actTitle: 'Prove Connected AI Reasoning',
      tabTarget: 'executive',
      description: 'Ask the judge question: "Why recommend this split & what evidence supports the quality alert?" Inspect real tool execution traces.',
      action: () =>
        onOpenAgentWithPrompt(
          'Why are you recommending this recovery split, and what evidence supports the supplier-quality alert?'
        ),
    },
  ];

  return (
    <div className="border-b border-emerald-900/10 bg-emerald-950 text-white shadow-md relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Bar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-300">
              Judges Demo Navigator · 3-Minute Walkthrough Protocol
            </span>
            <span className="text-emerald-600 hidden md:inline">|</span>
            <span className="text-[11px] text-emerald-200/80 hidden md:inline font-sans">
              Follow the 6 Acts from Return Records → Evidence → Financial Optimization → Approval → AI Grounding
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResettingDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60 transition-colors disabled:opacity-50"
              title="Reset SQLite database to clean benchmark demo state (40 headphones, 28 defects, 24 eligible RTV)"
            >
              <RotateCcw className={`h-3 w-3 ${isResettingDemo ? 'animate-spin' : ''}`} />
              <span>{isResettingDemo ? 'Resetting...' : 'Reset Demo Data'}</span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-300 hover:text-white rounded hover:bg-emerald-900/60 transition-colors"
              aria-label={isOpen ? 'Collapse walkthrough guide' : 'Expand walkthrough guide'}
            >
              <span className="text-[11px] font-medium">{isOpen ? 'Hide Steps' : 'Show 6 Acts'}</span>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Steps Ribbon */}
        {isOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-emerald-900/60 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {steps.map((step) => {
              const isActive = activeTab === step.tabTarget && step.id !== 6;
              return (
                <div
                  key={step.id}
                  onClick={step.action}
                  className={`group cursor-pointer rounded-lg p-2 transition-all border text-left flex flex-col justify-between ${
                    isActive
                      ? 'bg-emerald-900/90 border-emerald-400/80 shadow-xs'
                      : 'bg-emerald-900/30 hover:bg-emerald-900/60 border-emerald-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-emerald-400">{step.timing}</span>
                      <span className="text-emerald-300/70">Act {step.id}</span>
                    </div>
                    <div className="font-bold text-xs text-white mt-0.5 leading-snug group-hover:text-emerald-200 transition-colors">
                      {step.label.split('·')[1]?.trim() || step.label}
                    </div>
                    <p className="text-[10px] text-emerald-200/70 mt-1 leading-tight line-clamp-2">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-2 pt-1 border-t border-emerald-800/40 flex items-center justify-between text-[10px] text-emerald-300 font-medium">
                    <span className="flex items-center gap-1">
                      <Play className="h-2.5 w-2.5 text-emerald-400" />
                      <span>Jump</span>
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Demo Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 max-w-md w-full rounded-xl border border-slate-200 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-[#0B4632] border border-emerald-200">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  Reset Demo Dataset to Benchmark Reference?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This restores the SQLite database to the pristine hackathon judging state:
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1 text-slate-700">
              <div>✓ 40 Headphones (SKU WH-NEO-01 · Batch HB-09)</div>
              <div>✓ 28 DEF-01 hinge fractures (70.0% fault concentration)</div>
              <div>✓ 24 units within 30-day SLA window (₹20,160 credit)</div>
              <div>✓ 16 units expired past SLA (diverted to ₹26,000 refurb)</div>
              <div>✓ 5x 4K Monitors with 3 days remaining (₹91,000 at risk)</div>
              <div>✓ Idempotent re-seed without duplicating existing records</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await onResetDemoData();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#073022] rounded-lg shadow-xs transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
