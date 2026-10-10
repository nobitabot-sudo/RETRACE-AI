import React from 'react';
import {
  LayoutDashboard,
  RotateCcw,
  SlidersHorizontal,
  ShieldAlert,
  ClockAlert,
  CheckCircle2,
  Sparkles,
  CheckCheck,
  Microscope,
} from 'lucide-react';
import { PhoenixLogo } from './PhoenixLogo';

export type ActiveTab =
  | 'executive'
  | 'intelligence'
  | 'optimizer'
  | 'simulator'
  | 'detective'
  | 'quality'
  | 'deadlines'
  | 'approvals';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAgent: () => void;
  onOpenTestRunner: () => void;
  pendingApprovalsCount: number;
  criticalDeadlinesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAgent,
  onOpenTestRunner,
  pendingApprovalsCount,
  criticalDeadlinesCount,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'executive', label: 'Command Centre', icon: LayoutDashboard },
    { id: 'intelligence', label: 'Return Intelligence', icon: RotateCcw },
    { id: 'optimizer', label: 'Recovery Optimizer', icon: SlidersHorizontal },
    { id: 'simulator', label: 'What-If Simulator', icon: Sparkles },
    { id: 'detective', label: 'Return Detective', icon: Microscope },
    { id: 'quality', label: 'Supplier Quality', icon: ShieldAlert },
    { id: 'deadlines', label: 'Deadline Hunter', icon: ClockAlert, badge: criticalDeadlinesCount },
    { id: 'approvals', label: 'Approval Centre', icon: CheckCircle2, badge: pendingApprovalsCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('executive')}
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] rounded-md group"
          >
            <PhoenixLogo size={36} variant="mark" theme="light" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-tight text-slate-900">
                  RETRACE<span className="text-[#0B4632]">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 hidden md:inline px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight hidden sm:block">
                Commerce Recovery Intelligence · Gadgetbay
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs (Zero-Pill Functional Segmented Buttons) */}
        <nav
          aria-label="Platform Modules"
          className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 shadow-inner"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold border border-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? 'text-[#0B4632]' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenTestRunner}
            title="Execute deterministic test suite verification (20/20 suites)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-md border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] shadow-xs"
          >
            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Invariants</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
              20/20
            </span>
          </button>

          <button
            onClick={onOpenAgent}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0B4632] hover:bg-[#083626] active:bg-[#052419] rounded-md shadow-xs font-sans transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] focus-visible:ring-offset-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <span className="font-semibold tracking-tight">Ask AI Agent</span>
          </button>
        </div>
      </div>

      {/* Mobile Subnavigation */}
      <div className="lg:hidden border-t border-slate-200 overflow-x-auto py-1 px-3 flex gap-1 bg-slate-50 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs whitespace-nowrap rounded-md ${
                isActive
                  ? 'bg-white text-[#0B4632] font-semibold border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-0.5 text-[10px] font-mono font-bold text-amber-700">
                  ({item.badge})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
