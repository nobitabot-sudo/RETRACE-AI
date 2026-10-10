import { PhoenixDatabase } from '../db/database';

export type DatasetType =
  | 'products'
  | 'returns'
  | 'sales'
  | 'inventory'
  | 'refurb_rules'
  | 'vendor_terms'
  | 'liquidation_rules';

export interface ColumnMappingDefinition {
  canonicalField: string;
  aliases: string[];
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date';
}

export const DATASET_SCHEMAS: Record<DatasetType, ColumnMappingDefinition[]> = {
  products: [
    { canonicalField: 'sku', aliases: ['sku', 'product_sku', 'item_code'], required: true, type: 'string' },
    { canonicalField: 'name', aliases: ['name', 'product_name', 'title', 'item_name'], required: true, type: 'string' },
    { canonicalField: 'category', aliases: ['category', 'product_category', 'dept'], required: true, type: 'string' },
    { canonicalField: 'cost', aliases: ['cost', 'original_cost', 'procurement_cost', 'unit_cost'], required: true, type: 'number' },
    { canonicalField: 'selling_price', aliases: ['selling_price', 'price', 'retail_price', 'mrp'], required: true, type: 'number' },
    { canonicalField: 'supplier', aliases: ['supplier', 'vendor', 'manufacturer'], required: true, type: 'string' },
    { canonicalField: 'lifecycle_status', aliases: ['lifecycle_status', 'status', 'lifecycle'], required: false, type: 'string' },
    { canonicalField: 'image_url', aliases: ['image_url', 'image', 'photo', 'thumbnail', 'img', 'image_link'], required: false, type: 'string' },
  ],
  returns: [
    { canonicalField: 'return_id', aliases: ['return_id', 'id', 'rma_id', 'rma'], required: true, type: 'string' },
    { canonicalField: 'date', aliases: ['date', 'return_date', 'received_date'], required: true, type: 'date' },
    { canonicalField: 'sku', aliases: ['sku', 'product_sku', 'item_code'], required: true, type: 'string' },
    { canonicalField: 'supplier_batch', aliases: ['supplier_batch', 'batch', 'batch_id', 'lot_number'], required: true, type: 'string' },
    { canonicalField: 'reason_code', aliases: ['reason_code', 'fault_code', 'defect_code'], required: true, type: 'string' },
    { canonicalField: 'reason_label', aliases: ['reason_label', 'reason', 'defect_description', 'fault_label'], required: true, type: 'string' },
    { canonicalField: 'grade', aliases: ['grade', 'condition', 'return_grade'], required: true, type: 'string' },
    { canonicalField: 'customer_note', aliases: ['customer_note', 'notes', 'remarks', 'comment'], required: false, type: 'string' },
    { canonicalField: 'days_since_return', aliases: ['days_since_return', 'days_elapsed', 'age_days'], required: true, type: 'number' },
    { canonicalField: 'quantity', aliases: ['quantity', 'qty', 'units'], required: false, type: 'number' },
  ],
  sales: [
    { canonicalField: 'sale_id', aliases: ['sale_id', 'id', 'order_id', 'invoice_id'], required: true, type: 'string' },
    { canonicalField: 'date', aliases: ['date', 'sale_date', 'order_date'], required: true, type: 'date' },
    { canonicalField: 'sku', aliases: ['sku', 'product_sku'], required: true, type: 'string' },
    { canonicalField: 'qty_sold', aliases: ['qty_sold', 'quantity', 'units_sold', 'qty'], required: true, type: 'number' },
    { canonicalField: 'selling_price', aliases: ['selling_price', 'price', 'unit_price'], required: true, type: 'number' },
  ],
  inventory: [
    { canonicalField: 'sku', aliases: ['sku', 'product_sku'], required: true, type: 'string' },
    { canonicalField: 'new_stock', aliases: ['new_stock', 'stock', 'on_hand', 'available_stock'], required: true, type: 'number' },
    { canonicalField: 'avg_daily_demand', aliases: ['avg_daily_demand', 'daily_demand', 'demand_velocity', 'run_rate'], required: true, type: 'number' },
    { canonicalField: 'reorder_lead_time_days', aliases: ['reorder_lead_time_days', 'lead_time_days', 'lead_time'], required: false, type: 'number' },
  ],
  refurb_rules: [
    { canonicalField: 'category', aliases: ['category', 'product_category'], required: true, type: 'string' },
    { canonicalField: 'cost', aliases: ['cost', 'refurb_cost', 'repair_cost', 'bench_cost'], required: true, type: 'number' },
    { canonicalField: 'days_required', aliases: ['days_required', 'turnaround_days', 'duration_days'], required: true, type: 'number' },
    { canonicalField: 'resale_pct_of_new', aliases: ['resale_pct_of_new', 'resale_pct', 'secondary_pct'], required: true, type: 'number' },
  ],
  vendor_terms: [
    { canonicalField: 'sku', aliases: ['sku', 'product_sku'], required: true, type: 'string' },
    { canonicalField: 'supplier', aliases: ['supplier', 'vendor'], required: true, type: 'string' },
    { canonicalField: 'rtv_allowed', aliases: ['rtv_allowed', 'supplier_return_allowed', 'rtv_eligible'], required: true, type: 'boolean' },
    { canonicalField: 'credit_pct', aliases: ['credit_pct', 'credit_percentage', 'rtv_credit_pct'], required: true, type: 'number' },
    { canonicalField: 'window_days', aliases: ['window_days', 'rtv_window_days', 'deadline_days'], required: true, type: 'number' },
  ],
  liquidation_rules: [
    { canonicalField: 'category', aliases: ['category', 'product_category'], required: true, type: 'string' },
    { canonicalField: 'grade', aliases: ['grade', 'condition'], required: true, type: 'string' },
    { canonicalField: 'recovery_pct_of_cost', aliases: ['recovery_pct_of_cost', 'recovery_pct', 'liq_pct'], required: true, type: 'number' },
  ],
};

export interface ImportValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}

export interface ImportPreviewResult {
  dataset_type: DatasetType;
  filename: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  existingCount: number;
  newCount: number;
  columnMapping: Record<string, string>; // originalHeader -> canonicalField
  validationErrors: ImportValidationError[];
  previewRows: Array<{
    rowNumber: number;
    isValid: boolean;
    isExisting: boolean;
    data: Record<string, unknown>;
    errors: string[];
  }>;
}

export class DataImportEngine {
  /**
   * Parses raw CSV text into an array of objects.
   * Handles commas, quotes, trim whitespace.
   */
  public static parseCsv(csvText: string): Array<Record<string, string>> {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let inQuotes = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const records: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]).map((v) => v.replace(/^["']|["']$/g, '').trim());
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = values[j] !== undefined ? values[j] : '';
      }
      records.push(record);
    }

    return records;
  }

  /**
   * Automatically identifies column mapping to canonical fields based on aliases.
   */
  public static detectColumnMapping(
    headers: string[],
    datasetType: DatasetType
  ): Record<string, string> {
    const schema = DATASET_SCHEMAS[datasetType] || [];
    const mapping: Record<string, string> = {};

    for (const header of headers) {
      const clean = header.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').trim();
      const match = schema.find(
        (def) =>
          def.canonicalField === clean ||
          def.aliases.includes(clean) ||
          def.aliases.some((a) => clean.includes(a))
      );
      if (match) {
        mapping[header] = match.canonicalField;
      }
    }

    return mapping;
  }

  /**
   * Previews and strictly validates incoming dataset rows before committing.
   */
  public static previewImport(params: {
    dataset_type: DatasetType;
    filename: string;
    rawRows: Array<Record<string, unknown>>;
    customMapping?: Record<string, string>;
  }): ImportPreviewResult {
    const { dataset_type, filename, rawRows, customMapping } = params;
    const schema = DATASET_SCHEMAS[dataset_type];
    if (!schema) {
      throw new Error(`Unsupported dataset type: ${dataset_type}`);
    }

    const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    const mapping = customMapping || this.detectColumnMapping(headers, dataset_type);

    const db = PhoenixDatabase.getDb();
    const existingKeySet = new Set<string>();

    // Load existing primary keys for duplicate / update detection
    try {
      if (dataset_type === 'products') {
        const rows = db.prepare('SELECT sku FROM products').all() as Array<{ sku: string }>;
        rows.forEach((r) => existingKeySet.add(r.sku.toLowerCase()));
      } else if (dataset_type === 'returns') {
        const rows = db.prepare('SELECT return_id FROM returns').all() as Array<{ return_id: string }>;
        rows.forEach((r) => existingKeySet.add(r.return_id.toLowerCase()));
      } else if (dataset_type === 'sales') {
        const rows = db.prepare('SELECT sale_id FROM sales').all() as Array<{ sale_id: string }>;
        rows.forEach((r) => existingKeySet.add(r.sale_id.toLowerCase()));
      } else if (dataset_type === 'inventory') {
        const rows = db.prepare('SELECT sku FROM inventory').all() as Array<{ sku: string }>;
        rows.forEach((r) => existingKeySet.add(r.sku.toLowerCase()));
      } else if (dataset_type === 'refurb_rules') {
        const rows = db.prepare('SELECT category FROM refurb_rules').all() as Array<{ category: string }>;
        rows.forEach((r) => existingKeySet.add(r.category.toLowerCase()));
      } else if (dataset_type === 'vendor_terms') {
        const rows = db.prepare('SELECT sku FROM vendor_terms').all() as Array<{ sku: string }>;
        rows.forEach((r) => existingKeySet.add(r.sku.toLowerCase()));
      } else if (dataset_type === 'liquidation_rules') {
        const rows = db.prepare('SELECT id FROM liquidation_rules').all() as Array<{ id: string }>;
        rows.forEach((r) => existingKeySet.add(r.id.toLowerCase()));
      }
    } catch {
      // If table empty or uninitialized
    }

    const allErrors: ImportValidationError[] = [];
    const previewRows: ImportPreviewResult['previewRows'] = [];
    let validCount = 0;
    let existingCount = 0;
    let newCount = 0;

    for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex++) {
      const raw = rawRows[rowIndex];
      const normalizedData: Record<string, unknown> = {};
      const rowErrors: string[] = [];

      // Map values
      for (const [origCol, canonField] of Object.entries(mapping)) {
        if (raw[origCol] !== undefined) {
          normalizedData[canonField] = raw[origCol];
        }
      }

      // Check required fields & types
      for (const def of schema) {
        const val = normalizedData[def.canonicalField];

        if (def.required) {
          if (val === undefined || val === null || String(val).trim() === '') {
            const err = `Missing required column "${def.canonicalField}"`;
            rowErrors.push(err);
            allErrors.push({ row: rowIndex + 1, field: def.canonicalField, value: val, message: err });
            continue;
          }
        }

        if (val !== undefined && val !== null && String(val).trim() !== '') {
          if (def.type === 'number') {
            const num = Number(String(val).replace(/[^0-9.-]/g, ''));
            if (isNaN(num)) {
              const err = `Field "${def.canonicalField}" must be a number (got "${val}")`;
              rowErrors.push(err);
              allErrors.push({ row: rowIndex + 1, field: def.canonicalField, value: val, message: err });
            } else {
              normalizedData[def.canonicalField] = num;
            }
          } else if (def.type === 'boolean') {
            const str = String(val).toLowerCase().trim();
            normalizedData[def.canonicalField] = str === 'true' || str === '1' || str === 'yes' || str === 'y';
          } else if (def.type === 'string') {
            normalizedData[def.canonicalField] = String(val).trim();
          }
        }
      }

      // Check primary key existence
      let isExisting = false;
      let pkValue = '';
      if (dataset_type === 'products' && normalizedData.sku) {
        pkValue = String(normalizedData.sku).toLowerCase();
      } else if (dataset_type === 'returns' && normalizedData.return_id) {
        pkValue = String(normalizedData.return_id).toLowerCase();
      } else if (dataset_type === 'sales' && normalizedData.sale_id) {
        pkValue = String(normalizedData.sale_id).toLowerCase();
      } else if (dataset_type === 'inventory' && normalizedData.sku) {
        pkValue = String(normalizedData.sku).toLowerCase();
      } else if (dataset_type === 'refurb_rules' && normalizedData.category) {
        pkValue = String(normalizedData.category).toLowerCase();
      } else if (dataset_type === 'vendor_terms' && normalizedData.sku) {
        pkValue = String(normalizedData.sku).toLowerCase();
      } else if (dataset_type === 'liquidation_rules' && normalizedData.category && normalizedData.grade) {
        pkValue = `${normalizedData.category}_${normalizedData.grade}`.toLowerCase();
      }

      if (pkValue && existingKeySet.has(pkValue)) {
        isExisting = true;
      }

      const isValid = rowErrors.length === 0;
      if (isValid) {
        validCount += 1;
        if (isExisting) existingCount += 1;
        else newCount += 1;
      }

      // Store in preview (first 100 rows)
      if (previewRows.length < 100) {
        previewRows.push({
          rowNumber: rowIndex + 1,
          isValid,
          isExisting,
          data: normalizedData,
          errors: rowErrors,
        });
      }
    }

    return {
      dataset_type,
      filename,
      totalRows: rawRows.length,
      validCount,
      invalidCount: rawRows.length - validCount,
      existingCount,
      newCount,
      columnMapping: mapping,
      validationErrors: allErrors.slice(0, 50),
      previewRows,
    };
  }

  /**
   * Commits the previewed dataset to SQLite inside an atomic transaction.
   * Policy: 'upsert' (update existing, insert new) | 'skip_existing' (insert new only)
   */
  public static confirmImport(params: {
    dataset_type: DatasetType;
    filename: string;
    rows: Array<Record<string, unknown>>;
    policy?: 'upsert' | 'skip_existing';
  }): {
    success: boolean;
    dataset_type: DatasetType;
    filename: string;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    rejectedCount: number;
    timestamp: string;
  } {
    const { dataset_type, filename, rows, policy = 'upsert' } = params;
    const db = PhoenixDatabase.getDb();
    const now = new Date().toISOString();

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let rejectedCount = 0;

    // Execute within a strict database transaction
    db.exec('BEGIN TRANSACTION;');

    try {
      if (dataset_type === 'products') {
        const checkStmt = db.prepare('SELECT id FROM products WHERE sku = ?');
        const insertStmt = db.prepare(`
          INSERT INTO products (id, sku, name, category, cost, selling_price, supplier, lifecycle_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const updateStmt = db.prepare(`
          UPDATE products
          SET name = ?, category = ?, cost = ?, selling_price = ?, supplier = ?, lifecycle_status = ?, updated_at = ?
          WHERE sku = ?
        `);

        for (const r of rows) {
          const sku = String(r.sku || '').trim();
          if (!sku) {
            rejectedCount++;
            continue;
          }

          const existing = checkStmt.get(sku);
          if (existing) {
            if (policy === 'skip_existing') {
              skippedCount++;
            } else {
              updateStmt.run(
                String(r.name || 'Unnamed Product'),
                String(r.category || 'Audio'),
                Number(r.cost || 0),
                Number(r.selling_price || 0),
                String(r.supplier || 'General Supplier'),
                String(r.lifecycle_status || 'Active'),
                now,
                sku
              );
              updatedCount++;
            }
          } else {
            insertStmt.run(
              `PROD-${sku}`,
              sku,
              String(r.name || 'Unnamed Product'),
              String(r.category || 'Audio'),
              Number(r.cost || 0),
              Number(r.selling_price || 0),
              String(r.supplier || 'General Supplier'),
              String(r.lifecycle_status || 'Active'),
              now,
              now
            );
            importedCount++;
          }
        }
      } else if (dataset_type === 'returns') {
        const checkStmt = db.prepare('SELECT return_id FROM returns WHERE return_id = ?');
        const insertStmt = db.prepare(`
          INSERT INTO returns (return_id, date, sku, supplier_batch, reason_code, reason_label, grade, customer_note, days_since_return, quantity, investigation_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const updateStmt = db.prepare(`
          UPDATE returns
          SET date = ?, sku = ?, supplier_batch = ?, reason_code = ?, reason_label = ?, grade = ?, customer_note = ?, days_since_return = ?, quantity = ?, updated_at = ?
          WHERE return_id = ?
        `);

        for (const r of rows) {
          const retId = String(r.return_id || '').trim();
          if (!retId) {
            rejectedCount++;
            continue;
          }

          const existing = checkStmt.get(retId);
          if (existing) {
            if (policy === 'skip_existing') {
              skippedCount++;
            } else {
              updateStmt.run(
                String(r.date || now.slice(0, 10)),
                String(r.sku || ''),
                String(r.supplier_batch || 'BATCH-IMPORT'),
                String(r.reason_code || 'DEF-01'),
                String(r.reason_label || 'General Return'),
                String(r.grade || 'B'),
                r.customer_note ? String(r.customer_note) : null,
                Number(r.days_since_return || 0),
                Number(r.quantity || 1),
                now,
                retId
              );
              updatedCount++;
            }
          } else {
            insertStmt.run(
              retId,
              String(r.date || now.slice(0, 10)),
              String(r.sku || ''),
              String(r.supplier_batch || 'BATCH-IMPORT'),
              String(r.reason_code || 'DEF-01'),
              String(r.reason_label || 'General Return'),
              String(r.grade || 'B'),
              r.customer_note ? String(r.customer_note) : null,
              Number(r.days_since_return || 0),
              Number(r.quantity || 1),
              'pending',
              now,
              now
            );
            importedCount++;
          }
        }
      } else if (dataset_type === 'inventory') {
        const insertOrUpdate = db.prepare(`
          INSERT INTO inventory (sku, new_stock, avg_daily_demand, reorder_lead_time_days, last_updated)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(sku) DO UPDATE SET
            new_stock = excluded.new_stock,
            avg_daily_demand = excluded.avg_daily_demand,
            reorder_lead_time_days = excluded.reorder_lead_time_days,
            last_updated = excluded.last_updated
        `);

        for (const r of rows) {
          const sku = String(r.sku || '').trim();
          if (!sku) {
            rejectedCount++;
            continue;
          }
          insertOrUpdate.run(
            sku,
            Number(r.new_stock || 0),
            Number(r.avg_daily_demand || 0),
            Number(r.reorder_lead_time_days || 14),
            now
          );
          importedCount++;
        }
      } else if (dataset_type === 'sales') {
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO sales (sale_id, date, sku, qty_sold, selling_price, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const r of rows) {
          const id = String(r.sale_id || `SALE-${Date.now()}-${importedCount}`);
          insertStmt.run(
            id,
            String(r.date || now.slice(0, 10)),
            String(r.sku || ''),
            Number(r.qty_sold || 1),
            Number(r.selling_price || 0),
            now
          );
          importedCount++;
        }
      } else if (dataset_type === 'vendor_terms') {
        const insertStmt = db.prepare(`
          INSERT INTO vendor_terms (sku, supplier, rtv_allowed, credit_pct, window_days, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(sku) DO UPDATE SET
            supplier = excluded.supplier,
            rtv_allowed = excluded.rtv_allowed,
            credit_pct = excluded.credit_pct,
            window_days = excluded.window_days,
            updated_at = excluded.updated_at
        `);

        for (const r of rows) {
          const sku = String(r.sku || '').trim();
          if (!sku) {
            rejectedCount++;
            continue;
          }
          insertStmt.run(
            sku,
            String(r.supplier || 'Vendor'),
            r.rtv_allowed ? 1 : 0,
            Number(r.credit_pct || 0),
            Number(r.window_days || 30),
            now,
            now
          );
          importedCount++;
        }
      } else if (dataset_type === 'refurb_rules') {
        const insertStmt = db.prepare(`
          INSERT INTO refurb_rules (category, cost, days_required, resale_pct_of_new, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(category) DO UPDATE SET
            cost = excluded.cost,
            days_required = excluded.days_required,
            resale_pct_of_new = excluded.resale_pct_of_new,
            updated_at = excluded.updated_at
        `);

        for (const r of rows) {
          const cat = String(r.category || '').trim();
          if (!cat) {
            rejectedCount++;
            continue;
          }
          insertStmt.run(
            cat,
            Number(r.cost || 0),
            Number(r.days_required || 5),
            Number(r.resale_pct_of_new || 70),
            now,
            now
          );
          importedCount++;
        }
      } else if (dataset_type === 'liquidation_rules') {
        const insertStmt = db.prepare(`
          INSERT INTO liquidation_rules (id, category, grade, recovery_pct_of_cost, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(category, grade) DO UPDATE SET
            recovery_pct_of_cost = excluded.recovery_pct_of_cost,
            updated_at = excluded.updated_at
        `);

        for (const r of rows) {
          const cat = String(r.category || '').trim();
          const gr = String(r.grade || 'B').trim();
          if (!cat) {
            rejectedCount++;
            continue;
          }
          insertStmt.run(
            `${cat}_${gr}`,
            cat,
            gr,
            Number(r.recovery_pct_of_cost || 30),
            now,
            now
          );
          importedCount++;
        }
      }

      // Record in import audit history
      PhoenixDatabase.recordImport({
        id: `IMP-${Date.now().toString().slice(-6)}`,
        dataset_type,
        filename,
        record_count: rows.length,
        imported_count: importedCount,
        skipped_count: skippedCount,
        rejected_count: rejectedCount,
        status: 'SUCCESS',
        details: { updatedCount, policy },
      });

      db.exec('COMMIT;');

      return {
        success: true,
        dataset_type,
        filename,
        importedCount,
        updatedCount,
        skippedCount,
        rejectedCount,
        timestamp: now,
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('[PHOENIX Import Engine] Import transaction rolled back due to error:', err);
      throw err;
    }
  }
}
