import React from 'react';
import { X, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ReturnItem, Product, VendorTerms } from '../types';
import { CalculationEngine } from '../services/calculationEngine';
import { ProductImage } from './ProductImage';

interface ReturnDetailModalProps {
  returnItem: ReturnItem | null;
  product?: Product;
  vendorTerms?: VendorTerms;
  repeatedFaultCount: number;
  onClose: () => void;
  onOpenOptimizerForSku: (sku: string) => void;
}

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  returnItem,
  product,
  vendorTerms,
  repeatedFaultCount,
  onClose,
  onOpenOptimizerForSku,
}) => {
  if (!returnItem) return null;

  const isRtvEligible =
    vendorTerms?.rtv_allowed && returnItem.days_since_return <= (vendorTerms?.window_days ?? 0);
  const remainingDays = vendorTerms ? vendorTerms.window_days - returnItem.days_since_return : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <ProductImage
              sku={returnItem.sku}
              product={product}
              name={product?.name}
              category={product?.category}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
                <span>RETURN EVIDENCE &amp; DIAGNOSTIC</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-500 font-normal">{returnItem.return_id}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {product?.name || returnItem.sku}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>SKU: {returnItem.sku}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Batch: {returnItem.supplier_batch}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Intake Date: {returnItem.date}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Customer Voice Note / Physical Evidence */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Customer Note &amp; Return Symptom
            </div>
            <div className="text-sm text-slate-800 italic font-sans">
              "{returnItem.customer_note || 'Standard return intake. No additional notes logged.'}"
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 border-t border-slate-200 pt-2 font-mono">
              <span>Reason: <strong className="text-slate-900 font-sans">{returnItem.reason_label}</strong></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Code: <strong className="text-[#0B4632]">{returnItem.reason_code}</strong></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Condition Grade: <strong className="text-slate-900">{returnItem.grade}</strong></span>
            </div>
          </div>

          {/* Repeated Fault Context */}
          {repeatedFaultCount > 1 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
                <ShieldAlert className="h-4 w-4" />
                <span>Repeated Defect Cluster Detected</span>
              </div>
              <p className="text-xs text-slate-700">
                This exact fault ({returnItem.reason_code}) appears across{' '}
                <strong className="text-slate-900 font-mono">{repeatedFaultCount} returned units</strong> from Supplier Batch{' '}
                <strong className="text-slate-900 font-mono">{returnItem.supplier_batch}</strong>.
                This exceeds the baseline variance and indicates a systematic manufacturing or packaging defect.
              </p>
            </div>
          )}

          {/* Route Eligibility Matrix */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recovery Route Feasibility
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Route 1: RTV */}
              <div
                className={`p-3 rounded-md border ${
                  isRtvEligible
                    ? 'border-emerald-300 bg-emerald-50/70'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className={isRtvEligible ? 'text-emerald-900' : 'text-slate-600'}>
                    Supplier RTV
                  </span>
                  {isRtvEligible ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  {isRtvEligible ? (
                    <>
                      <div className="text-[#0B4632] font-mono font-semibold">
                        Eligible ({remainingDays}d remaining)
                      </div>
                      <div>
                        Credit:{' '}
                        {vendorTerms
                          ? CalculationEngine.formatINR(
                              Math.round((product?.cost || 0) * (vendorTerms.credit_pct / 100))
                            )
                          : '₹0'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-rose-700 font-mono font-medium">Ineligible / Expired</div>
                      <div>
                        Window was {vendorTerms?.window_days ?? 0} days ({returnItem.days_since_return}d elapsed)
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Route 2: Refurbish */}
              <div className="p-3 rounded-md border border-slate-200 bg-white">
                <div className="font-semibold text-teal-800 mb-1">Refurb &amp; Resale</div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Bench Cost: ₹250 (Audio SOP)</div>
                  <div>Resale target: 75% retail</div>
                  <div className="text-slate-800 font-mono font-medium">Net ~₹1,625</div>
                </div>
              </div>

              {/* Route 3: Liquidation */}
              <div className="p-3 rounded-md border border-slate-200 bg-white">
                <div className="font-semibold text-amber-800 mb-1">B2B Wholesale</div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Wholesale clearance: 35% cost</div>
                  <div className="text-slate-800 font-mono font-medium">Net ~₹490</div>
                  <div>Fast 72h cash payout</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 font-mono">
            Intake record verified · Gadgetbay Logistics
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onOpenOptimizerForSku(returnItem.sku);
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-colors"
            >
              Optimize This SKU Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
