import {
  DeadlineAlert,
  Product,
  ReturnItem,
  VendorTerms,
  ApprovalAction,
  CURRENT_SIMULATION_DATE,
} from '../types';
import { CalculationEngine } from './calculationEngine';

export interface PrepareRtvProposalParams {
  alert: DeadlineAlert;
  product: Product;
  requestedUnits?: number;
  managerNotes?: string;
  reviewerName?: string;
}

export class DeadlineHunterEngine {
  /**
   * Scans returns against vendor contract terms and returns prioritized opportunities.
   * Prioritizes high recoverable value and approaching deadlines.
   */
  public static scanOpportunities(
    returnsList: ReturnItem[],
    productsList: Product[],
    vendorTermsList: VendorTerms[]
  ): DeadlineAlert[] {
    const alerts: DeadlineAlert[] = [];

    // Group returns by SKU and supplier_batch
    const groupMap = new Map<string, ReturnItem[]>();
    for (const r of returnsList) {
      const key = `${r.sku}__${r.supplier_batch}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(r);
    }

    groupMap.forEach((batchReturns, key) => {
      const sampleItem = batchReturns[0];
      const sku = sampleItem.sku;
      const batch = sampleItem.supplier_batch;
      const product = productsList.find((p) => p.sku === sku);
      const terms = vendorTermsList.find((v) => v.sku === sku);

      const totalBatchUnits = batchReturns.length;

      // Case A: Missing product metadata
      if (!product) {
        alerts.push({
          id: `DL-UNKNOWN-${batch}`,
          sku,
          product_name: `Unregistered SKU (${sku})`,
          category: 'Audio',
          supplier: 'Unknown Vendor',
          supplier_batch: batch,
          earliest_return_date: sampleItem.date || null,
          window_days: null,
          deadline_date: null,
          days_remaining: -1,
          eligible_units: 0,
          expired_units: 0,
          total_batch_units: totalBatchUnits,
          credit_pct: 0,
          unit_credit: 0,
          total_credit_at_risk: 0,
          urgency: 'ineligible',
          eligibility_status: 'missing_terms',
          missing_information: [
            'SKU is missing from master product catalog.',
            'Procurement purchase order and invoice cost unrecorded.',
            'Vendor contract SLA terms unindexed.',
          ],
          recommended_action:
            'Quarantine batch in physical intake. Initiate catalog creation with Merchandising team.',
          consequence: 'No financial recovery model can be evaluated until procurement record is established.',
          priority_score: 10,
          is_relative_demo_date: false,
        });
        return;
      }

      // Case B: Missing vendor terms OR contract missing
      if (!terms) {
        alerts.push({
          id: `DL-${sku}-${batch}`,
          sku,
          product_name: product.name,
          category: product.category,
          supplier: product.supplier,
          supplier_batch: batch,
          earliest_return_date: sampleItem.date || null,
          window_days: null,
          deadline_date: null,
          days_remaining: -1,
          eligible_units: 0,
          expired_units: 0,
          total_batch_units: totalBatchUnits,
          credit_pct: 0,
          unit_credit: 0,
          total_credit_at_risk: 0,
          urgency: 'ineligible',
          eligibility_status: 'missing_terms',
          missing_information: [
            `No executed RTV agreement on file for supplier ${product.supplier}.`,
            'Contractual return window days and credit percentage unspecified.',
            'Supplier warehouse intake address and RMA authorization protocol missing.',
          ],
          recommended_action: `Ineligible for RTV claim. Route ${totalBatchUnits} units to Refurbishment or Liquidation, or request Procurement execute an RMA addendum with ${product.supplier}.`,
          consequence: `Zero supplier credit can be booked. Attempting RTV without contract risks uncredited cargo abandonment.`,
          priority_score: 50,
          is_relative_demo_date: false,
          contract_citation: 'No active vendor agreement found in repository.',
        });
        return;
      }

      // Case C: RTV explicitly disallowed by supplier contract
      if (!terms.rtv_allowed) {
        alerts.push({
          id: `DL-${sku}-${batch}`,
          sku,
          product_name: product.name,
          category: product.category,
          supplier: terms.supplier,
          supplier_batch: batch,
          earliest_return_date: sampleItem.date || null,
          window_days: 0,
          deadline_date: null,
          days_remaining: -1,
          eligible_units: 0,
          expired_units: 0,
          total_batch_units: totalBatchUnits,
          credit_pct: 0,
          unit_credit: 0,
          total_credit_at_risk: 0,
          urgency: 'ineligible',
          eligibility_status: 'rtv_disallowed',
          missing_information: [
            `Supplier contract with ${terms.supplier} explicitly disallows Return-To-Vendor (final-sale wholesale).`,
            'Zero vendor credit notes issued for consumer exchange returns.',
          ],
          recommended_action: `Contractually barred from supplier return. Divert all ${totalBatchUnits} units to Secondary Refurbishment or Bulk Liquidation.`,
          consequence: `Attempting return will trigger carrier rejection fees. Goods must be recovered via internal channels.`,
          priority_score: 100,
          is_relative_demo_date: false,
          contract_citation: `${terms.supplier} Master Purchasing Agreement: Wholesale final-sale terms; no RTV rights.`,
        });
        return;
      }

      // Case D: Active RTV Agreement - Check Item Eligibility & Physical Condition
      const windowDays = terms.window_days;
      const unitCredit = Math.round(product.cost * (terms.credit_pct / 100));

      // Separate items by window and condition
      const itemsInWindow: ReturnItem[] = [];
      const itemsOutOfWindow: ReturnItem[] = [];
      const itemsConditionIneligible: ReturnItem[] = [];

      for (const item of batchReturns) {
        // Physical damage exclusions (e.g., severe LCD matrix cracks in tablets)
        if (item.reason_code === 'PHY-CRACK' || item.grade === 'DEFECTIVE') {
          // If contract excludes customer-induced damage / physical trauma
          itemsConditionIneligible.push(item);
        } else if (item.days_since_return <= windowDays) {
          itemsInWindow.push(item);
        } else {
          itemsOutOfWindow.push(item);
        }
      }

      // If condition ineligible (e.g. tablet with cracked screen)
      if (itemsConditionIneligible.length === totalBatchUnits) {
        alerts.push({
          id: `DL-${sku}-${batch}`,
          sku,
          product_name: product.name,
          category: product.category,
          supplier: terms.supplier,
          supplier_batch: batch,
          earliest_return_date: sampleItem.date || null,
          window_days: windowDays,
          deadline_date: null,
          days_remaining: -1,
          eligible_units: 0,
          expired_units: 0,
          total_batch_units: totalBatchUnits,
          credit_pct: terms.credit_pct,
          unit_credit: unitCredit,
          total_credit_at_risk: 0,
          urgency: 'ineligible',
          eligibility_status: 'condition_ineligible',
          missing_information: [
            'Physical condition exclusion: Severe physical damage (cracked matrix) is barred under Clause 6.3.',
            'Vendor warranty RMA waiver required if claim is to be disputed.',
          ],
          recommended_action: `Physical trauma voids RTV credit eligibility under ${terms.supplier} SLA. Route units to E-Waste Scrap or Component Harvesting.`,
          consequence: `Supplier will reject damaged units upon inspection and bill return freight charges.`,
          priority_score: 200,
          is_relative_demo_date: false,
          contract_citation: `${terms.supplier} Warranty Policy Clause 6.3: Physical impact fracture and water ingress void return eligibility.`,
        });
        return;
      }

      // If all units have expired
      if (itemsInWindow.length === 0) {
        const oldestDaysSinceReturn = Math.max(...batchReturns.map((r) => r.days_since_return));
        const daysExpired = oldestDaysSinceReturn - windowDays;
        alerts.push({
          id: `DL-${sku}-${batch}`,
          sku,
          product_name: product.name,
          category: product.category,
          supplier: terms.supplier,
          supplier_batch: batch,
          earliest_return_date: sampleItem.date || null,
          window_days: windowDays,
          deadline_date: null,
          days_remaining: -daysExpired,
          eligible_units: 0,
          expired_units: totalBatchUnits,
          total_batch_units: totalBatchUnits,
          credit_pct: terms.credit_pct,
          unit_credit: unitCredit,
          total_credit_at_risk: 0,
          urgency: 'expired',
          eligibility_status: 'expired_window',
          missing_information: [
            `Contractual SLA window was ${windowDays} days; oldest item is ${oldestDaysSinceReturn} days old (${daysExpired} days past deadline).`,
            'Supplier RMA electronic intake portal blocks submissions past contractual cutoff.',
          ],
          recommended_action: `RTV window has lapsed for all ${totalBatchUnits} units. Immediately re-route to Bulk Liquidation or Secondary Refurbishment to halt inventory holding decay.`,
          consequence: `Supplier credit note is no longer obtainable. Sunk recovery opportunity of ${CalculationEngine.formatINR(
            totalBatchUnits * unitCredit
          )} lost to window expiration.`,
          priority_score: 500,
          is_relative_demo_date: false,
          contract_citation: `${terms.supplier} Contract Clause 4.1: Returns delivered after ${windowDays} days from retail return date are deemed ineligible.`,
        });
        return;
      }

      // Active eligible items exist!
      // Compute minimum days remaining among eligible items
      const minDaysRemaining = Math.min(
        ...itemsInWindow.map((r) => windowDays - r.days_since_return)
      );

      // Compute exact deadline date when return date is present
      // If the eligible item has a valid ISO date, calculate calendar deadline:
      // Item return date + window_days
      let calculatedDeadlineDate: string | null = null;
      let hasValidDate = false;
      const oldestEligibleItem = itemsInWindow.reduce((oldest, item) =>
        item.days_since_return > oldest.days_since_return ? item : oldest
      );

      if (oldestEligibleItem.date && oldestEligibleItem.date.includes('-')) {
        try {
          const [y, m, d] = oldestEligibleItem.date.split('-').map(Number);
          const returnDateObj = new Date(Date.UTC(y, m - 1, d));
          returnDateObj.setUTCDate(returnDateObj.getUTCDate() + windowDays);
          calculatedDeadlineDate = returnDateObj.toISOString().slice(0, 10);
          hasValidDate = true;
        } catch {
          calculatedDeadlineDate = null;
        }
      }

      const totalCreditAtRisk = itemsInWindow.length * unitCredit;

      // Urgency determination
      let urgency: 'critical' | 'warning' | 'info' = 'warning';
      let eligibilityStatus: 'eligible_critical' | 'eligible_upcoming' = 'eligible_upcoming';

      if (minDaysRemaining <= 3) {
        urgency = 'critical';
        eligibilityStatus = 'eligible_critical';
      } else if (minDaysRemaining <= 10) {
        urgency = 'warning';
        eligibilityStatus = 'eligible_upcoming';
      } else {
        urgency = 'info';
        eligibilityStatus = 'eligible_upcoming';
      }

      // Missing information checklist
      const missingInfo: string[] = [];
      if (!oldestEligibleItem.date) {
        missingInfo.push('Intake calendar return date unrecorded; estimated via warehouse tracking.');
      }
      missingInfo.push(`Supplier RMA dispatch booking manifest pending generation.`);
      if (urgency === 'critical') {
        missingInfo.push(
          `Priority freight carrier tracking number required before ${calculatedDeadlineDate || 'cutoff'}.`
        );
      }
      if (itemsOutOfWindow.length > 0) {
        missingInfo.push(
          `${itemsOutOfWindow.length} units in batch have already crossed the ${windowDays}-day cutoff and must be stripped from RTV consignment.`
        );
      }

      // Recommended next action
      let recommendedAction = '';
      if (urgency === 'critical') {
        recommendedAction = `CRITICAL ACTION: Stage simulated RTV proposal for ${itemsInWindow.length} units to preserve ${CalculationEngine.formatINR(
          totalCreditAtRisk
        )} credit note before the ${minDaysRemaining}-day window closes on ${calculatedDeadlineDate || 'cutoff'}.`;
      } else {
        recommendedAction = `Stage simulated RTV claim for ${itemsInWindow.length} eligible units (${CalculationEngine.formatINR(
          totalCreditAtRisk
        )} credit). Allocate the ${itemsOutOfWindow.length} expired units to Refurbishment or Liquidation.`;
      }

      const consequence = `Missing this ${minDaysRemaining}-day window forfeits ${CalculationEngine.formatINR(
        totalCreditAtRisk
      )} in guaranteed supplier credit note eligibility.`;

      // Priority formula: Critical (<=3d) has highest urgency weight + recoverable value
      const urgencyWeight = urgency === 'critical' ? 2_000_000 : 1_000_000;
      const priorityScore = urgencyWeight + totalCreditAtRisk - minDaysRemaining * 500;

      alerts.push({
        id: `DL-${sku}-${batch}`,
        sku,
        product_name: product.name,
        category: product.category,
        supplier: terms.supplier,
        supplier_batch: batch,
        earliest_return_date: oldestEligibleItem.date || null,
        window_days: windowDays,
        deadline_date: calculatedDeadlineDate,
        days_remaining: minDaysRemaining,
        eligible_units: itemsInWindow.length,
        expired_units: itemsOutOfWindow.length,
        total_batch_units: totalBatchUnits,
        credit_pct: terms.credit_pct,
        unit_credit: unitCredit,
        total_credit_at_risk: totalCreditAtRisk,
        urgency,
        eligibility_status: eligibilityStatus,
        missing_information: missingInfo,
        recommended_action: recommendedAction,
        consequence,
        priority_score: priorityScore,
        is_relative_demo_date: !hasValidDate,
        contract_citation: `${terms.supplier} SLA Clause: ${terms.credit_pct}% contractual credit on units received within ${windowDays} days.`,
      });
    });

    // Sort by priority score descending: high value + low remaining days first!
    return alerts.sort((a, b) => b.priority_score - a.priority_score);
  }

  /**
   * Prepares a simulated RTV approval proposal for managerial sign-off.
   * Explicitly marks action as simulated with internal audit notes.
   */
  public static prepareRtvProposal(params: PrepareRtvProposalParams): ApprovalAction {
    const { alert, product, requestedUnits, managerNotes } = params;
    const unitsToClaim =
      requestedUnits !== undefined
        ? Math.min(requestedUnits, alert.eligible_units)
        : alert.eligible_units;

    const totalCredit = unitsToClaim * alert.unit_credit;
    const dateFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const action: ApprovalAction = {
      id: `APP-RTV-${Date.now().toString().slice(-5)}`,
      created_at: dateFormatted,
      sku: alert.sku,
      product_name: alert.product_name,
      supplier_batch: alert.supplier_batch,
      total_units: unitsToClaim,
      allocations: {
        rtv: unitsToClaim,
        refurb: 0,
        liquidate: 0,
        scrap: 0,
      },
      expected_net_recovery: totalCredit,
      weighted_days_to_cash: 15, // Vendor credit memo cycle
      primary_rationale: `Simulated RTV proposal for ${unitsToClaim} units of ${alert.sku} (${alert.supplier_batch}). Preserves ${CalculationEngine.formatINR(
        totalCredit
      )} in contractual supplier credit. ${alert.days_remaining >= 0 ? `${alert.days_remaining} days remaining before ${alert.deadline_date || 'SLA'} cutoff.` : 'Immediate claim staged.'} ${managerNotes ? `Manager Notes: ${managerNotes}` : ''}`,
      key_assumptions: [
        `SIMULATED WORKFLOW ONLY: Internal staging ledger entry. No external communication dispatched to supplier ${alert.supplier}.`,
        `Supplier credit note rate: ${alert.credit_pct}% of procurement cost (${CalculationEngine.formatINR(alert.unit_credit)}/unit).`,
        `Contractual window: ${alert.window_days} days under ${alert.supplier} master agreement.`,
        `Physical items must pass intake barcode scan and intact packaging verification upon receipt.`,
      ],
      status: 'pending',
      is_simulated: true,
    };

    return action;
  }
}
