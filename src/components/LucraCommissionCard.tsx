import React from 'react';
import { Banknote, Target, TrendingUp, Wallet, CalendarRange } from 'lucide-react';

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function LucraCommissionCard() {
  const startDate = '2026-04-01';
  const annualTarget = 250000;
  const quarterTarget = 62500;
  const qtdCommission = 0;
  const ytdCommission = 3200;
  const pipelinePotential = 18400;
  const closedWon = 32000;
  const payoutQueued = 0;
  const dealsInPipeline = 3;

  return (
    <div className="bg-surface border border-emerald-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Lucra Commission Tracker</h2>
            <p className="text-xs text-gray-500">Starts April 1 • honest pre-start view</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">Pre-start</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Metric icon={<CalendarRange className="w-4 h-4 text-cyan-400" />} label="Start Date" value="Apr 1" sub="Lucra begins" />
        <Metric icon={<Target className="w-4 h-4 text-orange-400" />} label="Deals in Pipeline" value={String(dealsInPipeline)} sub="Active opportunities" />
        <Metric icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} label="Pipeline Potential" value={currency(pipelinePotential)} sub="Projected commission" />
        <Metric icon={<Wallet className="w-4 h-4 text-violet-400" />} label="Closed Won Total" value={currency(closedWon)} sub="Deal value basis" />
      </div>

      <div className="rounded-xl border border-border bg-surface-light/60 p-3 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Quarter target</span>
          <span className="font-semibold text-white">{currency(quarterTarget)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Annual target</span>
          <span className="font-semibold text-white">{currency(annualTarget)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">QTD commission</span>
          <span className="font-semibold text-white">{currency(qtdCommission)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">YTD commission</span>
          <span className="font-semibold text-white">{currency(ytdCommission)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Payout tracker</span>
          <span className="font-semibold text-white">{currency(payoutQueued)}</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <span>Target vs actual becomes active on Apr 1</span>
        <span>Source: manual + pipeline hooks</span>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-surface-light p-3 border border-border/60">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
