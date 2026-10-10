import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ReturnItem, Product, VendorTerms } from '../types';
import { ReturnDetailModal } from './ReturnDetailModal';
import { ProductImage } from './ProductImage';

interface ReturnIntelligenceProps {
  returnsList: ReturnItem[];
  products: Product[];
  vendorTerms: VendorTerms[];
  onSelectSkuForOptimizer: (sku: string) => void;
}

export const ReturnIntelligence: React.FC<ReturnIntelligenceProps> = ({
  returnsList,
  products,
  vendorTerms,
  onSelectSkuForOptimizer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'individual' | 'grouped'>('individual');
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.sku, p));
    return map;
  }, [products]);

  const termsMap = useMemo(() => {
    const map = new Map<string, VendorTerms>();
    vendorTerms.forEach((v) => map.set(v.sku, v));
    return map;
  }, [vendorTerms]);

  // Repeated fault counts: SKU + batch + reason_code
  const faultFrequencyMap = useMemo(() => {
    const map = new Map<string, number>();
    returnsList.forEach((r) => {
      const key = `${r.sku}__${r.supplier_batch}__${r.reason_code}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [returnsList]);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      const prod = productMap.get(item.sku);
      if (selectedCategory !== 'all' && prod?.category !== selectedCategory) return false;
      if (selectedSupplier !== 'all' && prod?.supplier !== selectedSupplier) return false;
      if (selectedReason !== 'all' && item.reason_code !== selectedReason) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = item.return_id.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchBatch = item.supplier_batch.toLowerCase().includes(query);
        const matchReason =
          item.reason_label.toLowerCase().includes(query) ||
          item.reason_code.toLowerCase().includes(query);
        const matchNote = item.customer_note?.toLowerCase().includes(query);
        const matchProd = prod?.name.toLowerCase().includes(query);
        if (!matchId && !matchSku && !matchBatch && !matchReason && !matchNote && !matchProd) {
          return false;
        }
      }

      return true;
    });
  }, [returnsList, productMap, selectedCategory, selectedSupplier, selectedReason, searchQuery]);

  // Grouped by SKU + Supplier + Batch + Reason Code
  const groupedFaults = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        sku: string;
        product_name: string;
        category: string;
        supplier: string;
        batch: string;
        reason_code: string;
        reason_label: string;
        items: ReturnItem[];
        eligibleRtvCount: number;
        expiredRtvCount: number;
      }
    >();

    filteredReturns.forEach((r) => {
      const prod = productMap.get(r.sku);
      const terms = termsMap.get(r.sku);
      const key = `${r.sku}__${r.supplier_batch}__${r.reason_code}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          sku: r.sku,
          product_name: prod?.name || r.sku,
          category: prod?.category || 'General',
          supplier: prod?.supplier || 'Unknown',
          batch: r.supplier_batch,
          reason_code: r.reason_code,
          reason_label: r.reason_label,
          items: [],
          eligibleRtvCount: 0,
          expiredRtvCount: 0,
        });
      }
      const entry = map.get(key)!;
      entry.items.push(r);
      if (terms?.rtv_allowed && r.days_since_return <= terms.window_days) {
        entry.eligibleRtvCount += 1;
      } else {
        entry.expiredRtvCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [filteredReturns, productMap, termsMap]);

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#0B4632] mb-1 font-semibold">
            <span>OPERATIONAL AUDIT TRAIL</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Return Intake Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Return Intelligence &amp; Defect Clustering
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Search, filter, and inspect returned inventory across suppliers, batches, and defect codes.
          </p>
        </div>

        {/* View Mode Toggle (Clean Segmented Functional Buttons) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start md:self-center">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'individual'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Individual Items ({filteredReturns.length})
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'grouped'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Grouped Fault Clusters ({groupedFaults.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ID, SKU, batch, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632] placeholder:text-slate-400"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632]"
          >
            <option value="all">All Categories</option>
            <option value="Audio">Audio</option>
            <option value="Displays">Displays</option>
            <option value="Wearables">Wearables</option>
            <option value="Drones">Drones</option>
            <option value="Tablets">Tablets</option>
          </select>
        </div>

        {/* Supplier Filter */}
        <div>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632]"
          >
            <option value="all">All Suppliers</option>
            <option value="SoundCraft Audio Ltd.">SoundCraft Audio Ltd.</option>
            <option value="VisionTech Displays">VisionTech Displays</option>
            <option value="ChronoCorp Micro">ChronoCorp Micro</option>
            <option value="ApexRobotics Global">ApexRobotics Global</option>
            <option value="OmniSilicon Co.">OmniSilicon Co.</option>
          </select>
        </div>

        {/* Reason Code Filter */}
        <div>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4632]"
          >
            <option value="all">All Fault Codes</option>
            <option value="DEF-01">DEF-01: Right Hinge Fracture (HB-09)</option>
            <option value="DISP-04">DISP-04: Panel Flicker (VT-4K)</option>
            <option value="BAT-03">BAT-03: Battery Drain (CW-GEN1)</option>
            <option value="GYRO-01">GYRO-01: Gyro Drift (APX-DR)</option>
            <option value="PHY-CRACK">PHY-CRACK: LCD Screen Crack</option>
          </select>
        </div>
      </div>

      {/* View 1: Individual Table */}
      {viewMode === 'individual' ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Return ID</th>
                  <th className="py-3 px-4 font-semibold">Product / SKU</th>
                  <th className="py-3 px-4 font-semibold">Supplier &amp; Batch</th>
                  <th className="py-3 px-4 font-semibold">Reason / Defect</th>
                  <th className="py-3 px-4 font-semibold">Grade</th>
                  <th className="py-3 px-4 font-semibold">Intake Age</th>
                  <th className="py-3 px-4 font-semibold">Available Route</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredReturns.map((item) => {
                  const prod = productMap.get(item.sku);
                  const terms = termsMap.get(item.sku);
                  const isEligibleRtv =
                    terms?.rtv_allowed && item.days_since_return <= terms.window_days;
                  const key = `${item.sku}__${item.supplier_batch}__${item.reason_code}`;
                  const freq = faultFrequencyMap.get(key) || 1;

                  return (
                    <tr
                      key={item.return_id}
                      onClick={() => setSelectedReturn(item)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Return ID */}
                      <td className="py-3 px-4 font-mono text-slate-900 font-semibold">
                        {item.return_id}
                      </td>

                      {/* Product / SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            sku={item.sku}
                            product={prod}
                            name={prod?.name}
                            category={prod?.category}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{prod?.name || item.sku}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {item.sku} · {prod?.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Supplier & Batch */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{prod?.supplier}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Batch: {item.supplier_batch}
                        </div>
                      </td>

                      {/* Reason & Defect */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-900 truncate font-medium">{item.reason_label}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span className="text-[#0B4632] font-semibold">{item.reason_code}</span>
                          {freq >= 5 && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span className="text-amber-700 font-medium">
                                {freq} units in batch
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {item.grade}
                      </td>

                      {/* Return Age */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-mono font-medium">{item.days_since_return}d ago</div>
                        <div className="text-[11px] text-slate-500">{item.date}</div>
                      </td>

                      {/* Available Route */}
                      <td className="py-3 px-4">
                        {isEligibleRtv ? (
                          <div className="flex items-center gap-1.5 text-[#0B4632] font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>Supplier RTV</span>
                          </div>
                        ) : item.grade === 'DEFECTIVE' ? (
                          <span className="text-slate-500">Scrap / Salvage</span>
                        ) : prod?.category === 'Wearables' ? (
                          <span className="text-amber-700 font-medium">Liquidation</span>
                        ) : (
                          <span className="text-teal-700 font-medium">Refurb &amp; Resale</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReturn(item);
                          }}
                          className="text-xs text-slate-500 hover:text-[#0B4632] transition-colors p-1"
                          title="View evidence"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View 2: Grouped Fault Clusters */
        <div className="space-y-4">
          {groupedFaults.map((cluster) => {
            const isHB09Cluster = cluster.batch === 'HB-09';
            return (
              <div
                key={cluster.key}
                className={`rounded-xl border p-5 transition-colors shadow-xs ${
                  isHB09Cluster
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <ProductImage
                      sku={cluster.sku}
                      product={productMap.get(cluster.sku)}
                      name={cluster.product_name}
                      category={productMap.get(cluster.sku)?.category}
                      size="md"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-[#0B4632] font-bold">{cluster.sku}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-700 font-sans font-medium">{cluster.supplier}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-500">Batch: {cluster.batch}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{cluster.reason_label}</span>
                        <span className="font-mono text-xs font-normal text-slate-500">
                          ({cluster.reason_code})
                        </span>
                      </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1 font-mono">
                      <span>
                        Concentration:{' '}
                        <strong className="text-slate-900 font-bold">{cluster.items.length} units</strong>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        RTV Eligible: <strong className="text-[#0B4632] font-bold">{cluster.eligibleRtvCount}</strong>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        Expired SLA: <strong className="text-rose-700 font-bold">{cluster.expiredRtvCount}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                  <div className="flex items-center gap-2 self-start lg:self-center">
                    <button
                      onClick={() => onSelectSkuForOptimizer(cluster.sku)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4632] hover:bg-[#083626] rounded-md shadow-xs transition-colors"
                    >
                      Optimize {cluster.sku} Batch
                    </button>
                  </div>
                </div>

                {/* Sample Customer Notes */}
                <div className="mt-4 pt-3 border-t border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Sample Return Voice Notes ({cluster.items.length} logged):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                    {cluster.items.slice(0, 4).map((r, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] italic"
                      >
                        "{r.customer_note || r.reason_label}"
                        <div className="text-[10px] text-slate-500 font-mono not-italic mt-1">
                          {r.return_id} · Intake {r.days_since_return}d ago
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Detail Modal */}
      {selectedReturn && (
        <ReturnDetailModal
          returnItem={selectedReturn}
          product={productMap.get(selectedReturn.sku)}
          vendorTerms={termsMap.get(selectedReturn.sku)}
          repeatedFaultCount={
            faultFrequencyMap.get(
              `${selectedReturn.sku}__${selectedReturn.supplier_batch}__${selectedReturn.reason_code}`
            ) || 1
          }
          onClose={() => setSelectedReturn(null)}
          onOpenOptimizerForSku={onSelectSkuForOptimizer}
        />
      )}
    </div>
  );
};
