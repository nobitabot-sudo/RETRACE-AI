import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Info,
  ShieldAlert,
  Send,
  Sparkles,
  Bookmark,
  Scale,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CalculationEngine } from '../services/calculationEngine';
import { FinancialRecoveryEngine } from '../services/financialRecoveryEngine';
import { ProductImage } from './ProductImage';
import {
  Product,
  ReturnItem,
  VendorTerms,
  RefurbishmentRule,
  LiquidationRule,
  InventoryRecord,
  ApprovalAction,
  CandidateAllocationComparison,
  DraftAllocationRecord,
} from '../types';

interface RecoveryOptimizerProps {
  products: Product[];
  returnsList: ReturnItem[];
  vendorTerms: VendorTerms[];
  refurbRules: RefurbishmentRule[];
  liqRules: LiquidationRule[];
  inventory: InventoryRecord[];
  selectedSku: string;
  setSelectedSku: (sku: string) => void;
  onStageApproval: (action: ApprovalAction) => void;
  onOpenSimulator?: () => void;
}

export const RecoveryOptimizer: React.FC<RecoveryOptimizerProps> = ({
  products,
  returnsList,
  vendorTerms,
  refurbRules,
  liqRules,
  inventory,
  selectedSku,
  setSelectedSku,
  onStageApproval,
  onOpenSimulator,
}) => {
  const currentProduct = useMemo(
    () => products.find((p) => p.sku === selectedSku) || products[0],
    [products, selectedSku]
  );

  const returnsForSku = useMemo(
    () => returnsList.filter((r) => r.sku === currentProduct.sku),
    [returnsList, currentProduct]
  );

  const totalUnits = returnsForSku.length;

  const currentTerms = useMemo(
    () => vendorTerms.find((v) => v.sku === currentProduct.sku),
    [vendorTerms, currentProduct]
  );

  // Retrieve complete batch inputs
  const batchInput = useMemo(() => {
    return FinancialRecoveryEngine.getBatchInput({
      sku: currentProduct.sku,
      products,
      vendorTermsList: vendorTerms,
      refurbRules,
      liqRules,
      inventoryList: inventory,
      returnsList,
    });
  }, [currentProduct.sku, products, vendorTerms, refurbRules, liqRules, inventory, returnsList]);

  const eligibleRtvUnits = batchInput.eligibleQuantity;

  // Baseline optimal split from calculation engine
  const baseOptimal = useMemo(() => {
    return CalculationEngine.optimizeBatch(
      currentProduct.sku,
      products,
      vendorTerms,
      refurbRules,
      liqRules,
      inventory,
      returnsList
    );
  }, [currentProduct.sku, products, vendorTerms, refurbRules, liqRules, inventory, returnsList]);

  // User interactive allocations state
  const [allocRtv, setAllocRtv] = useState<number>(baseOptimal.allocations.rtvUnits);
  const [allocRefurb, setAllocRefurb] = useState<number>(baseOptimal.allocations.refurbUnits);
  const [allocLiquidate, setAllocLiquidate] = useState<number>(baseOptimal.allocations.liquidateUnits);
  const [allocScrap, setAllocScrap] = useState<number>(baseOptimal.allocations.scrapUnits);

  // Modal / Drawer states
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [draftsList, setDraftsList] = useState<DraftAllocationRecord[]>([]);

  // Notifications
  const [feedbackToast, setFeedbackToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  // Sync state whenever selectedSku changes or baseline changes
  useEffect(() => {
    setAllocRtv(baseOptimal.allocations.rtvUnits);
    setAllocRefurb(baseOptimal.allocations.refurbUnits);
    setAllocLiquidate(baseOptimal.allocations.liquidateUnits);
    setAllocScrap(baseOptimal.allocations.scrapUnits);
  }, [selectedSku, baseOptimal]);

  // Load existing drafts from backend on mount or SKU change
  useEffect(() => {
    fetch(`/api/optimizer/drafts?sku=${encodeURIComponent(selectedSku)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.drafts) {
          setDraftsList(data.drafts);
        }
      })
      .catch(() => {});
  }, [selectedSku]);

  const allocatedTotal = allocRtv + allocRefurb + allocLiquidate + allocScrap;
  const unallocatedUnits = Math.max(0, totalUnits - allocatedTotal);
  const isAllocationEqualTotal = allocatedTotal === totalUnits;
  const isOverAllocated = allocatedTotal > totalUnits;
  const isRtvOverLimit = allocRtv > eligibleRtvUnits;
  const isNegative = allocRtv < 0 || allocRefurb < 0 || allocLiquidate < 0 || allocScrap < 0;

  const isFormValid = isAllocationEqualTotal && !isRtvOverLimit && !isNegative && totalUnits > 0;

  // Real-time calculation with user custom allocations
  const currentResult = useMemo(() => {
    return CalculationEngine.optimizeBatch(
      currentProduct.sku,
      products,
      vendorTerms,
      refurbRules,
      liqRules,
      inventory,
      returnsList,
      {
        rtvUnits: allocRtv,
        refurbUnits: allocRefurb,
        liquidateUnits: allocLiquidate,
        scrapUnits: allocScrap,
      }
    );
  }, [
    currentProduct.sku,
    products,
    vendorTerms,
    refurbRules,
    liqRules,
    inventory,
    returnsList,
    allocRtv,
    allocRefurb,
    allocLiquidate,
    allocScrap,
  ]);

  // Handlers
  const handleOptimizeAllocation = () => {
    setAllocRtv(baseOptimal.allocations.rtvUnits);
    setAllocRefurb(baseOptimal.allocations.refurbUnits);
    setAllocLiquidate(baseOptimal.allocations.liquidateUnits);
    setAllocScrap(baseOptimal.allocations.scrapUnits);
    showToast(`Applied optimal allocation for ${currentProduct.sku}.`);
  };

  const handleResetToRecommended = () => {
    setAllocRtv(baseOptimal.allocations.rtvUnits);
    setAllocRefurb(baseOptimal.allocations.refurbUnits);
    setAllocLiquidate(baseOptimal.allocations.liquidateUnits);
    setAllocScrap(baseOptimal.allocations.scrapUnits);
    showToast('Reset allocation sliders to algorithm recommendation.');
  };

  const handleSaveAsDraft = async () => {
    if (isOverAllocated || isNegative) {
      showToast('Cannot save draft: Allocation violates quantity constraints.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/optimizer/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: currentProduct.sku,
          scenario_name: `Allocation ${allocRtv} RTV / ${allocRefurb} Refurb / ${allocLiquidate} Liq`,
          notes: `Draft saved with projected net recovery of ${CalculationEngine.formatINR(
            currentResult.totalNetRecovery
          )}.`,
          allocations: {
            rtvUnits: allocRtv,
            refurbUnits: allocRefurb,
            liquidateUnits: allocLiquidate,
            scrapUnits: allocScrap,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.draft) {
          setDraftsList((prev) => [json.draft, ...prev]);
        }
        showToast(
          `Draft allocation for ${currentProduct.sku} persisted to backend database.`,
          'success'
        );
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to save draft on server.', 'error');
      }
    } catch {
      const localDraft: DraftAllocationRecord = {
        id: `DRAFT-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        sku: currentProduct.sku,
        product_name: currentProduct.name,
        supplier_batch: batchInput.supplierBatch,
        total_units: totalUnits,
        allocations: {
          rtv: allocRtv,
          refurb: allocRefurb,
          liquidate: allocLiquidate,
          scrap: allocScrap,
          unallocated: unallocatedUnits,
        },
        totalGrossRecovery: currentResult.totalGrossRecovery,
        totalDirectCosts: currentResult.totalDirectCost,
        totalNetRecovery: currentResult.totalNetRecovery,
        weightedTimeToCashDays: currentResult.weightedTimeToCashDays,
        scenario_name: `Local Draft (${allocRtv} RTV / ${allocRefurb} Refurb)`,
      };
      setDraftsList((prev) => [localDraft, ...prev]);
      showToast(`Draft saved locally in session ledger.`, 'success');
    }
  };

  const handleSubmitForApproval = async () => {
    if (!isFormValid) {
      if (isRtvOverLimit) {
        showToast(
          `Cannot submit: Allocated ${allocRtv} RTV units exceeds eligible ${eligibleRtvUnits} units.`,
          'error'
        );
      } else if (!isAllocationEqualTotal) {
        showToast(
          `Cannot submit: Allocated units (${allocatedTotal}) must equal available units (${totalUnits}).`,
          'error'
        );
      }
      return;
    }

    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: currentProduct.sku,
          allocations: {
            rtvUnits: allocRtv,
            refurbUnits: allocRefurb,
            liquidateUnits: allocLiquidate,
            scrapUnits: allocScrap,
          },
          reviewerNotes: `Submitted from Recovery Optimizer. Projected net recovery: ${CalculationEngine.formatINR(
            currentResult.totalNetRecovery
          )}.`,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.action) {
          onStageApproval(json.action);
        }
        showToast(
          `Allocation successfully validated on backend and staged in Approval Centre!`,
          'success'
        );
      } else {
        const err = await response.json();
        showToast(err.error || 'Server rejected allocation submission.', 'error');
      }
    } catch {
      const action: ApprovalAction = {
        id: `APP-ACT-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        sku: currentProduct.sku,
        product_name: currentProduct.name,
        supplier_batch: batchInput.supplierBatch,
        total_units: totalUnits,
        allocations: {
          rtv: allocRtv,
          refurb: allocRefurb,
          liquidate: allocLiquidate,
          scrap: allocScrap,
          unallocated: unallocatedUnits,
        },
        expected_net_recovery: currentResult.totalNetRecovery,
        weighted_days_to_cash: currentResult.weightedTimeToCashDays,
        primary_rationale: currentResult.recommendationExplanation,
        key_assumptions:
          currentResult.caveats.length > 0
            ? currentResult.caveats
            : currentResult.routes.rtv.assumptions,
        status: 'pending',
        is_simulated: true,
      };
      onStageApproval(action);
      showToast(`Allocation plan for ${currentProduct.sku} staged in Approval Centre!`, 'success');
    }
  };

  const handleApplyScenario = (scenario: CandidateAllocationComparison) => {
    setAllocRtv(scenario.allocation.rtv);
    setAllocRefurb(scenario.allocation.refurb);
    setAllocLiquidate(scenario.allocation.liquidate);
    setAllocScrap(scenario.allocation.scrap);
    setIsCompareModalOpen(false);
    showToast(`Applied scenario: "${scenario.name}" to allocation editor.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : feedbackToast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            ) : feedbackToast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Product/Batch Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
            <span>INTELLIGENT BATCH SPLITTING ENGINE</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Multi-Route Capital Recovery</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Recovery Optimizer &amp; Batch Allocation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
            Distribute returned batches among Supplier Return, Refurbishment, and Liquidation.
            Evaluates marginal net incremental recovery, contractual windows, and inventory velocity.
          </p>
        </div>

        {/* Action Controls Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="sku-select" className="text-xs font-semibold text-slate-600 shrink-0">
            Batch:
          </label>
          <select
            id="sku-select"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] shadow-2xs"
          >
            {products.map((p) => {
              const count = returnsList.filter((r) => r.sku === p.sku).length;
              return (
                <option key={p.sku} value={p.sku}>
                  {p.name} ({count} units) · {p.sku}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all shadow-2xs"
            title="Compare candidate alternative strategies side-by-side"
          >
            <Scale className="w-3.5 h-3.5 text-slate-600" />
            <span>Compare Scenarios</span>
          </button>

          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-all shadow-2xs"
              title="Open What-If Simulator"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0B4632]" />
              <span className="hidden sm:inline">What-If Simulator</span>
            </button>
          )}
        </div>
      </div>

      {/* PART 1: Comprehensive Product and Batch Information Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ProductImage
              sku={batchInput.sku}
              product={currentProduct}
              name={batchInput.productName}
              category={batchInput.category}
              size="lg"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">{batchInput.productName}</span>
                <span className="text-xs font-mono text-[#0B4632] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  {batchInput.sku}
                </span>
                <span className="text-xs font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                  Batch: {batchInput.supplierBatch}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 font-sans">
                <span>Supplier: <strong className="text-slate-900">{batchInput.supplier}</strong></span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Category: <strong className="text-slate-900">{batchInput.category}</strong></span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Primary Grade: <strong className="text-slate-900 font-mono">{batchInput.primaryGrade}</strong></span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Primary Reason: <strong className="text-slate-900">{batchInput.primaryReason}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBatchDetails(!showBatchDetails)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>{showBatchDetails ? 'Hide Catalog Specs' : 'View Full Catalog Inputs'}</span>
              {showBatchDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Key Metrics Quick Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Returned</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{batchInput.totalReturnedQty} units</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Original Unit Cost</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{CalculationEngine.formatINR(batchInput.originalProductCost)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">New Retail Price</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{CalculationEngine.formatINR(batchInput.newSellingPrice)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
            <div className="text-[10px] text-emerald-800 uppercase font-semibold">RTV Eligible</div>
            <div className="text-sm font-bold text-[#0B4632] mt-0.5">
              {batchInput.eligibleQuantity} units ({batchInput.supplierCreditPct ?? 0}% credit)
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Warehouse Stock</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {batchInput.currentInventoryStock ?? 'Unknown'} units
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Stock Coverage</div>
            <div className="text-sm font-bold text-amber-800 mt-0.5">
              {batchInput.inventoryCoverageDays !== null ? `${batchInput.inventoryCoverageDays} days` : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Collapsible Full Specs Detail Panel */}
        {showBatchDetails && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/40 border border-emerald-200">
              <span className="font-semibold text-[#0B4632] block font-mono">Supplier Return Terms:</span>
              <ul className="space-y-1 text-slate-700">
                <li>• Contract RTV Allowed: {batchInput.supplierReturnEligibility ? 'Yes' : 'No / Void'}</li>
                <li>• Credit Percentage: {batchInput.supplierCreditPct !== null ? `${batchInput.supplierCreditPct}% of original cost` : 'N/A'}</li>
                <li>• Unit Gross Credit: {batchInput.unitSupplierCredit !== null ? CalculationEngine.formatINR(batchInput.unitSupplierCredit) : '₹0'}</li>
                <li>• Return Window: {batchInput.vendorReturnDeadlineDays !== null ? `${batchInput.vendorReturnDeadlineDays} days from return` : 'N/A'}</li>
                <li>• Eligible Units: <strong className="text-[#0B4632]">{batchInput.eligibleQuantity}</strong> / Expired: <strong className="text-rose-700">{batchInput.expiredQuantity}</strong></li>
              </ul>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-teal-50/40 border border-teal-200">
              <span className="font-semibold text-teal-800 block font-mono">Refurbishment &amp; Resale Terms:</span>
              <ul className="space-y-1 text-slate-700">
                <li>• Direct Bench Cost: {batchInput.refurbishmentCost !== null ? CalculationEngine.formatINR(batchInput.refurbishmentCost) : 'Unconfigured'}</li>
                <li>• Bench Turnaround: {batchInput.refurbishmentDurationDays !== null ? `${batchInput.refurbishmentDurationDays} calendar days` : 'N/A'}</li>
                <li>• Resale Price: {batchInput.expectedRefurbishedResalePct !== null ? `${batchInput.expectedRefurbishedResalePct}% of new selling price (${CalculationEngine.formatINR(batchInput.expectedRefurbResalePrice || 0)})` : 'N/A'}</li>
                <li>• Net Unit Recovery before holding: <strong className="text-teal-800">{batchInput.unitRefurbNetBeforeRisk !== null ? CalculationEngine.formatINR(batchInput.unitRefurbNetBeforeRisk) : '₹0'}</strong></li>
              </ul>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/40 border border-amber-200">
              <span className="font-semibold text-amber-800 block font-mono">Liquidation &amp; Demand Context:</span>
              <ul className="space-y-1 text-slate-700">
                <li>• Liquidation Recovery: {batchInput.liquidationRecoveryPct}% of cost ({CalculationEngine.formatINR(batchInput.unitLiquidationProceeds || 0)}/unit)</li>
                <li>• Average Daily Demand: {batchInput.avgDailyDemand !== null ? `${batchInput.avgDailyDemand} units/day` : 'Unknown'}</li>
                <li>• Inventory Coverage: {batchInput.inventoryCoverageDays !== null ? `${batchInput.inventoryCoverageDays} days coverage` : 'Unknown'}</li>
                <li>• Demand Feasibility: {batchInput.inventoryCoverageDays && batchInput.inventoryCoverageDays > 120 ? 'High Dead-Stock Trap' : 'Normal Demand'}</li>
              </ul>
            </div>

            {batchInput.unavailableFields.length > 0 && (
              <div className="md:col-span-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Missing or Incomplete Records &amp; Operational Impact:</span>
                </span>
                <div className="space-y-1 mt-1">
                  {batchInput.unavailableFields.map((uf, idx) => (
                    <div key={idx} className="text-slate-600">
                      <strong className="text-slate-800">{uf.field}:</strong> {uf.impactOnRecommendation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Route Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Route 1: Supplier Return */}
        <div
          className={`rounded-xl border p-4 space-y-3 transition-all shadow-xs ${
            allocRtv > 0 ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0B4632] uppercase tracking-wider font-mono">
              1. Supplier Return (RTV)
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                eligibleRtvUnits > 0
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {eligibleRtvUnits > 0 ? `${eligibleRtvUnits} Eligible` : 'Ineligible'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {CalculationEngine.formatINR(currentResult.routes.rtv.unitNetRecovery)}
              <span className="text-xs font-sans text-slate-500 font-normal ml-1">/ unit</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Gross credit: {CalculationEngine.formatINR(currentResult.routes.rtv.unitGrossRecovery)} · Fees: ₹0
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Allocated:</span>
              <strong className="text-slate-900">{allocRtv} units</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Credit:</span>
              <strong className="text-[#0B4632]">{CalculationEngine.formatINR(currentResult.routes.rtv.totalNetRecovery)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Settlement SLA:</span>
              <span>15 business days</span>
            </div>
          </div>
        </div>

        {/* Route 2: Refurbishment & Secondary Resale */}
        <div
          className={`rounded-xl border p-4 space-y-3 transition-all shadow-xs ${
            allocRefurb > 0 ? 'bg-teal-50/60 border-teal-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider font-mono">
              2. Refurbish &amp; Resale
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200 font-semibold">
              75% Retail Resale
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {CalculationEngine.formatINR(currentResult.routes.refurb.unitNetRecovery)}
              <span className="text-xs font-sans text-slate-500 font-normal ml-1">/ unit</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Resale {CalculationEngine.formatINR(currentResult.routes.refurb.unitGrossRecovery)} − Bench {CalculationEngine.formatINR(currentResult.routes.refurb.unitDirectCost)}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Allocated:</span>
              <strong className="text-slate-900">{allocRefurb} units</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Net:</span>
              <strong className="text-teal-800">{CalculationEngine.formatINR(currentResult.routes.refurb.totalNetRecovery)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Cash Realization:</span>
              <span>~{currentResult.routes.refurb.timeToCashDays}d turnaround</span>
            </div>
          </div>
        </div>

        {/* Route 3: Liquidation */}
        <div
          className={`rounded-xl border p-4 space-y-3 transition-all shadow-xs ${
            allocLiquidate > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider font-mono">
              3. B2B Liquidation
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
              Fast Wire Cash
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {CalculationEngine.formatINR(currentResult.routes.liquidate.unitNetRecovery)}
              <span className="text-xs font-sans text-slate-500 font-normal ml-1">/ unit</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Bulk wholesale {batchInput.liquidationRecoveryPct}% of cost · Zero fees
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Allocated:</span>
              <strong className="text-slate-900">{allocLiquidate} units</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Net:</span>
              <strong className="text-amber-800">{CalculationEngine.formatINR(currentResult.routes.liquidate.totalNetRecovery)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Time To Cash:</span>
              <span>3 business days</span>
            </div>
          </div>
        </div>

        {/* Route 4: Scrap */}
        <div
          className={`rounded-xl border p-4 space-y-3 transition-all shadow-xs ${
            allocScrap > 0 ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
              4. E-Waste Scrap
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
              Recycling Salvage
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {CalculationEngine.formatINR(currentResult.routes.scrap.unitNetRecovery)}
              <span className="text-xs font-sans text-slate-500 font-normal ml-1">/ unit</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Salvage baseline ~3% of cost
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Allocated:</span>
              <strong className="text-slate-900">{allocScrap} units</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Net:</span>
              <strong className="text-slate-700">{CalculationEngine.formatINR(currentResult.routes.scrap.totalNetRecovery)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Time To Cash:</span>
              <span>5 days invoice settlement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Editor & Quantity Conservation */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#0B4632]" />
              <span>Multi-Route Allocation Editor</span>
            </h2>
            <p className="text-xs text-slate-500">
              Adjust quantities across routes using steppers or sliders. Out-of-bounds inputs are automatically flagged.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOptimizeAllocation}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md transition-all flex items-center gap-1.5 shadow-xs"
              title="Optimize allocation algorithmically"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>Optimize Allocation</span>
            </button>

            <button
              onClick={handleResetToRecommended}
              className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-all flex items-center gap-1.5 font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Recommendation</span>
            </button>
          </div>
        </div>

        {/* Quantity Summary Panel */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-200">
            <span className="font-bold tracking-wider uppercase text-slate-800">BATCH QUANTITY CONSERVATION LEDGER</span>
            <span className={isAllocationEqualTotal ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {isAllocationEqualTotal ? '✓ 100% CONSERVED & BALANCED' : '⚠ UNBALANCED ALLOCATION'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Available units</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{totalUnits}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <div className="text-[10px] text-[#0B4632] uppercase font-semibold">Supplier return</div>
              <div className="text-xl font-bold text-[#0B4632] mt-1">{allocRtv}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200">
              <div className="text-[10px] text-teal-800 uppercase font-semibold">Refurbishment</div>
              <div className="text-xl font-bold text-teal-800 mt-1">{allocRefurb}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
              <div className="text-[10px] text-amber-800 uppercase font-semibold">Liquidation</div>
              <div className="text-xl font-bold text-amber-800 mt-1">{allocLiquidate}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Allocated units</div>
              <div className={`text-xl font-bold mt-1 ${isOverAllocated ? 'text-rose-700' : 'text-slate-900'}`}>
                {allocatedTotal}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Unallocated units</div>
              <div className={`text-xl font-bold mt-1 ${unallocatedUnits > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                {unallocatedUnits}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Allocation Split Proportion Bar */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-mono font-medium">
            <span>LIVE ALLOCATION PROPORTION</span>
            <span>{allocatedTotal} / {totalUnits} units</span>
          </div>
          <div className="h-4 w-full rounded-md bg-slate-200 overflow-hidden flex border border-slate-300">
            {allocRtv > 0 && (
              <div
                title={`RTV: ${allocRtv} units`}
                className="bg-[#0B4632] text-white transition-all flex items-center justify-center text-[10px] font-bold font-mono"
                style={{ width: `${Math.round((allocRtv / Math.max(1, totalUnits)) * 100)}%` }}
              >
                {Math.round((allocRtv / totalUnits) * 100) >= 12 ? `${allocRtv} RTV` : ''}
              </div>
            )}
            {allocRefurb > 0 && (
              <div
                title={`Refurb: ${allocRefurb} units`}
                className="bg-teal-600 text-white transition-all flex items-center justify-center text-[10px] font-bold font-mono"
                style={{ width: `${Math.round((allocRefurb / Math.max(1, totalUnits)) * 100)}%` }}
              >
                {Math.round((allocRefurb / totalUnits) * 100) >= 12 ? `${allocRefurb} Refurb` : ''}
              </div>
            )}
            {allocLiquidate > 0 && (
              <div
                title={`Liquidate: ${allocLiquidate} units`}
                className="bg-amber-500 text-white transition-all flex items-center justify-center text-[10px] font-bold font-mono"
                style={{ width: `${Math.round((allocLiquidate / Math.max(1, totalUnits)) * 100)}%` }}
              >
                {Math.round((allocLiquidate / totalUnits) * 100) >= 12 ? `${allocLiquidate} Liq` : ''}
              </div>
            )}
            {allocScrap > 0 && (
              <div
                title={`Scrap: ${allocScrap} units`}
                className="bg-slate-400 text-white transition-all flex items-center justify-center text-[10px] font-bold font-mono"
                style={{ width: `${Math.round((allocScrap / Math.max(1, totalUnits)) * 100)}%` }}
              >
                {Math.round((allocScrap / totalUnits) * 100) >= 12 ? `${allocScrap} Scrap` : ''}
              </div>
            )}
          </div>
        </div>

        {/* 4 Interactive Route Adjusters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* RTV Stepper */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0B4632]">1. Supplier Return</span>
              <span className="font-mono text-slate-500">Cap: {eligibleRtvUnits} eligible</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllocRtv((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums px-2">{allocRtv}</span>
                <button
                  type="button"
                  onClick={() => setAllocRtv((v) => Math.min(totalUnits, v + 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-600 font-mono font-medium">
                {CalculationEngine.formatINR(currentResult.routes.rtv.unitNetRecovery)}/u
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={totalUnits}
              value={allocRtv}
              onChange={(e) => setAllocRtv(parseInt(e.target.value, 10))}
              className="w-full accent-[#0B4632] cursor-pointer"
            />
          </div>

          {/* Refurb Stepper */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-teal-800">2. Refurbishment</span>
              <span className="font-mono text-slate-500">Bench: ₹{batchInput.refurbishmentCost ?? 250}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllocRefurb((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums px-2">{allocRefurb}</span>
                <button
                  type="button"
                  onClick={() => setAllocRefurb((v) => Math.min(totalUnits, v + 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-600 font-mono font-medium">
                {CalculationEngine.formatINR(currentResult.routes.refurb.unitNetRecovery)}/u
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={totalUnits}
              value={allocRefurb}
              onChange={(e) => setAllocRefurb(parseInt(e.target.value, 10))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Liquidation Stepper */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-800">3. B2B Liquidation</span>
              <span className="font-mono text-slate-500">35% cost recovery</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllocLiquidate((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums px-2">{allocLiquidate}</span>
                <button
                  type="button"
                  onClick={() => setAllocLiquidate((v) => Math.min(totalUnits, v + 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-600 font-mono font-medium">
                {CalculationEngine.formatINR(currentResult.routes.liquidate.unitNetRecovery)}/u
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={totalUnits}
              value={allocLiquidate}
              onChange={(e) => setAllocLiquidate(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Scrap Stepper */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">4. E-Waste Scrap</span>
              <span className="font-mono text-slate-500">Salvage recycling</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllocScrap((v) => Math.max(0, v - 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums px-2">{allocScrap}</span>
                <button
                  type="button"
                  onClick={() => setAllocScrap((v) => Math.min(totalUnits, v + 1))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-center justify-center shadow-2xs font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-600 font-mono font-medium">
                {CalculationEngine.formatINR(currentResult.routes.scrap.unitNetRecovery)}/u
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={totalUnits}
              value={allocScrap}
              onChange={(e) => setAllocScrap(parseInt(e.target.value, 10))}
              className="w-full accent-slate-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Validation Error Warnings */}
        <div className="space-y-2">
          {isOverAllocated && (
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-xs flex items-center gap-2 text-rose-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Quantity Conservation Violation: Total allocated units ({allocatedTotal}) exceed available units ({totalUnits}) by {allocatedTotal - totalUnits} units.
              </span>
            </div>
          )}

          {unallocatedUnits > 0 && !isOverAllocated && (
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Partial Allocation Notice: <strong>{unallocatedUnits} units</strong> currently remain unallocated. Full batch conservation requires distributing all {totalUnits} units before submitting for approval.
                </span>
              </div>
              <button
                onClick={handleResetToRecommended}
                className="text-amber-800 hover:text-amber-900 font-bold underline shrink-0 ml-2 font-mono"
              >
                Auto-allocate
              </button>
            </div>
          )}

          {isRtvOverLimit && (
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-xs flex items-center gap-2 text-rose-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Contractual SLA Violation: Allocated {allocRtv} units to Supplier Return, but only {eligibleRtvUnits} units are within the {currentTerms?.window_days}-day contractual window. The remaining {allocRtv - eligibleRtvUnits} units will be rejected by {currentProduct.supplier}.
              </span>
            </div>
          )}
        </div>

        {/* FINANCIAL OUTCOME & GOVERNANCE SUBMISSION BAR */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-wider font-semibold">
              PROJECTED NET INCREMENTAL RECOVERY ({allocatedTotal}/{totalUnits} UNITS)
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0B4632] flex flex-wrap items-baseline gap-3">
              <span>{CalculationEngine.formatINR(currentResult.totalNetRecovery)}</span>
              <span className="text-xs font-sans text-slate-500 font-normal">
                (Gross {CalculationEngine.formatINR(currentResult.totalGrossRecovery)} minus {CalculationEngine.formatINR(currentResult.totalDirectCost)} direct bench costs)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-600 font-mono">
              <span>Weighted Time-To-Cash: <strong className="text-slate-900">~{currentResult.weightedTimeToCashDays} days</strong></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Supplier Credit: <strong className="text-[#0B4632]">{CalculationEngine.formatINR(currentResult.accountingDistinction.supplierCreditPortion)}</strong></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Cash Proceeds: <strong className="text-teal-700">{CalculationEngine.formatINR(currentResult.accountingDistinction.cashProceedsPortion)}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSaveAsDraft}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Bookmark className="h-3.5 w-3.5 text-slate-500" />
              <span>Save as Draft</span>
            </button>

            <button
              disabled={!isFormValid}
              onClick={handleSubmitForApproval}
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-all ${
                isFormValid
                  ? 'bg-[#0B4632] hover:bg-[#073022] active:bg-[#052419] text-white font-bold'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </div>
      </div>

      {/* EVIDENCE-BASED RECOMMENDATION EXPLANATION & AUDIT TRAIL */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] font-semibold">
            <FileText className="w-4 h-4" />
            <span className="tracking-wider uppercase">EVIDENCE-BASED ALLOCATION EXPLANATION</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Deterministic Mathematical Audit</span>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-sans">
          {/* Objective function */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-600">
            <strong className="text-[#0B4632]">Optimization Model: </strong>
            {currentResult.objectiveFunctionSummary}
          </div>

          {/* Why each route was chosen */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 font-mono text-[11px] uppercase tracking-wider">
              1. Rationale for Selected Routes:
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-600">
              {currentResult.alternativeComparisons.length > 0 && (
                <li>{currentResult.recommendationExplanation}</li>
              )}
              {currentResult.routes.rtv.allocatedUnits > 0 && (
                <li>
                  <strong className="text-slate-900">Supplier Return ({currentResult.routes.rtv.allocatedUnits} units):</strong> Locks in contractual ₹{currentResult.routes.rtv.unitGrossRecovery}/unit credit note before the 30-day SLA window closes. Zero secondary market friction, zero repair bench cost.
                </li>
              )}
              {currentResult.routes.refurb.allocatedUnits > 0 && (
                <li>
                  <strong className="text-slate-900">Refurbishment &amp; Resale ({currentResult.routes.refurb.allocatedUnits} units):</strong> Yields ₹{currentResult.routes.refurb.unitNetRecovery}/unit net recovery after deducting ₹{currentResult.routes.refurb.unitDirectCost} repair fee, generating +{CalculationEngine.formatINR((currentResult.routes.refurb.unitNetRecovery - currentResult.routes.liquidate.unitNetRecovery) * currentResult.routes.refurb.allocatedUnits)} more capital than wholesale liquidation.
                </li>
              )}
            </ul>
          </div>

          {/* Operational risk & assumptions */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 font-mono text-[11px] uppercase tracking-wider">
              2. Key Operational Risks, Assumptions &amp; Uncertainties:
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-600">
              <li>
                <strong>Turnaround vs Cash Arrival:</strong> Refurbishment bench duration is 5 calendar days, but cash does not arrive in 5 days. Full realization requires bench repair (5d) + channel sell-through (~19-22d) + payment settlement (3d), estimated at ~{currentResult.routes.refurb.timeToCashDays} days total.
              </li>
              <li>
                <strong>Inventory Demand Risk:</strong> New warehouse stock already covers {batchInput.inventoryCoverageDays ?? 60} days of demand. While secondary refurbished units sell to value-conscious buyers, demand risk must be monitored to prevent cannibalization.
              </li>
              <li>
                <strong>Defect Concentration:</strong> 70% of returns in Batch HB-09 exhibit right hinge fractures (Code DEF-01). Refurbished headphones must be structurally tested to prevent secondary customer returns.
              </li>
              <li>
                <strong>Fair Accounting Distinction:</strong> Original procurement cost of {CalculationEngine.formatINR(batchInput.originalProductCost)} is a sunk historical cost; analysis strictly models incremental cash recovery.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SCENARIO COMPARISON MODAL */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
                  <Scale className="w-3.5 h-3.5" />
                  <span>CANDIDATE ALLOCATION COMPARISON</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Feasible Alternative Route Strategies for {currentProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 pr-1">
              <p className="text-xs text-slate-600">
                Compare candidate integer allocations across all feasible recovery pathways. Click "Apply Scenario" to load any configuration directly into the interactive editor.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentResult.candidateComparisons.map((strat) => (
                  <div
                    key={strat.id}
                    className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between ${
                      strat.isRecommended
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{strat.name}</span>
                        {strat.isRecommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0B4632] text-white">
                            RECOMMENDED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">{strat.strategyDescription}</p>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono grid grid-cols-4 gap-1 text-center shadow-2xs">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">RTV</div>
                          <div className="font-bold text-[#0B4632]">{strat.allocation.rtv}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">REFURB</div>
                          <div className="font-bold text-teal-700">{strat.allocation.refurb}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">LIQUIDATE</div>
                          <div className="font-bold text-amber-700">{strat.allocation.liquidate}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">SCRAP</div>
                          <div className="font-bold text-slate-600">{strat.allocation.scrap}</div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs font-mono pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Net Recovery:</span>
                          <strong className="text-[#0B4632]">{CalculationEngine.formatINR(strat.totalNetRecovery)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Delta vs Recommended:</span>
                          <span className={strat.netRecoveryDeltaVsRecommended >= 0 ? 'text-[#0B4632] font-semibold' : 'text-rose-700 font-semibold'}>
                            {strat.netRecoveryDeltaVsRecommended === 0
                              ? 'Baseline (₹0)'
                              : `${CalculationEngine.formatINR(strat.netRecoveryDeltaVsRecommended)}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Time-To-Cash:</span>
                          <span className="text-slate-800">~{strat.weightedTimeToCashDays} days</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                        <strong className="text-slate-900">Trade-off: </strong>
                        {strat.keyTradeoff}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyScenario(strat)}
                      className="w-full mt-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Apply this Scenario</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAFTS MODAL */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>PERSISTED ALLOCATION DRAFTS</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Saved Draft Allocations for {currentProduct.sku}
                </h2>
              </div>
              <button
                onClick={() => setIsDraftsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3">
              {draftsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No saved drafts found for {currentProduct.sku}. Click "Save as Draft" in the editor to record one.
                </div>
              ) : (
                draftsList.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">{d.scenario_name || d.id}</div>
                      <div className="font-mono text-slate-600">
                        RTV: {d.allocations.rtv} · Refurb: {d.allocations.refurb} · Liq: {d.allocations.liquidate} · Scrap: {d.allocations.scrap}
                      </div>
                      <div className="text-[11px] text-[#0B4632] font-mono font-bold">
                        Net: {CalculationEngine.formatINR(d.totalNetRecovery)} · ~{d.weightedTimeToCashDays}d cash
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAllocRtv(d.allocations.rtv);
                        setAllocRefurb(d.allocations.refurb);
                        setAllocLiquidate(d.allocations.liquidate);
                        setAllocScrap(d.allocations.scrap);
                        setIsDraftsModalOpen(false);
                        showToast(`Loaded draft "${d.id}" into editor.`);
                      }}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-300 shadow-2xs"
                    >
                      Load Draft
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
