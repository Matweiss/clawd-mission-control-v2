import React from 'react';
import Head from 'next/head';
import { ShieldCheck } from 'lucide-react';
import { EmailCard } from '../components/EmailCard';
import { CollectorReengagementRadarCard } from '../components/CollectorReengagementRadarCard';
import { FirstTimeCollectorSignalsCard } from '../components/FirstTimeCollectorSignalsCard';
import { ShopifyOverviewCard } from '../components/ShopifyOverviewCard';
import { CollectorPulseLiveCard, InboxFramingLiveCard, LaunchRhythmLiveCard, SarahHeroLive, StudioPrioritiesLiveCard } from '../components/SarahShopifySignalsPanel';

function ApprovalRulesCard() {
  return (
    <div className="rounded-2xl border border-rose-300/15 bg-[#17141a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-rose-300" />
        <h2 className="text-sm font-semibold text-white">Approval rules</h2>
      </div>
      <ul className="space-y-2 text-sm leading-6 text-stone-300">
        <li>• Sarah remains final approver for anything customer-facing.</li>
        <li>• Drafts, recommendations, and timing cues are welcome. Autonomous outreach is not.</li>
        <li>• Preserve the human touch: notes, DMs, warmth, memory, and taste.</li>
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

      <main className="min-h-screen bg-[#0f0d12] text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <SarahHeroLive />

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-5 items-start">
            <div className="space-y-5">
              <CollectorPulseLiveCard />
              <ApprovalRulesCard />
              <StudioPrioritiesLiveCard />
              <LaunchRhythmLiveCard />
            </div>

            <div className="space-y-5">
              <ShopifyOverviewCard />
              <CollectorReengagementRadarCard />
              <FirstTimeCollectorSignalsCard />
            </div>

            <div className="space-y-5">
              <InboxFramingLiveCard />
              <EmailCard />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
