import { FinancialRecoveryEngine } from '../src/services/financialRecoveryEngine';
import { DeadlineHunterEngine } from '../src/services/deadlineHunterEngine';
import { WhatIfSimulatorEngine } from '../src/services/whatIfSimulatorEngine';
import { PhoenixTestSuite } from '../src/services/testSuite';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS,
} from '../src/data/sampleData';

console.log('================================================================');
console.log('RETRACE AI FINANCIAL RECOVERY ENGINE: AUTOMATED TEST SUITE');
console.log('================================================================\n');

// SCENARIO 1: 40 Returned Wireless Headphones
const product = SAMPLE_PRODUCTS.find((p) => p.sku === 'WH-NEO-01')!;
const vendorTerms = SAMPLE_VENDOR_TERMS.find((v) => v.sku === 'WH-NEO-01')!;
const refurbRule = SAMPLE_REFURB_RULES.find((r) => r.category === product.category)!;
const liqRule = SAMPLE_LIQUIDATION_RULES.find((l) => l.category === product.category && l.grade === 'B')!;
const inventory = SAMPLE_INVENTORY.find((i) => i.sku === 'WH-NEO-01')!;
const returns = SAMPLE_RETURNS.filter((r) => r.sku === 'WH-NEO-01');

console.log(`[Input Data Loaded]`);
console.log(`- Product: ${product.name} (${product.sku})`);
console.log(`- Original Procurement Cost: ₹${product.cost}`);
console.log(`- New Selling Price: ₹${product.selling_price}`);
console.log(`- Supplier: ${product.supplier}`);
console.log(`- Total Returned Units: ${returns.length}\n`);

// 1. TEST INDEPENDENT SUPPLIER RETURN FUNCTION
console.log('--- 1. Testing Supplier Return (RTV Credit) ---');
const rtvResult = FinancialRecoveryEngine.calculateSupplierReturn(
  product,
  vendorTerms,
  returns,
  24
);

console.log(`- Route Name: ${rtvResult.routeName}`);
console.log(`- Recovery Type: ${rtvResult.recoveryType}`);
console.log(`- Eligible Units: ${rtvResult.eligibilityConstraints.eligibleUnits}`);
console.log(`- Allocated Units: ${rtvResult.eligibilityConstraints.allocatedUnits}`);
console.log(`- Unit Gross Credit: ₹${rtvResult.unitGrossRecovery}`);
console.log(`- Unit Direct Costs: ₹${rtvResult.unitDirectCost}`);
console.log(`- Total Gross Credit: ₹${rtvResult.totalGrossRecovery}`);
console.log(`- Total Net Proceeds: ₹${rtvResult.totalNetProceeds}`);
console.log(`- Time to Cash Realization: ${rtvResult.timeToCashDays} days`);
console.log(`- Assumptions: ${rtvResult.timeToCashAssumptions.length} logged`);
console.log(`- Uncertainties: ${rtvResult.uncertaintiesAndMissingData.length} logged`);

if (rtvResult.totalGrossRecovery !== 20160) {
  throw new Error(`Assertion failed: expected total gross recovery of ₹20,160, got ₹${rtvResult.totalGrossRecovery}`);
}
if (rtvResult.unitGrossRecovery !== 840) {
  throw new Error(`Assertion failed: expected unit credit of ₹840, got ₹${rtvResult.unitGrossRecovery}`);
}
console.log('✓ PASS: 24 eligible supplier returns produce ₹20,160 in supplier credit before additional costs.\n');

// 2. TEST INDEPENDENT REFURBISHMENT FUNCTION
console.log('--- 2. Testing Refurbishment & Secondary Resale ---');
const refurbUnit1 = FinancialRecoveryEngine.calculateRefurbishmentAndResale(
  product,
  refurbRule,
  inventory,
  1
);
const refurbUnits16 = FinancialRecoveryEngine.calculateRefurbishmentAndResale(
  product,
  refurbRule,
  inventory,
  16
);

console.log(`- Resale Revenue per Unit: ₹${refurbUnit1.unitGrossRecovery} (75% of ₹2,500)`);
console.log(`- Refurbishment Cost per Unit: ₹${refurbUnit1.unitDirectCost}`);
console.log(`- Net Recovery per Unit before holding risk: ₹${refurbUnit1.unitNetProceeds}`);
console.log(`- 16 Units Total Net Proceeds: ₹${refurbUnits16.totalNetProceeds}`);
console.log(`- Time to Cash Realization: ${refurbUnits16.timeToCashDays} days (bench + secondary sell-through)`);
console.log(`- Demand Feasibility: ${refurbUnits16.demandConstraints.demandFeasible ? 'Feasible' : 'Infeasible'}`);
console.log(`- New Stock Coverage: ${refurbUnits16.demandConstraints.newStockCoverageDays} days`);

if (refurbUnit1.unitGrossRecovery !== 1875) {
  throw new Error(`Assertion failed: expected resale revenue ₹1,875, got ₹${refurbUnit1.unitGrossRecovery}`);
}
if (refurbUnit1.unitDirectCost !== 250) {
  throw new Error(`Assertion failed: expected direct bench cost ₹250, got ₹${refurbUnit1.unitDirectCost}`);
}
if (refurbUnit1.unitNetProceeds !== 1625) {
  throw new Error(`Assertion failed: expected unit net ₹1,625, got ₹${refurbUnit1.unitNetProceeds}`);
}
if (refurbUnits16.totalNetProceeds !== 26000) {
  throw new Error(`Assertion failed: expected 16 units net ₹26,000, got ₹${refurbUnits16.totalNetProceeds}`);
}
console.log('✓ PASS: Refurbishing one headphone gives ₹1,875 resale revenue and ₹250 cost, or ₹1,625 net proceeds.\n');

// 3. TEST INDEPENDENT LIQUIDATION FUNCTION
console.log('--- 3. Testing Bulk Liquidation ---');
const liqUnit1 = FinancialRecoveryEngine.calculateLiquidation(product, liqRule, 1);
const liqUnits16 = FinancialRecoveryEngine.calculateLiquidation(product, liqRule, 16);

console.log(`- Gross Liquidation per Unit: ₹${liqUnit1.unitGrossRecovery} (35% of ₹1,400)`);
console.log(`- Direct Costs: ₹${liqUnit1.unitDirectCost}`);
console.log(`- Net Proceeds per Unit: ₹${liqUnit1.unitNetProceeds}`);
console.log(`- 16 Units Total Liquidation Recovery: ₹${liqUnits16.totalGrossRecovery}`);
console.log(`- Time to Cash: ${liqUnits16.timeToCashDays} days`);

if (liqUnit1.unitGrossRecovery !== 490) {
  throw new Error(`Assertion failed: expected unit liquidation ₹490, got ₹${liqUnit1.unitGrossRecovery}`);
}
if (liqUnits16.totalGrossRecovery !== 7840) {
  throw new Error(`Assertion failed: expected 16 units liquidation ₹7,840, got ₹${liqUnits16.totalGrossRecovery}`);
}
console.log('✓ PASS: Liquidation gives ₹490 gross recovery per headphone (₹7,840 for 16 units).\n');

// 4. TEST ALLOCATION VALIDATOR
console.log('--- 4. Testing Quantity Allocation Validator ---');
const negVal = FinancialRecoveryEngine.validateAllocation({ rtvUnits: -3, refurbUnits: 10 }, 40);
const overflowVal = FinancialRecoveryEngine.validateAllocation({ rtvUnits: 25, refurbUnits: 20 }, 40); // 45 > 40
const validVal = FinancialRecoveryEngine.validateAllocation({ rtvUnits: 24, refurbUnits: 16 }, 40);

if (negVal.isValid) throw new Error('Validator failed to reject negative allocation');
if (overflowVal.isValid) throw new Error('Validator failed to reject sum exceeding available');
if (!validVal.isValid) throw new Error('Validator rejected a valid allocation of 24 + 16 = 40');
console.log('✓ PASS: Nonnegative bounds and maximum available constraints enforced.\n');

// 5. TEST BATCH SPLITTING OPTIMIZER
console.log('--- 5. Testing Batch-Splitting Optimizer ---');
const optimizedBatch = FinancialRecoveryEngine.optimizeBatchSplitting({
  product,
  vendorTerms,
  refurbRule,
  liqRule,
  inventory,
  returnsList: returns,
});

console.log(`- Optimal Split Allocation: RTV=${optimizedBatch.allocation.rtvUnits}, Refurb=${optimizedBatch.allocation.refurbUnits}, Liquidate=${optimizedBatch.allocation.liquidateUnits}`);
console.log(`- Supplier Credit Portion: ₹${optimizedBatch.summary.supplierCreditPortion}`);
console.log(`- Cash Proceeds Portion: ₹${optimizedBatch.summary.cashProceedsPortion}`);
console.log(`- Total Net Proceeds: ₹${optimizedBatch.summary.totalNetProceeds}`);
console.log(`- Weighted Time-to-Cash: ~${optimizedBatch.summary.weightedTimeToCashDays} days`);

if (optimizedBatch.allocation.rtvUnits !== 24 || optimizedBatch.allocation.refurbUnits !== 16) {
  throw new Error(`Optimizer failed to split into 24 RTV and 16 Refurb`);
}
if (optimizedBatch.summary.totalNetProceeds !== 46160) {
  throw new Error(`Optimizer total net proceeds ₹${optimizedBatch.summary.totalNetProceeds} != ₹46,160`);
}
console.log('✓ PASS: Batch splitting optimizer allocates 24 RTV (₹20,160) + 16 Refurb (₹26,000) = ₹46,160.\n');

// 6. TEST DEADLINE HUNTER ENGINE
console.log('--- 6. Testing Deadline Hunter Engine ---');
const deadlineOpportunities = DeadlineHunterEngine.scanOpportunities(
  SAMPLE_RETURNS,
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS
);
console.log(`- Opportunities Scanned: ${deadlineOpportunities.length}`);
const topOpp = deadlineOpportunities[0];
console.log(`- #1 Priority Opportunity: ${topOpp.product_name} (${topOpp.sku}) - Credit: ₹${topOpp.total_credit_at_risk}, Urgency: ${topOpp.urgency}`);
const hpOpp = deadlineOpportunities.find((o) => o.sku === 'WH-NEO-01')!;
console.log(`- Headphone Opportunity: ${hpOpp.eligible_units} eligible / ${hpOpp.expired_units} expired (Total Batch: ${hpOpp.total_batch_units})`);
console.log(`- Headphone Guaranteed Credit: ₹${hpOpp.total_credit_at_risk} (Unit Credit: ₹${hpOpp.unit_credit})`);

if (hpOpp.eligible_units !== 24 || hpOpp.total_credit_at_risk !== 20160) {
  throw new Error(`Headphone opportunity failed: expected 24 units and ₹20,160 credit, got ${hpOpp.eligible_units} units, ₹${hpOpp.total_credit_at_risk}`);
}
if (topOpp.sku !== 'MON-4K-PRO' || topOpp.total_credit_at_risk !== 91000) {
  throw new Error(`Top opportunity failed: expected MON-4K-PRO with ₹91,000 credit, got ${topOpp.sku} with ₹${topOpp.total_credit_at_risk}`);
}
console.log('✓ PASS: Deadline Hunter identifies 24 eligible headphones (₹20,160 credit) and prioritizes 3-day monitor cliff (₹91,000 credit) at top.\n');

// 7. TEST WHAT-IF RECOVERY SIMULATOR & TIPPING-POINT ENGINE
console.log('--- 7. Testing What-If Recovery Simulator Engine ---');
const baselineInputs = WhatIfSimulatorEngine.getBaselineInputs(
  'WH-NEO-01',
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS
);

const baselineSim = WhatIfSimulatorEngine.simulate(
  'WH-NEO-01',
  baselineInputs,
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS
);

console.log(`- Baseline Allocation: ${baselineSim.allocation.rtv} RTV, ${baselineSim.allocation.refurb} Refurb, ${baselineSim.allocation.liquidate} Liq`);
console.log(`- Baseline Net Recovery: ₹${baselineSim.totalNetProceeds.toLocaleString('en-IN')}`);

// Test Tipping Point: Spiking refurb bench cost to ₹1,450 flips allocation to Liquidation
const spikeSim = WhatIfSimulatorEngine.simulate(
  'WH-NEO-01',
  { ...baselineInputs, refurbCost: 1450 },
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS
);

console.log(`- Tipping Point Refurb Cost Spike (₹1,450):`);
console.log(`  Allocation: ${spikeSim.allocation.rtv} RTV, ${spikeSim.allocation.refurb} Refurb, ${spikeSim.allocation.liquidate} Liq`);
console.log(`  Strategy Headline: "${spikeSim.recommendationHeadline}"`);
console.log(`  Net Delta: ₹${spikeSim.delta.netProceedsDiff.toLocaleString('en-IN')}`);

if (spikeSim.allocation.refurb !== 0 || spikeSim.allocation.liquidate !== 16) {
  throw new Error(`Tipping point failed: expected 0 Refurb and 16 Liquidate, got ${spikeSim.allocation.refurb} Refurb, ${spikeSim.allocation.liquidate} Liquidate`);
}

// Test Tipping Point: Increasing credit percentage to 75%
const creditSim = WhatIfSimulatorEngine.simulate(
  'WH-NEO-01',
  { ...baselineInputs, supplierCreditPct: 75 },
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS
);

console.log(`- Credit Uplift (75%):`);
console.log(`  Unit Credit: ₹${creditSim.routes.rtv.unitNetProceeds} (Baseline: ₹${baselineSim.routes.rtv.unitNetProceeds})`);
console.log(`  Total Net Delta: +₹${creditSim.delta.netProceedsDiff.toLocaleString('en-IN')}`);

if (creditSim.routes.rtv.unitNetProceeds !== 1050 || creditSim.delta.netProceedsDiff !== 5040) {
  throw new Error(`Credit uplift calculation failed: expected ₹1,050 unit credit and +₹5,040 delta, got ₹${creditSim.routes.rtv.unitNetProceeds}, +₹${creditSim.delta.netProceedsDiff}`);
}

console.log('✓ PASS: What-If Simulator dynamically computes all routes and successfully triggers economic tipping point route flips.\n');

// 8. RUN COMPLETE MASTER TEST RUNNER SUITE (20 SUITES)
console.log('--- 8. Running Master Application Invariant Test Runner (20 Suites) ---');
const fullResults = PhoenixTestSuite.runAllTests();
let allPassed = true;

fullResults.forEach((t) => {
  const icon = t.status === 'passed' ? '✓' : '✗';
  console.log(`${icon} [${t.id}] ${t.title} (${t.duration_ms}ms)`);
  t.assertions.forEach((a) => {
    if (!a.passed) {
      allPassed = false;
      console.error(`   ✗ FAIL: ${a.check} (expected: ${a.expected}, got: ${a.actual})`);
    } else {
      console.log(`   ✓ ${a.check}`);
    }
  });
});

if (!allPassed) {
  console.error('\nSOME TESTS FAILED!');
  process.exit(1);
} else {
  console.log(`\n================================================================`);
  console.log(`ALL 20 TEST SUITES PASSED WITH 100% MATHEMATICAL PRECISION!`);
  console.log(`================================================================`);
}
