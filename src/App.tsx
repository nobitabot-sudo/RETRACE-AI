import React, { useState, useMemo } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ExecutiveCommandCentre } from './components/ExecutiveCommandCentre';
import { ReturnIntelligence } from './components/ReturnIntelligence';
import { RecoveryOptimizer } from './components/RecoveryOptimizer';
import { ReturnDetective } from './components/ReturnDetective';
import { SupplierQuality } from './components/SupplierQuality';
import { DeadlineHunter } from './components/DeadlineHunter';
import { ApprovalCentre } from './components/ApprovalCentre';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AgentDrawer } from './components/AgentDrawer';
import { TestRunnerModal } from './components/TestRunnerModal';
import { JudgingTourBar } from './components/JudgingTourBar';
import { CalculationEngine } from './services/calculationEngine';
import { DeadlineHunterEngine } from './services/deadlineHunterEngine';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_VENDOR_TERMS,
  SAMPLE_REFURB_RULES,
  SAMPLE_LIQUIDATION_RULES,
  SAMPLE_INVENTORY,
  SAMPLE_RETURNS,
  SAMPLE_SALES,
  INITIAL_APPROVALS,
} from './data/sampleData';
import { ApprovalAction, Product, ReturnItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('executive');
  const [selectedSku, setSelectedSku] = useState<string>('WH-NEO-01');

  // Master collections
  const [products] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [returnsList] = useState<ReturnItem[]>(SAMPLE_RETURNS);
  const [vendorTerms] = useState(SAMPLE_VENDOR_TERMS);
  const [refurbRules] = useState(SAMPLE_REFURB_RULES);
  const [liqRules] = useState(SAMPLE_LIQUIDATION_RULES);
  const [inventory] = useState(SAMPLE_INVENTORY);
  const [approvals, setApprovals] = useState<ApprovalAction[]>(INITIAL_APPROVALS);

  // Modals & Drawer State
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState<string | undefined>(undefined);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Deterministically computed alerts
  const qualityAlerts = useMemo(() => {
    return CalculationEngine.detectQualityRisks(returnsList, products, SAMPLE_SALES);
  }, [returnsList, products]);

  const deadlineAlerts = useMemo(() => {
    return CalculationEngine.findExpiringVendorWindows(returnsList, products, vendorTerms);
  }, [returnsList, products, vendorTerms]);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;
  const criticalDeadlinesCount = deadlineAlerts.filter((d) => d.urgency === 'critical').length;

  // Synchronize approvals with backend API on mount
  React.useEffect(() => {
    fetch('/api/approvals')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.approvals && data.approvals.length > 0) {
          setApprovals(data.approvals);
        }
      })
      .catch(() => {});
  }, []);

  // Handlers
  const handleStageApproval = (newAction: ApprovalAction) => {
    setApprovals((prev) => [newAction, ...prev.filter((a) => a.id !== newAction.id)]);
    showToast(`Staged recovery plan for ${newAction.sku} in Approval Centre.`);
  };

  const handleApproveAction = (actionId: string, reviewerNotes?: string) => {
    fetch(`/api/approvals/${encodeURIComponent(actionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', reviewerNotes }),
    }).catch(() => {});

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: 'approved',
              reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
              reviewer_name: 'Devin K. (Returns Ops Lead)',
              reviewer_notes: reviewerNotes || 'Approved via Manager Executive Console.',
            }
          : a
      )
    );
    showToast(`Action ${actionId} approved in simulation ledger.`);
  };

  const handleRejectAction = (actionId: string, reviewerNotes?: string) => {
    fetch(`/api/approvals/${encodeURIComponent(actionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', reviewerNotes }),
    }).catch(() => {});

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: 'rejected',
              reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
              reviewer_name: 'Devin K. (Returns Ops Lead)',
              reviewer_notes: reviewerNotes || 'Manager rejected proposal.',
            }
          : a
      )
    );
    showToast(`Action ${actionId} rejected.`);
  };

  const handleStageRtvForApproval = (sku: string) => {
    const prod = products.find((p) => p.sku === sku);
    const alert = deadlineAlerts.find((d) => d.sku === sku);
    if (!prod || !alert) return;

    const action = DeadlineHunterEngine.prepareRtvProposal({
      alert,
      product: prod,
      managerNotes: 'Staged from Deadline Hunter to lock in supplier credit before SLA window closes.',
    });

    handleStageApproval(action);
    showToast(
      `Simulated RTV proposal for ${alert.product_name} staged in Manager Approval Ledger.`
    );
    setActiveTab('approvals');
  };

  const handleOpenAgentWithPrompt = (prompt: string) => {
    setAgentPrompt(prompt);
    setIsAgentOpen(true);
  };

  const handleSelectSkuForOptimizer = (sku: string) => {
    setSelectedSku(sku);
    setActiveTab('optimizer');
  };

  const [isResettingDemo, setIsResettingDemo] = useState(false);

  const handleResetDemoData = async () => {
    setIsResettingDemo(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        const appRes = await fetch('/api/approvals');
        if (appRes.ok) {
          const appData = await appRes.json();
          if (appData.approvals) {
            setApprovals(appData.approvals);
          }
        }
      } else {
        setApprovals(INITIAL_APPROVALS);
      }
    } catch {
      setApprovals(INITIAL_APPROVALS);
    } finally {
      setSelectedSku('WH-NEO-01');
      setActiveTab('executive');
      setIsResettingDemo(false);
      showToast('Demo dataset reset to benchmark state (HB-09, 40 Units, 24 Eligible).');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-200">System:</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAgent={() => {
          setAgentPrompt(undefined);
          setIsAgentOpen(true);
        }}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
        pendingApprovalsCount={pendingApprovalsCount}
        criticalDeadlinesCount={criticalDeadlinesCount}
      />

      {/* Interactive 3-Minute Presentation Judging Tour Bar & Dataset Reset */}
      <JudgingTourBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAgentWithPrompt={handleOpenAgentWithPrompt}
        onResetDemoData={handleResetDemoData}
        isResetting={isResettingDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'executive' && (
          <ExecutiveCommandCentre
            products={products}
            returnsList={returnsList}
            vendorTerms={vendorTerms}
            refurbRules={refurbRules}
            liqRules={liqRules}
            inventory={inventory}
            approvals={approvals}
            qualityAlerts={qualityAlerts}
            deadlineAlerts={deadlineAlerts}
            setActiveTab={setActiveTab}
            onSelectSkuForOptimizer={handleSelectSkuForOptimizer}
            onOpenAgentWithPrompt={handleOpenAgentWithPrompt}
          />
        )}

        {activeTab === 'intelligence' && (
          <ReturnIntelligence
            returnsList={returnsList}
            products={products}
            vendorTerms={vendorTerms}
            onSelectSkuForOptimizer={handleSelectSkuForOptimizer}
          />
        )}

        {activeTab === 'optimizer' && (
          <RecoveryOptimizer
            products={products}
            returnsList={returnsList}
            vendorTerms={vendorTerms}
            refurbRules={refurbRules}
            liqRules={liqRules}
            inventory={inventory}
            selectedSku={selectedSku}
            setSelectedSku={setSelectedSku}
            onStageApproval={handleStageApproval}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'simulator' && (
          <WhatIfSimulator
            products={products}
            returnsList={returnsList}
            vendorTerms={vendorTerms}
            refurbRules={refurbRules}
            liqRules={liqRules}
            inventory={inventory}
            selectedSku={selectedSku}
            setSelectedSku={setSelectedSku}
            onStageApproval={handleStageApproval}
            onNavigateToApprovals={() => setActiveTab('approvals')}
          />
        )}

        {activeTab === 'detective' && (
          <ReturnDetective
            returnsList={returnsList}
            products={products}
            salesList={SAMPLE_SALES}
            onOpenOptimizerForSku={handleSelectSkuForOptimizer}
            onOpenAgentWithPrompt={handleOpenAgentWithPrompt}
          />
        )}

        {activeTab === 'quality' && (
          <SupplierQuality
            alerts={qualityAlerts}
            onOpenOptimizerForSku={handleSelectSkuForOptimizer}
          />
        )}

        {activeTab === 'deadlines' && (
          <DeadlineHunter
            alerts={deadlineAlerts}
            products={products}
            vendorTerms={vendorTerms}
            onSelectSkuForOptimizer={handleSelectSkuForOptimizer}
            onStageRtvForApproval={handleStageRtvForApproval}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalCentre
            approvals={approvals}
            onApproveAction={handleApproveAction}
            onRejectAction={handleRejectAction}
            onEditAction={handleSelectSkuForOptimizer}
          />
        )}
      </main>

      {/* AI Assistant Drawer */}
      <AgentDrawer
        isOpen={isAgentOpen}
        initialPrompt={agentPrompt}
        onClose={() => setIsAgentOpen(false)}
        onSelectSkuForOptimizer={handleSelectSkuForOptimizer}
        onStageApproval={handleStageApproval}
      />

      {/* Test Runner Modal */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      {/* Minimal Footer with Brand Tagline */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700">
            <span className="text-[#0B4632] font-bold">RETRACE AI</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="italic font-sans text-slate-600">"Every return has a second chance. Every defect leaves a trail."</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Gadgetbay Reverse Logistics Platform · Indian Rupee (INR) Ledger · v2.6 Enterprise
          </div>
        </div>
      </footer>
    </div>
  );
}
