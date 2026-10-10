import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { QualityAlert } from '../types';
import { CalculationEngine } from '../services/calculationEngine';
import { ProductImage } from './ProductImage';

interface SupplierNoticeModalProps {
  alert: QualityAlert | null;
  onClose: () => void;
}

export const SupplierNoticeModal: React.FC<SupplierNoticeModalProps> = ({ alert, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const formalNoticeText = `FORMAL SUPPLIER QUALITY DEFECT NOTIFICATION
To: Quality Assurance & Engineering Division, ${alert.supplier}
From: Reverse Logistics & Vendor Quality Governance, Gadgetbay
Date: 2026-10-09
Reference: QA-INCIDENT-${alert.supplier_batch}-${alert.fault_code}

SUBJECT: Batch Defect Cluster Notice — ${alert.product_name} (Batch: ${alert.supplier_batch})

Dear Quality Assurance Team,

This document serves as a formal quality escalation regarding Batch ${alert.supplier_batch} of ${alert.product_name} (SKU: ${alert.sku}).

REVERSE LOGISTICS EVIDENCE:
1. Returns Concentration: ${alert.fault_percentage_of_returns}% (${alert.fault_returns_count} of ${alert.batch_returns_count}) of all customer returns for this batch report identical failure mode: "${alert.fault_description}" (Fault Code: ${alert.fault_code}).
2. Total Sold Defect Velocity: Out of ${alert.batch_total_units_sold} units sold from this production lot, ${alert.fault_returns_count} physical units have failed due to this defect, representing an 8.0% defect rate (against category SLA ceiling of 1.5%).
3. Physical Defect Characteristics: Repeated mechanical fracture at the right headband pivot joint / Bluetooth audio dropouts after 10-14 days of consumer usage.

STATISTICAL CONFIDENCE ASSESSMENT:
${alert.sample_size_note}

ESTIMATED FINANCIAL IMPACT:
Procurement capital at risk: ${CalculationEngine.formatINR(alert.financial_impact_estimate)}.

REQUESTED CORRECTIVE ACTIONS:
1. Immediate tooling mold and resin tensile strength inspection for Batch ${alert.supplier_batch} production line.
2. Full RTV credit acceptance for all ${alert.fault_returns_count} failed units without restocking depreciation.
3. Submission of an 8D Root Cause Analysis within 10 business days.

Sincerely,
Reverse Logistics & Quality Operations Lead
Gadgetbay E-Commerce Solutions
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formalNoticeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <ProductImage
              sku={alert.sku}
              name={alert.product_name}
              size="md"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Draft Supplier Quality Review Notice
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Recipient: {alert.supplier} · Batch: {alert.supplier_batch} · {alert.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4 max-h-[60vh] overflow-y-auto rounded-lg bg-slate-50 p-4 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-all">
          {formalNoticeText}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            Preview generated deterministically from return intake audit logs.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Notice Text'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
