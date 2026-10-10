import {
  Product,
  ReturnItem,
  VendorTerms,
  RefurbishmentRule,
  LiquidationRule,
  InventoryRecord,
  WhatIfSimulationInputs,
  WhatIfValidationState,
  WhatIfSimulationResult,
  WhatIfRouteSummary,
} from '../types';

export interface WhatIfPresetScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  scenarioChange: string;
  inputs: Partial<WhatIfSimulationInputs>;
}

export class WhatIfSimulatorEngine {
  /**
   * Pre-configured demonstration scenarios showcasing dynamic recalculations and tipping points.
   */
  public static readonly DEMO_SCENARIOS: WhatIfPresetScenario[] = [
    {
      id: 'baseline',
      title: 'Baseline Contract Reality (WH-NEO-01)',
      badge: 'Current Actuals',
      description: 'Official vendor terms (60% credit, 24 units in window) + standard repair bench (₹250).',
      scenarioChange: 'Resets to authentic procurement contracts & historical return intake.',
      inputs: {
        supplierCreditPct: 60,
        eligibleReturnQty: 24,
        refurbCost: 250,
        refurbResalePct: 75,
        refurbDurationDays: 14,
        liquidationRecoveryPct: 35,
        avgDailyDemand: 2.5,
        newStockOnHand: 60,
        demandTrapDaysThreshold: 120,
      },
    },
    {
      id: 'tipping_refurb_cost',
      title: 'Tipping Point: Tooling Spike (Refurb ₹1,450)',
      badge: 'Route Shift Demo',
      description:
        'Hinge replacement parts & specialized ultrasonic welding tool spike bench repair cost to ₹1,450/unit.',
      scenarioChange:
        'Unit refurb margin collapses from ₹1,625 to ₹425, falling below B2B liquidation (₹490). Remaining 16 units flip from Refurb to Liquidation!',
      inputs: {
        supplierCreditPct: 60,
        eligibleReturnQty: 24,
        refurbCost: 1450, // Spike: Net becomes 1875 - 1450 = 425 < 490 (Liquidation)
        refurbResalePct: 75,
        refurbDurationDays: 14,
        liquidationRecoveryPct: 35,
        avgDailyDemand: 2.5,
        newStockOnHand: 60,
        demandTrapDaysThreshold: 120,
      },
    },
    {
      id: 'demand_trap_overhang',
      title: 'Tipping Point: Demand Glut (New Stock 360 units)',
      badge: 'Demand Trap Demo',
      description:
        'Central warehouse receives bulk container shipment: 360 units new stock = 144 days coverage (>120 limit).',
      scenarioChange:
        'Demand constraint triggers: secondary refurbishment is blocked to avoid price cannibalization. Remaining 16 units routed to Liquidation.',
      inputs: {
        supplierCreditPct: 60,
        eligibleReturnQty: 24,
        refurbCost: 250,
        refurbResalePct: 65,
        refurbDurationDays: 14,
        liquidationRecoveryPct: 35,
        avgDailyDemand: 2.5,
        newStockOnHand: 360, // 360 / 2.5 = 144 days (> 120 limit)
        demandTrapDaysThreshold: 120,
      },
    },
    {
      id: 'supplier_window_collapse',
      title: 'Tipping Point: SLA Expiry (0 Units Eligible)',
      badge: 'Window Cliff Demo',
      description:
        'Supplier audit invalidates return window (30-day strict cutoff). All 40 returned units become expired from RTV.',
      scenarioChange:
        '0 units qualify for RTV credit. All 40 units reallocated to Refurbishment (₹54,960 gross, 30 days to cash).',
      inputs: {
        supplierCreditPct: 60,
        eligibleReturnQty: 0, // Zero eligible units
        refurbCost: 250,
        refurbResalePct: 65,
        refurbDurationDays: 14,
        liquidationRecoveryPct: 35,
        avgDailyDemand: 2.5,
        newStockOnHand: 60,
        demandTrapDaysThreshold: 120,
      },
    },
    {
      id: 'vendor_renegotiation',
      title: 'Vendor Upside: SLA Concession (75% Credit)',
      badge: 'High Value Demo',
      description:
        'Procurement negotiates batch defect allowance concession from SoundCraft: credit raised to 75% for 32 units.',
      scenarioChange:
        'Supplier credit jumps to ₹1,050/unit (+₹210/unit). Total RTV credit increases from ₹20,160 to ₹33,600.',
      inputs: {
        supplierCreditPct: 75,
        eligibleReturnQty: 32,
        refurbCost: 250,
        refurbResalePct: 65,
        refurbDurationDays: 14,
        liquidationRecoveryPct: 35,
        avgDailyDemand: 2.5,
        newStockOnHand: 60,
        demandTrapDaysThreshold: 120,
      },
    },
  ];

  /**
   * Validates manager inputs and rejects impossible or out-of-bound values.
   */
  public static validateInputs(
    inputs: WhatIfSimulationInputs,
    totalBatchUnits: number
  ): WhatIfValidationState {
    const errors: Partial<Record<keyof WhatIfSimulationInputs, string>> = {};
    const warnings: string[] = [];

    // 1. Supplier credit percentage (0 - 100%)
    if (isNaN(inputs.supplierCreditPct)) {
      errors.supplierCreditPct = 'Supplier credit percentage is required.';
    } else if (inputs.supplierCreditPct < 0 || inputs.supplierCreditPct > 100) {
      errors.supplierCreditPct = 'Supplier credit must be between 0% and 100%.';
    }

    // 2. Eligible return quantity (0 - total batch returns)
    if (isNaN(inputs.eligibleReturnQty)) {
      errors.eligibleReturnQty = 'Eligible return quantity is required.';
    } else if (inputs.eligibleReturnQty < 0) {
      errors.eligibleReturnQty = 'Eligible units cannot be negative.';
    } else if (inputs.eligibleReturnQty > totalBatchUnits) {
      errors.eligibleReturnQty = `Eligible units (${inputs.eligibleReturnQty}) cannot exceed total batch returns (${totalBatchUnits}).`;
    }

    // 3. Refurbishment bench cost (>= 0)
    if (isNaN(inputs.refurbCost)) {
      errors.refurbCost = 'Refurbishment bench cost is required.';
    } else if (inputs.refurbCost < 0) {
      errors.refurbCost = 'Refurbishment bench cost cannot be negative.';
    } else if (inputs.refurbCost > 10000) {
      warnings.push(`High refurbishment cost (₹${inputs.refurbCost}) may exceed market value.`);
    }

    // 4. Refurbishment resale percentage (0 - 100%)
    if (isNaN(inputs.refurbResalePct)) {
      errors.refurbResalePct = 'Resale percentage is required.';
    } else if (inputs.refurbResalePct < 0 || inputs.refurbResalePct > 100) {
      errors.refurbResalePct = 'Resale percentage must be between 0% and 100%.';
    }

    // 5. Refurbishment duration days (>= 1)
    if (isNaN(inputs.refurbDurationDays)) {
      errors.refurbDurationDays = 'Duration is required.';
    } else if (inputs.refurbDurationDays < 1) {
      errors.refurbDurationDays = 'Turnaround duration must be at least 1 calendar day.';
    } else if (inputs.refurbDurationDays > 180) {
      warnings.push('Turnaround duration exceeds 6 months, creating holding cost decay.');
    }

    // 6. Liquidation recovery percentage (0 - 100%)
    if (isNaN(inputs.liquidationRecoveryPct)) {
      errors.liquidationRecoveryPct = 'Liquidation percentage is required.';
    } else if (inputs.liquidationRecoveryPct < 0 || inputs.liquidationRecoveryPct > 100) {
      errors.liquidationRecoveryPct = 'Liquidation percentage must be between 0% and 100%.';
    }

    // 7. Demand assumptions: average daily demand (> 0)
    if (isNaN(inputs.avgDailyDemand)) {
      errors.avgDailyDemand = 'Daily demand is required.';
    } else if (inputs.avgDailyDemand <= 0) {
      errors.avgDailyDemand = 'Average daily demand must be strictly greater than 0.';
    }

    // 8. New stock on hand (>= 0)
    if (isNaN(inputs.newStockOnHand)) {
      errors.newStockOnHand = 'Stock quantity is required.';
    } else if (inputs.newStockOnHand < 0) {
      errors.newStockOnHand = 'Stock quantity cannot be negative.';
    }

    // 9. Demand trap days threshold (> 0)
    if (isNaN(inputs.demandTrapDaysThreshold)) {
      errors.demandTrapDaysThreshold = 'Threshold is required.';
    } else if (inputs.demandTrapDaysThreshold <= 0) {
      errors.demandTrapDaysThreshold = 'Demand trap threshold must be greater than 0 days.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Retrieves default actual contract baseline inputs for a given SKU.
   */
  public static getBaselineInputs(
    sku: string,
    products: Product[],
    vendorTermsList: VendorTerms[],
    refurbRules: RefurbishmentRule[],
    liqRules: LiquidationRule[],
    inventoryList: InventoryRecord[],
    returnsList: ReturnItem[]
  ): WhatIfSimulationInputs {
    const product = products.find((p) => p.sku === sku) || products[0];
    const vendorTerms = vendorTermsList.find((v) => v.sku === sku);
    const refurbRule = refurbRules.find((r) => r.category === product.category);
    const liqRule = liqRules.find((l) => l.category === product.category && l.grade === 'B');
    const inventory = inventoryList.find((i) => i.sku === sku);
    const returnsForSku = returnsList.filter((r) => r.sku === sku);

    // Calculate eligible units under strict vendor contract window
    const eligibleRtvUnits = vendorTerms && vendorTerms.rtv_allowed
      ? returnsForSku.filter((r) => r.days_since_return <= vendorTerms.window_days).length
      : 0;

    return {
      supplierCreditPct: vendorTerms ? vendorTerms.credit_pct : 0,
      eligibleReturnQty: eligibleRtvUnits,
      refurbCost: refurbRule ? refurbRule.cost : 250,
      refurbResalePct: refurbRule ? refurbRule.resale_pct_of_new : 65,
      refurbDurationDays: refurbRule ? refurbRule.days_required : 14,
      liquidationRecoveryPct: liqRule ? liqRule.recovery_pct_of_cost : 35,
      avgDailyDemand: inventory ? inventory.avg_daily_demand : 2.5,
      newStockOnHand: inventory ? inventory.new_stock : 60,
      demandTrapDaysThreshold: 120,
    };
  }

  /**
   * Deterministically recalculates all recovery routes and feasible batch allocation.
   * Compares simulated results with baseline actuals and generates plain-language business explanations.
   */
  public static simulate(
    sku: string,
    inputs: WhatIfSimulationInputs,
    products: Product[],
    vendorTermsList: VendorTerms[],
    refurbRules: RefurbishmentRule[],
    liqRules: LiquidationRule[],
    inventoryList: InventoryRecord[],
    returnsList: ReturnItem[]
  ): WhatIfSimulationResult {
    const product = products.find((p) => p.sku === sku) || products[0];
    const vendorTerms = vendorTermsList.find((v) => v.sku === sku);
    const returnsForSku = returnsList.filter((r) => r.sku === sku);
    const totalBatchUnits = returnsForSku.length > 0 ? returnsForSku.length : 40;

    // 1. Validate inputs
    const validation = this.validateInputs(inputs, totalBatchUnits);

    // 2. Compute Baseline Actuals (to measure exact deltas)
    const baselineInputs = this.getBaselineInputs(
      sku,
      products,
      vendorTermsList,
      refurbRules,
      liqRules,
      inventoryList,
      returnsList
    );
    const baselineCalculated = this.executeCoreFormulas(
      product,
      vendorTerms,
      totalBatchUnits,
      baselineInputs
    );

    // 3. Compute Simulated Core Results
    // If validation fails, fallback safely to baseline to avoid crashing
    const safeInputs = validation.isValid ? inputs : baselineInputs;
    const simulatedCalculated = this.executeCoreFormulas(
      product,
      vendorTerms,
      totalBatchUnits,
      safeInputs
    );

    // 4. Derive comparison deltas
    const grossDiff = simulatedCalculated.totalGrossRecovery - baselineCalculated.totalGrossRecovery;
    const costDiff = simulatedCalculated.totalDirectCost - baselineCalculated.totalDirectCost;
    const netProceedsDiff =
      simulatedCalculated.totalNetProceeds - baselineCalculated.totalNetProceeds;
    const netProceedsPctDiff =
      baselineCalculated.totalNetProceeds > 0
        ? Math.round((netProceedsDiff / baselineCalculated.totalNetProceeds) * 1000) / 10
        : 0;
    const timeToCashDiffDays =
      simulatedCalculated.weightedTimeToCashDays - baselineCalculated.weightedTimeToCashDays;

    const allocationChanged =
      simulatedCalculated.allocation.rtv !== baselineCalculated.allocation.rtv ||
      simulatedCalculated.allocation.refurb !== baselineCalculated.allocation.refurb ||
      simulatedCalculated.allocation.liquidate !== baselineCalculated.allocation.liquidate ||
      simulatedCalculated.allocation.scrap !== baselineCalculated.allocation.scrap;

    const routeRecommendationChanged =
      simulatedCalculated.strategyHeadline !== baselineCalculated.strategyHeadline;

    // 5. Generate Explanation: which recommendation changed and why
    const { headline, explanation, tippingPoints } = this.generateDeterministicExplanations({
      product,
      baselineInputs,
      simulatedInputs: safeInputs,
      baseline: baselineCalculated,
      simulated: simulatedCalculated,
      totalBatchUnits,
      allocationChanged,
    });

    // 6. Real-world missing information and risk uncertainties
    const missingInformation = [
      'Actual RMA courier shipping freight note (currently assumed absorbed or ₹0 in standard terms).',
      'Supplier cosmetic inspection rejection variance (historical acceptance rate ~92%).',
      'Refurbished batch warranty return rate (potential RMA churn if secondary hinge repairs degrade).',
      'B2B bulk spot market price lock agreement (liquidation quote valid for 7 days only).',
    ];

    const risksAndUncertainties = [
      `Batch ${returnsForSku[0]?.supplier_batch || 'HB-09'} carries documented defect concentration. Reselling secondary units risks customer complaints unless hinge reinforcement is validated.`,
      `Supplier credit realization relies on ledger settlement cycle (~45 days). Cash is credited against future PO invoices rather than direct bank deposit.`,
      `Secondary channel demand of ${safeInputs.avgDailyDemand} units/day requires ~${simulatedCalculated.routes.refurb.timeToCashDays} days to fully realize cash.`,
    ];

    return {
      sku: product.sku,
      productName: product.name,
      totalBatchUnits,
      inputs: safeInputs,
      validation,
      routes: simulatedCalculated.routes,
      allocation: simulatedCalculated.allocation,
      totalGrossRecovery: simulatedCalculated.totalGrossRecovery,
      totalDirectCost: simulatedCalculated.totalDirectCost,
      totalNetProceeds: simulatedCalculated.totalNetProceeds,
      weightedTimeToCashDays: simulatedCalculated.weightedTimeToCashDays,
      baseline: {
        totalGrossRecovery: baselineCalculated.totalGrossRecovery,
        totalDirectCost: baselineCalculated.totalDirectCost,
        totalNetProceeds: baselineCalculated.totalNetProceeds,
        weightedTimeToCashDays: baselineCalculated.weightedTimeToCashDays,
        allocation: baselineCalculated.allocation,
        bestRouteStrategy: baselineCalculated.strategyHeadline,
      },
      delta: {
        grossDiff,
        costDiff,
        netProceedsDiff,
        netProceedsPctDiff,
        timeToCashDiffDays,
        allocationChanged,
        routeRecommendationChanged,
      },
      recommendationHeadline: headline,
      recommendationExplanation: explanation,
      detailedEconomicTippingPoints: tippingPoints,
      missingInformation,
      risksAndUncertainties,
    };
  }

  /**
   * Internal deterministic execution of formulas based on inputs.
   */
  private static executeCoreFormulas(
    product: Product,
    vendorTerms: VendorTerms | undefined,
    totalBatchUnits: number,
    inputs: WhatIfSimulationInputs
  ) {
    // 1. Supplier Return Route (RTV)
    const rtvAllowed = vendorTerms ? vendorTerms.rtv_allowed : true;
    const rtvUnitGross = Math.round(product.cost * (inputs.supplierCreditPct / 100));
    const rtvUnitCost = 0; // Standard contractual RTV freight absorbed by vendor
    const rtvUnitNet = rtvUnitGross - rtvUnitCost;
    const rtvTimeToCash = 45; // SLA ledger credit note cycle

    // 2. Refurbishment Route
    const refurbUnitGross = Math.round(product.selling_price * (inputs.refurbResalePct / 100));
    const refurbUnitCost = inputs.refurbCost;
    const refurbUnitNet = refurbUnitGross - refurbUnitCost;

    // Demand calculations for Refurb
    const coverageDays =
      inputs.avgDailyDemand > 0 ? Math.round(inputs.newStockOnHand / inputs.avgDailyDemand) : 999;
    const isDemandTrapped = coverageDays > inputs.demandTrapDaysThreshold;

    // 3. Liquidation Route
    const liqUnitGross = Math.round(product.cost * (inputs.liquidationRecoveryPct / 100));
    const liqUnitCost = 0;
    const liqUnitNet = liqUnitGross - liqUnitCost;
    const liqTimeToCash = 7;

    // 4. Scrap Route
    const scrapUnitGross = Math.round(product.cost * 0.03);
    const scrapUnitCost = 0;
    const scrapUnitNet = scrapUnitGross;
    const scrapTimeToCash = 5;

    // Allocation optimization logic:
    // Units eligible for supplier return
    const eligibleRtv = Math.min(totalBatchUnits, Math.max(0, Math.floor(inputs.eligibleReturnQty)));
    const remainingUnits = totalBatchUnits - eligibleRtv;

    let rtvAlloc = eligibleRtv;
    let refurbAlloc = 0;
    let liqAlloc = 0;
    let scrapAlloc = 0;

    // Handle allocation for remaining units
    if (remainingUnits > 0) {
      if (isDemandTrapped) {
        // Demand trap restricts secondary refurbishment
        if (liqUnitNet > 0) {
          liqAlloc = remainingUnits;
        } else {
          scrapAlloc = remainingUnits;
        }
      } else if (refurbUnitNet > liqUnitNet && refurbUnitNet > 0) {
        // Refurbishment yields higher unit recovery than liquidation
        refurbAlloc = remainingUnits;
      } else if (liqUnitNet > 0) {
        // Liquidation yields higher or refurb is unprofitable
        liqAlloc = remainingUnits;
      } else {
        // Salvage scrap
        scrapAlloc = remainingUnits;
      }
    }

    // Sell-through calculation for refurb units
    const refurbSellThroughDays =
      inputs.refurbDurationDays +
      (refurbAlloc > 0 && inputs.avgDailyDemand > 0
        ? Math.round(refurbAlloc / inputs.avgDailyDemand)
        : 0);

    // Route objects
    const rtvRoute: WhatIfRouteSummary = {
      route: 'rtv',
      routeName: 'Supplier Return (RTV Credit)',
      unitGross: rtvUnitGross,
      unitDirectCost: rtvUnitCost,
      unitNetProceeds: rtvUnitNet,
      allocatedUnits: rtvAlloc,
      totalGross: rtvAlloc * rtvUnitGross,
      totalDirectCost: rtvAlloc * rtvUnitCost,
      totalNetProceeds: rtvAlloc * rtvUnitNet,
      timeToCashDays: rtvTimeToCash,
      isEligible: rtvAllowed && inputs.eligibleReturnQty > 0,
      notes: `${inputs.supplierCreditPct}% credit of ₹${product.cost} cost = ₹${rtvUnitGross}/unit ledger credit.`,
    };

    const refurbRoute: WhatIfRouteSummary = {
      route: 'refurb',
      routeName: 'Refurbish & Secondary Resale',
      unitGross: refurbUnitGross,
      unitDirectCost: refurbUnitCost,
      unitNetProceeds: refurbUnitNet,
      allocatedUnits: refurbAlloc,
      totalGross: refurbAlloc * refurbUnitGross,
      totalDirectCost: refurbAlloc * refurbUnitCost,
      totalNetProceeds: refurbAlloc * refurbUnitNet,
      timeToCashDays: refurbSellThroughDays,
      isEligible: !isDemandTrapped && refurbUnitNet > 0,
      notes: isDemandTrapped
        ? `Demand Trap Active: New stock coverage (${coverageDays}d) exceeds ${inputs.demandTrapDaysThreshold}d ceiling.`
        : `${inputs.refurbResalePct}% resale (₹${refurbUnitGross}) minus ₹${refurbUnitCost} bench cost = ₹${refurbUnitNet}/unit net.`,
    };

    const liqRoute: WhatIfRouteSummary = {
      route: 'liquidate',
      routeName: 'Bulk B2B Liquidation',
      unitGross: liqUnitGross,
      unitDirectCost: liqUnitCost,
      unitNetProceeds: liqUnitNet,
      allocatedUnits: liqAlloc,
      totalGross: liqAlloc * liqUnitGross,
      totalDirectCost: liqAlloc * liqUnitCost,
      totalNetProceeds: liqAlloc * liqUnitNet,
      timeToCashDays: liqTimeToCash,
      isEligible: true,
      notes: `${inputs.liquidationRecoveryPct}% salvage of ₹${product.cost} procurement cost = ₹${liqUnitGross}/unit cash.`,
    };

    const scrapRoute: WhatIfRouteSummary = {
      route: 'scrap',
      routeName: 'Certified Recycling Scrap',
      unitGross: scrapUnitGross,
      unitDirectCost: scrapUnitCost,
      unitNetProceeds: scrapUnitNet,
      allocatedUnits: scrapAlloc,
      totalGross: scrapAlloc * scrapUnitGross,
      totalDirectCost: scrapAlloc * scrapUnitCost,
      totalNetProceeds: scrapAlloc * scrapUnitNet,
      timeToCashDays: scrapTimeToCash,
      isEligible: true,
      notes: `3% material scrap salvage = ₹${scrapUnitGross}/unit.`,
    };

    // Aggregate totals
    const totalGrossRecovery =
      rtvRoute.totalGross + refurbRoute.totalGross + liqRoute.totalGross + scrapRoute.totalGross;
    const totalDirectCost =
      rtvRoute.totalDirectCost +
      refurbRoute.totalDirectCost +
      liqRoute.totalDirectCost +
      scrapRoute.totalDirectCost;
    const totalNetProceeds =
      rtvRoute.totalNetProceeds +
      refurbRoute.totalNetProceeds +
      liqRoute.totalNetProceeds +
      scrapRoute.totalNetProceeds;

    // Weighted time to cash
    const totalAllocated = rtvAlloc + refurbAlloc + liqAlloc + scrapAlloc;
    const weightedTimeToCashDays =
      totalNetProceeds > 0
        ? Math.round(
            (rtvRoute.totalNetProceeds * rtvRoute.timeToCashDays +
              refurbRoute.totalNetProceeds * refurbRoute.timeToCashDays +
              liqRoute.totalNetProceeds * liqRoute.timeToCashDays +
              scrapRoute.totalNetProceeds * scrapRoute.timeToCashDays) /
              totalNetProceeds
          )
        : totalAllocated > 0
        ? Math.round(
            (rtvAlloc * rtvTimeToCash +
              refurbAlloc * refurbSellThroughDays +
              liqAlloc * liqTimeToCash +
              scrapAlloc * scrapTimeToCash) /
              totalAllocated
          )
        : 0;

    // Strategy description
    let strategyHeadline = '';
    if (rtvAlloc === totalBatchUnits) {
      strategyHeadline = `100% Supplier Return (${rtvAlloc} units)`;
    } else if (refurbAlloc === totalBatchUnits) {
      strategyHeadline = `100% Refurbishment (${refurbAlloc} units)`;
    } else if (liqAlloc === totalBatchUnits) {
      strategyHeadline = `100% Bulk Liquidation (${liqAlloc} units)`;
    } else if (rtvAlloc > 0 && refurbAlloc > 0) {
      strategyHeadline = `Split Batch: ${rtvAlloc} RTV + ${refurbAlloc} Refurbish`;
    } else if (rtvAlloc > 0 && liqAlloc > 0) {
      strategyHeadline = `Split Batch: ${rtvAlloc} RTV + ${liqAlloc} Liquidate`;
    } else {
      strategyHeadline = `Multi-Route Allocation (${rtvAlloc} RTV, ${refurbAlloc} Refurb, ${liqAlloc} Liq, ${scrapAlloc} Scrap)`;
    }

    return {
      routes: {
        rtv: rtvRoute,
        refurb: refurbRoute,
        liquidate: liqRoute,
        scrap: scrapRoute,
      },
      allocation: {
        rtv: rtvAlloc,
        refurb: refurbAlloc,
        liquidate: liqAlloc,
        scrap: scrapAlloc,
        total: totalAllocated,
      },
      totalGrossRecovery,
      totalDirectCost,
      totalNetProceeds,
      weightedTimeToCashDays,
      strategyHeadline,
      isDemandTrapped,
      coverageDays,
      rtvUnitNet,
      refurbUnitNet,
      liqUnitNet,
    };
  }

  /**
   * Generates clear deterministic explanations citing exact values, delta diffs, and tipping points.
   */
  private static generateDeterministicExplanations(params: {
    product: Product;
    baselineInputs: WhatIfSimulationInputs;
    simulatedInputs: WhatIfSimulationInputs;
    baseline: ReturnType<typeof WhatIfSimulatorEngine.executeCoreFormulas>;
    simulated: ReturnType<typeof WhatIfSimulatorEngine.executeCoreFormulas>;
    totalBatchUnits: number;
    allocationChanged: boolean;
  }): { headline: string; explanation: string; tippingPoints: string[] } {
    const { product, baselineInputs, simulatedInputs, baseline, simulated, totalBatchUnits, allocationChanged } = params;

    const netDiff = simulated.totalNetProceeds - baseline.totalNetProceeds;
    const formattedNetDiff = Math.abs(netDiff).toLocaleString('en-IN');
    const netDirection = netDiff >= 0 ? `+₹${formattedNetDiff}` : `-₹${formattedNetDiff}`;

    const tippingPoints: string[] = [];

    // Check specific parameter triggers
    let headline = '';
    let explanation = '';

    // Case 1: Refurb bench cost spiked above liquidation net proceeds
    if (simulatedInputs.refurbCost > baselineInputs.refurbCost && simulated.allocation.refurb === 0 && baseline.allocation.refurb > 0) {
      headline = 'Optimal Route Flipped: Refurbishment Abandoned for Bulk Liquidation';
      explanation = `Refurbishment bench cost increased from ₹${baselineInputs.refurbCost} to ₹${simulatedInputs.refurbCost} (+₹${simulatedInputs.refurbCost - baselineInputs.refurbCost}/unit). This eroded net unit proceeds from ₹${baseline.refurbUnitNet} down to ₹${simulated.refurbUnitNet}, dropping below the liquidation recovery floor of ₹${simulated.liqUnitNet}. Consequently, all ${baseline.allocation.refurb} remaining units were re-routed to Bulk Liquidation.`;
      tippingPoints.push(
        `Economic Tipping Point: At a resale price of ₹${simulated.routes.refurb.unitGross}, any repair bench cost exceeding ₹${simulated.routes.refurb.unitGross - simulated.liqUnitNet} makes Liquidation economically superior to Refurbishment.`
      );
    }
    // Case 2: Demand trap triggered
    else if (simulated.isDemandTrapped && !baseline.isDemandTrapped) {
      headline = 'Demand Trap Triggered: Secondary Refurbishment Restricted';
      explanation = `New stock coverage increased to ${simulated.coverageDays} days (exceeding the ${simulatedInputs.demandTrapDaysThreshold}-day ceiling) due to ${simulatedInputs.newStockOnHand} units on hand. To prevent secondary channel price cannibalization of primary stock, the engine disqualified Refurbishment and routed the ${simulated.allocation.liquidate} remaining units to B2B Liquidation.`;
      tippingPoints.push(
        `Demand Tipping Point: Inventory coverage of ${simulated.coverageDays} days surpasses the ${simulatedInputs.demandTrapDaysThreshold}-day threshold, requiring immediate wholesale liquidation to unlock working capital.`
      );
    }
    // Case 3: Supplier credit or eligible units dropped to 0
    else if (simulatedInputs.eligibleReturnQty === 0 && baselineInputs.eligibleReturnQty > 0) {
      headline = 'Supplier Window Expired: Shifted from RTV to Full Refurbishment';
      explanation = `Eligible units for supplier return dropped from ${baselineInputs.eligibleReturnQty} to 0 (simulating strict SLA expiration or vendor dispute). All ${totalBatchUnits} units were re-allocated to Refurbishment, generating ₹${simulated.totalNetProceeds.toLocaleString('en-IN')} net proceeds, though extending cash collection to ${simulated.weightedTimeToCashDays} days.`;
      tippingPoints.push(
        `SLA Cliff: Missing the supplier return cutoff shifts 100% of inventory risk to internal repair and secondary resale channels.`
      );
    }
    // Case 4: Supplier credit negotiated upward
    else if (simulatedInputs.supplierCreditPct > baselineInputs.supplierCreditPct) {
      headline = `Supplier Credit Increased: Net Recovery Expanded by ${netDirection}`;
      explanation = `Supplier credit increased from ${baselineInputs.supplierCreditPct}% to ${simulatedInputs.supplierCreditPct}%, raising RTV unit credit from ₹${baseline.routes.rtv.unitNetProceeds} to ₹${simulated.routes.rtv.unitNetProceeds}. Overall net proceeds grew by ${netDirection} (+${Math.round((netDiff / baseline.totalNetProceeds) * 1000) / 10}%).`;
      tippingPoints.push(
        `Margin Expansion: Every 5% increase in supplier credit yields +₹${Math.round(product.cost * 0.05 * simulated.allocation.rtv).toLocaleString('en-IN')} in direct supplier credit notes.`
      );
    }
    // Case 5: General parameter shift without route flipping
    else if (!allocationChanged) {
      headline = `Financial Sensitivity Updated: Net Recovery Adjusted by ${netDirection}`;
      explanation = `Allocation remains steady at ${simulated.strategyHeadline}. Modified parameters (resale price, bench cost, or credit percentage) altered total net proceeds by ${netDirection} with an estimated weighted time-to-cash of ${simulated.weightedTimeToCashDays} days.`;
      tippingPoints.push(
        `Sensitivity Stability: Current input parameters remain within the economic viability zone for the ${simulated.strategyHeadline} recovery plan.`
      );
    } else {
      headline = `Feasible Allocation Recomputed: ${simulated.strategyHeadline}`;
      explanation = `Simulated parameter changes adjusted route margins and constraints, resulting in a revised batch distribution (${simulated.allocation.rtv} RTV, ${simulated.allocation.refurb} Refurb, ${simulated.allocation.liquidate} Liquidate). Net recovery shifted by ${netDirection}.`;
      tippingPoints.push(
        `Comparative Unit Economics: RTV ₹${simulated.rtvUnitNet} | Refurb ₹${simulated.refurbUnitNet} | Liquidate ₹${simulated.liqUnitNet} | Scrap ₹${simulated.routes.scrap.unitNetProceeds}.`
      );
    }

    // Always include relative comparison
    tippingPoints.push(
      `Baseline Yield: ₹${baseline.totalNetProceeds.toLocaleString('en-IN')} (${baseline.weightedTimeToCashDays}d) → Simulated Yield: ₹${simulated.totalNetProceeds.toLocaleString('en-IN')} (${simulated.weightedTimeToCashDays}d).`
    );

    return { headline, explanation, tippingPoints };
  }
}
