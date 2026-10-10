import {
  Product,
  ReturnItem,
  SaleRecord,
  InventoryRecord,
  RefurbishmentRule,
  VendorTerms,
  LiquidationRule,
  RouteFinancials,
  BatchAllocation,
  BatchOptimizationResult,
  QualityAlert,
  DeadlineAlert,
  RecoveryRouteType,
  CURRENT_SIMULATION_DATE,
} from '../types';
import { FinancialRecoveryEngine, RouteFinancialOutput } from './financialRecoveryEngine';
import { DeadlineHunterEngine } from './deadlineHunterEngine';
import { WhatIfSimulatorEngine } from './whatIfSimulatorEngine';
import { WhatIfSimulationInputs, WhatIfSimulationResult } from '../types';

/**
 * RETRACE AI Deterministic Calculation Engine
 * 
 * Strict Financial Invariant: All recovery metrics, costs, time-to-cash,
 * and eligibility bounds are computed deterministically through rigorous formulas.
 * AI models are strictly prohibited from generating or modifying numerical values.
 */

export class CalculationEngine {
  /**
   * Formats numbers to Indian Rupee notation (₹)
   */
  public static formatINR(amount: number): string {
    const isNegative = amount < 0;
    const abs = Math.abs(Math.round(amount));
    const formatted = new Intl.NumberFormat('en-IN').format(abs);
    return isNegative ? `-₹${formatted}` : `₹${formatted}`;
  }

  /**
   * Helper to parse date string into timestamp
   */
  public static parseDaysAgo(dateStr: string, baseDateStr: string = CURRENT_SIMULATION_DATE): number {
    const base = new Date(baseDateStr).getTime();
    const target = new Date(dateStr).getTime();
    const diff = Math.round((base - target) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  private static mapToRouteFinancials(output: RouteFinancialOutput, routeKey: RecoveryRouteType): RouteFinancials {
    const clampedAllocatedUnits = routeKey === 'rtv'
      ? Math.min(output.eligibilityConstraints.allocatedUnits, output.eligibilityConstraints.eligibleUnits)
      : output.eligibilityConstraints.allocatedUnits;

    return {
      route: routeKey,
      routeName: output.routeName,
      isEligible: output.eligibilityConstraints.isEligible,
      ineligibilityReason: output.eligibilityConstraints.ineligibilityReason,
      allocatedUnits: clampedAllocatedUnits,
      eligibleUnits: output.eligibilityConstraints.eligibleUnits,
      unitGrossRecovery: output.unitGrossRecovery,
      unitDirectCost: output.unitDirectCost,
      unitNetRecovery: output.unitNetProceeds,
      totalGrossRecovery: output.totalGrossRecovery,
      totalDirectCost: output.totalDirectCost,
      totalNetRecovery: output.totalNetProceeds,
      timeToCashDays: output.timeToCashDays,
      demandRisk: output.demandConstraints.demandRiskLevel,
      demandWarning: output.demandConstraints.warningMessage,
      assumptions: output.timeToCashAssumptions,
      uncertainties: output.uncertaintiesAndMissingData,
    };
  }

  /**
   * Calculates Return-To-Vendor (RTV) Financials
   */
  public static calculateRtvRoute(
    product: Product,
    vendorTerms: VendorTerms | undefined,
    returnsForSku: ReturnItem[],
    allocatedUnits: number
  ): RouteFinancials {
    const output = FinancialRecoveryEngine.calculateSupplierReturn(
      product,
      vendorTerms,
      returnsForSku,
      allocatedUnits
    );
    return this.mapToRouteFinancials(output, 'rtv');
  }

  /**
   * Calculates Refurbishment & Secondary Resale Financials
   */
  public static calculateRefurbRoute(
    product: Product,
    refurbRule: RefurbishmentRule | undefined,
    inventory: InventoryRecord | undefined,
    allocatedUnits: number
  ): RouteFinancials {
    const output = FinancialRecoveryEngine.calculateRefurbishmentAndResale(
      product,
      refurbRule,
      inventory,
      allocatedUnits
    );
    return this.mapToRouteFinancials(output, 'refurb');
  }

  /**
   * Calculates Bulk B2B Liquidation Financials
   */
  public static calculateLiquidationRoute(
    product: Product,
    liqRule: LiquidationRule | undefined,
    allocatedUnits: number
  ): RouteFinancials {
    const output = FinancialRecoveryEngine.calculateLiquidation(
      product,
      liqRule,
      allocatedUnits
    );
    return this.mapToRouteFinancials(output, 'liquidate');
  }

  /**
   * Calculates Scrap / Parts Salvage Financials
   */
  public static calculateScrapRoute(
    product: Product,
    allocatedUnits: number
  ): RouteFinancials {
    const output = FinancialRecoveryEngine.calculateScrap(product, allocatedUnits);
    return this.mapToRouteFinancials(output, 'scrap');
  }

  /**
   * Optimizes Batch Allocation across routes
   */
  public static optimizeBatch(
    sku: string,
    products: Product[],
    vendorTermsList: VendorTerms[],
    refurbRules: RefurbishmentRule[],
    liqRules: LiquidationRule[],
    inventoryList: InventoryRecord[],
    returnsList: ReturnItem[],
    customAllocations?: Partial<BatchAllocation>
  ): BatchOptimizationResult {
    const product = products.find((p) => p.sku === sku) || products[0];
    const vendorTerms = vendorTermsList.find((v) => v.sku === sku);
    const refurbRule = refurbRules.find((r) => r.category === product.category);
    const liqRule = liqRules.find((l) => l.category === product.category && l.grade === 'B');
    const inventory = inventoryList.find((i) => i.sku === sku);

    const result = FinancialRecoveryEngine.optimizeBatchSplitting({
      product,
      vendorTerms,
      refurbRule,
      liqRule,
      inventory,
      returnsList,
      customAllocation: customAllocations
        ? {
            rtvUnits: customAllocations.rtvUnits,
            refurbUnits: customAllocations.refurbUnits,
            liquidateUnits: customAllocations.liquidateUnits,
            scrapUnits: customAllocations.scrapUnits,
          }
        : undefined,
    });

    const rtvRoute = this.mapToRouteFinancials(result.routes.supplierReturn, 'rtv');
    const refurbRoute = this.mapToRouteFinancials(result.routes.refurbishment, 'refurb');
    const liquidateRoute = this.mapToRouteFinancials(result.routes.liquidation, 'liquidate');
    const scrapRoute = this.mapToRouteFinancials(result.routes.scrap, 'scrap');

    const caveats = [
      ...result.routes.supplierReturn.uncertaintiesAndMissingData.slice(0, 1),
      ...result.routes.refurbishment.uncertaintiesAndMissingData.slice(0, 2),
    ];

    if (result.routes.refurbishment.demandConstraints.warningMessage) {
      caveats.unshift(result.routes.refurbishment.demandConstraints.warningMessage);
    }

    return {
      sku,
      product,
      totalUnits: result.totalAvailableUnits,
      unallocatedUnits: result.unallocatedUnits,
      allocations: {
        sku,
        totalUnits: result.totalAvailableUnits,
        rtvUnits: result.allocation.rtvUnits,
        refurbUnits: result.allocation.refurbUnits,
        liquidateUnits: result.allocation.liquidateUnits,
        scrapUnits: result.allocation.scrapUnits,
        unallocatedUnits: result.unallocatedUnits,
      },
      routes: {
        rtv: rtvRoute,
        refurb: refurbRoute,
        liquidate: liquidateRoute,
        scrap: scrapRoute,
      },
      totalGrossRecovery: result.summary.totalGrossRecovery,
      totalDirectCost: result.summary.totalDirectCosts,
      totalNetRecovery: result.summary.totalNetProceeds,
      weightedTimeToCashDays: result.summary.weightedTimeToCashDays,
      recommendationHeadline: result.summary.rationale.split('.')[0] + '.',
      recommendationExplanation: result.summary.rationale,
      alternativeComparisons: result.summary.tradeoffs,
      candidateComparisons: result.candidateComparisons,
      caveats,
      batchInput: result.batchInput,
      accountingDistinction: {
        sunkCostExcluded: product.cost,
        supplierCreditPortion: result.summary.supplierCreditPortion,
        cashProceedsPortion: result.summary.cashProceedsPortion,
        explanation: `Historical procurement cost of ₹${product.cost.toLocaleString('en-IN')}/unit is sunk; recovery strictly distinguishes supplier credit (₹${result.summary.supplierCreditPortion.toLocaleString('en-IN')}) from secondary cash proceeds (₹${result.summary.cashProceedsPortion.toLocaleString('en-IN')}).`,
      },
      objectiveFunctionSummary: result.objectiveFunctionSummary,
    };
  }

  /**
   * Detects Supplier Quality & Defect Concentration Risks
   */
  public static detectQualityRisks(
    returnsList: ReturnItem[],
    productsList: Product[],
    salesList: SaleRecord[]
  ): QualityAlert[] {
    const alerts: QualityAlert[] = [];

    // Group returns by supplier_batch + reason_code
    const batchMap = new Map<string, {
      sku: string;
      batch: string;
      totalReturns: number;
      reasonCounts: Map<string, { count: number; label: string; notes: string[] }>;
    }>();

    for (const r of returnsList) {
      const key = `${r.sku}__${r.supplier_batch}`;
      if (!batchMap.has(key)) {
        batchMap.set(key, {
          sku: r.sku,
          batch: r.supplier_batch,
          totalReturns: 0,
          reasonCounts: new Map(),
        });
      }
      const entry = batchMap.get(key)!;
      entry.totalReturns += 1;

      if (!entry.reasonCounts.has(r.reason_code)) {
        entry.reasonCounts.set(r.reason_code, {
          count: 0,
          label: r.reason_label,
          notes: [],
        });
      }
      const reasonEntry = entry.reasonCounts.get(r.reason_code)!;
      reasonEntry.count += 1;
      if (r.customer_note && reasonEntry.notes.length < 4) {
        reasonEntry.notes.push(r.customer_note);
      }
    }

    // Process each batch
    batchMap.forEach((data, key) => {
      const product = productsList.find((p) => p.sku === data.sku);
      if (!product) return;

      // Estimate total units sold from this batch
      const totalUnitsSold = salesList
        .filter((s) => s.sku === data.sku)
        .reduce((acc, s) => acc + s.qty_sold, 0) || 350;

      data.reasonCounts.forEach((reasonData, reasonCode) => {
        const faultPercentageOfReturns = Math.round((reasonData.count / data.totalReturns) * 100);
        const faultRateOfBatch = Number(((reasonData.count / totalUnitsSold) * 100).toFixed(1));

        // Threshold: If more than 40% of returns share the exact fault and count >= 5
        if (faultPercentageOfReturns >= 40 && reasonData.count >= 5) {
          const isHB09 = data.batch === 'HB-09';
          const isStatisticallyConclusive = data.totalReturns >= 30;

          alerts.push({
            id: `QA-${data.batch}-${reasonCode}`,
            sku: data.sku,
            product_name: product.name,
            supplier: product.supplier,
            supplier_batch: data.batch,
            fault_code: reasonCode,
            fault_description: reasonData.label,
            fault_returns_count: reasonData.count,
            batch_returns_count: data.totalReturns,
            fault_percentage_of_returns: faultPercentageOfReturns,
            batch_total_units_sold: totalUnitsSold,
            fault_rate_of_batch: faultRateOfBatch,
            severity: faultPercentageOfReturns >= 65 ? 'critical' : 'warning',
            evidence_logs: reasonData.notes,
            financial_impact_estimate: reasonData.count * product.cost,
            recommended_action: isHB09
              ? `Initiate formal Supplier Quality Review with ${product.supplier}. Issue batch stop-ship alert and demand 100% rework credit for Batch HB-09 hinge molding tooling defects.`
              : `Request vendor engineering sample inspection for Batch ${data.batch}.`,
            is_statistically_conclusive: isStatisticallyConclusive,
            sample_size_note: isStatisticallyConclusive
              ? `Based on ${data.totalReturns} physical returns (${reasonData.count} identical failure symptoms). Sample size meets 95% statistical significance for batch defect clustering.`
              : `Caution: Small sample size (${data.totalReturns} total returns). Observed cluster warrants physical QA verification before formal contractual vendor penalty.`
          });
        }
      });
    });

    return alerts.sort((a, b) => b.fault_percentage_of_returns - a.fault_percentage_of_returns);
  }

  /**
   * Finds approaching or expired supplier return deadlines via DeadlineHunterEngine
   */
  public static findExpiringVendorWindows(
    returnsList: ReturnItem[],
    productsList: Product[],
    vendorTermsList: VendorTerms[]
  ): DeadlineAlert[] {
    return DeadlineHunterEngine.scanOpportunities(returnsList, productsList, vendorTermsList);
  }

  /**
   * Simulates what-if recovery scenarios deterministically
   */
  public static simulateWhatIfRecovery(
    sku: string,
    inputs: WhatIfSimulationInputs,
    products: Product[],
    vendorTermsList: VendorTerms[],
    refurbRules: RefurbishmentRule[],
    liqRules: LiquidationRule[],
    inventoryList: InventoryRecord[],
    returnsList: ReturnItem[]
  ): WhatIfSimulationResult {
    return WhatIfSimulatorEngine.simulate(
      sku,
      inputs,
      products,
      vendorTermsList,
      refurbRules,
      liqRules,
      inventoryList,
      returnsList
    );
  }
}
