import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  Product,
  ReturnItem,
  SaleRecord,
  InventoryRecord,
  RefurbishmentRule,
  VendorTerms,
  LiquidationRule,
  ApprovalAction,
  DraftAllocationRecord,
} from '../types';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent database path (configurable via SQLITE_DB_PATH)
const DB_PATH = process.env.SQLITE_DB_PATH
  ? path.resolve(process.env.SQLITE_DB_PATH)
  : path.resolve(__dirname, '../../data/phoenix.db');

let dbInstance: DatabaseSync | null = null;

export class PhoenixDatabase {
  public static getDb(): DatabaseSync {
    if (!dbInstance) {
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      dbInstance = new DatabaseSync(DB_PATH);
      // Enable WAL mode & foreign keys for high performance and integrity
      dbInstance.exec('PRAGMA foreign_keys = ON;');
      console.log(`[PHOENIX DB] Connected to SQLite database at: ${DB_PATH}`);
      this.initSchema();
    }
    return dbInstance;
  }

  public static getDbPath(): string {
    return DB_PATH;
  }

  /**
   * Initializes all required tables and indexes if they do not exist.
   * PostgreSQL-compatible column definitions and typing.
   */
  public static initSchema(): void {
    const db = dbInstance || this.getDb();

    db.exec(`
      -- 1. Products
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        cost REAL NOT NULL,
        selling_price REAL NOT NULL,
        supplier TEXT NOT NULL,
        lifecycle_status TEXT NOT NULL DEFAULT 'Active',
        image_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

      -- 2. Returns
      CREATE TABLE IF NOT EXISTS returns (
        return_id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        sku TEXT NOT NULL,
        supplier_batch TEXT NOT NULL,
        reason_code TEXT NOT NULL,
        reason_label TEXT NOT NULL,
        grade TEXT NOT NULL,
        customer_note TEXT,
        days_since_return INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        investigation_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_returns_sku ON returns(sku);
      CREATE INDEX IF NOT EXISTS idx_returns_batch ON returns(supplier_batch);
      CREATE INDEX IF NOT EXISTS idx_returns_reason ON returns(reason_code);

      -- 3. Sales
      CREATE TABLE IF NOT EXISTS sales (
        sale_id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        sku TEXT NOT NULL,
        qty_sold INTEGER NOT NULL,
        selling_price REAL NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sales_sku ON sales(sku);

      -- 4. Inventory
      CREATE TABLE IF NOT EXISTS inventory (
        sku TEXT PRIMARY KEY,
        new_stock INTEGER NOT NULL,
        avg_daily_demand REAL NOT NULL,
        reorder_lead_time_days INTEGER NOT NULL DEFAULT 14,
        last_updated TEXT NOT NULL
      );

      -- 5. Refurbishment Rules
      CREATE TABLE IF NOT EXISTS refurb_rules (
        category TEXT PRIMARY KEY,
        cost REAL NOT NULL,
        days_required INTEGER NOT NULL,
        resale_pct_of_new REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 6. Vendor Terms
      CREATE TABLE IF NOT EXISTS vendor_terms (
        sku TEXT PRIMARY KEY,
        supplier TEXT NOT NULL,
        rtv_allowed INTEGER NOT NULL DEFAULT 1,
        credit_pct REAL NOT NULL,
        window_days INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 7. Liquidation Rules
      CREATE TABLE IF NOT EXISTS liquidation_rules (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        grade TEXT NOT NULL,
        recovery_pct_of_cost REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_liq_cat_grade ON liquidation_rules(category, grade);

      -- 8. Recovery Proposals
      CREATE TABLE IF NOT EXISTS recovery_proposals (
        proposal_id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        related_return_ids TEXT NOT NULL,
        allocations TEXT NOT NULL,
        total_units INTEGER NOT NULL,
        total_gross_recovery REAL NOT NULL,
        total_direct_costs REAL NOT NULL,
        expected_net_recovery REAL NOT NULL,
        weighted_days_to_cash INTEGER NOT NULL,
        primary_rationale TEXT NOT NULL,
        key_assumptions TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        calculation_timestamp TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- 9. Approvals
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        proposal_id TEXT,
        sku TEXT NOT NULL,
        product_name TEXT NOT NULL,
        supplier_batch TEXT NOT NULL,
        total_units INTEGER NOT NULL,
        allocations TEXT NOT NULL,
        expected_net_recovery REAL NOT NULL,
        weighted_days_to_cash INTEGER NOT NULL,
        primary_rationale TEXT NOT NULL,
        key_assumptions TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_at TEXT,
        reviewer_name TEXT,
        reviewer_notes TEXT,
        is_simulated INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

      -- 10. Approval Audit History
      CREATE TABLE IF NOT EXISTS approval_audit_events (
        id TEXT PRIMARY KEY,
        approval_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        manager_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        comments TEXT,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        details TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_audit_approval_id ON approval_audit_events(approval_id);

      -- 11. Agent Investigations
      CREATE TABLE IF NOT EXISTS agent_investigations (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        dataset_references TEXT,
        findings TEXT NOT NULL,
        supporting_evidence TEXT,
        calculations TEXT,
        recommendations TEXT,
        risks_and_missing_info TEXT,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- 12. Draft Allocations
      CREATE TABLE IF NOT EXISTS draft_allocations (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        product_name TEXT NOT NULL,
        supplier_batch TEXT NOT NULL,
        total_units INTEGER NOT NULL,
        allocations TEXT NOT NULL,
        total_gross_recovery REAL NOT NULL,
        total_direct_costs REAL NOT NULL,
        total_net_recovery REAL NOT NULL,
        weighted_time_to_cash_days INTEGER NOT NULL,
        notes TEXT,
        scenario_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 13. What-If Simulations
      CREATE TABLE IF NOT EXISTS what_if_simulations (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        inputs TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- 14. Import History
      CREATE TABLE IF NOT EXISTS import_history (
        id TEXT PRIMARY KEY,
        dataset_type TEXT NOT NULL,
        filename TEXT NOT NULL,
        record_count INTEGER NOT NULL,
        imported_count INTEGER NOT NULL,
        skipped_count INTEGER NOT NULL,
        rejected_count INTEGER NOT NULL,
        status TEXT NOT NULL,
        details TEXT,
        imported_at TEXT NOT NULL
      );
    `);

    // Migration: add image_url if upgrading existing database
    try {
      db.exec('ALTER TABLE products ADD COLUMN image_url TEXT;');
    } catch (_) {}

    // Seed initial dataset if tables are empty (first launch only)
    this.seedIfEmpty();
  }

  /**
   * Seeds initial datasets only if products table has 0 records.
   * Subsequent runs reuse the existing database file.
   */
  private static seedIfEmpty(): void {
    const db = dbInstance || this.getDb();
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM products');
    const row = countStmt.get() as { count: number };

    if (row && Number(row.count) > 0) {
      console.log(`[PHOENIX DB] Reusing existing persistent database (${row.count} products stored).`);
      return;
    }

    console.log('[PHOENIX DB] Empty database detected. Seeding baseline reversal intelligence catalog...');

    const now = new Date().toISOString();

    // 1. Seed Products
    const insertProduct = db.prepare(`
      INSERT INTO products (id, sku, name, category, cost, selling_price, supplier, lifecycle_status, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of SAMPLE_PRODUCTS) {
      insertProduct.run(
        `PROD-${p.sku}`,
        p.sku,
        p.name,
        p.category,
        p.cost,
        p.selling_price,
        p.supplier,
        p.lifecycle_status,
        p.image_url || null,
        now,
        now
      );
    }

    // 2. Seed Returns
    const insertReturn = db.prepare(`
      INSERT INTO returns (return_id, date, sku, supplier_batch, reason_code, reason_label, grade, customer_note, days_since_return, quantity, investigation_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of SAMPLE_RETURNS) {
      insertReturn.run(
        r.return_id,
        r.date,
        r.sku,
        r.supplier_batch,
        r.reason_code,
        r.reason_label,
        r.grade,
        r.customer_note || null,
        r.days_since_return,
        1,
        'pending',
        now,
        now
      );
    }

    // 3. Seed Sales
    const insertSale = db.prepare(`
      INSERT INTO sales (sale_id, date, sku, qty_sold, selling_price, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < SAMPLE_SALES.length; i++) {
      const s = SAMPLE_SALES[i];
      insertSale.run(
        `SALE-${String(i + 1).padStart(4, '0')}`,
        s.date,
        s.sku,
        s.qty_sold,
        s.selling_price,
        now
      );
    }

    // 4. Seed Inventory
    const insertInventory = db.prepare(`
      INSERT INTO inventory (sku, new_stock, avg_daily_demand, reorder_lead_time_days, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const inv of SAMPLE_INVENTORY) {
      insertInventory.run(
        inv.sku,
        inv.new_stock,
        inv.avg_daily_demand,
        inv.reorder_lead_time_days,
        now
      );
    }

    // 5. Seed Refurb Rules
    const insertRefurb = db.prepare(`
      INSERT INTO refurb_rules (category, cost, days_required, resale_pct_of_new, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const rf of SAMPLE_REFURB_RULES) {
      insertRefurb.run(
        rf.category,
        rf.cost,
        rf.days_required,
        rf.resale_pct_of_new,
        now,
        now
      );
    }

    // 6. Seed Vendor Terms
    const insertVendorTerms = db.prepare(`
      INSERT INTO vendor_terms (sku, supplier, rtv_allowed, credit_pct, window_days, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const vt of SAMPLE_VENDOR_TERMS) {
      insertVendorTerms.run(
        vt.sku,
        vt.supplier,
        vt.rtv_allowed ? 1 : 0,
        vt.credit_pct,
        vt.window_days,
        now,
        now
      );
    }

    // 7. Seed Liquidation Rules
    const insertLiq = db.prepare(`
      INSERT INTO liquidation_rules (id, category, grade, recovery_pct_of_cost, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const lq of SAMPLE_LIQUIDATION_RULES) {
      insertLiq.run(
        `${lq.category}_${lq.grade}`,
        lq.category,
        lq.grade,
        lq.recovery_pct_of_cost,
        now,
        now
      );
    }

    // 8. Seed Approvals
    const insertApproval = db.prepare(`
      INSERT INTO approvals (id, proposal_id, sku, product_name, supplier_batch, total_units, allocations, expected_net_recovery, weighted_days_to_cash, primary_rationale, key_assumptions, status, reviewed_at, reviewer_name, reviewer_notes, is_simulated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ap of INITIAL_APPROVALS) {
      insertApproval.run(
        ap.id,
        `PROP-${ap.sku}`,
        ap.sku,
        ap.product_name,
        ap.supplier_batch,
        ap.total_units,
        JSON.stringify(ap.allocations),
        ap.expected_net_recovery,
        ap.weighted_days_to_cash,
        ap.primary_rationale,
        JSON.stringify(ap.key_assumptions),
        ap.status,
        ap.reviewed_at || null,
        ap.reviewer_name || null,
        ap.reviewer_notes || null,
        ap.is_simulated ? 1 : 0,
        ap.created_at || now
      );
    }

    console.log('[PHOENIX DB] Baseline Reverse Logistics database successfully seeded and committed.');
  }

  // --- QUERY METHODS ---

  public static getProducts(): Product[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM products ORDER BY sku ASC').all() as Array<{
      sku: string;
      name: string;
      category: Product['category'];
      cost: number;
      selling_price: number;
      supplier: string;
      lifecycle_status: Product['lifecycle_status'];
      image_url?: string | null;
    }>;

    return rows.map((r) => ({
      sku: r.sku,
      name: r.name,
      category: r.category,
      cost: Number(r.cost),
      selling_price: Number(r.selling_price),
      supplier: r.supplier,
      lifecycle_status: r.lifecycle_status,
      image_url: r.image_url || undefined,
    }));
  }

  public static getReturns(filter?: { sku?: string; batch?: string; reason_code?: string; limit?: number }): ReturnItem[] {
    const db = this.getDb();
    let sql = 'SELECT * FROM returns WHERE 1=1';
    const params: (string | number)[] = [];

    if (filter?.sku) {
      sql += ' AND sku = ?';
      params.push(filter.sku);
    }
    if (filter?.batch) {
      sql += ' AND supplier_batch = ?';
      params.push(filter.batch);
    }
    if (filter?.reason_code) {
      sql += ' AND reason_code = ?';
      params.push(filter.reason_code);
    }

    sql += ' ORDER BY date DESC';
    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    const rows = db.prepare(sql).all(...params) as Array<{
      return_id: string;
      date: string;
      sku: string;
      supplier_batch: string;
      reason_code: string;
      reason_label: string;
      grade: ReturnItem['grade'];
      customer_note: string | null;
      days_since_return: number;
    }>;

    return rows.map((r) => ({
      return_id: r.return_id,
      date: r.date,
      sku: r.sku,
      supplier_batch: r.supplier_batch,
      reason_code: r.reason_code,
      reason_label: r.reason_label,
      grade: r.grade,
      customer_note: r.customer_note || undefined,
      days_since_return: Number(r.days_since_return),
    }));
  }

  public static getSales(): SaleRecord[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM sales ORDER BY date DESC').all() as Array<{
      date: string;
      sku: string;
      qty_sold: number;
      selling_price: number;
    }>;

    return rows.map((r) => ({
      date: r.date,
      sku: r.sku,
      qty_sold: Number(r.qty_sold),
      selling_price: Number(r.selling_price),
    }));
  }

  public static getInventory(): InventoryRecord[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM inventory').all() as Array<{
      sku: string;
      new_stock: number;
      avg_daily_demand: number;
      reorder_lead_time_days: number;
    }>;

    return rows.map((r) => ({
      sku: r.sku,
      new_stock: Number(r.new_stock),
      avg_daily_demand: Number(r.avg_daily_demand),
      reorder_lead_time_days: Number(r.reorder_lead_time_days),
    }));
  }

  public static getRefurbRules(): RefurbishmentRule[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM refurb_rules').all() as Array<{
      category: string;
      cost: number;
      days_required: number;
      resale_pct_of_new: number;
    }>;

    return rows.map((r) => ({
      category: r.category,
      cost: Number(r.cost),
      days_required: Number(r.days_required),
      resale_pct_of_new: Number(r.resale_pct_of_new),
    }));
  }

  public static getVendorTerms(): VendorTerms[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM vendor_terms').all() as Array<{
      sku: string;
      supplier: string;
      rtv_allowed: number;
      credit_pct: number;
      window_days: number;
    }>;

    return rows.map((r) => ({
      sku: r.sku,
      supplier: r.supplier,
      rtv_allowed: Number(r.rtv_allowed) === 1,
      credit_pct: Number(r.credit_pct),
      window_days: Number(r.window_days),
    }));
  }

  public static getLiquidationRules(): LiquidationRule[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM liquidation_rules').all() as Array<{
      category: string;
      grade: LiquidationRule['grade'];
      recovery_pct_of_cost: number;
    }>;

    return rows.map((r) => ({
      category: r.category,
      grade: r.grade,
      recovery_pct_of_cost: Number(r.recovery_pct_of_cost),
    }));
  }

  public static getApprovals(): ApprovalAction[] {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM approvals ORDER BY created_at DESC').all() as Array<{
      id: string;
      proposal_id: string | null;
      sku: string;
      product_name: string;
      supplier_batch: string;
      total_units: number;
      allocations: string;
      expected_net_recovery: number;
      weighted_days_to_cash: number;
      primary_rationale: string;
      key_assumptions: string;
      status: ApprovalAction['status'];
      reviewed_at: string | null;
      reviewer_name: string | null;
      reviewer_notes: string | null;
      is_simulated: number;
      created_at: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      product_name: r.product_name,
      supplier_batch: r.supplier_batch,
      total_units: Number(r.total_units),
      allocations: JSON.parse(r.allocations || '{}'),
      expected_net_recovery: Number(r.expected_net_recovery),
      weighted_days_to_cash: Number(r.weighted_days_to_cash),
      primary_rationale: r.primary_rationale,
      key_assumptions: JSON.parse(r.key_assumptions || '[]'),
      status: r.status,
      reviewed_at: r.reviewed_at || undefined,
      reviewer_name: r.reviewer_name || undefined,
      reviewer_notes: r.reviewer_notes || undefined,
      is_simulated: Number(r.is_simulated) === 1,
      created_at: r.created_at,
    }));
  }

  public static saveApproval(action: ApprovalAction, managerId: string = 'DEVIN-K'): void {
    const db = this.getDb();
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR REPLACE INTO approvals (
        id, proposal_id, sku, product_name, supplier_batch, total_units,
        allocations, expected_net_recovery, weighted_days_to_cash,
        primary_rationale, key_assumptions, status, reviewed_at,
        reviewer_name, reviewer_notes, is_simulated, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      action.id,
      `PROP-${action.sku}`,
      action.sku,
      action.product_name,
      action.supplier_batch,
      action.total_units,
      JSON.stringify(action.allocations),
      action.expected_net_recovery,
      action.weighted_days_to_cash,
      action.primary_rationale,
      JSON.stringify(action.key_assumptions || []),
      action.status,
      action.reviewed_at || null,
      action.reviewer_name || null,
      action.reviewer_notes || null,
      action.is_simulated ? 1 : 0,
      action.created_at || now
    );

    // Audit Event
    const insertAudit = db.prepare(`
      INSERT INTO approval_audit_events (id, approval_id, decision, manager_id, timestamp, comments, previous_status, new_status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(
      `AUD-${Date.now().toString().slice(-6)}`,
      action.id,
      action.status === 'approved' ? 'AUTHORIZE' : action.status === 'rejected' ? 'REJECT' : 'PROPOSE',
      managerId,
      now,
      action.reviewer_notes || 'Approval status record updated.',
      'draft',
      action.status,
      JSON.stringify(action.allocations)
    );
  }

  public static updateApprovalStatus(
    id: string,
    status: 'approved' | 'rejected',
    reviewerNotes?: string,
    reviewerName: string = 'Devin K. (Returns Lead)'
  ): ApprovalAction | null {
    const db = this.getDb();
    const existing = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as {
      status: string;
      sku: string;
      allocations: string;
    } | undefined;

    if (!existing) return null;

    const prevStatus = existing.status;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    db.prepare(`
      UPDATE approvals
      SET status = ?, reviewed_at = ?, reviewer_name = ?, reviewer_notes = ?
      WHERE id = ?
    `).run(status, now, reviewerName, reviewerNotes || (status === 'approved' ? 'Authorized in console.' : 'Rejected by manager.'), id);

    // Audit Event
    const insertAudit = db.prepare(`
      INSERT INTO approval_audit_events (id, approval_id, decision, manager_id, timestamp, comments, previous_status, new_status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(
      `AUD-${Date.now().toString().slice(-6)}`,
      id,
      status === 'approved' ? 'APPROVED' : 'REJECTED',
      reviewerName,
      new Date().toISOString(),
      reviewerNotes || `Action marked ${status}`,
      prevStatus,
      status,
      existing.allocations
    );

    const updated = this.getApprovals().find((a) => a.id === id);
    return updated || null;
  }

  public static getApprovalAuditEvents(approvalId?: string): Array<{
    id: string;
    approval_id: string;
    decision: string;
    manager_id: string;
    timestamp: string;
    comments: string | null;
    previous_status: string;
    new_status: string;
    details?: string;
  }> {
    const db = this.getDb();
    let sql = 'SELECT * FROM approval_audit_events';
    const params: string[] = [];
    if (approvalId) {
      sql += ' WHERE approval_id = ?';
      params.push(approvalId);
    }
    sql += ' ORDER BY timestamp DESC LIMIT 50';

    return db.prepare(sql).all(...params) as Array<{
      id: string;
      approval_id: string;
      decision: string;
      manager_id: string;
      timestamp: string;
      comments: string | null;
      previous_status: string;
      new_status: string;
      details?: string;
    }>;
  }

  /**
   * Resets the SQLite database to the pristine benchmark demonstration dataset.
   * Idempotent and reproducible without duplicating records.
   */
  public static resetDemoData(): {
    success: boolean;
    message: string;
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
    timestamp: string;
  } {
    const db = this.getDb();
    const now = new Date().toISOString();

    // Clear operational tables
    db.exec(`
      DELETE FROM products;
      DELETE FROM returns;
      DELETE FROM sales;
      DELETE FROM inventory;
      DELETE FROM refurb_rules;
      DELETE FROM vendor_terms;
      DELETE FROM liquidation_rules;
      DELETE FROM approvals;
      DELETE FROM draft_allocations;
    `);

    // 1. Products
    const insertProduct = db.prepare(`
      INSERT INTO products (id, sku, name, category, cost, selling_price, supplier, lifecycle_status, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of SAMPLE_PRODUCTS) {
      insertProduct.run(
        `PROD-${p.sku}`,
        p.sku,
        p.name,
        p.category,
        p.cost,
        p.selling_price,
        p.supplier,
        p.lifecycle_status,
        p.image_url || null,
        now,
        now
      );
    }

    // 2. Returns
    const insertReturn = db.prepare(`
      INSERT INTO returns (return_id, date, sku, supplier_batch, reason_code, reason_label, grade, customer_note, days_since_return, quantity, investigation_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of SAMPLE_RETURNS) {
      insertReturn.run(
        r.return_id,
        r.date,
        r.sku,
        r.supplier_batch,
        r.reason_code,
        r.reason_label,
        r.grade,
        r.customer_note || null,
        r.days_since_return,
        1,
        'pending',
        now,
        now
      );
    }

    // 3. Sales
    const insertSale = db.prepare(`
      INSERT INTO sales (sale_id, date, sku, qty_sold, selling_price, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    SAMPLE_SALES.forEach((s, idx) => {
      insertSale.run(`SALE-${idx + 1}`, s.date, s.sku, s.qty_sold, s.selling_price, now);
    });

    // 4. Inventory
    const insertInv = db.prepare(`
      INSERT INTO inventory (sku, new_stock, avg_daily_demand, reorder_lead_time_days, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const inv of SAMPLE_INVENTORY) {
      insertInv.run(inv.sku, inv.new_stock, inv.avg_daily_demand, inv.reorder_lead_time_days, now);
    }

    // 5. Refurb Rules
    const insertRefurb = db.prepare(`
      INSERT INTO refurb_rules (category, cost, days_required, resale_pct_of_new, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const rf of SAMPLE_REFURB_RULES) {
      insertRefurb.run(rf.category, rf.cost, rf.days_required, rf.resale_pct_of_new, now, now);
    }

    // 6. Vendor Terms
    const insertTerms = db.prepare(`
      INSERT INTO vendor_terms (sku, supplier, rtv_allowed, credit_pct, window_days, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const vt of SAMPLE_VENDOR_TERMS) {
      insertTerms.run(vt.sku, vt.supplier, vt.rtv_allowed ? 1 : 0, vt.credit_pct, vt.window_days, now, now);
    }

    // 7. Liquidation Rules
    const insertLiq = db.prepare(`
      INSERT INTO liquidation_rules (id, category, grade, recovery_pct_of_cost, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const lq of SAMPLE_LIQUIDATION_RULES) {
      insertLiq.run(`${lq.category}_${lq.grade}`, lq.category, lq.grade, lq.recovery_pct_of_cost, now, now);
    }

    // 8. Initial Approvals
    const insertApp = db.prepare(`
      INSERT INTO approvals (id, proposal_id, sku, product_name, supplier_batch, total_units, allocations, expected_net_recovery, weighted_days_to_cash, primary_rationale, key_assumptions, status, reviewed_at, reviewer_name, reviewer_notes, is_simulated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ap of INITIAL_APPROVALS) {
      insertApp.run(
        ap.id,
        `PROP-${ap.sku}`,
        ap.sku,
        ap.product_name,
        ap.supplier_batch,
        ap.total_units,
        JSON.stringify(ap.allocations),
        ap.expected_net_recovery,
        ap.weighted_days_to_cash,
        ap.primary_rationale,
        JSON.stringify(ap.key_assumptions),
        ap.status,
        ap.reviewed_at || null,
        ap.reviewer_name || null,
        ap.reviewer_notes || null,
        ap.is_simulated ? 1 : 0,
        ap.created_at || now
      );
    }

    // Audit log entry for demo reset
    db.prepare(`
      INSERT INTO approval_audit_events (id, approval_id, decision, manager_id, timestamp, comments, previous_status, new_status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `AUD-RESET-${Date.now().toString().slice(-4)}`,
      'SYS-DEMO-RESET',
      'RESET_DEMO_DATA',
      'Judge Demo Lead',
      now,
      'Restored benchmark demonstration dataset to clean reference state.',
      'modified',
      'pristine',
      JSON.stringify({ headphones: 40, eligibleRtv: 24, batch: 'HB-09' })
    );

    const headphoneReturns = SAMPLE_RETURNS.filter((r) => r.sku === 'WH-NEO-01');
    const headphoneDefects = headphoneReturns.filter((r) => r.reason_code === 'DEF-01');

    return {
      success: true,
      message: 'Demonstration dataset successfully reset to pristine benchmark state.',
      datasetName: 'RETRACE AI Reverse Logistics Benchmark Demo',
      benchmarkBatch: 'HB-09',
      counts: {
        products: SAMPLE_PRODUCTS.length,
        returns: SAMPLE_RETURNS.length,
        headphoneReturns: headphoneReturns.length,
        headphoneDefects: headphoneDefects.length,
        eligibleRtvUnits: 24,
        approvals: INITIAL_APPROVALS.length,
      },
      timestamp: now,
    };
  }

  public static getDrafts(sku?: string): DraftAllocationRecord[] {
    const db = this.getDb();
    let sql = 'SELECT * FROM draft_allocations';
    const params: string[] = [];
    if (sku) {
      sql += ' WHERE sku = ?';
      params.push(sku);
    }
    sql += ' ORDER BY updated_at DESC';

    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      sku: string;
      product_name: string;
      supplier_batch: string;
      total_units: number;
      allocations: string;
      total_gross_recovery: number;
      total_direct_costs: number;
      total_net_recovery: number;
      weighted_time_to_cash_days: number;
      notes: string | null;
      scenario_name: string | null;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      product_name: r.product_name,
      supplier_batch: r.supplier_batch,
      total_units: Number(r.total_units),
      allocations: JSON.parse(r.allocations || '{}'),
      totalGrossRecovery: Number(r.total_gross_recovery),
      totalDirectCosts: Number(r.total_direct_costs),
      totalNetRecovery: Number(r.total_net_recovery),
      weightedTimeToCashDays: Number(r.weighted_time_to_cash_days),
      notes: r.notes || undefined,
      scenario_name: r.scenario_name || undefined,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  public static saveDraft(draft: DraftAllocationRecord): void {
    const db = this.getDb();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO draft_allocations (
        id, sku, product_name, supplier_batch, total_units, allocations,
        total_gross_recovery, total_direct_costs, total_net_recovery,
        weighted_time_to_cash_days, notes, scenario_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      draft.id,
      draft.sku,
      draft.product_name,
      draft.supplier_batch,
      draft.total_units,
      JSON.stringify(draft.allocations),
      draft.totalGrossRecovery,
      draft.totalDirectCosts,
      draft.totalNetRecovery,
      draft.weightedTimeToCashDays,
      draft.notes || null,
      draft.scenario_name || null,
      draft.created_at,
      draft.updated_at
    );
  }

  public static getSimulations(sku?: string): Array<{
    id: string;
    sku: string;
    scenario_name: string;
    inputs: Record<string, unknown>;
    summary: Record<string, unknown>;
    created_at: string;
  }> {
    const db = this.getDb();
    let sql = 'SELECT * FROM what_if_simulations';
    const params: string[] = [];
    if (sku) {
      sql += ' WHERE sku = ?';
      params.push(sku);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      sku: string;
      scenario_name: string;
      inputs: string;
      summary: string;
      created_at: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      scenario_name: r.scenario_name,
      inputs: JSON.parse(r.inputs || '{}'),
      summary: JSON.parse(r.summary || '{}'),
      created_at: r.created_at,
    }));
  }

  public static saveSimulation(sim: {
    id: string;
    sku: string;
    scenario_name: string;
    inputs: Record<string, unknown>;
    summary: Record<string, unknown>;
    created_at: string;
  }): void {
    const db = this.getDb();
    const insert = db.prepare(`
      INSERT INTO what_if_simulations (id, sku, scenario_name, inputs, summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      sim.id,
      sim.sku,
      sim.scenario_name,
      JSON.stringify(sim.inputs),
      JSON.stringify(sim.summary),
      sim.created_at
    );
  }

  public static logInvestigation(inv: {
    id?: string;
    query: string;
    dataset_references?: Record<string, unknown>;
    findings: string;
    supporting_evidence?: unknown;
    calculations?: unknown;
    recommendations?: unknown;
    risks_and_missing_info?: unknown;
    source: string;
  }): string {
    const db = this.getDb();
    const id = inv.id || `INV-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO agent_investigations (
        id, query, dataset_references, findings, supporting_evidence,
        calculations, recommendations, risks_and_missing_info, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      inv.query,
      JSON.stringify(inv.dataset_references || {}),
      inv.findings,
      JSON.stringify(inv.supporting_evidence || {}),
      JSON.stringify(inv.calculations || {}),
      JSON.stringify(inv.recommendations || {}),
      JSON.stringify(inv.risks_and_missing_info || {}),
      inv.source,
      now
    );

    return id;
  }

  public static getInvestigations(limit: number = 20): Array<{
    id: string;
    query: string;
    findings: string;
    source: string;
    created_at: string;
  }> {
    const db = this.getDb();
    return db.prepare('SELECT id, query, findings, source, created_at FROM agent_investigations ORDER BY created_at DESC LIMIT ?')
      .all(limit) as Array<{
        id: string;
        query: string;
        findings: string;
        source: string;
        created_at: string;
      }>;
  }

  public static getImportHistory(): Array<{
    id: string;
    dataset_type: string;
    filename: string;
    record_count: number;
    imported_count: number;
    skipped_count: number;
    rejected_count: number;
    status: string;
    imported_at: string;
  }> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM import_history ORDER BY imported_at DESC LIMIT 50').all() as Array<{
      id: string;
      dataset_type: string;
      filename: string;
      record_count: number;
      imported_count: number;
      skipped_count: number;
      rejected_count: number;
      status: string;
      imported_at: string;
    }>;
  }

  public static recordImport(record: {
    id: string;
    dataset_type: string;
    filename: string;
    record_count: number;
    imported_count: number;
    skipped_count: number;
    rejected_count: number;
    status: string;
    details?: Record<string, unknown>;
  }): void {
    const db = this.getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO import_history (
        id, dataset_type, filename, record_count, imported_count,
        skipped_count, rejected_count, status, details, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.dataset_type,
      record.filename,
      record.record_count,
      record.imported_count,
      record.skipped_count,
      record.rejected_count,
      record.status,
      JSON.stringify(record.details || {}),
      now
    );
  }

  public static getDatabaseStats(): {
    path: string;
    sizeBytes: number;
    counts: {
      products: number;
      returns: number;
      sales: number;
      inventory: number;
      vendor_terms: number;
      refurb_rules: number;
      liquidation_rules: number;
      approvals: number;
      investigations: number;
      imports: number;
    };
  } {
    const db = this.getDb();
    const stats: Record<string, number> = {};
    const tables = [
      'products',
      'returns',
      'sales',
      'inventory',
      'vendor_terms',
      'refurb_rules',
      'liquidation_rules',
      'approvals',
      'agent_investigations',
      'import_history',
    ];

    for (const t of tables) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as { c: number };
        stats[t] = Number(row?.c || 0);
      } catch {
        stats[t] = 0;
      }
    }

    let sizeBytes = 0;
    try {
      if (fs.existsSync(DB_PATH)) {
        sizeBytes = fs.statSync(DB_PATH).size;
      }
    } catch {
      // ignore
    }

    return {
      path: DB_PATH,
      sizeBytes,
      counts: {
        products: stats.products || 0,
        returns: stats.returns || 0,
        sales: stats.sales || 0,
        inventory: stats.inventory || 0,
        vendor_terms: stats.vendor_terms || 0,
        refurb_rules: stats.refurb_rules || 0,
        liquidation_rules: stats.liquidation_rules || 0,
        approvals: stats.approvals || 0,
        investigations: stats.agent_investigations || 0,
        imports: stats.import_history || 0,
      },
    };
  }
}
