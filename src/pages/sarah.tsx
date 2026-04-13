import React from 'react';
import Head from 'next/head';
import { ArrowRight, Brush, CalendarClock, CheckSquare, HeartHandshake, Mail, Palette, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import { EmailCard } from '../components/EmailCard';
import { CollectorReengagementRadarCard } from '../components/CollectorReengagementRadarCard';
import { FirstTimeCollectorLadderCard } from '../components/FirstTimeCollectorLadderCard';
import { ShopifyOverviewCard } from '../components/ShopifyOverviewCard';

function SarahHero() {
  const stats = [
    { label: 'Newsletter cadence', value: 'Saturday drops' },
    { label: 'Collector access', value: '24h early access' },
    { label: 'Human touch', value: 'Sarah-approved' },
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-rose-300/20 bg-gradient-to-br from-[#3a1823] via-[#17141f] to-[#120f17] p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.14),transparent_24%)]" />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-rose-100/80">
            <Palette className="w-3.5 h-3.5" />
            Sarah J. Schwartz Fine Art
          </div>
          <h1 className="mt-4 text-3xl lg:text-5xl font-semibold tracking-tight text-white max-w-3xl">
            A collector-first workspace for launches, relationships, and studio follow-through.
          </h1>
          <p className="mt-4 max-w-2xl text-sm lg:text-base leading-7 text-rose-50/75">
            Built to help Sarah protect the warmth of the brand while making launches, sold-piece updates, inbox review, and collector follow-up feel calm and beautifully organized.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-400/15 px-4 py-2 text-sm text-rose-100">
              <HeartHandshake className="w-4 h-4" /> Human-in-the-loop always
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
              <Brush className="w-4 h-4" /> Studio workflow, not generic CRM
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-rose-100/70 mb-4">
            <Sparkles className="w-4 h-4" /> Brand operating posture
          </div>
          <div className="space-y-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-rose-100/55">{stat.label}</div>
                <div className="mt-1 text-sm text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudioPrioritiesCard() {
  const tasks = [
    'Review sold-piece landing page updates before tonight',
    'Approve collector follow-up drafts for warm VIPs',
    'Prep next Saturday newsletter story arc',
    'Clear upload backlog and image QA for new works',
  ];

  return (
    <div className="rounded-2xl border border-stone-700/60 bg-[#17141a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-4 h-4 text-rose-300" />
        <h2 className="text-sm font-semibold text-white">Studio priorities</h2>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task} className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5 text-sm text-stone-200">
            {task}
          </div>
        ))}
      </div>
    </div>
  );
}

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

function LaunchRhythmCard() {
  const beats = [
    { icon: Mail, title: 'Newsletter first', detail: 'Subscribers get first look and emotional context before public social push.' },
    { icon: CalendarClock, title: '24-hour collector window', detail: 'Keep the early-access promise crisp and visible for every release.' },
    { icon: Star, title: 'Personal follow-up', detail: 'High-intent collectors get Sarah-calibrated outreach, not automation spam.' },
  ];

  return (
    <div className="rounded-2xl border border-amber-300/10 bg-gradient-to-br from-[#20161c] to-[#141118] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-amber-200" />
        <h2 className="text-sm font-semibold text-white">Launch rhythm</h2>
      </div>
      <div className="space-y-3">
        {beats.map((beat) => {
          const Icon = beat.icon;
          return (
            <div key={beat.title} className="rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-white">
                <Icon className="w-4 h-4 text-amber-200" />
                {beat.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">{beat.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollectorPulseCard() {
  const items = [
    'VIPs at risk of drifting after previous purchases',
    'New subscribers ready for first-original concierge treatment',
    'Collectors needing sold-piece page or shortlist follow-up',
  ];

  return (
    <div className="rounded-2xl border border-stone-700/60 bg-[#17141a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-amber-300" />
        <h2 className="text-sm font-semibold text-white">Collector pulse</h2>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3 text-sm text-stone-300">
            <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-rose-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InboxFramingCard() {
  return (
    <div className="rounded-2xl border border-stone-700/60 bg-[#17141a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4 text-pink-300" />
        <h2 className="text-sm font-semibold text-white">Collector communications</h2>
      </div>
      <p className="text-sm leading-6 text-stone-300">
        Use inbox review to spot warm replies, shortlist requests, launch questions, and moments where a personal Sarah response will deepen trust.
      </p>
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
          <SarahHero />

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-5 items-start">
            <div className="space-y-5">
              <CollectorPulseCard />
              <ApprovalRulesCard />
              <StudioPrioritiesCard />
              <LaunchRhythmCard />
            </div>

            <div className="space-y-5">
              <ShopifyOverviewCard />
              <CollectorReengagementRadarCard />
              <FirstTimeCollectorLadderCard />
            </div>

            <div className="space-y-5">
              <InboxFramingCard />
              <EmailCard />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
