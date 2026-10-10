import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  History,
  ArrowRight,
  UserCheck,
  Send,
  Layers,
  DollarSign,
  Info,
} from 'lucide-react';
import { ApprovalAction, ApprovalAuditEvent } from '../types';
import { CalculationEngine } from '../services/calculationEngine';
import { ProductImage } from './ProductImage';

interface ApprovalCentreProps {
  approvals: ApprovalAction[];
  onApproveAction: (actionId: string, reviewerNotes?: string) => void;
  onRejectAction: (actionId: string, reviewerNotes?: string) => void;
  onEditAction: (sku: string) => void;
}

export const ApprovalCentre: React.FC<ApprovalCentreProps> = ({
  approvals,
  onApproveAction,
  onRejectAction,
  onEditAction,
}) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('Authorized in executive simulation ledger.');
  const [reviewerName, setReviewerName] = useState<string>('Devin K. (Returns Lead)');
  const [auditEvents, setAuditEvents] = useState<ApprovalAuditEvent[]>([]);

  // Fetch real persisted audit events from backend SQLite
  React.useEffect(() => {
    fetch('/api/approvals/audit')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.events) {
          setAuditEvents(data.events);
        }
      })
      .catch(() => {});
  }, [approvals]);

  const pendingActions = approvals.filter((a) => a.status === 'pending');
  const historyActions = approvals.filter((a) => a.status !== 'pending');

  const handleConfirmApprove = (action: ApprovalAction) => {
    onApproveAction(
      action.id,
      approvalNotes || `Approved by ${reviewerName} via Executive Console.`
    );
    setApprovingId(null);
    setApprovalNotes('Authorized in executive simulation ledger.');
  };

  const handleConfirmReject = (id: string) => {
    onRejectAction(id, rejectReason || 'Manager rejected allocation.');
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>OPERATIONAL GOVERNANCE &amp; AUTHORIZATION</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Manager Staging Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Approval Centre
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Review proposed recovery allocations, verify financial impact, and authorize staging workflows.
          </p>
        </div>

        {/* Manager Persona Identifier */}
        <div className="flex items-center gap-2.5 text-xs bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-xs">
          <UserCheck className="h-4 w-4 text-[#0B4632]" />
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase font-medium">Authorized Lead</div>
            <strong className="text-slate-900 font-medium">{reviewerName}</strong>
          </div>
        </div>
      </div>

      {/* Prominent Simulated Environment Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700">
          <div className="font-bold text-amber-900 uppercase font-mono tracking-wider text-[11px]">
            SIMULATED APPROVAL WORKFLOW · AUDIT &amp; MODELING ENVIRONMENT
          </div>
          <p className="leading-relaxed">
            Approving or rejecting proposals in this centre commits the decision to the internal Gadgetbay ledger simulation.
            <strong> No live supplier EDI transactions, vendor credit notes, banking wires, or freight courier dispatches are triggered.</strong>
            This workflow demonstrates enterprise role-based governance, mathematical bounds, and compliance audit trails.
          </p>
        </div>
      </div>

      {/* Pending Proposals Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pending Authorizations</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
              {pendingActions.length} Action{pendingActions.length !== 1 ? 's' : ''} Pending
            </span>
          </h2>
        </div>

        {pendingActions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 space-y-2 shadow-xs">
            <CheckCircle2 className="h-8 w-8 text-[#0B4632] mx-auto" />
            <div className="font-semibold text-slate-900 text-sm">All Proposals Reviewed</div>
            <p className="text-slate-600 max-w-md mx-auto">
              There are no pending actions awaiting manager review. You can stage new allocations from the Recovery Optimizer or Deadline Hunter.
            </p>
          </div>
        ) : (
          pendingActions.map((action) => (
            <div
              key={action.id}
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <ProductImage
                    sku={action.sku}
                    name={action.product_name}
                    size="md"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-[#0B4632] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {action.id}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500 font-mono">{action.created_at}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono text-slate-700 font-medium">Batch: {action.supplier_batch}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        STATUS: PENDING
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
                      {action.product_name} <span className="font-mono font-normal text-slate-500">({action.sku})</span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  <button
                    onClick={() => onEditAction(action.sku)}
                    className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Edit in Optimizer</span>
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(action.id);
                      setApprovingId(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => {
                      setApprovingId(action.id);
                      setRejectingId(null);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Review &amp; Approve</span>
                  </button>
                </div>
              </div>

              {/* Pre-Approval Confirmation Box */}
              {approvingId === action.id && (
                <div className="p-4 rounded-lg bg-emerald-50/80 border border-emerald-300 space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B4632] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0B4632]" />
                      <span>Confirm Manager Authorization: {action.product_name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#0B4632] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                      Simulated Authorization
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed">
                    You are authorizing the recovery allocation of <strong className="text-slate-900">{action.total_units} units</strong> with projected net proceeds of <strong className="text-[#0B4632] font-mono">{CalculationEngine.formatINR(action.expected_net_recovery)}</strong> across designated routes:
                  </p>

                  <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                    {action.allocations.rtv > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#0B4632] border border-emerald-300 font-semibold">
                        RTV: {action.allocations.rtv} units
                      </span>
                    )}
                    {action.allocations.refurb > 0 && (
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300 font-semibold">
                        Refurb: {action.allocations.refurb} units
                      </span>
                    )}
                    {action.allocations.liquidate > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold">
                        Liquidation: {action.allocations.liquidate} units
                      </span>
                    )}
                    {action.allocations.scrap > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
                        Scrap: {action.allocations.scrap} units
                      </span>
                    )}
                    {action.allocations.unallocated !== undefined && action.allocations.unallocated > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold">
                        Unallocated: {action.allocations.unallocated} units
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Approval Audit Memo / Reviewer Notes:
                    </label>
                    <input
                      type="text"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-[#0B4632] focus-visible:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setApprovingId(null)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs border border-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmApprove(action)}
                      className="px-4 py-1.5 bg-[#0B4632] hover:bg-[#083626] text-white font-semibold rounded text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirm Authorization</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Reject Confirmation Input if active */}
              {rejectingId === action.id && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 space-y-3 text-xs animate-in fade-in">
                  <div className="font-semibold text-rose-800 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Specify Reason for Rejection:</span>
                  </div>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Inadequate vendor credit rate, request alternative quote, technician repair bench backlogged..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-rose-500 focus-visible:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-1 bg-white text-slate-700 rounded text-xs border border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmReject(action.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors shadow-xs"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {/* Quantities & Financial Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-mono font-medium">TOTAL UNITS</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                    {action.total_units} units
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-mono font-medium">ESTIMATED NET PROCEEDS</div>
                  <div className="text-xl font-bold font-mono text-[#0B4632] mt-1 tabular-nums">
                    {CalculationEngine.formatINR(action.expected_net_recovery)}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-mono font-medium">TIME-TO-CASH</div>
                  <div className="text-xl font-bold font-mono text-slate-800 mt-1 tabular-nums">
                    ~{action.weighted_days_to_cash} days
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-mono font-medium">ROUTE ALLOCATION</div>
                  <div className="text-xs font-mono text-slate-700 mt-1 space-y-0.5">
                    {action.allocations.rtv > 0 && <div className="text-[#0B4632] font-semibold">RTV: {action.allocations.rtv} units</div>}
                    {action.allocations.refurb > 0 && <div className="text-teal-700 font-semibold">Refurb: {action.allocations.refurb} units</div>}
                    {action.allocations.liquidate > 0 && <div className="text-amber-700 font-semibold">Liquidate: {action.allocations.liquidate} units</div>}
                    {action.allocations.scrap > 0 && <div className="text-slate-500 font-semibold">Scrap: {action.allocations.scrap} units</div>}
                    {action.allocations.unallocated !== undefined && action.allocations.unallocated > 0 && <div className="text-amber-700 font-semibold">Unallocated: {action.allocations.unallocated} units</div>}
                  </div>
                </div>
              </div>

              {/* Rationale & Assumptions */}
              <div className="space-y-2 text-xs pt-1">
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Primary Rationale:</strong> {action.primary_rationale}
                </div>
                {action.key_assumptions.length > 0 && (
                  <div className="space-y-1 text-slate-600 text-[11px] pt-1">
                    <span className="font-semibold text-slate-700 uppercase font-mono text-[10px]">
                      Assumptions &amp; SLAs:
                    </span>
                    {action.key_assumptions.map((a, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#0B4632] font-bold">·</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 7. Historical Governance & Recent Activity Audit Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
            <History className="h-4 w-4 text-[#0B4632]" />
            <span>Governance Audit Ledger &amp; Decision Timeline</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>{historyActions.length} Actions Decided</span>
            <span>·</span>
            <span className="text-[#0B4632] font-semibold">{auditEvents.length} SQLite Audit Events Persisted</span>
          </div>
        </div>

        {/* Audit Status Disclaimer */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Execution Status Note:</strong> Manager authorization confirms and stages the recovery allocation in the system ledger. Because physical warehouse courier and supplier EDI integrations require offline dispatch verification, approved proposals are recorded with authoritative status: <span className="font-mono font-semibold text-[#0B4632]">"Approved — Awaiting Execution"</span>.
          </span>
        </div>

        {/* Decision Cards */}
        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {historyActions.map((h) => (
            <div
              key={h.id}
              className="relative pl-8 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              {/* Timeline marker */}
              <div
                className={`absolute left-2 top-4 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  h.status === 'approved'
                    ? 'border-[#0B4632]'
                    : h.status === 'rejected'
                    ? 'border-rose-500'
                    : 'border-amber-500'
                }`}
              />

              <div className="flex items-center gap-3">
                <ProductImage
                  sku={h.sku}
                  name={h.product_name}
                  size="sm"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[#0B4632] font-bold">{h.id}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <strong className="text-slate-900 text-sm">{h.product_name}</strong>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">({h.sku})</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-700">
                      Allocated: {h.total_units} units ({h.allocations.rtv} RTV, {h.allocations.refurb} Refurb, {h.allocations.liquidate} Liq)
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    Decided: <span className="font-mono text-slate-800">{h.reviewed_at || h.created_at}</span> by <strong className="text-slate-800">{h.reviewer_name || 'System Admin'}</strong> · <em>"{h.reviewer_notes}"</em>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <span className="font-mono font-bold text-[#0B4632] tabular-nums text-sm">
                  {CalculationEngine.formatINR(h.expected_net_recovery)}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide ${
                    h.status === 'approved'
                      ? 'bg-emerald-100 text-[#0B4632] border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {h.status === 'approved' ? 'Approved — Awaiting Execution' : 'Rejected'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Persisted SQLite Audit Trail Table */}
        {auditEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0B4632]" />
                <span>Immutable SQLite Audit Ledger (Survives Server Restart)</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">table: approval_audit_events</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Audit Event ID</th>
                    <th className="py-2 px-3">Proposal ID</th>
                    <th className="py-2 px-3">Decision</th>
                    <th className="py-2 px-3">Manager / Lead</th>
                    <th className="py-2 px-3">Transition</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Audit Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {auditEvents.slice(0, 10).map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-[#0B4632] font-semibold">{evt.id}</td>
                      <td className="py-2 px-3 text-slate-700">{evt.approval_id}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            evt.decision === 'APPROVED' || evt.decision === 'AUTHORIZE'
                              ? 'bg-emerald-50 text-[#0B4632] border border-emerald-200'
                              : evt.decision === 'REJECTED' || evt.decision === 'REJECT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {evt.decision}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-800 font-sans">{evt.manager_id}</td>
                      <td className="py-2 px-3 text-slate-500">
                        {evt.previous_status} &rarr; <span className="text-slate-800 font-semibold">{evt.new_status}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{evt.timestamp}</td>
                      <td className="py-2 px-3 text-slate-600 font-sans max-w-xs truncate">{evt.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
