import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  Terminal,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Database,
  SlidersHorizontal,
  BookmarkCheck,
} from 'lucide-react';
import { PhoenixAIAgent, REGISTERED_AGENT_TOOLS } from '../services/aiAgent';
import { CalculationEngine } from '../services/calculationEngine';
import { AgentResponse, AgentToolTrace, ApprovalAction, DailyExecutiveReport } from '../types';
import { ProductImage } from './ProductImage';

interface AgentDrawerProps {
  isOpen: boolean;
  initialPrompt?: string;
  onClose: () => void;
  onSelectSkuForOptimizer: (sku: string) => void;
  onStageApproval?: (action: ApprovalAction) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  toolsCalled?: AgentToolTrace[];
  recommendedAction?: AgentResponse['recommended_action'];
  savedApproval?: ApprovalAction;
  dailyReport?: DailyExecutiveReport;
  source?: 'gemini_api' | 'deterministic_agent';
  timestamp: string;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  isOpen,
  initialPrompt,
  onClose,
  onSelectSkuForOptimizer,
  onStageApproval,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-01',
      sender: 'agent',
      text: `Hello, I am **RETRACE AI**, your returns recovery & defect intelligence agent for Gadgetbay.

I am connected directly to your application database, vendor SLA contracts, defect clustering forensics, and batch recovery optimization engine.

Every return has a second chance. Every defect leaves a trail. Ask any operational question or select an action from the operations toolkit below.`,
      timestamp: 'Just now',
      source: 'deterministic_agent',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<string | null>(null);
  const [stagingSku, setStagingSku] = useState<string | null>(null);
  const [showToolRegistry, setShowToolRegistry] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '⚖️ Judge Question: Split & Quality Evidence', prompt: 'Why are you recommending this recovery split, and what evidence supports the supplier-quality alert?' },
    { label: '📊 Daily Operations Report', prompt: 'Run the daily operations report' },
    { label: '⚠️ Urgent Attention Today', prompt: 'What needs attention today?' },
    { label: '⏳ Expiring SLA Windows', prompt: 'Which supplier-return deadlines are approaching?' },
    { label: '🔍 Defect Pattern Forensics', prompt: 'Which supplier or batch has a suspicious defect pattern?' },
    { label: '🔀 Optimize Batch Split', prompt: 'Optimize batch allocation for WH-NEO-01' },
    { label: '📝 Stage Approval Proposal', prompt: 'Save approval proposal for WH-NEO-01' },
  ];

  const handleSend = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await PhoenixAIAgent.queryAgent(text);

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        text: response.answer,
        toolsCalled: response.tools_called,
        recommendedAction: response.recommended_action,
        dailyReport: response.daily_report,
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-agent-err`,
        sender: 'agent',
        text: `Error executing agent request: ${errorMessage}. Reverting to authoritative deterministic calculation rules.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'deterministic_agent',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageRecommendedAction = async (recAction: NonNullable<AgentResponse['recommended_action']>) => {
    setStagingSku(recAction.sku);
    try {
      const result = await PhoenixAIAgent.save_approval({
        sku: recAction.sku,
        rtv_units: recAction.allocations.rtv || 0,
        refurb_units: recAction.allocations.refurb || 0,
        liquidate_units: recAction.allocations.liquidate || 0,
        scrap_units: recAction.allocations.scrap || 0,
        reviewer_notes: `Authorized directly from RETRACE AI Operations Console: ${recAction.headline}`,
      });

      if (result.success && result.action) {
        if (onStageApproval) {
          onStageApproval(result.action);
        }

        const confirmMsg: ChatMessage = {
          id: `msg-${Date.now()}-agent-confirm`,
          sender: 'agent',
          text: `Action **${result.action.id}** for **${result.action.sku}** (${CalculationEngine.formatINR(result.action.expected_net_recovery)} net recovery) has been persisted and staged in the **Approval Centre**.`,
          savedApproval: result.action,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'deterministic_agent',
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
    } catch (err) {
      console.error('Failed to stage approval from agent drawer:', err);
    } finally {
      setStagingSku(null);
    }
  };

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#F8FAFC] border-l border-slate-200 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-[#0B4632] shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>RETRACE AI Operations Assistant</span>
                  <span className="text-[10px] font-mono font-semibold text-[#0B4632] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Tools (8 Active)
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Real Backend Functions &amp; Database Connected</span>
                  <span>·</span>
                  <button
                    onClick={() => setShowToolRegistry(!showToolRegistry)}
                    className="text-[#0B4632] hover:text-[#083626] font-semibold underline font-mono text-[10px]"
                  >
                    {showToolRegistry ? 'Hide Tool Registry' : 'View Registered Tools'}
                  </button>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Collapsible Registered Tools Registry Panel */}
          {showToolRegistry && (
            <div className="p-3.5 bg-white border-b border-slate-200 text-xs text-slate-700 space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-[#0B4632] font-mono uppercase tracking-wider">
                  <Database className="h-3.5 w-3.5" />
                  Active Connected Backend Function Registry:
                </span>
                <span className="text-slate-500 font-mono font-medium">{REGISTERED_AGENT_TOOLS.length} Tools Ready</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                {REGISTERED_AGENT_TOOLS.map((tool) => (
                  <div key={tool.name} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[#0B4632] font-semibold">{tool.name}()</div>
                    <div className="text-slate-500 text-[10px] line-clamp-1">{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Prompts Carousel */}
          <div className="p-2.5 sm:p-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 transition-all shrink-0 disabled:opacity-50 font-medium shadow-2xs"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[94%] rounded-xl p-4 sm:p-5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0B4632] text-white font-medium shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-line space-y-2.5">
                    {msg.text}
                  </div>

                  {/* Real Tool Calling Execution Traces */}
                  {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#0B4632]">
                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          <Terminal className="h-3.5 w-3.5" />
                          Backend Function Traces ({msg.toolsCalled.length} Invoked):
                        </span>
                        <span className="text-slate-500 text-[10px] font-medium">Authoritative Execution</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.toolsCalled.map((tool, idx) => {
                          const traceId = `${msg.id}-trace-${idx}`;
                          const isExpanded = expandedTraceIndex === traceId;
                          return (
                            <div
                              key={idx}
                              className="rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] overflow-hidden"
                            >
                              <button
                                onClick={() => setExpandedTraceIndex(isExpanded ? null : traceId)}
                                className="w-full text-left p-2.5 flex items-center justify-between hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B4632]"></span>
                                  <span className="text-[#0B4632] font-bold">{tool.tool_name}()</span>
                                  <span className="text-slate-600 text-[10px] hidden sm:inline">
                                    {tool.output_summary}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                                  {tool.duration_ms !== undefined && <span>{tool.duration_ms}ms</span>}
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="p-3 bg-white border-t border-slate-200 text-[10px] space-y-2">
                                  <div>
                                    <span className="text-slate-600 block font-semibold mb-0.5">Arguments:</span>
                                    <pre className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800 overflow-x-auto">
                                      {JSON.stringify(tool.arguments, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 block font-semibold mb-0.5">Execution Summary:</span>
                                    <p className="text-[#0B4632] font-semibold">{tool.output_summary}</p>
                                  </div>
                                  {Boolean(tool.result) && (
                                    <div>
                                      <span className="text-slate-600 block font-semibold mb-0.5">Output Data Preview:</span>
                                      <pre className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800 max-h-36 overflow-y-auto text-[9.5px]">
                                        {JSON.stringify(tool.result, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommended Action Card with Direct Stage Approval */}
                  {msg.recommendedAction && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#0B4632] uppercase tracking-wider flex items-center gap-1.5">
                          <BookmarkCheck className="h-3.5 w-3.5" />
                          Recommended Recovery Action Plan
                        </span>
                        <span className="font-mono text-xs font-bold text-[#0B4632]">
                          {CalculationEngine.formatINR(msg.recommendedAction.net_recovery)} Net
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <ProductImage
                          sku={msg.recommendedAction.sku}
                          name={msg.recommendedAction.headline}
                          size="md"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900">
                            {msg.recommendedAction.headline}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            SKU: {msg.recommendedAction.sku}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(msg.recommendedAction.allocations).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700"
                          >
                            <span className="text-slate-500 uppercase">{k}:</span> <strong className="text-slate-900">{v}</strong>
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (msg.recommendedAction) {
                              onSelectSkuForOptimizer(msg.recommendedAction.sku);
                              onClose();
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                          <span>Open in Optimizer</span>
                        </button>

                        <button
                          onClick={() => {
                            if (msg.recommendedAction) {
                              handleStageRecommendedAction(msg.recommendedAction);
                            }
                          }}
                          disabled={stagingSku === msg.recommendedAction.sku}
                          className="px-3.5 py-1.5 text-xs font-bold bg-[#0B4632] hover:bg-[#083626] text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            {stagingSku === msg.recommendedAction.sku ? 'Staging...' : 'Stage for Manager Approval'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Saved Approval Confirmation Badge */}
                  {msg.savedApproval && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0B4632] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0B4632] shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">
                            Action Staged: {msg.savedApproval.id}
                          </div>
                          <div className="text-[11px] text-slate-700">
                            {msg.savedApproval.sku} · Net: {CalculationEngine.formatINR(msg.savedApproval.expected_net_recovery)} · Status: {msg.savedApproval.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-[#0B4632] font-semibold">
                        In Approval Centre
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Timestamp & Engine Footnote */}
                <div className="text-[10px] text-slate-500 font-mono mt-1.5 px-1.5 flex items-center gap-2">
                  <span>{msg.timestamp}</span>
                  {msg.source && (
                    <span>
                      · {msg.source === 'gemini_api' ? 'Gemini 3.8 Flash (Function Calling)' : 'Deterministic Backend Engine'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-mono p-3.5 bg-white rounded-xl border border-slate-200 w-fit shadow-xs">
                <Cpu className="h-4 w-4 text-[#0B4632] animate-spin" />
                <span>Invoking application backend tools &amp; computing recovery models...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about batch defects, expiring windows, or recovery calculations..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] placeholder:text-slate-400 shadow-2xs"
              />
              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="px-4 py-2.5 text-xs font-bold text-white bg-[#0B4632] hover:bg-[#083626] active:bg-[#06291c] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ask Agent</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
