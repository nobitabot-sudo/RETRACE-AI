import React, { useState, useMemo } from 'react';
import {
  ClockAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  CheckCircle2,
  Search,
  Info,
  SlidersHorizontal,
  Sparkles,
  X,
  Send,
  Building2,
  Package,
} from 'lucide-react';
import { DeadlineAlert, Product, VendorTerms } from '../types';
import { CalculationEngine } from '../services/calculationEngine';
import { ProductImage } from './ProductImage';

interface DeadlineHunterProps {
  alerts: DeadlineAlert[];
  products: Product[];
  vendorTerms: VendorTerms[];
  onSelectSkuForOptimizer: (sku: string) => void;
  onStageRtvForApproval: (sku: string) => void;
}

export const DeadlineHunter: React.FC<DeadlineHunterProps> = ({
  alerts,
  products,
  onSelectSkuForOptimizer,
  onStageRtvForApproval,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'critical' | 'eligible' | 'expired' | 'ineligible'
  >('all');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'credit' | 'units'>('priority');
  const [selectedAlertForProposal, setSelectedAlertForProposal] = useState<DeadlineAlert | null>(
    null
  );
  const [proposalUnits, setProposalUnits] = useState<number>(0);
  const [managerNotes, setManagerNotes] = useState('');
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});
  const [showHeadphoneSpotlight, setShowHeadphoneSpotlight] = useState(true);

  // Compute stats
  const totalCreditAtRisk = useMemo(() => {
    return alerts.reduce((acc, a) => acc + a.total_credit_at_risk, 0);
  }, [alerts]);

  const criticalCount = useMemo(() => {
    return alerts.filter((a) => a.urgency === 'critical').length;
  }, [alerts]);

  const totalEligibleUnits = useMemo(() => {
    return alerts.reduce((acc, a) => acc + a.eligible_units, 0);
  }, [alerts]);

  const totalExpiredUnits = useMemo(() => {
    return alerts.reduce((acc, a) => acc + a.expired_units, 0);
  }, [alerts]);

  // Filter & sort alerts
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        // Status filter
        if (statusFilter === 'critical' && a.urgency !== 'critical') return false;
        if (
          statusFilter === 'eligible' &&
          (a.eligible_units === 0 || a.urgency === 'expired' || a.urgency === 'ineligible')
        )
          return false;
        if (statusFilter === 'expired' && a.urgency !== 'expired') return false;
        if (statusFilter === 'ineligible' && a.urgency !== 'ineligible') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSku = a.sku.toLowerCase().includes(q);
          const matchName = a.product_name.toLowerCase().includes(q);
          const matchSupplier = a.supplier.toLowerCase().includes(q);
          const matchBatch = a.supplier_batch.toLowerCase().includes(q);
          return matchSku || matchName || matchSupplier || matchBatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return b.priority_score - a.priority_score;
        }
        if (sortBy === 'deadline') {
          const aDays = a.days_remaining >= 0 ? a.days_remaining : 9999;
          const bDays = b.days_remaining >= 0 ? b.days_remaining : 9999;
          return aDays - bDays;
        }
        if (sortBy === 'credit') {
          return b.total_credit_at_risk - a.total_credit_at_risk;
        }
        if (sortBy === 'units') {
          return b.eligible_units - a.eligible_units;
        }
        return 0;
      });
  }, [alerts, statusFilter, searchQuery, sortBy]);

  // Handle opening the proposal modal
  const handleOpenProposal = (alert: DeadlineAlert) => {
    setSelectedAlertForProposal(alert);
    setProposalUnits(alert.eligible_units);
    setManagerNotes('');
    setCheckedChecklist({});
  };

  // Handle staging proposal
  const handleConfirmStageProposal = () => {
    if (!selectedAlertForProposal) return;
    const prod = products.find((p) => p.sku === selectedAlertForProposal.sku);
    if (!prod) return;

    onStageRtvForApproval(selectedAlertForProposal.sku);
    setSelectedAlertForProposal(null);
  };

  // Find headphone alert for the scenario spotlight
  const headphoneAlert = alerts.find((a) => a.sku === 'WH-NEO-01');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
            <span>CONTRACTUAL SLA GUARDIAN</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Deterministic Supplier Return Window Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Deadline Hunter &amp; Credit Preservation</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-50 text-[#0B4632] border border-emerald-200">
              Active SLA Sentinel
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
            Prioritizes eligible return cohorts facing impending contractual cutoffs. Prevents unrecoverable capital forfeiture by calculating exact days-to-expire and preparing simulated return proposals before supplier portals lock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono font-semibold">
              Eligible Credit at Risk
            </span>
            <strong className="text-[#0B4632] font-mono text-base font-bold">
              {CalculationEngine.formatINR(totalCreditAtRisk)}
            </strong>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">Critical SLA Cliffs</span>
            <ClockAlert className={`h-4 w-4 ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {criticalCount}{' '}
            <span className="text-xs font-sans font-normal text-rose-700">
              (&le; 3 Days Remaining)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requires immediate dispatch staging</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">Eligible Units in Window</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#0B4632] tracking-tight">
            {totalEligibleUnits}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Backed by active contractual terms</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">Preservable Vendor Credit</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {CalculationEngine.formatINR(totalCreditAtRisk)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Non-cash invoice offset value</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">Expired / Voided Units</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-800 tracking-tight">
            {totalExpiredUnits}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Diverted to Refurb or Liquidation</p>
        </div>
      </div>

      {/* Headphone Scenario Spotlight Panel */}
      {headphoneAlert && showHeadphoneSpotlight && (
        <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <ProductImage
                sku={headphoneAlert.sku}
                product={products.find((p) => p.sku === headphoneAlert.sku)}
                name={headphoneAlert.product_name}
                category={headphoneAlert.category}
                size="lg"
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0B4632] uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Headphone Scenario Verification · Batch HB-09 (40 Units Total)</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  24 Units Identified Within Supplier-Return Window · ₹20,160 Guaranteed Credit
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed max-w-4xl font-sans">
                  Out of 40 returned headphones, exactly <strong className="text-slate-900 font-mono">24 units</strong> were returned between 10 and 21 days ago and remain within the contractual 30-day window with SoundCraft Audio Ltd. At 60% credit on ₹1,400 procurement cost, they yield exactly <strong className="text-[#0B4632] font-mono">₹840/unit = ₹20,160</strong> in supplier credit. The remaining <strong className="text-amber-800 font-mono">16 units</strong> are expired (&gt;30 days) and must not be sent for RTV.
                </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-[#0B4632]"></span>
                  Eligible Units: <strong className="text-slate-900">24</strong> (₹20,160 Credit)
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Expired Units: <strong className="text-slate-900">16</strong> (Diverted to Refurb)
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <Clock className="h-3 w-3 text-emerald-600" />
                  Window Closes in: <strong className="text-slate-900">9 to 20 Days</strong>
                </span>
              </div>
            </div>
          </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenProposal(headphoneAlert)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#073022] rounded-lg shadow-xs transition-colors text-center"
              >
                Stage 24-Unit RTV Proposal
              </button>
              <button
                onClick={() => setShowHeadphoneSpotlight(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg text-xs"
                title="Dismiss spotlight"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, supplier, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B4632]"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 shrink-0 flex items-center gap-1 font-medium">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0B4632]"
            >
              <option value="priority">Priority (Urgency + Value)</option>
              <option value="deadline">Approaching Deadline (Fewest Days Left)</option>
              <option value="credit">Credit at Risk (Highest First)</option>
              <option value="units">Eligible Units (Most First)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs (Clean Segmented Buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Opportunities ({alerts.length})
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'critical'
                ? 'bg-rose-50 text-rose-800 font-semibold border border-rose-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
            Critical Cliffs ({alerts.filter((a) => a.urgency === 'critical').length})
          </button>
          <button
            onClick={() => setStatusFilter('eligible')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'eligible'
                ? 'bg-emerald-50 text-[#0B4632] font-semibold border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            Active Windows ({alerts.filter((a) => a.eligible_units > 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'expired'
                ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Expired Windows ({alerts.filter((a) => a.urgency === 'expired').length})
          </button>
          <button
            onClick={() => setStatusFilter('ineligible')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'ineligible'
                ? 'bg-slate-100 text-slate-800 font-semibold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Ineligible / Missing Terms ({alerts.filter((a) => a.urgency === 'ineligible').length})
          </button>
        </div>
      </div>

      {/* Opportunity Cards List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No matching return deadlines</h3>
            <p className="text-xs text-slate-500 mt-1">Try relaxing your search query or status filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isCritical = alert.urgency === 'critical';
            const isExpired = alert.urgency === 'expired';
            const isIneligible = alert.urgency === 'ineligible';
            const isWarning = alert.urgency === 'warning';

            // Progress bar calculation
            let progressPercent = 0;
            if (alert.window_days && alert.window_days > 0 && alert.days_remaining >= 0) {
              const elapsed = alert.window_days - alert.days_remaining;
              progressPercent = Math.min(
                100,
                Math.max(5, Math.round((elapsed / alert.window_days) * 100))
              );
            } else if (isExpired) {
              progressPercent = 100;
            }

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-5 sm:p-6 transition-all shadow-xs ${
                  isCritical
                    ? 'border-rose-300 bg-rose-50/50'
                    : isExpired
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : isIneligible
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="space-y-3 flex-1 max-w-4xl">
                    {/* Urgency Badge & Breadcrumb */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {isCritical && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <ClockAlert className="h-3 w-3" />
                          CRITICAL SLA CLIFF · {alert.days_remaining} DAYS REMAINING
                        </span>
                      )}
                      {isWarning && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          APPROACHING DEADLINE · {alert.days_remaining} DAYS REMAINING
                        </span>
                      )}
                      {alert.urgency === 'info' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-[#0B4632] border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          ACTIVE WINDOW · {alert.days_remaining} DAYS REMAINING
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Hourglass className="h-3 w-3" />
                          WINDOW EXPIRED ({Math.abs(alert.days_remaining)} DAYS PAST SLA)
                        </span>
                      )}
                      {isIneligible && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <ShieldAlert className="h-3 w-3" />
                          INELIGIBLE FOR RTV
                        </span>
                      )}

                      <span className="text-slate-400">#0{idx + 1}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-700 font-sans font-medium flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {alert.supplier}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500">Batch: {alert.supplier_batch}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500 font-sans">{alert.category}</span>
                    </div>

                    {/* Product Title */}
                    <div className="flex items-center gap-3">
                      <ProductImage
                        sku={alert.sku}
                        product={products.find((p) => p.sku === alert.sku)}
                        name={alert.product_name}
                        category={alert.category}
                        size="md"
                      />
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {alert.product_name} <span className="font-mono text-slate-500 text-sm font-normal">({alert.sku})</span>
                        </h2>
                      </div>
                    </div>

                    {/* Financial Metrics Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Eligible Units</span>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {alert.eligible_units}{' '}
                          <span className="text-slate-500 font-normal text-xs font-sans">
                            / {alert.total_batch_units} total
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Unit Vendor Credit</span>
                        <div className="font-mono font-bold text-[#0B4632] text-sm">
                          {alert.unit_credit > 0 ? (
                            <>
                              {CalculationEngine.formatINR(alert.unit_credit)}{' '}
                              <span className="text-slate-500 font-normal text-[11px]">({alert.credit_pct}%)</span>
                            </>
                          ) : (
                            <span className="text-slate-500">₹0</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Expected Total Credit</span>
                        <div className="font-mono font-bold text-[#0B4632] text-sm">
                          {CalculationEngine.formatINR(alert.total_credit_at_risk)}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Deadline Date</span>
                        <div className="font-mono font-bold text-slate-900 text-xs truncate">
                          {alert.deadline_date ? (
                            <span>{alert.deadline_date}</span>
                          ) : alert.days_remaining >= 0 ? (
                            <span>In {alert.days_remaining} days</span>
                          ) : isExpired ? (
                            <span className="text-rose-700">Expired</span>
                          ) : (
                            <span className="text-slate-500">Not Calculable</span>
                          )}
                          {alert.is_relative_demo_date && (
                            <span className="ml-1 text-[9px] text-slate-400 font-normal block font-sans">
                              (Demo Relative SLA)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Window Timeline Progress Bar */}
                    {alert.window_days && alert.window_days > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>
                            {alert.days_remaining >= 0
                              ? `Day ${alert.window_days - alert.days_remaining} of ${alert.window_days}`
                              : 'Window Closed'}
                          </span>
                          <span>Contract Window: {alert.window_days} Days</span>
                          <span
                            className={
                              isCritical
                                ? 'text-rose-700 font-bold'
                                : isExpired
                                ? 'text-slate-500'
                                : 'text-[#0B4632] font-bold'
                            }
                          >
                            {alert.days_remaining >= 0
                              ? `${alert.days_remaining}d remaining`
                              : `${Math.abs(alert.days_remaining)}d overdue`}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritical
                                ? 'bg-rose-600'
                                : isExpired
                                ? 'bg-slate-400'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-[#0B4632]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* What Information Is Missing */}
                    {alert.missing_information.length > 0 && (
                      <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-800">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>WHAT INFORMATION IS MISSING:</span>
                        </div>
                        <ul className="space-y-1 text-slate-700 text-xs pl-4 list-disc marker:text-amber-600">
                          {alert.missing_information.map((item, mIdx) => (
                            <li key={mIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Next Action */}
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#0B4632]">
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span>RECOMMENDED NEXT ACTION:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans">{alert.recommended_action}</p>
                    </div>

                    {/* Consequence of Missing */}
                    <div className="text-[11px] text-slate-500 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{alert.consequence}</span>
                    </div>

                    {/* Contract citation */}
                    {alert.contract_citation && (
                      <div className="text-[10px] font-mono text-slate-400">
                        Citation: {alert.contract_citation}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 self-start lg:self-center shrink-0 w-full lg:w-48 pt-2 lg:pt-0">
                    {alert.eligible_units > 0 ? (
                      <button
                        onClick={() => handleOpenProposal(alert)}
                        className={`w-full px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-all text-center flex items-center justify-center gap-1.5 ${
                          isCritical
                            ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
                            : 'bg-[#0B4632] hover:bg-[#073022] text-white font-bold'
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Prepare RTV Proposal</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full px-4 py-2 text-xs font-medium rounded-lg text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed text-center"
                      >
                        Ineligible for RTV
                      </button>
                    )}

                    <button
                      onClick={() => onSelectSkuForOptimizer(alert.sku)}
                      className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors text-center shadow-2xs"
                    >
                      Review in Optimizer
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contractual Policy Invariants Callout */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-xs text-slate-600 shadow-xs">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0B4632]" />
          <span>Strict Contractual SLA Policies &amp; Deterministic Day-Counting</span>
        </div>
        <p className="leading-relaxed font-sans">
          1. <strong>No Artificial Window Extensions:</strong> Vendor Return-To-Vendor (RTV) credit notes are legally contingent upon physical delivery before the contractual SLA cutoff. RETRACE AI calculates remaining days deterministically from actual intake timestamps.
        </p>
        <p className="leading-relaxed font-sans">
          2. <strong>Zero-Hallucination Policy on Missing Terms:</strong> For suppliers with void or missing agreements (such as ApexRobotics), the system strictly zeroes out credit calculations and surfaces the missing terms checklist rather than inventing speculative recovery figures.
        </p>
        <p className="leading-relaxed font-sans">
          3. <strong>Condition Exclusions:</strong> Units with physical structural damage or impact fractures (such as cracked LCD tablets) are isolated and barred from warranty RTV claims to avoid carrier freight rejection penalties.
        </p>
      </div>

      {/* Prepare Simulated RTV Proposal Modal */}
      {selectedAlertForProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
                  <span>SIMULATED PROPOSAL BUILDER</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500 font-normal">Internal Manager Approval Pipeline</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Prepare Supplier-Return Claim for Manager Approval
                </h2>
              </div>
              <button
                onClick={() => setSelectedAlertForProposal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-4 space-y-4 text-xs pr-1 font-sans">
              {/* Simulation Notice Banner */}
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>SIMULATED WORKFLOW ONLY · NO SUPPLIER DISPATCH</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  This action stages an internal allocation proposal into Gadgetbay&apos;s Manager Approval Ledger. No external emails, EDI messages, or carrier pickups will be triggered without physical gatekeeper authorization.
                </p>
              </div>

              {/* Opportunity Summary */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      sku={selectedAlertForProposal.sku}
                      product={products.find((p) => p.sku === selectedAlertForProposal.sku)}
                      name={selectedAlertForProposal.product_name}
                      category={selectedAlertForProposal.category}
                      size="md"
                    />
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono font-semibold">PRODUCT &amp; BATCH</span>
                      <strong className="text-slate-900 text-sm">
                        {selectedAlertForProposal.product_name} ({selectedAlertForProposal.sku})
                      </strong>
                      <div className="text-slate-600 text-xs">
                        Supplier: {selectedAlertForProposal.supplier} · Batch: {selectedAlertForProposal.supplier_batch}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] font-mono font-semibold">DEADLINE</span>
                    <span className="font-mono font-bold text-amber-800">
                      {selectedAlertForProposal.days_remaining} Days Left
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {selectedAlertForProposal.deadline_date || 'Cutoff imminent'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Allocation Controls */}
              <div className="space-y-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Units Allocated for RTV Claim:
                  </label>
                  <span className="font-mono text-[#0B4632] font-bold text-sm">
                    {proposalUnits} of {selectedAlertForProposal.eligible_units} Eligible
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={selectedAlertForProposal.eligible_units}
                  value={proposalUnits}
                  onChange={(e) => setProposalUnits(Number(e.target.value))}
                  className="w-full accent-[#0B4632] bg-slate-200 cursor-pointer"
                />

                <div className="flex justify-between items-center pt-1 text-[11px] text-slate-600 font-mono">
                  <span>Unit Credit: {CalculationEngine.formatINR(selectedAlertForProposal.unit_credit)} ({selectedAlertForProposal.credit_pct}%)</span>
                  <span>
                    Staged Net Credit:{' '}
                    <strong className="text-[#0B4632] font-bold text-xs">
                      {CalculationEngine.formatINR(proposalUnits * selectedAlertForProposal.unit_credit)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Pre-Dispatch Verification Checklist:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Internal QA Sign-off</span>
                </div>
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={!!checkedChecklist['serial']}
                      onChange={(e) =>
                        setCheckedChecklist((prev) => ({ ...prev, serial: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-[#0B4632] focus:ring-[#0B4632]"
                    />
                    <span>Physical serial numbers match return intake ledger and OEM packaging intact</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={!!checkedChecklist['cid']}
                      onChange={(e) =>
                        setCheckedChecklist((prev) => ({ ...prev, cid: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-[#0B4632] focus:ring-[#0B4632]"
                    />
                    <span>Visual inspection confirms no Customer-Induced Damage (CID) or physical crack exclusion</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={!!checkedChecklist['carrier']}
                      onChange={(e) =>
                        setCheckedChecklist((prev) => ({ ...prev, carrier: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-[#0B4632] focus:ring-[#0B4632]"
                    />
                    <span>Carrier priority manifest prepared for intake before {selectedAlertForProposal.deadline_date || 'SLA deadline'}</span>
                  </label>
                </div>
              </div>

              {/* Manager Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  Manager Rationale / Filing Notes (Optional):
                </label>
                <textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Enter specific notes for reviewer (e.g. Priority dispatch requested to safeguard Q3 invoice credit)..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B4632]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 shrink-0">
              <button
                onClick={() => setSelectedAlertForProposal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmStageProposal}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#073022] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Stage Proposal to Approval Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
