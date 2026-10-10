export const CURRENT_SIMULATION_DATE = '2026-10-09';

export type ReturnGrade = 'A' | 'B' | 'C' | 'DEFECTIVE';

export interface Product {
  sku: string;
  name: string;
  category: 'Audio' | 'Displays' | 'Wearables' | 'Drones' | 'Tablets';
  cost: number; // Original product cost in INR
  selling_price: number; // Current new selling price in INR
  supplier: string;
  lifecycle_status: 'Active' | 'Discontinued' | 'Phase-out';
  image_url?: string;
}

export interface ReturnItem {
  return_id: string;
  date: string; // YYYY-MM-DD
  sku: string;
  supplier_batch: string;
  reason_code: string;
  reason_label: string;
  grade: ReturnGrade;
  customer_note?: string;
  days_since_return: number;
}

export interface SaleRecord {
  date: string;
  sku: string;
  qty_sold: number;
  selling_price: number;
}

export interface InventoryRecord {
  sku: string;
  new_stock: number;
  avg_daily_demand: number;
  reorder_lead_time_days: number;
}

export interface RefurbishmentRule {
  category: string;
  cost: number; // Cost to inspect, repair & repackage per unit
  days_required: number; // Turnaround bench time
  resale_pct_of_new: number; // Percentage of new selling price achievable
}

export interface VendorTerms {
  supplier: string;
  sku: string;
  rtv_allowed: boolean;
  credit_pct: number; // Percentage of original product cost returned as credit
  window_days: number; // Max calendar days from return to claim credit
}

export interface LiquidationRule {
  category: string;
  grade: ReturnGrade;
  recovery_pct_of_cost: number; // Percentage of original product cost paid by bulk liquidator
}

export type RecoveryRouteType = 'rtv' | 'refurb' | 'liquidate' | 'scrap';

export interface RouteFinancials {
  route: RecoveryRouteType;
  routeName: string;
  isEligible: boolean;
  ineligibilityReason?: string;
  
  allocatedUnits: number;
  eligibleUnits: number;
  
  unitGrossRecovery: number;
  unitDirectCost: number;
  unitNetRecovery: number;
  
  totalGrossRecovery: number;
  totalDirectCost: number;
  totalNetRecovery: number;
  
  timeToCashDays: number;
  demandRisk: 'None' | 'Low' | 'Moderate' | 'High';
  demandWarning?: string;
  
  assumptions: string[];
  uncertainties: string[];
}

export interface BatchAllocation {
  sku: string;
  totalUnits: number;
  rtvUnits: number;
  refurbUnits: number;
  liquidateUnits: number;
  scrapUnits: number;
  unallocatedUnits?: number;
}

export interface BatchInputData {
  returnIds: string[];
  sku: string;
  productName: string;
  category: string;
  supplier: string;
  supplierBatch: string;
  totalReturnedQty: number;
  productGrades: Record<string, number>;
  primaryGrade: ReturnGrade;
  returnReasons: { code: string; label: string; count: number; percentage: number }[];
  primaryReason: string;
  originalProductCost: number;
  newSellingPrice: number;
  
  // Supplier Return terms & status
  supplierReturnEligibility: boolean;
  supplierCreditPct: number | null;
  unitSupplierCredit: number | null;
  vendorReturnDeadlineDays: number | null;
  earliestReturnDate: string | null;
  daysRemainingInWindow: number | null;
  eligibleQuantity: number;
  expiredQuantity: number;
  
  // Refurbishment terms
  refurbishmentCost: number | null;
  refurbishmentDurationDays: number | null;
  expectedRefurbishedResalePct: number | null;
  expectedRefurbResalePrice: number | null;
  unitRefurbNetBeforeRisk: number | null;
  
  // Liquidation terms
  liquidationRecoveryPct: number | null;
  unitLiquidationProceeds: number | null;
  
  // Inventory & demand context
  currentInventoryStock: number | null;
  avgDailyDemand: number | null;
  inventoryCoverageDays: number | null;
  
  // Unavailable information & impact explanation
  unavailableFields: {
    field: string;
    impactOnRecommendation: string;
  }[];
}

export interface CandidateAllocationComparison {
  id: string;
  name: string;
  strategyDescription: string;
  allocation: {
    rtv: number;
    refurb: number;
    liquidate: number;
    scrap: number;
    unallocated: number;
  };
  totalGrossRecovery: number;
  totalDirectCosts: number;
  totalNetRecovery: number;
  netRecoveryDeltaVsRecommended: number;
  weightedTimeToCashDays: number | string;
  demandRiskLevel: 'None' | 'Low' | 'Moderate' | 'High';
  keyTradeoff: string;
  isRecommended: boolean;
}

export interface BatchOptimizationConstraints {
  maxRefurbCapacity?: number;
  minNetRecoveryTarget?: number;
  maxTimeToCashDays?: number;
  requireFullAllocation?: boolean;
  strategyPreference?: 'max_recovery' | 'fast_cash' | 'balanced';
  allowedRoutes?: RecoveryRouteType[];
}

export interface DraftAllocationRecord {
  id: string;
  created_at: string;
  updated_at: string;
  sku: string;
  product_name: string;
  supplier_batch: string;
  total_units: number;
  allocations: {
    rtv: number;
    refurb: number;
    liquidate: number;
    scrap: number;
    unallocated: number;
  };
  totalGrossRecovery: number;
  totalDirectCosts: number;
  totalNetRecovery: number;
  weightedTimeToCashDays: number;
  notes?: string;
  scenario_name?: string;
}

export interface BatchOptimizationResult {
  sku: string;
  product: Product;
  totalUnits: number;
  allocations: BatchAllocation;
  unallocatedUnits: number;
  routes: {
    rtv: RouteFinancials;
    refurb: RouteFinancials;
    liquidate: RouteFinancials;
    scrap: RouteFinancials;
  };
  totalGrossRecovery: number;
  totalDirectCost: number;
  totalNetRecovery: number;
  weightedTimeToCashDays: number;
  recommendationHeadline: string;
  recommendationExplanation: string;
  alternativeComparisons: string[];
  candidateComparisons: CandidateAllocationComparison[];
  caveats: string[];
  batchInput?: BatchInputData;
  accountingDistinction: {
    sunkCostExcluded: number;
    supplierCreditPortion: number;
    cashProceedsPortion: number;
    explanation: string;
  };
  objectiveFunctionSummary: string;
}

export interface QualityAlert {
  id: string;
  sku: string;
  product_name: string;
  supplier: string;
  supplier_batch: string;
  fault_code: string;
  fault_description: string;
  fault_returns_count: number;
  batch_returns_count: number;
  fault_percentage_of_returns: number; // e.g. 70%
  batch_total_units_sold: number;
  fault_rate_of_batch: number; // e.g. 8% of total sold
  severity: 'critical' | 'warning' | 'info';
  evidence_logs: string[];
  financial_impact_estimate: number;
  recommended_action: string;
  is_statistically_conclusive: boolean;
  sample_size_note: string;
}

export type DeadlineUrgency = 'critical' | 'warning' | 'info' | 'expired' | 'ineligible';

export interface DeadlineAlert {
  id: string;
  sku: string;
  product_name: string;
  category: string;
  supplier: string;
  supplier_batch: string;
  earliest_return_date: string | null;
  window_days: number | null;
  deadline_date: string | null;
  days_remaining: number;
  eligible_units: number;
  expired_units: number;
  total_batch_units: number;
  credit_pct: number;
  unit_credit: number;
  total_credit_at_risk: number;
  urgency: DeadlineUrgency;
  eligibility_status:
    | 'eligible_critical'
    | 'eligible_upcoming'
    | 'expired_window'
    | 'missing_terms'
    | 'rtv_disallowed'
    | 'condition_ineligible';
  missing_information: string[];
  recommended_action: string;
  consequence: string;
  priority_score: number;
  is_relative_demo_date: boolean;
  contract_citation?: string;
}

export interface ApprovalAction {
  id: string;
  created_at: string;
  sku: string;
  product_name: string;
  supplier_batch: string;
  total_units: number;
  allocations: {
    rtv: number;
    refurb: number;
    liquidate: number;
    scrap: number;
    unallocated?: number;
  };
  expected_net_recovery: number;
  weighted_days_to_cash: number;
  primary_rationale: string;
  key_assumptions: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string;
  reviewer_name?: string;
  reviewer_notes?: string;
  is_simulated: boolean;
}

export interface ApprovalAuditEvent {
  id: string;
  approval_id: string;
  decision: string;
  manager_id: string;
  timestamp: string;
  comments: string | null;
  previous_status: string;
  new_status: string;
  details?: string;
}

export interface DemoDatasetStatus {
  isLoaded: boolean;
  datasetName: string;
  benchmarkBatch: string;
  counts: {
    products: number;
    returns: number;
    headphoneReturns: number;
    headphoneDefects: number;
    eligibleRtvUnits: number;
    approvals: number;
  };
  lastResetAt: string;
}

export interface AutomatedTestResult {
  id: string;
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'running';
  assertions: {
    check: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
  duration_ms: number;
  error_message?: string;
}

export interface WhatIfSimulationInputs {
  supplierCreditPct: number;
  eligibleReturnQty: number;
  refurbCost: number;
  refurbResalePct: number;
  refurbDurationDays: number;
  liquidationRecoveryPct: number;
  avgDailyDemand: number;
  newStockOnHand: number;
  demandTrapDaysThreshold: number;
}

export interface WhatIfValidationState {
  isValid: boolean;
  errors: Partial<Record<keyof WhatIfSimulationInputs, string>>;
  warnings: string[];
}

export interface WhatIfRouteSummary {
  route: RecoveryRouteType;
  routeName: string;
  unitGross: number;
  unitDirectCost: number;
  unitNetProceeds: number;
  allocatedUnits: number;
  totalGross: number;
  totalDirectCost: number;
  totalNetProceeds: number;
  timeToCashDays: number;
  isEligible: boolean;
  notes: string;
}

export interface WhatIfSimulationResult {
  sku: string;
  productName: string;
  totalBatchUnits: number;
  inputs: WhatIfSimulationInputs;
  validation: WhatIfValidationState;
  routes: {
    rtv: WhatIfRouteSummary;
    refurb: WhatIfRouteSummary;
    liquidate: WhatIfRouteSummary;
    scrap: WhatIfRouteSummary;
  };
  allocation: {
    rtv: number;
    refurb: number;
    liquidate: number;
    scrap: number;
    total: number;
  };
  totalGrossRecovery: number;
  totalDirectCost: number;
  totalNetProceeds: number;
  weightedTimeToCashDays: number;
  baseline: {
    totalGrossRecovery: number;
    totalDirectCost: number;
    totalNetProceeds: number;
    weightedTimeToCashDays: number;
    allocation: { rtv: number; refurb: number; liquidate: number; scrap: number };
    bestRouteStrategy: string;
  };
  delta: {
    grossDiff: number;
    costDiff: number;
    netProceedsDiff: number;
    netProceedsPctDiff: number;
    timeToCashDiffDays: number;
    allocationChanged: boolean;
    routeRecommendationChanged: boolean;
  };
  recommendationHeadline: string;
  recommendationExplanation: string;
  detailedEconomicTippingPoints: string[];
  missingInformation: string[];
  risksAndUncertainties: string[];
}

export type AgentToolName =
  | 'get_return_data'
  | 'calculate_recovery'
  | 'detect_quality_risk'
  | 'find_expiring_vendor_windows'
  | 'optimize_batch_allocation'
  | 'generate_action_plan'
  | 'save_approval'
  | 'generate_daily_report';

export interface AgentToolTrace {
  tool_name: AgentToolName | string;
  arguments: Record<string, unknown>;
  output_summary: string;
  result?: unknown;
  status?: 'success' | 'failed';
  duration_ms?: number;
}

export interface DailyExecutiveReport {
  date: string;
  system: string;
  summaryHeadline: string;
  stats: {
    totalPendingReturns: number;
    criticalDeadlinesCount: number;
    creditAtRiskTotal: number;
    defectClustersCount: number;
    potentialIncrementalRecovery: number;
  };
  criticalDeadlines: Array<{
    sku: string;
    productName: string;
    supplier: string;
    daysRemaining: number;
    eligibleUnits: number;
    creditAtRisk: number;
    urgency: string;
  }>;
  qualityAlerts: Array<{
    batch: string;
    sku: string;
    faultCode: string;
    concentrationPct: number;
    batchSoldDefectRate: number;
    suggestedInvestigation: string;
  }>;
  batchSplittingHighlights: Array<{
    sku: string;
    productName: string;
    allocations: { rtv: number; refurb: number; liquidate: number; scrap: number; unallocated?: number };
    netRecovery: number;
    deltaVsLiquidation: number;
  }>;
  recommendedActions: Array<{
    sku: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    title: string;
    rationale: string;
  }>;
}

export interface AgentResponse {
  answer: string;
  tools_called: AgentToolTrace[];
  recommended_action?: {
    sku: string;
    headline: string;
    net_recovery: number;
    allocations: Record<string, number>;
    weighted_days_to_cash?: number;
  };
  saved_approval?: ApprovalAction;
  daily_report?: DailyExecutiveReport;
  source: 'gemini_api' | 'deterministic_agent';
}
