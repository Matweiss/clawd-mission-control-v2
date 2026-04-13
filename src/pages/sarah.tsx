import React from 'react';
import Head from 'next/head';
import { Palette, Mail, Users, CheckSquare, ShieldCheck } from 'lucide-react';
import { EmailCard } from '../components/EmailCard';
import { CollectorReengagementRadarCard } from '../components/CollectorReengagementRadarCard';
import { FirstTimeCollectorLadderCard } from '../components/FirstTimeCollectorLadderCard';

function SarahTaskCard() {
  const tasks = [
    'Review sold-piece landing page updates',
    'Approve collector follow-up drafts',
    'Prep next newsletter drop',
    'Review upload backlog and image QA',
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="w-4 h-4 text-rose-300" />
        <h2 className="text-sm font-semibold text-gray-200">Studio priorities</h2>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task} className="rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-gray-300">
            {task}
          </div>
        ))}
      </div>
    </div>
  );
}

function SarahRulesCard() {
  return (
    <div className="bg-surface border border-rose-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-rose-300" />
        <h2 className="text-sm font-semibold text-gray-200">Approval rules</h2>
      </div>
      <ul className="space-y-2 text-sm text-gray-300">
        <li>• Sarah remains final approver for customer-facing communication.</li>
        <li>• Use the dashboard to surface drafts, priorities, and relationship context.</li>
        <li>• Protect the human touch, handwritten notes, DMs, and collector warmth.</li>
      </ul>
    </div>
  );
}

export default function SarahDashboard() {
  return (
    <>
      <Head>
        <title>Sarah Dashboard</title>
      </Head>

      <main className="min-h-screen bg-bg text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-purple-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-rose-500/20 p-3 text-rose-200">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Sarah Dashboard</h1>
                <p className="mt-2 text-sm text-rose-100/80 max-w-2xl">
                  A dedicated workspace for Sarah’s art business, collector relationships, launches, and approval-safe follow-up.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-amber-300" />
                  <h2 className="text-sm font-semibold text-gray-200">Collector pulse</h2>
                </div>
                <p className="text-sm text-gray-300">
                  Track VIPs, lapsing collectors, launch readiness, and who deserves a personal Sarah touch next.
                </p>
              </div>
              <SarahRulesCard />
              <SarahTaskCard />
            </div>

            <div className="space-y-4">
              <CollectorReengagementRadarCard />
            </div>

            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-pink-400" />
                  <h2 className="text-sm font-semibold text-gray-200">Collector communications</h2>
                </div>
                <p className="text-sm text-gray-300">
                  Review inbox activity, draft responses, and decide what Sarah should personally send.
                </p>
              </div>
              <EmailCard />
              <FirstTimeCollectorLadderCard />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
