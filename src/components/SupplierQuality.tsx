import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  ExternalLink,
  Info,
  Scale,
} from 'lucide-react';
import { QualityAlert } from '../types';
import { CalculationEngine } from '../services/calculationEngine';
import { SupplierNoticeModal } from './SupplierNoticeModal';
import { ProductImage } from './ProductImage';

interface SupplierQualityProps {
  alerts: QualityAlert[];
  onOpenOptimizerForSku: (sku: string) => void;
}

export const SupplierQuality: React.FC<SupplierQualityProps> = ({
  alerts,
  onOpenOptimizerForSku,
}) => {
  const [selectedNoticeAlert, setSelectedNoticeAlert] = useState<QualityAlert | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            <span>DEFECT INTELLIGENCE &amp; VENDOR AUDIT</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Quality Risk Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Supplier Quality Intelligence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Identify repeated defect clusters, evaluate statistical confidence, and hold component suppliers accountable.
          </p>
        </div>
      </div>

      {/* Critical Methodology Callout: Distinguishing Return Share vs Total Manufacturing Rate */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row items-start gap-4 shadow-xs">
        <Scale className="h-6 w-6 text-[#0B4632] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700">
          <div className="font-bold text-[#0B4632] uppercase font-mono tracking-wider text-[11px]">
            Statistical Rigor: Returns Concentration vs. Overall Batch Defect Rate
          </div>
          <p className="leading-relaxed">
            RETRACE AI strictly distinguishes between <strong className="text-[#0B4632]">Returns Defect Share</strong> (what % of incoming returns exhibit a symptom, e.g. 70%) and <strong className="text-[#0B4632]">Overall Batch Defect Rate</strong> (what % of all manufactured or sold units failed, e.g. 8.0%).
            High return concentration flags localized tooling failures, while overall defect rate establishes contractual SLA breach thresholds. Small sample sizes are explicitly caveated to prevent false certainty.
          </p>
        </div>
      </div>

      {/* Quality Alerts List */}
      <div className="space-y-5">
        {alerts.map((alert) => {
          return (
            <div
              key={alert.id}
              className={`rounded-xl border p-5 sm:p-6 transition-all shadow-xs ${
                alert.severity === 'critical'
                  ? 'border-rose-200 bg-white shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Header Info */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <ProductImage
                    sku={alert.sku}
                    name={alert.product_name}
                    size="md"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span
                        className={`font-bold uppercase tracking-wider text-[11px] ${
                          alert.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {alert.severity === 'critical' ? 'CRITICAL DEFECT CLUSTER' : 'QUALITY ADVISORY'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-700 font-sans font-medium">{alert.supplier}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-[#0B4632] font-semibold">Batch: {alert.supplier_batch}</span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{alert.product_name}</span>
                      <span className="font-mono text-xs font-normal text-slate-500">({alert.sku})</span>
                    </h2>

                    <div className="text-xs text-slate-600">
                      Observed Fault: <strong className="text-slate-900">{alert.fault_description}</strong> (Code: <span className="font-mono text-[#0B4632] font-semibold">{alert.fault_code}</span>)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
                  <button
                    onClick={() => setSelectedNoticeAlert(alert)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#0B4632]" />
                    <span>Draft Supplier Review Notice</span>
                  </button>
                  <button
                    onClick={() => onOpenOptimizerForSku(alert.sku)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-colors"
                  >
                    Optimize Batch Recovery
                  </button>
                </div>
              </div>

              {/* Side-by-side Dual Metrics Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
                {/* Metric A: Returns Share */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-medium">
                    Returns Fault Concentration
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700">
                    {alert.fault_percentage_of_returns}%
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {alert.fault_returns_count} of {alert.batch_returns_count} returns share this fault
                  </div>
                </div>

                {/* Metric B: Total Batch Failure Rate */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-medium">
                    Total Batch Defect Velocity
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-700">
                    {alert.fault_rate_of_batch}%
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {alert.fault_returns_count} failed of ~{alert.batch_total_units_sold} sold (SLA benchmark: 1.5%)
                  </div>
                </div>

                {/* Metric C: Procurement Capital at Risk */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-medium">
                    Procurement Cost at Risk
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {CalculationEngine.formatINR(alert.financial_impact_estimate)}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Based on original product cost
                  </div>
                </div>

                {/* Metric D: Statistical Sample Confidence */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-medium">
                    Statistical Certainty
                  </div>
                  <div className={`text-base font-bold font-mono ${alert.is_statistically_conclusive ? 'text-[#0B4632]' : 'text-amber-700'}`}>
                    {alert.is_statistically_conclusive ? 'High (N ≥ 30)' : 'Moderate Sample'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {alert.batch_returns_count} physical units inspected
                  </div>
                </div>
              </div>

              {/* Evidence Log & Customer Quotes */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Physical Evidence &amp; Intake Voice Notes:
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {alert.evidence_logs.length} customer reports cataloged
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {alert.evidence_logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 italic"
                    >
                      "{log}"
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action & Sample Size Note */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-700 max-w-2xl">
                  <strong className="text-slate-900">Recommended Governance Step:</strong>{' '}
                  {alert.recommended_action}
                </div>
                <div className="text-[11px] text-slate-500 font-mono italic">
                  {alert.sample_size_note}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Notice Modal */}
      {selectedNoticeAlert && (
        <SupplierNoticeModal
          alert={selectedNoticeAlert}
          onClose={() => setSelectedNoticeAlert(null)}
        />
      )}
    </div>
  );
};
