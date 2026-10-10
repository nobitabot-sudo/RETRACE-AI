import React from 'react';
import {
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Info,
} from 'lucide-react';
import { CalculationEngine } from '../services/calculationEngine';
import {
  Product,
  ReturnItem,
  VendorTerms,
  RefurbishmentRule,
  LiquidationRule,
  InventoryRecord,
  ApprovalAction,
  QualityAlert,
  DeadlineAlert,
} from '../types';
import { ActiveTab } from './Navbar';
import { ProductImage } from './ProductImage';

interface ExecutiveCommandCentreProps {
  products: Product[];
  returnsList: ReturnItem[];
  vendorTerms: VendorTerms[];
  refurbRules: RefurbishmentRule[];
  liqRules: LiquidationRule[];
  inventory: InventoryRecord[];
  approvals: ApprovalAction[];
  qualityAlerts: QualityAlert[];
  deadlineAlerts: DeadlineAlert[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSkuForOptimizer: (sku: string) => void;
  onOpenAgentWithPrompt: (prompt: string) => void;
}

export const ExecutiveCommandCentre: React.FC<ExecutiveCommandCentreProps> = ({
  products,
  returnsList,
  vendorTerms,
  refurbRules,
  liqRules,
  inventory,
  approvals,
  qualityAlerts,
  deadlineAlerts,
  setActiveTab,
  onSelectSkuForOptimizer,
  onOpenAgentWithPrompt,
}) => {
  // Aggregate calculations directly derived from data
  const totalUnits = returnsList.length;

  // Calculate estimated recoverable value across all SKU batches using optimized allocation
  const uniqueSkus = Array.from(new Set(returnsList.map((r) => r.sku)));
  let totalRecoverableValue = 0;
  let totalGrossValue = 0;
  let totalDirectCosts = 0;

  // Breakdown by route for portfolio comparison
  let rtvTotalNet = 0;
  let refurbTotalNet = 0;
  let liquidateTotalNet = 0;
  let scrapTotalNet = 0;

  let rtvUnitsTotal = 0;
  let refurbUnitsTotal = 0;
  let liquidateUnitsTotal = 0;
  let scrapUnitsTotal = 0;

  uniqueSkus.forEach((sku) => {
    const opt = CalculationEngine.optimizeBatch(
      sku,
      products,
      vendorTerms,
      refurbRules,
      liqRules,
      inventory,
      returnsList
    );
    totalRecoverableValue += opt.totalNetRecovery;
    totalGrossValue += opt.totalGrossRecovery;
    totalDirectCosts += opt.totalDirectCost;

    rtvTotalNet += opt.routes.rtv.totalNetRecovery;
    refurbTotalNet += opt.routes.refurb.totalNetRecovery;
    liquidateTotalNet += opt.routes.liquidate.totalNetRecovery;
    scrapTotalNet += opt.routes.scrap.totalNetRecovery;

    rtvUnitsTotal += opt.allocations.rtvUnits;
    refurbUnitsTotal += opt.allocations.refurbUnits;
    liquidateUnitsTotal += opt.allocations.liquidateUnits;
    scrapUnitsTotal += opt.allocations.scrapUnits;
  });

  const criticalDeadlines = deadlineAlerts.filter((d) => d.urgency === 'critical');

  // HB-09 Quality Investigation Data
  const hb09Returns = returnsList.filter((r) => r.supplier_batch === 'HB-09');
  const hb09Def01Returns = hb09Returns.filter((r) => r.reason_code === 'DEF-01');
  const hb09HingeConcentration =
    hb09Returns.length > 0
      ? ((hb09Def01Returns.length / hb09Returns.length) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Banner / Mission Statement */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1.5 font-semibold">
              <span>EXECUTIVE COMMAND CENTRE</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">Reverse Logistics Decision Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Returns Recovery &amp; Defect Intelligence
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              <span className="italic font-medium text-slate-800">"Every return has a second chance. Every defect leaves a trail."</span>
              {' '}Real-time deterministic recovery modeling across Supplier RTV, Secondary Refurbishment, and B2B Wholesale Liquidation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAgentWithPrompt('What needs attention today?')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632]"
            >
              <Sparkles className="h-4 w-4 text-[#0B4632]" />
              <span>Ask Agent: What needs attention today?</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Compact Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Units */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-600">Total Returned Units</span>
            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
              5 Batches
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {totalUnits} <span className="text-xs font-sans font-normal text-slate-500">units</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Audio: 40</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Displays: 5</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Wearables: 15</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Estimated Net Recoverable Value */}
        <div className="rounded-xl border border-emerald-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">Estimated Net Recovery</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0B4632] font-mono tabular-nums tracking-tight">
              {CalculationEngine.formatINR(totalRecoverableValue)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Gross: {CalculationEngine.formatINR(totalGrossValue)}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Direct: -{CalculationEngine.formatINR(totalDirectCosts)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Approaching SLA Deadlines */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-600">Approaching Deadlines</span>
            <Clock className={`h-4 w-4 ${criticalDeadlines.length > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight flex items-baseline gap-2">
              <span>{deadlineAlerts.length}</span>
              {criticalDeadlines.length > 0 && (
                <span className="text-xs font-semibold text-rose-700 font-mono bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  {criticalDeadlines.length} CRITICAL (≤3d)
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Credit at risk:</span>
              <span className="text-amber-700 font-bold">
                {CalculationEngine.formatINR(
                  deadlineAlerts.reduce((acc, d) => acc + d.total_credit_at_risk, 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Quality & Defect Risk */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-600">Defect &amp; Quality Alerts</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight flex items-baseline gap-2">
              <span>{qualityAlerts.length}</span>
              <span className="text-xs font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                1 Severe Cluster
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Batch HB-09:</span>
              <span className="text-rose-700 font-bold">{hb09HingeConcentration}% hinge fault</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. PROMINENT "What needs attention today?" PANEL */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>DATASET-DERIVED OPERATIONAL MONITOR</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">Deterministic Ledger Triage (Simulation Date: 2026-10-09)</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Needs Your Attention (Key Demonstration Findings)
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('approvals')}
            className="text-xs text-[#0B4632] hover:underline flex items-center gap-1.5 font-semibold self-start sm:self-center transition-colors"
          >
            <span>Review Manager Approvals ({approvals.filter((a) => a.status === 'pending').length} pending)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* FINDING 1: SUPPLIER CREDIT OPPORTUNITY */}
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-4 sm:p-5 transition-all hover:bg-emerald-50/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <ProductImage sku="WH-NEO-01" size="lg" className="rounded-xl border shadow-xs mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0B4632] bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 text-[11px] uppercase">
                      Finding 1 · Supplier Credit Opportunity
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-700 font-medium">SoundCraft Audio Ltd. · AcoustiQ Neo Headphones</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">SKU: WH-NEO-01 · Batch: HB-09</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    24 Eligible Returned Headphone Units Qualify for Supplier Credit
                  </h3>

                  <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
                    <strong className="text-slate-900">Concise Explanation:</strong> There are 24 eligible returned headphone units that qualify for contractual supplier credit, subject to recorded vendor terms and deadline.
                  </p>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    <strong className="text-slate-800">Supporting Evidence:</strong> Returned between 10 and 21 days ago, leaving 9 to 20 days inside SoundCraft Audio's 30-day SLA window. Stored contractual terms grant 60% credit on ₹1,400 original cost = ₹840 credit per unit. The remaining 16 returned headphones have expired (&gt;30 days) and are disqualified from RTV credit.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-600">
                    <span>
                      Affected Quantity: <strong className="text-slate-900 font-bold">24 Units</strong> (of 40 returned)
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Financial Significance: Potential gross supplier credit of <strong className="text-[#0B4632] font-bold">{CalculationEngine.formatINR(20160)}</strong> (24 × ₹840)
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-amber-800">
                      SLA Risk: Missing deadline forces liquidation write-down to ₹490/unit (₹8,400 loss).
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  onClick={() => {
                    onSelectSkuForOptimizer('WH-NEO-01');
                    setActiveTab('optimizer');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors shadow-2xs"
                >
                  Inspect in Optimizer
                </button>
                <button
                  onClick={() => setActiveTab('deadlines')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Open Deadline Hunter</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* FINDING 2: SUPPLIER QUALITY CONCERN */}
          <div className="rounded-lg border border-rose-300 bg-rose-50/50 p-4 sm:p-5 transition-all hover:bg-rose-50/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <ProductImage sku="WH-NEO-01" size="lg" className="rounded-xl border shadow-xs mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded border border-rose-300 text-[11px] uppercase">
                      Finding 2 · Supplier Quality Concern
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-700 font-medium">SoundCraft Audio Ltd. · AcoustiQ Neo Headphones</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">Batch: HB-09 · Severity: Critical</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    40 Headphones Returned · 70% Share the Same Reported Fault (Batch HB-09)
                  </h3>

                  <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
                    <strong className="text-slate-900">Concise Explanation:</strong> Forty headphones have been returned, and 70% of these returned units are associated with the same reported fault. The records associate the affected returns with supplier batch HB-09.
                  </p>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    <strong className="text-slate-800">Supporting Evidence:</strong> Exactly 28 of 40 returned units cite fault code DEF-01 ("Right Hinge Fracture / Audio Dropout"). <em>Statistical Rigor:</em> The observed 70% represents the share of returned units associated with the recorded fault. It is not the defect rate among all manufactured headphones. Across 350 units sold from Batch HB-09, the overall failure rate is 8.0% (28 / 350), which breaches SoundCraft's contractual SLA ceiling of 1.5%.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-600">
                    <span>
                      Affected Quantity: <strong className="text-rose-900 font-bold">28 Units Affected</strong> (of 40 returned)
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Financial Impact: <strong className="text-slate-900 font-bold">{CalculationEngine.formatINR(39200)}</strong> product cost affected
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Action: Issue formal Supplier Quality Review with SoundCraft Audio.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  onClick={() => setActiveTab('detective')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-md shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Open Return Detective</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* FINDING 3: RECOVERY AND DEMAND RISK */}
          <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-4 sm:p-5 transition-all hover:bg-amber-50/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <ProductImage sku="WH-NEO-01" size="lg" className="rounded-xl border shadow-xs mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 text-[11px] uppercase">
                      Finding 3 · Recovery and Demand Risk
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-700 font-medium">Headphone Batch HB-09 &amp; Warehouse Inventory</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">Demand Coverage: 60 Days</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Refurbishing All Units Ties Up Working Capital While Existing Stock Covers 60 Days
                  </h3>

                  <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
                    <strong className="text-slate-900">Concise Explanation:</strong> Refurbishing all returned units without evaluating demand, inventory coverage, and alternative recovery routes may tie up money unnecessarily.
                  </p>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    <strong className="text-slate-800">Supporting Evidence:</strong> New headphone inventory in warehouse covers 60 days of demand (72 units in stock @ 1.2 units/day demand). Blindly refurbishing all 40 units locks up ₹10,000 in upfront repair bench costs (40 × ₹250) and adds 33 days of inventory. Intelligent batch splitting (24 RTV + 16 Refurb) avoids ₹6,000 in unnecessary bench spend, locks in ₹20,160 in risk-free supplier credit, and generates ₹46,160 total net recovery vs ₹19,600 liquidation.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-600">
                    <span>
                      Affected Quantity: <strong className="text-slate-900 font-bold">40 Units</strong> (plus 72 warehouse units)
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Capital Saved: <strong className="text-[#0B4632] font-bold">₹6,000</strong> bench spend prevented
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Optimized Recovery: <strong className="text-[#0B4632] font-bold">{CalculationEngine.formatINR(46160)}</strong> net proceeds (+135.5% vs liquidation)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  onClick={() => {
                    onSelectSkuForOptimizer('WH-NEO-01');
                    setActiveTab('simulator');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors shadow-2xs"
                >
                  Simulate What-If
                </button>
                <button
                  onClick={() => {
                    onSelectSkuForOptimizer('WH-NEO-01');
                    setActiveTab('optimizer');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Open Recovery Optimizer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* FINDING 4: CRITICAL SLA CLIFF (MONITORS) */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:p-5 transition-all hover:bg-slate-100/60">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <ProductImage sku="MON-4K-PRO" size="lg" className="rounded-xl border shadow-xs mt-0.5 shrink-0" />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded border border-rose-300 text-[11px] uppercase">
                      Urgent SLA Cliff · 3 Days Remaining
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-700 font-medium">VisionTech Displays Ltd. · SpectraView 32" 4K Monitor</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">SKU: MON-4K-PRO · 5 Units</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    Expiring Return Window: ₹91,000 Supplier Credit at Risk Across 5 Studio Monitors
                  </h3>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    VisionTech's 21-day SLA closes in 3 calendar days. Contractual terms grant 65% credit on ₹28,000 procurement cost = ₹18,200/unit. Claiming RTV secures ₹91,000 credit before window lapses into bulk liquidation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  onClick={() => setActiveTab('deadlines')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs"
                >
                  Stage Monitor RTV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 & 3: QUALITY-RISK VISUALIZATION (HB-09) & RECOVERY-ROUTE COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quality-Risk Visualization Highlighting Supplier Batch HB-09 */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <ProductImage sku="WH-NEO-01" size="md" className="rounded-lg border shadow-2xs shrink-0" />
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-rose-700 mb-1 font-semibold">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>QUALITY RISK HIGHLIGHT</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Forensic Fault Concentration: Batch HB-09
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('detective')}
                className="text-xs text-[#0B4632] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Forensic Detective</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* HB-09 Stat Callout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200">
                <div className="text-[11px] font-mono text-slate-600 font-medium">RETURN COHORT CONCENTRATION</div>
                <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                  {hb09HingeConcentration}%
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  28 of 40 returned headphones cite <strong className="text-slate-900">DEF-01 Hinge Fracture</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-[11px] font-mono text-slate-600 font-medium">BATCH MANUFACTURING DEFECT RATE</div>
                <div className="text-2xl font-bold font-mono text-amber-800 mt-1 tabular-nums">
                  8.0%
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  40 failures out of 500 units sold (vs 1.5% contract ceiling)
                </div>
              </div>
            </div>

            {/* Visual Comparative Chart across Batches */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Return Fault Concentration by Supplier Batch (DEF-01 Right Hinge Stress)</span>
                <span className="text-[11px] font-mono text-slate-500">Benchmark: &lt;5%</span>
              </div>

              {/* Batch HB-09 (Anomaly) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-rose-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>Batch HB-09 (SoundCraft Audio · NeoBass WH-NEO-01)</span>
                  </span>
                  <span className="font-mono text-rose-700 font-bold tabular-nums">70.0% (28/40 units)</span>
                </div>
                <div className="h-3 w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full bg-rose-600 rounded transition-all" style={{ width: '70%' }} />
                </div>
              </div>

              {/* Batch HB-08 (Prior Batch) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Batch HB-08 (SoundCraft Audio · Prior Production Run)</span>
                  </span>
                  <span className="font-mono text-slate-600 tabular-nums">12.5% (1/8 units)</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full bg-slate-400 rounded transition-all" style={{ width: '12.5%' }} />
                </div>
              </div>

              {/* Batch VT-4K-2026Q3 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>Batch VT-4K-2026Q3 (VisionTech Displays · 4K Monitors)</span>
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">0.0% (0/5 units)</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full bg-slate-300 rounded transition-all" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong className="text-slate-800">Statistical Integrity Note:</strong> The 70.0% figure represents fault concentration <em>within the returned sample</em> (28/40), which isolates mechanical hinge brittleness. Total batch failure rate across 500 sold units is 8.0%.
            </div>
          </div>
        </div>

        {/* Recovery-Route Comparison with Readable Financial Values */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>PORTFOLIO RECOVERY BREAKDOWN</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recovery-Route Contribution Across All Returns
                </h2>
              </div>
              <span className="text-xs font-mono text-[#0B4632] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {CalculationEngine.formatINR(totalRecoverableValue)}
              </span>
            </div>

            {/* Proportional Distribution Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Distribution of Net Proceeds ({totalUnits} total units)</span>
                <span className="font-mono text-slate-700 font-medium">100% Allocated</span>
              </div>
              <div className="h-3 w-full rounded-md bg-slate-100 overflow-hidden flex border border-slate-200">
                <div
                  title={`Supplier RTV: ${CalculationEngine.formatINR(rtvTotalNet)}`}
                  className="bg-[#0B4632] transition-all"
                  style={{ width: `${Math.round((rtvTotalNet / Math.max(1, totalRecoverableValue)) * 100)}%` }}
                />
                <div
                  title={`Refurbish & Resale: ${CalculationEngine.formatINR(refurbTotalNet)}`}
                  className="bg-teal-500 transition-all"
                  style={{ width: `${Math.round((refurbTotalNet / Math.max(1, totalRecoverableValue)) * 100)}%` }}
                />
                <div
                  title={`B2B Wholesale Liquidation: ${CalculationEngine.formatINR(liquidateTotalNet)}`}
                  className="bg-amber-400 transition-all"
                  style={{ width: `${Math.round((liquidateTotalNet / Math.max(1, totalRecoverableValue)) * 100)}%` }}
                />
                <div
                  title={`E-Waste Scrap: ${CalculationEngine.formatINR(scrapTotalNet)}`}
                  className="bg-slate-400 transition-all"
                  style={{ width: `${Math.max(1, Math.round((scrapTotalNet / Math.max(1, totalRecoverableValue)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Route Cards with Explicit Economics */}
            <div className="space-y-2.5">
              {/* Route 1: Supplier RTV */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0B4632]" />
                    <span className="font-semibold text-slate-900">Supplier Return (RTV Credit)</span>
                    <span className="font-mono text-slate-500 text-[11px]">({rtvUnitsTotal} units)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Non-recourse credit memo · ~15d settlement SLA · 0% demand risk
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-[#0B4632] tabular-nums">
                    {CalculationEngine.formatINR(rtvTotalNet)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Math.round((rtvTotalNet / Math.max(1, totalRecoverableValue)) * 100)}% of total
                  </div>
                </div>
              </div>

              {/* Route 2: Refurbish */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="font-semibold text-slate-900">Secondary Refurbishment &amp; Resale</span>
                    <span className="font-mono text-slate-500 text-[11px]">({refurbUnitsTotal} units)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    75% resale revenue minus direct technician repair · ~18d cash
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-teal-700 tabular-nums">
                    {CalculationEngine.formatINR(refurbTotalNet)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Math.round((refurbTotalNet / Math.max(1, totalRecoverableValue)) * 100)}% of total
                  </div>
                </div>
              </div>

              {/* Route 3: Liquidation */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-900">B2B Wholesale Liquidation</span>
                    <span className="font-mono text-slate-500 text-[11px]">({liquidateUnitsTotal} units)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    35% procurement cost buyout · 3d wire settlement · zero inventory drag
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-amber-800 tabular-nums">
                    {CalculationEngine.formatINR(liquidateTotalNet)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Math.round((liquidateTotalNet / Math.max(1, totalRecoverableValue)) * 100)}% of total
                  </div>
                </div>
              </div>

              {/* Route 4: Scrap */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="font-semibold text-slate-900">E-Waste Scrap &amp; Salvage</span>
                    <span className="font-mono text-slate-500 text-[11px]">({scrapUnitsTotal} units)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Salvage metals &amp; certified recycling reimbursement
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-slate-700 tabular-nums">
                    {CalculationEngine.formatINR(scrapTotalNet)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Math.round((scrapTotalNet / Math.max(1, totalRecoverableValue)) * 100)}% of total
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Accounting basis: Incremental Net Cash Proceeds (Sunk Cost Isolated)</span>
            <button
              onClick={() => setActiveTab('optimizer')}
              className="text-[#0B4632] hover:underline flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Batch Splitting Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 & 7: DEADLINE URGENCY PANEL & RECENT ACTIVITY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4. Deadline Urgency Panel */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-700 mb-1 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>VENDOR RETURN SLA SCANNER</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Approaching Supplier Return Windows
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('deadlines')}
                className="text-xs text-[#0B4632] hover:underline flex items-center gap-1 font-semibold transition-colors"
              >
                <span>View All Deadlines ({deadlineAlerts.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {deadlineAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    alert.urgency === 'critical'
                      ? 'border-rose-200 bg-rose-50/50'
                      : alert.urgency === 'warning'
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ProductImage sku={alert.sku} size="sm" className="rounded-md border shadow-2xs shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{alert.product_name}</span>
                        <span className="font-mono text-slate-500">({alert.sku})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                        <span>Supplier: <strong className="text-slate-800">{alert.supplier}</strong></span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>Batch: <strong className="font-mono text-slate-800">{alert.supplier_batch}</strong></span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>Eligible: <strong className="font-mono text-[#0B4632] font-semibold">{alert.eligible_units} units</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {CalculationEngine.formatINR(alert.total_credit_at_risk)}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          alert.urgency === 'critical'
                            ? 'text-rose-700'
                            : alert.urgency === 'warning'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {alert.days_remaining >= 0 ? `${alert.days_remaining}d remaining` : alert.urgency.toUpperCase()}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectSkuForOptimizer(alert.sku);
                        setActiveTab('optimizer');
                      }}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 transition-colors shadow-2xs font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Prioritizing high recoverable credit and nearest SLA expiration dates.</span>
            <span className="font-mono text-[#0B4632] font-semibold">100% Deterministic Contract Modeling</span>
          </div>
        </div>

        {/* 7. Recent Activity Timeline */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>AUDIT TIMELINE</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Governance Activity
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('approvals')}
                className="text-xs text-[#0B4632] hover:underline font-semibold transition-colors"
              >
                Ledger ({approvals.length})
              </button>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {approvals.slice(0, 3).map((act) => (
                <div key={act.id} className="relative pl-7 text-xs space-y-1">
                  {/* Timeline Node */}
                  <div
                    className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                      act.status === 'approved'
                        ? 'border-emerald-600'
                        : act.status === 'rejected'
                        ? 'border-rose-600'
                        : 'border-amber-500'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ProductImage sku={act.sku} size="xs" className="rounded border shrink-0" />
                      <span className="font-semibold text-slate-900">{act.product_name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                        act.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : act.status === 'rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    Allocated: {act.total_units} units · Net: <strong className="font-mono text-[#0B4632]">{CalculationEngine.formatINR(act.expected_net_recovery)}</strong>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {act.reviewed_at ? `Reviewed: ${act.reviewed_at}` : `Staged: ${act.created_at}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Simulated Governance: Actions logged in auditable local demo ledger.
          </div>
        </div>
      </div>
    </div>
  );
};
