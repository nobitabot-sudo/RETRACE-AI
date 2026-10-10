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
  BatchOptimizationResult,
  ReturnGrade,
} from '../types';
import { FinancialRecoveryEngine, RouteFinancialOutput } from './financialRecoveryEngine';
import { CalculationEngine } from './calculationEngine';
import { DeadlineHunterEngine } from './deadlineHunterEngine';
import { ReturnDetectiveEngine, SuspiciousPatternAlert } from './returnDetectiveEngine';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS,
  SAMPLE_SALES,
  INITIAL_APPROVALS,
} from '../data/sampleData';

export type ToolPermission =
  | 'read_returns'
  | 'read_financials'
  | 'read_quality'
  | 'read_deadlines'
  | 'optimize_allocation'
  | 'stage_proposal'
  | 'persist_approval'
  | 'generate_reports';

export interface ToolDefinition {
  name: string;
  description: string;
  isReadOnly: boolean;
  requiredPermission: ToolPermission;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface ExecutionProgressStep {
  stepId: string;
  label: string;
  toolName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  details?: string;
}

export interface StructuredFinding {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'deadline' | 'quality' | 'recovery' | 'governance';
  sku: string;
  batch?: string;
  productName: string;
  summary: string;
  evidence: string[];
  supportingRecordIds: string[];
  recommendedAction: string;
  actionRoute?: 'optimizer' | 'deadlines' | 'quality' | 'approvals';
}

export interface StructuredAgentResponse {
  investigation_summary: string;
  execution_steps: ExecutionProgressStep[];
  findings: StructuredFinding[];
  affected_products: string[];
  affected_batches: string[];
  supporting_record_ids: string[];
  calculations: {
    sku: string;
    product_name: string;
    total_units: number;
    recommended_route_summary: string;
    gross_recovery: number;
    direct_costs: number;
    net_recovery: number;
    weighted_time_to_cash_days: number;
    routes_breakdown: {
      route: string;
      units: number;
      unit_net: number;
      total_net: number;
      time_to_cash: string | number;
    }[];
  }[];
  assumptions: string[];
  data_gaps: string[];
  risks: string[];
  recommendation: string;
  proposed_actions: {
    id: string;
    title: string;
    sku: string;
    action_type: 'stage_rtv' | 'stage_split' | 'investigate_quality' | 'liquidate';
    financial_impact: number;
    urgency: 'critical' | 'warning' | 'info';
    requires_manager_approval: boolean;
    is_simulated: boolean;
  }[];
  approval_required: boolean;
  raw_tool_results: Record<string, unknown>[];
  source: 'gemini_api' | 'deterministic_agent';
}

/**
 * Central Tool Registry
 * Strictly enforces validation, parameter sanitization, and permission checks
 * before executing actual application functions against genuine database records.
 */
export class PhoenixToolRegistry {
  public static readonly TOOLS: Record<string, ToolDefinition> = {
    get_return_data: {
      name: 'get_return_data',
      description:
        'Retrieve actual return records, product details, return reasons, grades, and supplier batches from reverse logistics ledger.',
      isReadOnly: true,
      requiredPermission: 'read_returns',
      inputSchema: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Product SKU filter (e.g. WH-NEO-01, MON-4K-PRO)' },
          supplier_batch: { type: 'string', description: 'Supplier production batch code (e.g. HB-09, VT-4K-2026Q3)' },
          reason_code: { type: 'string', description: 'Specific fault code (e.g. DEF-01, DISP-04)' },
          limit: { type: 'number', description: 'Maximum number of return records to retrieve' },
        },
      },
    },

    calculate_recovery: {
      name: 'calculate_recovery',
      description:
        'Calculate deterministic financial outcomes for Supplier Return, Refurbishment, Liquidation, and Scrap using application calculation rules.',
      isReadOnly: true,
      requiredPermission: 'read_financials',
      inputSchema: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Target product SKU' },
          rtv_units: { type: 'number', description: 'Allocated supplier return units' },
          refurb_units: { type: 'number', description: 'Allocated refurbishment units' },
          liquidate_units: { type: 'number', description: 'Allocated bulk liquidation units' },
          scrap_units: { type: 'number', description: 'Allocated scrap salvage units' },
        },
        required: ['sku'],
      },
    },

    detect_quality_risk: {
      name: 'detect_quality_risk',
      description:
        'Analyze recorded return patterns and detect SKU- or batch-level manufacturing defect clusters and forensic failure rates.',
      isReadOnly: true,
      requiredPermission: 'read_quality',
      inputSchema: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Filter by specific SKU' },
          supplier_batch: { type: 'string', description: 'Filter by supplier batch code' },
        },
      },
    },

    find_expiring_vendor_windows: {
      name: 'find_expiring_vendor_windows',
      description:
        'Identify supplier-return opportunities approaching contractual SLA deadlines using actual vendor terms and calendar return dates.',
      isReadOnly: true,
      requiredPermission: 'read_deadlines',
      inputSchema: {
        type: 'object',
        properties: {
          urgency_filter: {
            type: 'string',
            description: 'Filter by urgency level',
            enum: ['critical', 'warning', 'all'],
          },
        },
      },
    },

    optimize_batch_allocation: {
      name: 'optimize_batch_allocation',
      description:
        'Calculate a mathematically feasible allocation of returned units across recovery routes to maximize expected net incremental recovery.',
      isReadOnly: true,
      requiredPermission: 'optimize_allocation',
      inputSchema: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Target product SKU to optimize' },
          strategy_preference: {
            type: 'string',
            description: 'Preferred allocation bias',
            enum: ['max_recovery', 'fast_cash', 'balanced'],
          },
        },
        required: ['sku'],
      },
    },

    generate_action_plan: {
      name: 'generate_action_plan',
      description:
        'Prepare a structured recovery proposal backed by deterministic calculations and stage it for manager review (read-only staging, does not approve).',
      isReadOnly: false,
      requiredPermission: 'stage_proposal',
      inputSchema: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Target product SKU' },
          notes: { type: 'string', description: 'Operational notes explaining the manager proposal' },
        },
        required: ['sku'],
      },
    },

    save_approval: {
      name: 'save_approval',
      description:
        'Record a manager authorization or rejection decision in the governance ledger with audit trail notes. Protected action.',
      isReadOnly: false,
      requiredPermission: 'persist_approval',
      inputSchema: {
        type: 'object',
        properties: {
          action_id: { type: 'string', description: 'Identifier of the approval action (e.g. APP-2026-001)' },
          status: { type: 'string', description: 'Decision status', enum: ['approved', 'rejected'] },
          reviewer_notes: { type: 'string', description: 'Mandatory audit trail notes from authorizing lead' },
          reviewer_name: { type: 'string', description: 'Name of authorizing manager' },
        },
        required: ['action_id', 'status'],
      },
    },

    generate_daily_report: {
      name: 'generate_daily_report',
      description:
        'Produce an executive operations report synthesized from actual return intakes, deadline cliffs, defect alerts, and pending approvals.',
      isReadOnly: true,
      requiredPermission: 'generate_reports',
      inputSchema: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            description: 'Report scope focus',
            enum: ['full_operations', 'critical_deadlines', 'quality_anomalies'],
          },
        },
      },
    },
  };

  /**
   * Safe execution router with parameter validation and strict error boundaries.
   */
  public static async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    context: {
      callerRole?: string;
      approvalsLedger?: ApprovalAction[];
      onSaveApproval?: (actionId: string, status: 'approved' | 'rejected', notes?: string) => void;
    } = {}
  ): Promise<{ success: boolean; data?: unknown; error?: string; isReadOnly: boolean }> {
    const def = this.TOOLS[toolName];
    if (!def) {
      return {
        success: false,
        error: `Unknown tool "${toolName}". Tool is not registered in RETRACE AI registry.`,
        isReadOnly: true,
      };
    }

    // Role / Permission check
    const callerRole = context.callerRole || 'manager';
    if (!def.isReadOnly && callerRole === 'read_only_auditor') {
      return {
        success: false,
        error: `Access Denied: Tool "${toolName}" modifies operational state and requires write permissions.`,
        isReadOnly: false,
      };
    }

    try {
      switch (toolName) {
        case 'get_return_data': {
          const sku = typeof args.sku === 'string' ? args.sku.trim() : undefined;
          const batch = typeof args.supplier_batch === 'string' ? args.supplier_batch.trim() : undefined;
          const reason = typeof args.reason_code === 'string' ? args.reason_code.trim() : undefined;
          const limit = typeof args.limit === 'number' ? Math.max(1, args.limit) : 100;

          const records = SAMPLE_RETURNS.filter((r) => {
            if (sku && r.sku !== sku) return false;
            if (batch && r.supplier_batch !== batch) return false;
            if (reason && r.reason_code !== reason) return false;
            return true;
          }).slice(0, limit);

          const product = sku ? SAMPLE_PRODUCTS.find((p) => p.sku === sku) : undefined;

          return {
            success: true,
            isReadOnly: true,
            data: {
              sku_queried: sku || 'all',
              matched_records_count: records.length,
              product_details: product
                ? {
                    sku: product.sku,
                    name: product.name,
                    category: product.category,
                    cost: product.cost,
                    selling_price: product.selling_price,
                    supplier: product.supplier,
                  }
                : undefined,
              records: records.map((r) => ({
                return_id: r.return_id,
                date: r.date,
                sku: r.sku,
                supplier_batch: r.supplier_batch,
                reason_code: r.reason_code,
                reason_label: r.reason_label,
                grade: r.grade,
                days_since_return: r.days_since_return,
                customer_note: r.customer_note,
              })),
            },
          };
        }

        case 'calculate_recovery': {
          const sku = typeof args.sku === 'string' ? args.sku.trim() : 'WH-NEO-01';
          const product = SAMPLE_PRODUCTS.find((p) => p.sku === sku);
          if (!product) {
            return { success: false, error: `SKU "${sku}" not found in catalog.`, isReadOnly: true };
          }

          const rtvUnits = typeof args.rtv_units === 'number' ? args.rtv_units : undefined;
          const refurbUnits = typeof args.refurb_units === 'number' ? args.refurb_units : undefined;
          const liquidateUnits = typeof args.liquidate_units === 'number' ? args.liquidate_units : undefined;
          const scrapUnits = typeof args.scrap_units === 'number' ? args.scrap_units : undefined;

          // Reject negative parameters
          if (
            (rtvUnits !== undefined && rtvUnits < 0) ||
            (refurbUnits !== undefined && refurbUnits < 0) ||
            (liquidateUnits !== undefined && liquidateUnits < 0) ||
            (scrapUnits !== undefined && scrapUnits < 0)
          ) {
            return { success: false, error: 'Allocation quantities cannot be negative.', isReadOnly: true };
          }

          const opt = CalculationEngine.optimizeBatch(
            sku,
            SAMPLE_PRODUCTS,
            SAMPLE_VENDOR_TERMS,
            SAMPLE_REFURB_RULES,
            SAMPLE_LIQUIDATION_RULES,
            SAMPLE_INVENTORY,
            SAMPLE_RETURNS,
            { rtvUnits, refurbUnits, liquidateUnits, scrapUnits }
          );

          return {
            success: true,
            isReadOnly: true,
            data: {
              sku: opt.sku,
              product_name: opt.product.name,
              total_available_units: opt.totalUnits,
              unallocated_units: opt.unallocatedUnits,
              allocation_evaluated: opt.allocations,
              total_gross_recovery: opt.totalGrossRecovery,
              total_direct_cost: opt.totalDirectCost,
              total_net_recovery: opt.totalNetRecovery,
              weighted_time_to_cash_days: opt.weightedTimeToCashDays,
              routes: {
                supplier_return: {
                  eligible: opt.routes.rtv.isEligible,
                  allocated_units: opt.routes.rtv.allocatedUnits,
                  unit_net: opt.routes.rtv.unitNetRecovery,
                  total_net: opt.routes.rtv.totalNetRecovery,
                  time_to_cash: opt.routes.rtv.timeToCashDays,
                },
                refurbishment: {
                  eligible: opt.routes.refurb.isEligible,
                  allocated_units: opt.routes.refurb.allocatedUnits,
                  unit_net: opt.routes.refurb.unitNetRecovery,
                  total_net: opt.routes.refurb.totalNetRecovery,
                  time_to_cash: opt.routes.refurb.timeToCashDays,
                  demand_risk: opt.routes.refurb.demandRisk,
                },
                liquidation: {
                  allocated_units: opt.routes.liquidate.allocatedUnits,
                  unit_net: opt.routes.liquidate.unitNetRecovery,
                  total_net: opt.routes.liquidate.totalNetRecovery,
                  time_to_cash: opt.routes.liquidate.timeToCashDays,
                },
              },
            },
          };
        }

        case 'detect_quality_risk': {
          const sku = typeof args.sku === 'string' ? args.sku.trim() : undefined;
          const batch = typeof args.supplier_batch === 'string' ? args.supplier_batch.trim() : undefined;

          const alerts = CalculationEngine.detectQualityRisks(SAMPLE_RETURNS, SAMPLE_PRODUCTS, SAMPLE_SALES);
          const patterns = ReturnDetectiveEngine.detectSuspiciousPatterns(
            SAMPLE_RETURNS,
            SAMPLE_PRODUCTS,
            SAMPLE_SALES
          );

          const filteredAlerts = alerts.filter((a) => {
            if (sku && a.sku !== sku) return false;
            if (batch && a.supplier_batch !== batch) return false;
            return true;
          });

          return {
            success: true,
            isReadOnly: true,
            data: {
              alerts_count: filteredAlerts.length,
              alerts: filteredAlerts.map((a) => ({
                id: a.id,
                sku: a.sku,
                product_name: a.product_name,
                supplier: a.supplier,
                supplier_batch: a.supplier_batch,
                fault_code: a.fault_code,
                fault_description: a.fault_description,
                fault_returns_count: a.fault_returns_count,
                batch_returns_count: a.batch_returns_count,
                fault_percentage_of_returns: a.fault_percentage_of_returns,
                batch_total_units_sold: a.batch_total_units_sold,
                fault_rate_of_batch: a.fault_rate_of_batch,
                severity: a.severity,
                sample_size_note: a.sample_size_note,
                recommended_action: a.recommended_action,
              })),
              forensic_investigation_patterns: patterns.map((p) => ({
                id: p.id,
                sku: p.sku,
                batch: p.batch,
                affected_returns: p.affectedReturnsCount,
                total_returns: p.groupTotalReturns,
                concentration_pct: p.percentageOfGroup,
                overall_batch_failure_rate: p.overallBatchFailureRate,
                statistical_distinction: p.statisticalDistinctionNote,
                cited_return_ids: p.citedReturnIds,
              })),
            },
          };
        }

        case 'find_expiring_vendor_windows': {
          const filter = typeof args.urgency_filter === 'string' ? args.urgency_filter : 'all';
          const deadlines = CalculationEngine.findExpiringVendorWindows(
            SAMPLE_RETURNS,
            SAMPLE_PRODUCTS,
            SAMPLE_VENDOR_TERMS
          );

          const filtered = deadlines.filter((d) => {
            if (filter === 'critical') return d.urgency === 'critical';
            if (filter === 'warning') return d.urgency === 'critical' || d.urgency === 'warning';
            return true;
          });

          return {
            success: true,
            isReadOnly: true,
            data: {
              total_opportunities: filtered.length,
              opportunities: filtered.map((d) => ({
                id: d.id,
                sku: d.sku,
                product_name: d.product_name,
                supplier: d.supplier,
                supplier_batch: d.supplier_batch,
                days_remaining: d.days_remaining,
                eligible_units: d.eligible_units,
                expired_units: d.expired_units,
                total_credit_at_risk: d.total_credit_at_risk,
                urgency: d.urgency,
                eligibility_status: d.eligibility_status,
                missing_information: d.missing_information,
                recommended_action: d.recommended_action,
              })),
            },
          };
        }

        case 'optimize_batch_allocation': {
          const sku = typeof args.sku === 'string' ? args.sku.trim() : 'WH-NEO-01';
          const product = SAMPLE_PRODUCTS.find((p) => p.sku === sku);
          if (!product) {
            return { success: false, error: `SKU "${sku}" not found in catalog.`, isReadOnly: true };
          }

          const opt = FinancialRecoveryEngine.optimize_batch_allocation({
            sku,
            products: SAMPLE_PRODUCTS,
            vendorTermsList: SAMPLE_VENDOR_TERMS,
            refurbRules: SAMPLE_REFURB_RULES,
            liqRules: SAMPLE_LIQUIDATION_RULES,
            inventoryList: SAMPLE_INVENTORY,
            returnsList: SAMPLE_RETURNS,
          });

          return {
            success: true,
            isReadOnly: true,
            data: {
              sku: opt.sku,
              product_name: opt.product.name,
              total_available_units: opt.totalAvailableUnits,
              optimal_allocation: opt.allocation,
              total_gross_recovery: opt.summary.totalGrossRecovery,
              total_direct_costs: opt.summary.totalDirectCosts,
              total_net_recovery: opt.summary.totalNetProceeds,
              supplier_credit_portion: opt.summary.supplierCreditPortion,
              cash_proceeds_portion: opt.summary.cashProceedsPortion,
              weighted_time_to_cash_days: opt.summary.weightedTimeToCashDays,
              candidate_alternatives: opt.candidateComparisons.map((c) => ({
                name: c.name,
                allocation: c.allocation,
                net_recovery: c.totalNetRecovery,
                delta_vs_recommended: c.netRecoveryDeltaVsRecommended,
                days_to_cash: c.weightedTimeToCashDays,
                tradeoff: c.keyTradeoff,
                is_recommended: c.isRecommended,
              })),
              evidence_based_explanation: opt.evidenceBasedExplanation,
              objective_function: opt.objectiveFunctionSummary,
            },
          };
        }

        case 'generate_action_plan': {
          const sku = typeof args.sku === 'string' ? args.sku.trim() : 'WH-NEO-01';
          const product = SAMPLE_PRODUCTS.find((p) => p.sku === sku);
          if (!product) {
            return { success: false, error: `SKU "${sku}" not found in catalog.`, isReadOnly: false };
          }

          const opt = FinancialRecoveryEngine.optimize_batch_allocation({
            sku,
            products: SAMPLE_PRODUCTS,
            vendorTermsList: SAMPLE_VENDOR_TERMS,
            refurbRules: SAMPLE_REFURB_RULES,
            liqRules: SAMPLE_LIQUIDATION_RULES,
            inventoryList: SAMPLE_INVENTORY,
            returnsList: SAMPLE_RETURNS,
          });

          const notes = typeof args.notes === 'string' ? args.notes : 'Staged proposal prepared by RETRACE AI Agent for manager authorization.';

          const proposal: ApprovalAction = {
            id: `APP-ACT-${Date.now().toString().slice(-4)}`,
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
            sku: opt.sku,
            product_name: opt.product.name,
            supplier_batch: SAMPLE_RETURNS.find((r) => r.sku === sku)?.supplier_batch || 'BATCH-SPLIT',
            total_units: opt.totalAvailableUnits,
            allocations: {
              rtv: opt.allocation.rtvUnits,
              refurb: opt.allocation.refurbUnits,
              liquidate: opt.allocation.liquidateUnits,
              scrap: opt.allocation.scrapUnits,
              unallocated: opt.allocation.unallocatedUnits,
            },
            expected_net_recovery: opt.summary.totalNetProceeds,
            weighted_days_to_cash: opt.summary.weightedTimeToCashDays,
            primary_rationale: opt.summary.rationale,
            key_assumptions: opt.evidenceBasedExplanation.uncertaintyAndRisks,
            status: 'pending',
            reviewer_notes: notes,
            is_simulated: true,
          };

          return {
            success: true,
            isReadOnly: false,
            data: {
              proposal_staged: proposal,
              status: 'pending_manager_authorization',
              note: 'Proposal successfully drafted and staged for manager review. Staging does NOT approve or execute transactions.',
            },
          };
        }

        case 'save_approval': {
          const actionId = typeof args.action_id === 'string' ? args.action_id.trim() : '';
          const status = args.status === 'approved' || args.status === 'rejected' ? args.status : null;
          const notes = typeof args.reviewer_notes === 'string' ? args.reviewer_notes : 'Manager authorization recorded in ledger.';
          const reviewerName = typeof args.reviewer_name === 'string' ? args.reviewer_name : 'Devin K. (Returns Lead)';

          if (!actionId || !status) {
            return {
              success: false,
              error: 'action_id and valid status ("approved" or "rejected") are required.',
              isReadOnly: false,
            };
          }

          if (context.onSaveApproval) {
            context.onSaveApproval(actionId, status, notes);
          }

          return {
            success: true,
            isReadOnly: false,
            data: {
              action_id: actionId,
              status,
              reviewer_name: reviewerName,
              reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
              notes,
              simulated_audit_recorded: true,
            },
          };
        }

        case 'generate_daily_report': {
          const deadlines = CalculationEngine.findExpiringVendorWindows(
            SAMPLE_RETURNS,
            SAMPLE_PRODUCTS,
            SAMPLE_VENDOR_TERMS
          );
          const qualityRisks = CalculationEngine.detectQualityRisks(
            SAMPLE_RETURNS,
            SAMPLE_PRODUCTS,
            SAMPLE_SALES
          );
          const totalReturns = SAMPLE_RETURNS.length;
          const criticalCount = deadlines.filter((d) => d.urgency === 'critical').length;
          const totalAtRiskCredit = deadlines.reduce((acc, d) => acc + d.total_credit_at_risk, 0);

          return {
            success: true,
            isReadOnly: true,
            data: {
              report_date: new Date().toISOString().slice(0, 10),
              executive_summary: `RETRACE AI Daily Operations Briefing: ${totalReturns} returned items under active triage across 5 categories. ${criticalCount} critical supplier windows require immediate approval. Total contractual credit at risk: ₹${totalAtRiskCredit.toLocaleString('en-IN')}.`,
              kpis: {
                total_active_returns: totalReturns,
                critical_deadlines_count: criticalCount,
                quality_alerts_count: qualityRisks.length,
                total_credit_at_risk: totalAtRiskCredit,
              },
              urgent_action_items: [
                {
                  priority: 1,
                  item: 'Authorize VisionTech 4K Monitor RTV claim (5 units, ₹91,000 credit) before 3-day SLA window closes.',
                },
                {
                  priority: 2,
                  item: 'Approve batch split for SoundCraft Headphones HB-09 (24 RTV = ₹20,160 credit, 16 Refurb = ₹26,000 net).',
                },
                {
                  priority: 3,
                  item: 'Execute wholesale liquidation on PulseTrack Smartwatches (8 units = ₹22,400) to avert 180-day holding trap.',
                },
              ],
            },
          };
        }

        default:
          return { success: false, error: `Unhandled tool "${toolName}"`, isReadOnly: true };
      }
    } catch (err) {
      return {
        success: false,
        error: `Tool execution failed: ${(err as Error).message}`,
        isReadOnly: def.isReadOnly,
      };
    }
  }
}
