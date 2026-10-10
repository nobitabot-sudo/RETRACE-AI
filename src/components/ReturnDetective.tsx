import React, { useState, useMemo } from 'react';
import {
  Search,
  Layers,
  ShieldAlert,
  Scale,
  Microscope,
  FileText,
  Copy,
  Check,
  X,
  RotateCcw,
  Sparkles,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import {
  ReturnDetectiveEngine,
  GroupDimension,
  SuspiciousPatternAlert,
} from '../services/returnDetectiveEngine';
import { Product, ReturnItem, SaleRecord } from '../types';
import { ProductImage } from './ProductImage';

interface ReturnDetectiveProps {
  returnsList: ReturnItem[];
  products: Product[];
  salesList: SaleRecord[];
  onOpenOptimizerForSku: (sku: string) => void;
  onOpenAgentWithPrompt: (prompt: string) => void;
}

export const ReturnDetective: React.FC<ReturnDetectiveProps> = ({
  returnsList,
  products,
  salesList,
  onOpenOptimizerForSku,
  onOpenAgentWithPrompt,
}) => {
  // State
  const [selectedDimension, setSelectedDimension] = useState<GroupDimension>('batch');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScenarioFilter, setActiveScenarioFilter] = useState<string>('all');
  const [selectedAlertForModal, setSelectedAlertForModal] =
    useState<SuspiciousPatternAlert | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dimension buttons definition
  const dimensionOptions: { id: GroupDimension; label: string }[] = [
    { id: 'batch', label: 'Supplier Batch' },
    { id: 'sku', label: 'SKU' },
    { id: 'category', label: 'Category' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'reason_code', label: 'Reason Code' },
    { id: 'grade', label: 'Product Grade' },
  ];

  // Compute dynamic grouped aggregates
  const groupedAggregates = useMemo(() => {
    return ReturnDetectiveEngine.groupReturns(selectedDimension, returnsList, products);
  }, [selectedDimension, returnsList, products]);

  // Compute suspicious patterns
  const suspiciousAlerts = useMemo(() => {
    return ReturnDetectiveEngine.detectSuspiciousPatterns(returnsList, products, salesList);
  }, [returnsList, products, salesList]);

  // Compute batch comparison metrics
  const batchMetrics = useMemo(() => {
    return ReturnDetectiveEngine.getBatchComparisonMetrics(returnsList, products, salesList);
  }, [returnsList, products, salesList]);

  // Compute supplier comparison metrics
  const supplierMetrics = useMemo(() => {
    return ReturnDetectiveEngine.getSupplierComparisonMetrics(returnsList, products);
  }, [returnsList, products]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return suspiciousAlerts.filter((alert) => {
      if (activeScenarioFilter !== 'all' && alert.scenarioType !== activeScenarioFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = alert.title.toLowerCase().includes(q);
        const matchSku = alert.sku.toLowerCase().includes(q);
        const matchBatch = alert.batch.toLowerCase().includes(q);
        const matchFault =
          alert.faultLabel.toLowerCase().includes(q) || alert.faultCode.toLowerCase().includes(q);
        const matchSupp = alert.supplier.toLowerCase().includes(q);
        return matchTitle || matchSku || matchBatch || matchFault || matchSupp;
      }
      return true;
    });
  }, [suspiciousAlerts, activeScenarioFilter, searchQuery]);

  const handleCopyProtocol = (alert: SuspiciousPatternAlert) => {
    const text = `INVESTIGATION DOSSIER & PROTOCOL: ${alert.title}
Reference: ${alert.id}
Product: ${alert.productName} (${alert.sku})
Supplier: ${alert.supplier} | Batch: ${alert.batch}
Fault Code: ${alert.faultCode} (${alert.faultLabel})

QUANTITATIVE EVIDENCE:
- Affected Returns: ${alert.affectedReturnsCount} of ${alert.groupTotalReturns} returned units (${alert.percentageOfGroup}% of returned cohort)
- Batch Manufacturing Velocity: ${alert.overallBatchFailureRate}% of ~${alert.batchSoldUnitsEstimate} units sold (SLA ceiling: ${alert.slaDefectRateCeiling}%)

STATISTICAL INTEGRITY NOTE:
${alert.statisticalDistinctionNote}

INVESTIGATION OBJECTIVE:
${alert.suggestedInvestigation.objective}

HYPOTHESES TO TEST:
${alert.suggestedInvestigation.hypothesisToTest.map((h, i) => `${i + 1}. ${h}`).join('\n')}

MANDATORY ACTION ITEMS:
${alert.suggestedInvestigation.actionItems.map((a, i) => `- ${a}`).join('\n')}

VENDOR DIALOGUE NEXT STEP:
${alert.suggestedInvestigation.vendorConsultationStep}
`;
    navigator.clipboard.writeText(text);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 3000);
  };

  const simulateRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header & Scenario Jump Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
            <Microscope className="h-4 w-4" />
            <span>RETURN DETECTIVE</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Forensic Defect Investigation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Root Cause Investigation &amp; Pattern Forensics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
            Investigate why products are returned, isolate abnormal fault clustering, and prepare objective testing protocols without leaping to premature blame.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() =>
              onOpenAgentWithPrompt('Which supplier or batch has a suspicious defect pattern?')
            }
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            <Sparkles className="h-4 w-4 text-[#0B4632]" />
            <span>Ask Detective Agent</span>
          </button>
          <button
            onClick={simulateRefresh}
            title="Refresh forensic calculations"
            className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#0B4632]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Scenario Selectors (Functional Segmented Buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-slate-500 font-mono shrink-0 font-medium">Scenarios:</span>
        {[
          { id: 'all', label: 'All Investigation Scenarios' },
          { id: 'headphone_hinge', label: '🎧 Batch HB-09 (70% Hinge Fracture)' },
          { id: 'monitor_flicker', label: '🖥️ Batch VT-4K (Panel Flicker)' },
          { id: 'watch_battery', label: '⌚ Batch CW-GEN1 (Battery Drain)' },
          { id: 'tablet_fracture', label: '📱 Tablets (Transit Fractures)' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenarioFilter(s.id)}
            className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-md font-medium transition-colors shrink-0 ${
              activeScenarioFilter === s.id
                ? 'bg-[#0B4632] text-white font-semibold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Critical Statistical Rigor Callout Banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <Scale className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700">
          <div className="font-bold text-[#0B4632] uppercase font-mono tracking-wider text-[11px]">
            Statistical Rigor Invariant · Concentration Within Returns vs. Overall Defect Rate
          </div>
          <p className="leading-relaxed">
            When 28 out of 40 returned headphones share the same right hinge fracture, this is a{' '}
            <strong className="text-[#0B4632]">high concentration (70.0%) within the returned sample</strong>.
            It does <strong>NOT</strong> mean that 70% of all manufactured headphones are defective. The overall defect rate across the 500 units sold from Batch HB-09 is{' '}
            <strong className="text-slate-900 font-mono font-bold">8.0%</strong>.
            Return Detective never invents unproven root causes; it establishes factual symptom clustering and suggests laboratory testing protocols.
          </p>
        </div>
      </div>

      {/* Visual Comparison: Fault Frequency Across Batches & Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Across Batches Chart */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0B4632]" />
                <span>Fault Frequency Across Supplier Batches</span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualizing dominant fault concentration and manufacturing defect velocity
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium">5 Active Batches</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {batchMetrics.map((b) => {
              const isHB09 = b.batch === 'HB-09';
              return (
                <div
                  key={b.batch}
                  className={`space-y-2 p-3.5 rounded-lg border transition-all ${
                    isHB09
                      ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">Batch {b.batch}</span>
                      {isHB09 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                          Primary Anomaly
                        </span>
                      )}
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-700 font-medium">{b.productName}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500">{b.dominantFaultCount} of {b.totalReturns} returns</span>
                      <span
                        className={`font-bold ${
                          isHB09
                            ? 'text-rose-700'
                            : b.dominantFaultShare >= 65
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        ({b.dominantFaultShare}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar of Concentration */}
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHB09
                          ? 'bg-rose-600'
                          : b.dominantFaultShare >= 65
                          ? 'bg-amber-500'
                          : b.dominantFaultShare >= 40
                          ? 'bg-teal-600'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${b.dominantFaultShare}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-0.5 font-sans">
                    <span className="truncate max-w-sm">
                      Dominant: <strong className={isHB09 ? 'text-rose-900' : 'text-slate-800'}>{b.dominantFaultLabel}</strong> ({b.dominantFaultCode})
                    </span>
                    <span className="font-mono text-slate-700 shrink-0">
                      Overall sold defect rate: <strong className={b.overallFailureRate > 5 ? 'text-rose-700' : 'text-slate-800'}>{b.overallFailureRate}%</strong> (SLA ceiling: 1.5%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Across Suppliers Risk Matrix */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Supplier Quality Risk Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Defect concentration across hardware partners
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">5 Partners</span>
            </div>

            <div className="space-y-3 pt-3">
              {supplierMetrics.map((s) => (
                <div
                  key={s.supplier}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{s.supplier}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        s.riskRating === 'High Focus'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : s.riskRating === 'Moderate'
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-emerald-100 text-[#0B4632] border-emerald-300'
                      }`}
                    >
                      {s.riskRating}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Top Concentration: <span className="text-slate-900 font-medium">{s.topFaultDescription}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                    <span>{s.totalReturns} total returned units</span>
                    <span>{s.categoriesSupplied.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Note: Concentration indicates symptom uniformity within incoming returns, prompting targeted inspection.
          </div>
        </div>
      </div>

      {/* Forensic Suspicious Patterns Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#0B4632]" />
              <span>Suspicious Pattern Alerts &amp; Evidence ({filteredAlerts.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Each alert demonstrates symptom clustering with quantitative records and suggested investigations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search alert by SKU, fault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] placeholder:text-slate-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500 space-y-2 shadow-xs">
            <div className="inline-block h-6 w-6 border-2 border-[#0B4632] border-t-transparent rounded-full animate-spin" />
            <div>Running forensic pattern clustering across return logs...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAlerts.length === 0 && (
          <div className="p-12 text-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500 space-y-2 shadow-xs">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="font-semibold text-slate-700">No suspicious pattern alerts match your search.</div>
            <div>Try clearing the search query or selecting "All Investigation Scenarios".</div>
          </div>
        )}

        {/* Alerts Grid */}
        {!isLoading && filteredAlerts.length > 0 && (
          <div className="space-y-5">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 transition-all hover:border-slate-300 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3.5">
                    <ProductImage
                      sku={alert.sku}
                      product={products.find((p) => p.sku === alert.sku)}
                      name={alert.title}
                      size="md"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span
                          className={`font-bold uppercase tracking-wider text-[11px] ${
                            alert.severity === 'critical'
                              ? 'text-rose-700'
                              : alert.severity === 'warning'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {alert.severity.toUpperCase()} ALERT
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-700 font-sans font-medium">{alert.supplier}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-[#0B4632] font-semibold">Batch: {alert.batch}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {alert.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <button
                      onClick={() => setSelectedAlertForModal(alert)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#0B4632]" />
                      <span>Open Detective Case File</span>
                    </button>
                    <button
                      onClick={() => onOpenOptimizerForSku(alert.sku)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-colors"
                    >
                      Optimize {alert.sku}
                    </button>
                  </div>
                </div>

                {/* Evidence Metrics Quad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Affected Returns */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                      Affected Return Count
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-900">
                      {alert.affectedReturnsCount}{' '}
                      <span className="text-xs font-normal text-slate-500 font-sans">of {alert.groupTotalReturns} units</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      Citing fault code <strong className="text-[#0B4632]">{alert.faultCode}</strong>
                    </div>
                  </div>

                  {/* Return Share */}
                  <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-0.5">
                    <div className="text-[11px] font-mono text-amber-800 uppercase font-semibold">
                      Return Group Concentration
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-900">
                      {alert.percentageOfGroup}%
                    </div>
                    <div className="text-[11px] text-amber-800">
                      Share of returns reporting this fault
                    </div>
                  </div>

                  {/* Total Batch Failure Rate */}
                  <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 space-y-0.5">
                    <div className="text-[11px] font-mono text-rose-800 uppercase font-semibold">
                      Total Batch Sold Defect Rate
                    </div>
                    <div className="text-2xl font-bold font-mono text-rose-900">
                      {alert.overallBatchFailureRate}%
                    </div>
                    <div className="text-[11px] text-rose-800 font-mono">
                      ~{alert.batchSoldUnitsEstimate} units sold (SLA ceiling: {alert.slaDefectRateCeiling}%)
                    </div>
                  </div>

                  {/* Severity & SLA Status */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                      Contractual SLA Status
                    </div>
                    <div className="text-base font-bold font-mono text-amber-800 mt-1">
                      {alert.overallBatchFailureRate > alert.slaDefectRateCeiling
                        ? 'Breaches SLA Ceiling'
                        : 'Within Tolerance'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Requires physical verification
                    </div>
                  </div>
                </div>

                {/* Evidence Summary & Customer Quotes */}
                <div className="space-y-2 text-xs">
                  <div className="text-slate-700 leading-relaxed font-sans">
                    <strong className="text-slate-900">Observed Evidence:</strong> {alert.evidenceSummary}
                  </div>

                  {alert.sampleCustomerQuotes.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 italic text-slate-700 space-y-1">
                      <div className="text-[10px] uppercase font-mono not-italic text-slate-500 font-semibold">
                        Sample Intake Quotes from Returns Ledger:
                      </div>
                      {alert.sampleCustomerQuotes.map((q, qIdx) => (
                        <div key={qIdx} className="text-xs">
                          "{q}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Statistical Caveat Callout Box */}
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-[11px] text-slate-700 leading-relaxed">
                  <strong className="text-[#0B4632] font-mono">STATISTICAL INTEGRITY:</strong>{' '}
                  {alert.statisticalDistinctionNote}
                </div>

                {/* Suggested Investigation Protocol */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs font-sans">
                  <div className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px] flex items-center gap-1.5">
                    <Microscope className="h-3.5 w-3.5 text-[#0B4632]" />
                    <span>Suggested Engineering &amp; Operational Investigation</span>
                  </div>
                  <div className="text-slate-700">
                    <strong className="text-slate-900">Objective:</strong> {alert.suggestedInvestigation.objective}
                  </div>
                  <div className="space-y-1 text-slate-600 pt-1">
                    <div className="text-slate-800 font-semibold">Testing Hypotheses:</div>
                    {alert.suggestedInvestigation.hypothesisToTest.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-1.5 text-slate-600">
                        <span className="text-[#0B4632] font-bold">·</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-amber-800 pt-1 font-mono">
                    <strong>Vendor Action Rule:</strong> {alert.suggestedInvestigation.vendorConsultationStep}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Dimensional Grouping Inspector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#0B4632]" />
              <span>Multi-Dimensional Return Grouping Explorer</span>
            </h2>
            <p className="text-xs text-slate-500">
              Group all 60 returned items by chosen operational dimension to inspect fault clustering
            </p>
          </div>

          {/* Dimension Selector Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto no-scrollbar">
            {dimensionOptions.map((dim) => (
              <button
                key={dim.id}
                onClick={() => setSelectedDimension(dim.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedDimension === dim.id
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Group Dimension Value</th>
                <th className="py-3 px-3">Units</th>
                <th className="py-3 px-3">% of All Returns</th>
                <th className="py-3 px-3">Dominant Reason Code</th>
                <th className="py-3 px-3">Condition Grades</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {groupedAggregates.map((group) => {
                const dominantReason = group.reasonBreakdown[0];
                return (
                  <tr key={group.key} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{group.label}</div>
                      {group.subLabel && (
                        <div className="text-[11px] text-slate-500">{group.subLabel}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-bold">
                      {group.totalReturns}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {group.percentageOfAllReturns}%
                    </td>
                    <td className="py-3 px-3">
                      {dominantReason ? (
                        <div>
                          <span className="font-semibold text-slate-800">{dominantReason.label}</span>{' '}
                          <span className="font-mono text-[#0B4632] text-[11px] font-semibold">({dominantReason.code})</span>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {dominantReason.count} units ({dominantReason.percentageOfGroup}% of this group)
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {Object.entries(group.gradeBreakdown)
                        .map(([gr, cnt]) => `${gr}: ${cnt}`)
                        .join(' · ')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          const firstSku = group.sampleRecords[0]?.sku;
                          if (firstSku) onOpenOptimizerForSku(firstSku);
                        }}
                        className="px-2.5 py-1 text-[11px] text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors shadow-2xs font-medium"
                      >
                        Inspect SKU
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case File Modal */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <ProductImage
                  sku={selectedAlertForModal.sku}
                  product={products.find((p) => p.sku === selectedAlertForModal.sku)}
                  name={selectedAlertForModal.title}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
                    <Microscope className="h-4 w-4" />
                    <span>DETECTIVE CASE FILE</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 font-normal">{selectedAlertForModal.id}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {selectedAlertForModal.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs text-slate-700 font-sans">
              {/* Evidence Box */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px]">
                  Cited Intake Evidence &amp; Specific Records:
                </div>
                <p className="leading-relaxed">{selectedAlertForModal.evidenceSummary}</p>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-600">
                  <span>Cited Return IDs:</span>
                  {selectedAlertForModal.citedReturnIds.map((id) => (
                    <span
                      key={id}
                      className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[#0B4632] font-semibold"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statistical Rigor Callout */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] leading-relaxed text-slate-700">
                <strong className="text-[#0B4632] font-mono">STATISTICAL DISTINCTION:</strong>{' '}
                {selectedAlertForModal.statisticalDistinctionNote}
              </div>

              {/* Investigation Hypotheses & Action Protocol */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px]">
                  Recommended Engineering Investigation Protocol:
                </div>
                <div className="text-slate-800">
                  <strong className="text-slate-900">Objective:</strong>{' '}
                  {selectedAlertForModal.suggestedInvestigation.objective}
                </div>
                <div className="space-y-1 pt-1">
                  <div className="text-slate-900 font-semibold">Hypotheses to Validate:</div>
                  {selectedAlertForModal.suggestedInvestigation.hypothesisToTest.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-600">
                      <span className="text-[#0B4632] font-bold">{i + 1}.</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 pt-1">
                  <div className="text-slate-900 font-semibold">Action Items:</div>
                  {selectedAlertForModal.suggestedInvestigation.actionItems.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-600">
                      <span className="text-[#0B4632] font-bold">✓</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleCopyProtocol(selectedAlertForModal)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {copiedProtocol ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedProtocol ? 'Copied Protocol' : 'Copy Investigation Protocol'}</span>
              </button>
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="px-3.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
