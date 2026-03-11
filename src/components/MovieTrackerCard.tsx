import React from 'react';
import { Clapperboard, Ticket, CalendarDays, Plus, RotateCcw, ListTodo } from 'lucide-react';

const seenThisMonth = 4;
const seenThisYear = 11;
const monthlyCost = 26.95;
const nextBilling = 'Mar 15';
const costPerMovie = monthlyCost / seenThisMonth;

const watchlist = ['Black Bag', 'Mickey 17', 'The Shrouds'];
const recentSeen = ['Dune: Part Two', 'Crime 101', 'Poor Things'];

export function MovieTrackerCard() {
  return (
    <div className="bg-surface border border-rose-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Regal Unlimited Tracker</h2>
            <p className="text-xs text-gray-500">$26.95/mo • billed on the 15th</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-rose-500/10 text-rose-300">Movie mode</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Metric icon={<Ticket className="w-4 h-4 text-rose-400" />} label="Seen This Month" value={String(seenThisMonth)} sub={`≈ $${costPerMovie.toFixed(2)} / movie`} />
        <Metric icon={<Clapperboard className="w-4 h-4 text-pink-400" />} label="Seen This Year" value={String(seenThisYear)} sub="Running yearly total" />
        <Metric icon={<CalendarDays className="w-4 h-4 text-orange-400" />} label="Next Billing" value={nextBilling} sub="Recurring on the 15th" />
        <Metric icon={<ListTodo className="w-4 h-4 text-cyan-400" />} label="Watchlist" value={String(watchlist.length)} sub="Ready to move into seen" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-light/60 p-3">
          <div className="text-sm font-medium text-white mb-2">Recent Seen</div>
          <div className="space-y-2">
            {recentSeen.map((movie) => (
              <div key={movie} className="text-xs text-gray-300 rounded-lg bg-[#161616] px-2 py-2 border border-border/60">
                {movie}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-light/60 p-3">
          <div className="text-sm font-medium text-white mb-2">Want to See</div>
          <div className="space-y-2">
            {watchlist.map((movie) => (
              <div key={movie} className="text-xs text-gray-300 rounded-lg bg-[#161616] px-2 py-2 border border-border/60">
                {movie}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <button className="flex items-center justify-center gap-1 rounded-lg bg-surface-light hover:bg-border transition-colors px-3 py-2 text-gray-300">
          <Plus className="w-3 h-3" /> Add Seen
        </button>
        <button className="flex items-center justify-center gap-1 rounded-lg bg-surface-light hover:bg-border transition-colors px-3 py-2 text-gray-300">
          <RotateCcw className="w-3 h-3" /> Undo
        </button>
        <button className="flex items-center justify-center gap-1 rounded-lg bg-surface-light hover:bg-border transition-colors px-3 py-2 text-gray-300">
          <ListTodo className="w-3 h-3" /> Watchlist
        </button>
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
