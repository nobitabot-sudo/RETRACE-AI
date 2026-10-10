import {
  Product,
  ReturnItem,
  SaleRecord,
  InventoryRecord,
  RefurbishmentRule,
  VendorTerms,
  LiquidationRule,
  ApprovalAction,
} from '../types';

import { PRODUCT_IMAGE_MAP } from './productImages';

export const CURRENT_SIMULATION_DATE = '2026-10-09';

// 1. PRODUCTS
export const SAMPLE_PRODUCTS: Product[] = [
  {
    sku: 'WH-NEO-01',
    name: 'AcoustiQ Neo Wireless ANC Headphones',
    category: 'Audio',
    cost: 1400, // ₹1,400
    selling_price: 2500, // ₹2,500
    supplier: 'SoundCraft Audio Ltd.',
    lifecycle_status: 'Active',
    image_url: PRODUCT_IMAGE_MAP['WH-NEO-01'],
  },
  {
    sku: 'MON-4K-PRO',
    name: 'SpectraView 32" 4K UHD Studio Monitor',
    category: 'Displays',
    cost: 28000, // ₹28,000
    selling_price: 42000, // ₹42,000
    supplier: 'VisionTech Displays',
    lifecycle_status: 'Active',
    image_url: PRODUCT_IMAGE_MAP['MON-4K-PRO'],
  },
  {
    sku: 'WATCH-LTE-X',
    name: 'PulseTrack Ultra LTE Smartwatch (Gen 1)',
    category: 'Wearables',
    cost: 7000, // ₹7,000
    selling_price: 12000, // ₹12,000
    supplier: 'ChronoCorp Micro',
    lifecycle_status: 'Phase-out',
    image_url: PRODUCT_IMAGE_MAP['WATCH-LTE-X'],
  },
  {
    sku: 'DRONE-MINI',
    name: 'AeroPocket 4K Foldable Quadcopter',
    category: 'Drones',
    cost: 8500, // ₹8,500
    selling_price: 15500, // ₹15,500
    supplier: 'ApexRobotics Global',
    lifecycle_status: 'Active',
    image_url: PRODUCT_IMAGE_MAP['DRONE-MINI'],
  },
  {
    sku: 'TAB-AIR-10',
    name: 'VividPad Air 10.5" Android Tablet',
    category: 'Tablets',
    cost: 11000, // ₹11,000
    selling_price: 18900, // ₹18,900
    supplier: 'OmniSilicon Co.',
    lifecycle_status: 'Active',
    image_url: PRODUCT_IMAGE_MAP['TAB-AIR-10'],
  },
];

// 2. VENDOR TERMS (RTV)
export const SAMPLE_VENDOR_TERMS: VendorTerms[] = [
  {
    supplier: 'SoundCraft Audio Ltd.',
    sku: 'WH-NEO-01',
    rtv_allowed: true,
    credit_pct: 60, // 60% of original cost = ₹840
    window_days: 30, // 30-day return window
  },
  {
    supplier: 'VisionTech Displays',
    sku: 'MON-4K-PRO',
    rtv_allowed: true,
    credit_pct: 65, // 65% of original cost = ₹18,200
    window_days: 21, // 21-day return window
  },
  {
    supplier: 'ChronoCorp Micro',
    sku: 'WATCH-LTE-X',
    rtv_allowed: true,
    credit_pct: 45, // 45% credit on phased-out inventory = ₹3,150
    window_days: 14, // Tight 14-day window
  },
  // ApexRobotics deliberately omitted or set to rtv_allowed = false to test missing terms
  {
    supplier: 'ApexRobotics Global',
    sku: 'DRONE-MINI',
    rtv_allowed: false, // Contract expired / no RTV clause
    credit_pct: 0,
    window_days: 0,
  },
  {
    supplier: 'OmniSilicon Co.',
    sku: 'TAB-AIR-10',
    rtv_allowed: true,
    credit_pct: 50,
    window_days: 30,
  },
];

// 3. REFURBISHMENT RULES
export const SAMPLE_REFURB_RULES: RefurbishmentRule[] = [
  {
    category: 'Audio',
    cost: 250, // ₹250 refurbishment bench cost
    days_required: 5, // 5 days
    resale_pct_of_new: 75, // 75% of new selling price = ₹1,875
  },
  {
    category: 'Displays',
    cost: 2200, // ₹2,200 testing & recalibration
    days_required: 7,
    resale_pct_of_new: 70, // ₹29,400
  },
  {
    category: 'Wearables',
    cost: 1400, // ₹1,400 waterproofing & seal replacement
    days_required: 8,
    resale_pct_of_new: 55, // 55% because Gen 1 is phased out
  },
  {
    category: 'Drones',
    cost: 1800,
    days_required: 6,
    resale_pct_of_new: 65,
  },
  {
    category: 'Tablets',
    cost: 3200,
    days_required: 9,
    resale_pct_of_new: 60,
  },
];

// 4. LIQUIDATION RULES
export const SAMPLE_LIQUIDATION_RULES: LiquidationRule[] = [
  {
    category: 'Audio',
    grade: 'B',
    recovery_pct_of_cost: 35, // 35% of original cost = ₹490
  },
  {
    category: 'Audio',
    grade: 'C',
    recovery_pct_of_cost: 25,
  },
  {
    category: 'Audio',
    grade: 'DEFECTIVE',
    recovery_pct_of_cost: 15,
  },
  {
    category: 'Displays',
    grade: 'B',
    recovery_pct_of_cost: 30,
  },
  {
    category: 'Wearables',
    grade: 'B',
    recovery_pct_of_cost: 40, // 40% of cost = ₹2,800
  },
  {
    category: 'Drones',
    grade: 'B',
    recovery_pct_of_cost: 30,
  },
  {
    category: 'Tablets',
    grade: 'C',
    recovery_pct_of_cost: 20,
  },
];

// 5. INVENTORY & DEMAND
export const SAMPLE_INVENTORY: InventoryRecord[] = [
  {
    sku: 'WH-NEO-01',
    new_stock: 72, // Covers 60 days of demand (1.2 units/day)
    avg_daily_demand: 1.2,
    reorder_lead_time_days: 14,
  },
  {
    sku: 'MON-4K-PRO',
    new_stock: 15, // 0.5 units/day = 30 days
    avg_daily_demand: 0.5,
    reorder_lead_time_days: 21,
  },
  {
    sku: 'WATCH-LTE-X',
    new_stock: 36, // At 0.2 units/day = 180 days coverage! (WEAK DEMAND TRAP)
    avg_daily_demand: 0.2,
    reorder_lead_time_days: 45,
  },
  {
    sku: 'DRONE-MINI',
    new_stock: 20,
    avg_daily_demand: 0.8,
    reorder_lead_time_days: 18,
  },
  {
    sku: 'TAB-AIR-10',
    new_stock: 12,
    avg_daily_demand: 0.4,
    reorder_lead_time_days: 25,
  },
];

// 6. SALES RECORDS (Context for batch defect rate)
export const SAMPLE_SALES: SaleRecord[] = [
  // For batch HB-09: 350 units were sold over last 45 days
  { date: '2026-08-25', sku: 'WH-NEO-01', qty_sold: 80, selling_price: 2500 },
  { date: '2026-09-02', sku: 'WH-NEO-01', qty_sold: 110, selling_price: 2500 },
  { date: '2026-09-15', sku: 'WH-NEO-01', qty_sold: 95, selling_price: 2500 },
  { date: '2026-09-28', sku: 'WH-NEO-01', qty_sold: 65, selling_price: 2500 },
  // Monitors: 45 sold
  { date: '2026-09-10', sku: 'MON-4K-PRO', qty_sold: 25, selling_price: 42000 },
  { date: '2026-09-24', sku: 'MON-4K-PRO', qty_sold: 20, selling_price: 42000 },
  // Watches: 18 sold
  { date: '2026-09-01', sku: 'WATCH-LTE-X', qty_sold: 18, selling_price: 12000 },
];

// 7. RETURN ITEMS
// Generate 40 Headphones matching exact requirements:
// - All 40 associated with supplier batch HB-09
// - 24 units still eligible for supplier return (< 30 days)
// - 16 units expired from supplier return (> 30 days)
// - 28 of 40 (70%) report the same fault: "DEF-01: Right Hinge Fracture / Bluetooth Dropout"
// - 12 report other reasons: "UNWANTED_GIFT", "FIT_DISCOMFORT", etc.
export const SAMPLE_RETURNS: ReturnItem[] = (() => {
  const returns: ReturnItem[] = [];

  // 24 eligible headphones (e.g., returned between 12 and 22 days ago, window is 30 days => 8 to 18 days left)
  // Among these 24, 17 have DEF-01
  for (let i = 1; i <= 24; i++) {
    const isDefect = i <= 17; // 17 of 24
    const daysAgo = 10 + (i % 12); // 10 to 21 days ago (window 30 days => eligible!)
    returns.push({
      return_id: `RET-HP-${String(i).padStart(3, '0')}`,
      date: `2026-09-${String(29 - (daysAgo - 10)).padStart(2, '0')}`,
      sku: 'WH-NEO-01',
      supplier_batch: 'HB-09',
      reason_code: isDefect ? 'DEF-01' : (i % 2 === 0 ? 'ACC-02' : 'FIT-03'),
      reason_label: isDefect
        ? 'Right Hinge Fracture / Audio Dropout'
        : (i % 2 === 0 ? 'Customer changed mind' : 'Ear cup size discomfort'),
      grade: isDefect ? 'B' : 'A',
      customer_note: isDefect
        ? 'Right hinge cracked while putting on. Sound cuts out.'
        : 'Box opened, clean item, buyer changed mind.',
      days_since_return: daysAgo,
    });
  }

  // 16 expired headphones (returned 34 to 42 days ago, window 30 days => expired for RTV)
  // Among these 16, 11 have DEF-01 (17 + 11 = 28 out of 40 = exactly 70%!)
  for (let i = 25; i <= 40; i++) {
    const isDefect = i <= 35; // 11 of 16
    const daysAgo = 33 + (i - 24); // 34 to 49 days ago (expired)
    returns.push({
      return_id: `RET-HP-${String(i).padStart(3, '0')}`,
      date: `2026-08-${String(Math.max(1, 31 - (daysAgo - 33))).padStart(2, '0')}`,
      sku: 'WH-NEO-01',
      supplier_batch: 'HB-09',
      reason_code: isDefect ? 'DEF-01' : 'ACC-02',
      reason_label: isDefect
        ? 'Right Hinge Fracture / Audio Dropout'
        : 'Customer changed mind / Buyer remorse',
      grade: isDefect ? 'B' : 'B',
      customer_note: isDefect
        ? 'Hinge plastic snapped at stress point after 2 weeks.'
        : 'Customer upgraded to newer model.',
      days_since_return: daysAgo,
    });
  }

  // Scenario 2: 5 High-value 4K Studio Monitors approaching supplier deadline (3 days left!)
  // Window = 21 days, returned 18 days ago => 3 days remaining!
  for (let i = 1; i <= 5; i++) {
    returns.push({
      return_id: `RET-MON-${String(i).padStart(3, '0')}`,
      date: '2026-09-21',
      sku: 'MON-4K-PRO',
      supplier_batch: 'VT-4K-2026Q3',
      reason_code: 'DISP-04',
      reason_label: 'Edge back-light bleed & panel flicker',
      grade: 'B',
      customer_note: 'Panel flickering observed during color grading session.',
      days_since_return: 18, // 21 - 18 = 3 days remaining!
    });
  }

  // Scenario 3: 8 Smartwatches with weak market demand (Watch LTE X)
  // Phased out model, new stock already covers 180 days!
  for (let i = 1; i <= 8; i++) {
    returns.push({
      return_id: `RET-WCH-${String(i).padStart(3, '0')}`,
      date: '2026-09-15',
      sku: 'WATCH-LTE-X',
      supplier_batch: 'CW-GEN1-B2',
      reason_code: 'BAT-03',
      reason_label: 'Battery drain below 12 hours',
      grade: 'B',
      customer_note: 'Battery drops to 15% after 8 hours of light use.',
      days_since_return: 24, // Window 14 days => already expired for RTV!
    });
  }

  // Scenario 4: 4 Drones with missing / void vendor terms (ApexRobotics)
  for (let i = 1; i <= 4; i++) {
    returns.push({
      return_id: `RET-DRN-${String(i).padStart(3, '0')}`,
      date: '2026-09-25',
      sku: 'DRONE-MINI',
      supplier_batch: 'APX-DR-04',
      reason_code: 'GYRO-01',
      reason_label: 'Drifts during hover calibration',
      grade: 'B',
      customer_note: 'Gimbal drifts to left during take-off.',
      days_since_return: 14,
    });
  }

  // Scenario 5: 3 Tablets with unviable economics (Cracked LCD screens)
  for (let i = 1; i <= 3; i++) {
    returns.push({
      return_id: `RET-TAB-${String(i).padStart(3, '0')}`,
      date: '2026-09-18',
      sku: 'TAB-AIR-10',
      supplier_batch: 'OMN-TB-88',
      reason_code: 'PHY-CRACK',
      reason_label: 'Severe LCD matrix fracture',
      grade: 'DEFECTIVE',
      customer_note: 'Screen internally cracked, digitizer unresponsive.',
      days_since_return: 21,
    });
  }

  return returns;
})();

// 8. INITIAL APPROVAL PIPELINE
export const INITIAL_APPROVALS: ApprovalAction[] = [
  {
    id: 'APP-2026-001',
    created_at: '2026-10-08 16:30',
    sku: 'MON-4K-PRO',
    product_name: 'SpectraView 32" 4K UHD Studio Monitor',
    supplier_batch: 'VT-4K-2026Q3',
    total_units: 5,
    allocations: {
      rtv: 5,
      refurb: 0,
      liquidate: 0,
      scrap: 0,
    },
    expected_net_recovery: 91000,
    weighted_days_to_cash: 18,
    primary_rationale:
      'Critical 3-day deadline approaching. Supplier credit is 65% of ₹28,000 cost (₹18,200/unit = ₹91,000 guaranteed). Refurbishing ties up bench and takes 28+ days to sell.',
    key_assumptions: [
      'Supplier VisionTech accepts returns within 21 days (day 18 currently).',
      'Vendor credit note settles to Gadgetbay accounts in 18 business days.',
      'Logistics freight is borne by supplier under tier-1 warranty SLA.',
    ],
    status: 'pending',
    is_simulated: true,
  },
  {
    id: 'APP-2026-002',
    created_at: '2026-10-07 11:15',
    sku: 'WATCH-LTE-X',
    product_name: 'PulseTrack Ultra LTE Smartwatch (Gen 1)',
    supplier_batch: 'CW-GEN1-B2',
    total_units: 8,
    allocations: {
      rtv: 0,
      refurb: 0,
      liquidate: 8,
      scrap: 0,
    },
    expected_net_recovery: 22400,
    weighted_days_to_cash: 3,
    primary_rationale:
      'Weak demand trap averted. Existing warehouse stock covers 180 days of new sales. Refurbishing would require ₹1,400 bench cost per unit and sit for months. Instant B2B liquidation at 40% of cost yields ₹22,400 in 72 hours.',
    key_assumptions: [
      'B2B liquidator agreed to purchase Grade B lot at 40% of cost (₹2,800/unit).',
      'Supplier 14-day RTV window had already expired.',
      'Direct pickup from Gadgetbay hub with zero freight expense.',
    ],
    status: 'approved',
    reviewed_at: '2026-10-07 14:02',
    reviewer_name: 'Devin K. (Returns Ops Lead)',
    reviewer_notes: 'Approved. Fast cash clearance prevents long-term warehouse decay.',
    is_simulated: true,
  },
];
