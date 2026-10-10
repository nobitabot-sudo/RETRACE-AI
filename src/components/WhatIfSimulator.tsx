import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldAlert,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  ChevronRight,
  Send,
  Info,
  Plus,
  Minus,
} from 'lucide-react';
import {
  Product,
  ReturnItem,
  VendorTerms,
  RefurbishmentRule,
  LiquidationRule,
  InventoryRecord,
  ApprovalAction,
  WhatIfSimulationInputs,
} from '../types';
import { WhatIfSimulatorEngine } from '../services/whatIfSimulatorEngine';
import { ProductImage } from './ProductImage';

interface WhatIfSimulatorProps {
  products: Product[];
  returnsList: ReturnItem[];
  vendorTerms: VendorTerms[];
  refurbRules: RefurbishmentRule[];
  liqRules: LiquidationRule[];
  inventory: InventoryRecord[];
  selectedSku: string;
  setSelectedSku: (sku: string) => void;
  onStageApproval?: (action: ApprovalAction) => void;
  onNavigateToApprovals?: () => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  products,
  returnsList,
  vendorTerms,
  refurbRules,
  liqRules,
  inventory,
  selectedSku,
  setSelectedSku,
  onStageApproval,
  onNavigateToApprovals,
}) => {
  const currentProduct = useMemo(
    () => products.find((p) => p.sku === selectedSku) || products[0],
    [products, selectedSku]
  );

  const returnsForSku = useMemo(
    () => returnsList.filter((r) => r.sku === selectedSku),
    [returnsList, selectedSku]
  );

  const totalBatchUnits = returnsForSku.length > 0 ? returnsForSku.length : 40;

  // Initialize simulation inputs from baseline
  const baselineInputs = useMemo(
    () =>
      WhatIfSimulatorEngine.getBaselineInputs(
        selectedSku,
        products,
        vendorTerms,
        refurbRules,
        liqRules,
        inventory,
        returnsList
      ),
    [selectedSku, products, vendorTerms, refurbRules, liqRules, inventory, returnsList]
  );

  const [inputs, setInputs] = useState<WhatIfSimulationInputs>(baselineInputs);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('baseline');
  const [isStaged, setIsStaged] = useState<boolean>(false);

  // When SKU changes, reset inputs to new SKU's baseline
  React.useEffect(() => {
    setInputs(baselineInputs);
    setActiveScenarioId('baseline');
    setIsStaged(false);
  }, [baselineInputs]);

  // Execute simulation deterministically whenever inputs change
  const simulationResult = useMemo(
    () =>
      WhatIfSimulatorEngine.simulate(
        selectedSku,
        inputs,
        products,
        vendorTerms,
        refurbRules,
        liqRules,
        inventory,
        returnsList
      ),
    [selectedSku, inputs, products, vendorTerms, refurbRules, liqRules, inventory, returnsList]
  );

  // Update specific input with boundary validation
  const handleInputChange = <K extends keyof WhatIfSimulationInputs>(
    field: K,
    value: WhatIfSimulationInputs[K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
    setActiveScenarioId('custom');
    setIsStaged(false);
  };

  // Preset scenario selector
  const handleSelectScenario = (scenarioId: string) => {
    const scenario = WhatIfSimulatorEngine.DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setInputs((prev) => ({
      ...prev,
      ...scenario.inputs,
    }));
    setActiveScenarioId(scenarioId);
    setIsStaged(false);
  };

  // Reset to Baseline
  const handleResetToBaseline = () => {
    setInputs(baselineInputs);
    setActiveScenarioId('baseline');
    setIsStaged(false);
  };

  // Stage in Approval Centre
  const handleStageProposal = () => {
    if (!onStageApproval) return;

    const action: ApprovalAction = {
      id: `SIM-APPV-${Date.now()}-${selectedSku.slice(0, 4)}`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sku: currentProduct.sku,
      product_name: currentProduct.name,
      supplier_batch: returnsForSku[0]?.supplier_batch || 'HB-09',
      total_units: simulationResult.allocation.total,
      allocations: {
        rtv: simulationResult.allocation.rtv,
        refurb: simulationResult.allocation.refurb,
        liquidate: simulationResult.allocation.liquidate,
        scrap: simulationResult.allocation.scrap,
      },
      expected_net_recovery: simulationResult.totalNetProceeds,
      weighted_days_to_cash: simulationResult.weightedTimeToCashDays,
      primary_rationale: `[What-If Simulation] ${simulationResult.recommendationHeadline} ${simulationResult.recommendationExplanation}`,
      key_assumptions: [
        `Supplier credit rate simulated at ${inputs.supplierCreditPct}% (${simulationResult.allocation.rtv} units eligible).`,
        `Refurbishment bench cost set to ₹${inputs.refurbCost}/unit with ${inputs.refurbResalePct}% secondary market realization.`,
        `Liquidation recovery assumption: ${inputs.liquidationRecoveryPct}% of cost.`,
        `Deterministic engine confidence: 100% mathematical invariant.`,
      ],
      status: 'pending',
      is_simulated: true,
    };

    onStageApproval(action);
    setIsStaged(true);
  };

  // Delta helpers
  const formatDeltaINR = (val: number) => {
    const abs = Math.abs(val);
    const formatted = Math.round(abs).toLocaleString('en-IN');
    if (val > 0) return `+₹${formatted}`;
    if (val < 0) return `-₹${formatted}`;
    return '₹0';
  };

  const formatDeltaDays = (days: number) => {
    if (days > 0) return `+${days}d`;
    if (days < 0) return `${days}d`;
    return '0d';
  };

  const { delta, routes, allocation, validation } = simulationResult;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Live Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-start gap-4">
          <ProductImage
            sku={currentProduct.sku}
            product={currentProduct}
            name={currentProduct.name}
            category={currentProduct.category}
            size="lg"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#0B4632]">
              <span>LIVE RECOVERY SIMULATOR</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">{currentProduct.sku}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              What-If Scenario &amp; Tipping-Point Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Simulate vendor SLA renegotiations, bench repair tooling spikes, and secondary market demand traps for{' '}
              <strong className="text-slate-800">{currentProduct.name}</strong>. All route calculations update in real-time.
            </p>
          </div>
        </div>

        {/* Global Controls & SKU Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#0B4632] transition-colors cursor-pointer shadow-2xs"
            >
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} — {p.name.slice(0, 22)}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
          </div>

          <button
            onClick={handleResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-medium text-slate-700 transition-all"
            title="Reset all simulation sliders to actual catalog & contract values"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset to Actuals
          </button>
        </div>
      </div>

      {/* 3-Tier Legend & Visual Distinction Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-sky-50 border border-sky-200 text-sky-900">
          <div className="p-1 rounded bg-sky-100 text-sky-700">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] text-sky-800">
              [ACTUAL SUPPLIED DATA]
            </div>
            <div className="text-[11px] text-sky-800 font-sans">
              Cost ₹{currentProduct.cost}, SRP ₹{currentProduct.selling_price}, Batch {returnsForSku[0]?.supplier_batch || 'HB-09'} ({totalBatchUnits} units)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-900">
          <div className="p-1 rounded bg-amber-100 text-amber-700">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
              [SIMULATED ASSUMPTIONS]
            </div>
            <div className="text-[11px] text-amber-800 font-sans">
              User-adjusted credit %, bench costs, resale prices &amp; inventory overhang
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900">
          <div className="p-1 rounded bg-emerald-100 text-emerald-700">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] text-emerald-800">
              [DETERMINISTIC ENGINE]
            </div>
            <div className="text-[11px] text-emerald-800 font-sans">
              Mathematical batch optimization, SLA window bounds &amp; marginal net realization
            </div>
          </div>
        </div>
      </div>

      {/* Preset Demonstration Scenarios (Interactive 1-Click Tipping Points) */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#0B4632]" />
            Interactive Tipping-Point Demonstrations (1-Click Presets)
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {WhatIfSimulatorEngine.DEMO_SCENARIOS.length} Scenarios Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {WhatIfSimulatorEngine.DEMO_SCENARIOS.map((sc) => {
            const isActive = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-[#0B4632] border border-emerald-300'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {sc.badge}
                  </span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </div>
                <div
                  className={`text-xs font-semibold leading-snug line-clamp-2 ${
                    isActive ? 'text-[#0B4632]' : 'text-slate-800'
                  }`}
                >
                  {sc.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Simulation Assumption Sliders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Simulated Assumptions Console</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                [SIMULATED]
              </span>
            </div>

            {/* Validation Errors & Warnings */}
            {!validation.isValid && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1 text-xs text-rose-800 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Invalid Simulation Parameters Rejected:
                </div>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                  {Object.entries(validation.errors).map(([key, err]) => (
                    <li key={key}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                <div className="space-y-0.5">
                  {validation.warnings.map((w, idx) => (
                    <div key={idx} className="text-[11px]">
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Controls */}
            <div className="space-y-4 text-xs">
              {/* 1. Supplier Credit Percentage */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>1. Supplier Credit Rate</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Contract: {baselineInputs.supplierCreditPct}%)</span>
                  </label>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {inputs.supplierCreditPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={inputs.supplierCreditPct}
                  onChange={(e) => handleInputChange('supplierCreditPct', Number(e.target.value))}
                  className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>₹0/unit (0%)</span>
                  <span className="text-[#0B4632] font-semibold">
                    ₹{Math.round(currentProduct.cost * (inputs.supplierCreditPct / 100))}/unit
                  </span>
                  <span>₹{currentProduct.cost}/unit (100%)</span>
                </div>
              </div>

              {/* 2. Eligible Return Quantity */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>2. Eligible Return Quantity</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Actual: {baselineInputs.eligibleReturnQty} of {totalBatchUnits})</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleInputChange(
                          'eligibleReturnQty',
                          Math.max(0, inputs.eligibleReturnQty - 1)
                        )
                      }
                      className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold"
                      title="Decrease by 1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-amber-800 text-sm min-w-8 text-center">
                      {inputs.eligibleReturnQty}
                    </span>
                    <button
                      onClick={() =>
                        handleInputChange(
                          'eligibleReturnQty',
                          Math.min(totalBatchUnits, inputs.eligibleReturnQty + 1)
                        )
                      }
                      className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold"
                      title="Increase by 1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={totalBatchUnits}
                  step="1"
                  value={inputs.eligibleReturnQty}
                  onChange={(e) => handleInputChange('eligibleReturnQty', Number(e.target.value))}
                  className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>0 units (All expired)</span>
                  <span className="text-slate-700">
                    Expired: {Math.max(0, totalBatchUnits - inputs.eligibleReturnQty)} units
                  </span>
                  <span>{totalBatchUnits} units (100% eligible)</span>
                </div>
              </div>

              {/* 3. Refurbishment Direct Bench Cost */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>3. Refurb Bench Cost</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Baseline: ₹{baselineInputs.refurbCost})</span>
                  </label>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    ₹{inputs.refurbCost}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1800"
                  step="25"
                  value={inputs.refurbCost}
                  onChange={(e) => handleInputChange('refurbCost', Number(e.target.value))}
                  className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>₹0 (Free QA)</span>
                  <span className="text-amber-800 font-semibold">
                    Net: ₹{Math.round(currentProduct.selling_price * (inputs.refurbResalePct / 100)) - inputs.refurbCost}/unit
                  </span>
                  <span>₹1,800 (Spike)</span>
                </div>
              </div>

              {/* 4. Refurbishment Resale Percentage */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>4. Refurb Resale Price %</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Baseline: {baselineInputs.refurbResalePct}%)</span>
                  </label>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {inputs.refurbResalePct}% (₹{Math.round(currentProduct.selling_price * (inputs.refurbResalePct / 100))})
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={inputs.refurbResalePct}
                  onChange={(e) => handleInputChange('refurbResalePct', Number(e.target.value))}
                  className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>30% (₹{Math.round(currentProduct.selling_price * 0.3)})</span>
                  <span>65% (₹{Math.round(currentProduct.selling_price * 0.65)})</span>
                  <span>95% (₹{Math.round(currentProduct.selling_price * 0.95)})</span>
                </div>
              </div>

              {/* 5. Refurbishment Turnaround Duration */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>5. Bench Turnaround Days</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Baseline: {baselineInputs.refurbDurationDays}d)</span>
                  </label>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {inputs.refurbDurationDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="45"
                  step="1"
                  value={inputs.refurbDurationDays}
                  onChange={(e) => handleInputChange('refurbDurationDays', Number(e.target.value))}
                  className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>3 days (Express)</span>
                  <span>14 days</span>
                  <span>45 days (Backlogged)</span>
                </div>
              </div>

              {/* 6. Liquidation Recovery Percentage */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>6. Liquidation Recovery %</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Baseline: {baselineInputs.liquidationRecoveryPct}%)</span>
                  </label>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {inputs.liquidationRecoveryPct}% (₹{Math.round(currentProduct.cost * (inputs.liquidationRecoveryPct / 100))})
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  value={inputs.liquidationRecoveryPct}
                  onChange={(e) => handleInputChange('liquidationRecoveryPct', Number(e.target.value))}
                  className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>10% (Distressed)</span>
                  <span>35% (Standard B2B)</span>
                  <span>70% (Premium lot)</span>
                </div>
              </div>

              {/* 7. Demand Constraints */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>7. Demand &amp; Cannibalization Constraints</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Coverage: {Math.round(inputs.newStockOnHand / Math.max(0.1, inputs.avgDailyDemand))}d
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">
                      Avg Daily Demand: <span className="font-mono font-bold text-slate-800">{inputs.avgDailyDemand}</span>/day
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={inputs.avgDailyDemand}
                      onChange={(e) => handleInputChange('avgDailyDemand', Number(e.target.value))}
                      className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">
                      New Stock on Hand: <span className="font-mono font-bold text-slate-800">{inputs.newStockOnHand}</span> units
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      step="20"
                      value={inputs.newStockOnHand}
                      onChange={(e) => handleInputChange('newStockOnHand', Number(e.target.value))}
                      className="w-full accent-[#0B4632] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono pt-1">
                  <span>Demand Trap Threshold: {inputs.demandTrapDaysThreshold} Days</span>
                  <span
                    className={
                      inputs.newStockOnHand / Math.max(0.1, inputs.avgDailyDemand) >
                      inputs.demandTrapDaysThreshold
                        ? 'text-rose-700 font-bold'
                        : 'text-emerald-700 font-semibold'
                    }
                  >
                    {inputs.newStockOnHand / Math.max(0.1, inputs.avgDailyDemand) >
                    inputs.demandTrapDaysThreshold
                      ? '⚠ TRAPPED: Refurb Blocked'
                      : '✓ Healthy Coverage'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Recalculations */}
        <div className="lg:col-span-7 space-y-4">
          {/* Financial KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Net Recovery */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Net Proceeds</span>
                <span className="font-mono text-[10px] text-slate-400">
                  Base: ₹{simulationResult.baseline.totalNetProceeds.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                ₹{simulationResult.totalNetProceeds.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-mono flex items-center gap-1">
                <span
                  className={
                    delta.netProceedsDiff >= 0
                      ? 'text-[#0B4632] font-bold'
                      : 'text-rose-700 font-bold'
                  }
                >
                  {formatDeltaINR(delta.netProceedsDiff)}
                </span>
                <span className="text-slate-400">
                  ({delta.netProceedsPctDiff > 0 ? `+${delta.netProceedsPctDiff}%` : `${delta.netProceedsPctDiff}%`})
                </span>
              </div>
            </div>

            {/* 2. Gross Recovery */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Gross Value</span>
                <span className="font-mono text-[10px] text-slate-400">
                  Base: ₹{simulationResult.baseline.totalGrossRecovery.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-800">
                ₹{simulationResult.totalGrossRecovery.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Δ {formatDeltaINR(delta.grossDiff)}
              </div>
            </div>

            {/* 3. Direct Costs */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Bench Costs</span>
                <span className="font-mono text-[10px] text-slate-400">
                  Base: ₹{simulationResult.baseline.totalDirectCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-amber-800">
                ₹{simulationResult.totalDirectCost.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Δ {formatDeltaINR(delta.costDiff)}
              </div>
            </div>

            {/* 4. Weighted Time-to-Cash */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Time-to-Cash</span>
                <span className="font-mono text-[10px] text-slate-400">
                  Base: {simulationResult.baseline.weightedTimeToCashDays}d
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {simulationResult.weightedTimeToCashDays} Days
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Δ {formatDeltaDays(delta.timeToCashDiffDays)}
              </div>
            </div>
          </div>

          {/* Forensic "What Changed & Why" Explanation Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0B4632]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Deterministic Recommendation Analysis
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {delta.routeRecommendationChanged && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    ★ OPTIMAL STRATEGY FLIPPED
                  </span>
                )}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#0B4632] border border-emerald-200 font-semibold">
                  [DETERMINISTIC FORMULA]
                </span>
              </div>
            </div>

            {/* Headline Banner */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-[#0B4632] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{simulationResult.recommendationHeadline}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {simulationResult.recommendationExplanation}
              </p>
            </div>

            {/* Economic Tipping Points & Trade-offs */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Economic Tipping Points &amp; Sensitivity Bounds:
              </div>
              <div className="space-y-1 text-xs font-mono">
                {simulationResult.detailedEconomicTippingPoints.map((tp, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[11px] flex items-start gap-2"
                  >
                    <ArrowRight className="w-3 h-3 text-[#0B4632] mt-0.5 shrink-0" />
                    <span>{tp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feasible Batch Allocation Split Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Layers className="w-3.5 h-3.5 text-[#0B4632]" />
                Feasible Batch Allocation: {totalBatchUnits} Units Total
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] font-semibold">
                <span className="text-sky-700">RTV: {allocation.rtv}</span>
                <span className="text-[#0B4632]">Refurb: {allocation.refurb}</span>
                <span className="text-amber-700">Liq: {allocation.liquidate}</span>
                <span className="text-slate-500">Scrap: {allocation.scrap}</span>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="h-5 w-full rounded-md bg-slate-100 overflow-hidden flex border border-slate-200">
              {allocation.rtv > 0 && (
                <div
                  style={{ width: `${(allocation.rtv / totalBatchUnits) * 100}%` }}
                  className="bg-sky-600 text-white transition-all flex items-center justify-center text-[10px] font-mono font-bold"
                  title={`Supplier Return: ${allocation.rtv} units`}
                >
                  {allocation.rtv >= 4 && `${allocation.rtv} RTV`}
                </div>
              )}
              {allocation.refurb > 0 && (
                <div
                  style={{ width: `${(allocation.refurb / totalBatchUnits) * 100}%` }}
                  className="bg-emerald-600 text-white transition-all flex items-center justify-center text-[10px] font-mono font-bold"
                  title={`Refurbish: ${allocation.refurb} units`}
                >
                  {allocation.refurb >= 4 && `${allocation.refurb} Refurb`}
                </div>
              )}
              {allocation.liquidate > 0 && (
                <div
                  style={{ width: `${(allocation.liquidate / totalBatchUnits) * 100}%` }}
                  className="bg-amber-500 text-white transition-all flex items-center justify-center text-[10px] font-mono font-bold"
                  title={`Bulk Liquidation: ${allocation.liquidate} units`}
                >
                  {allocation.liquidate >= 4 && `${allocation.liquidate} Liq`}
                </div>
              )}
              {allocation.scrap > 0 && (
                <div
                  style={{ width: `${(allocation.scrap / totalBatchUnits) * 100}%` }}
                  className="bg-slate-400 text-white transition-all flex items-center justify-center text-[10px] font-mono font-bold"
                  title={`Scrap: ${allocation.scrap} units`}
                >
                  {allocation.scrap >= 4 && `${allocation.scrap} Scrap`}
                </div>
              )}
            </div>
          </div>

          {/* 4 Recovery Routes Detailed Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Route 1: Supplier Return */}
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                routes.rtv.allocatedUnits > 0
                  ? 'bg-sky-50/60 border-sky-300'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-sky-900">
                  1. Supplier Return (RTV)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 font-semibold">
                  {routes.rtv.allocatedUnits} Units Allocated
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Unit Net Credit:</span>
                  <span className="text-slate-900 font-semibold">₹{routes.rtv.unitNetProceeds}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Total Route Credit:</span>
                  <span className="text-sky-900 font-bold">
                    ₹{routes.rtv.totalNetProceeds.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Time-to-Cash:</span>
                  <span className="text-slate-700">{routes.rtv.timeToCashDays} Days (Ledger)</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-snug border-t border-slate-200">
                  {routes.rtv.notes}
                </p>
              </div>
            </div>

            {/* Route 2: Refurbishment */}
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                routes.refurb.allocatedUnits > 0
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-emerald-900">
                  2. Refurbish &amp; Secondary Resale
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                  {routes.refurb.allocatedUnits} Units Allocated
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Unit Net (Gross - Cost):</span>
                  <span className="text-slate-900 font-semibold">
                    ₹{routes.refurb.unitNetProceeds} (₹{routes.refurb.unitGross} - ₹{routes.refurb.unitDirectCost})
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Total Route Net:</span>
                  <span className="text-[#0B4632] font-bold">
                    ₹{routes.refurb.totalNetProceeds.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Time-to-Cash:</span>
                  <span className="text-slate-700">{routes.refurb.timeToCashDays} Days (Bench + Sales)</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-snug border-t border-slate-200">
                  {routes.refurb.notes}
                </p>
              </div>
            </div>

            {/* Route 3: Bulk B2B Liquidation */}
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                routes.liquidate.allocatedUnits > 0
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-amber-900">
                  3. Bulk B2B Liquidation
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                  {routes.liquidate.allocatedUnits} Units Allocated
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Unit Net Proceeds:</span>
                  <span className="text-slate-900 font-semibold">₹{routes.liquidate.unitNetProceeds}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Total Route Net:</span>
                  <span className="text-amber-800 font-bold">
                    ₹{routes.liquidate.totalNetProceeds.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Time-to-Cash:</span>
                  <span className="text-slate-700">{routes.liquidate.timeToCashDays} Days (Wholesale)</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-snug border-t border-slate-200">
                  {routes.liquidate.notes}
                </p>
              </div>
            </div>

            {/* Route 4: Certified Scrap */}
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                routes.scrap.allocatedUnits > 0
                  ? 'bg-slate-100 border-slate-300'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-800">
                  4. Certified Recycling Scrap
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 font-semibold">
                  {routes.scrap.allocatedUnits} Units Allocated
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Unit Net Salvage:</span>
                  <span className="text-slate-900 font-semibold">₹{routes.scrap.unitNetProceeds}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Total Route Net:</span>
                  <span className="text-slate-700 font-bold">
                    ₹{routes.scrap.totalNetProceeds.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Time-to-Cash:</span>
                  <span className="text-slate-700">{routes.scrap.timeToCashDays} Days</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-snug border-t border-slate-200">
                  {routes.scrap.notes}
                </p>
              </div>
            </div>
          </div>

          {/* Missing Information & Real-World Risks Panel */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Missing Information &amp; Operational Uncertainties
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 font-sans">
              {simulationResult.missingInformation.map((info, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-start gap-2"
                >
                  <span className="text-amber-700 font-mono font-bold">[{idx + 1}]</span>
                  <span>{info}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Action Bar: Stage into Governance / Approval Centre */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ready to Authorize Simulated Recovery Plan?
              </div>
              <div className="text-[11px] text-slate-500">
                Transfers this simulated plan (₹{simulationResult.totalNetProceeds.toLocaleString('en-IN')}) into the Manager Approval Queue for executive sign-off.
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isStaged ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#0B4632] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300">
                    ✓ Proposal Staged in Ledger
                  </span>
                  {onNavigateToApprovals && (
                    <button
                      onClick={onNavigateToApprovals}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                    >
                      View in Approvals →
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleStageProposal}
                  disabled={!validation.isValid}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    validation.isValid
                      ? 'bg-[#0B4632] hover:bg-[#073022] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Stage Proposal for Approval
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
