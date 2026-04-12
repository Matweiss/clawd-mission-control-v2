import React from 'react';
import { ArrowRight, CheckCircle2, Mail, Palette, ShieldCheck, Sparkles, Star, Target } from 'lucide-react';

type LadderStep = {
  id: string;
  window: string;
  title: string;
  goal: string;
  trigger: string;
  angle: string;
  cta: string;
  proof: string[];
};

const steps: LadderStep[] = [
  {
    id: '01',
    window: 'Days 0 to 7',
    title: 'Welcome + taste calibration',
    goal: 'Turn a generic subscriber into a known aesthetic fit.',
    trigger: 'Immediately after newsletter signup',
    angle: 'Lead with Sarah’s point of view, then invite subscribers to self-identify what kind of work they gravitate toward.',
    cta: 'Tap to pick your lane: playful minis, color-forward statement pieces, or sentimental originals.',
    proof: ['Founder note from Sarah', 'Best-performing 3 pieces', '1-click preference poll'],
  },
  {
    id: '02',
    window: 'Days 7 to 21',
    title: 'Process + trust building',
    goal: 'Make owning an original feel personal, not intimidating.',
    trigger: 'Subscriber opened or clicked welcome email',
    angle: 'Show the making-of story, collector reactions, and what it feels like to live with the work.',
    cta: 'See the studio process and the stories behind recent originals.',
    proof: ['Studio photos or short reel', 'Collector testimonial', '“How originals ship” FAQ'],
  },
  {
    id: '03',
    window: 'Days 21 to 35',
    title: 'De-risk the first purchase',
    goal: 'Lower anxiety around price, fit, and timing.',
    trigger: 'Subscriber clicked product/story content but has not purchased',
    angle: 'Answer the hidden objections directly: scale, framing, shipping, payment options, and whether Sarah can help choose.',
    cta: 'Reply for a personalized shortlist of originals under your target budget.',
    proof: ['Size-in-room mockups', 'Price-band picks', 'Install + framing guidance'],
  },
  {
    id: '04',
    window: 'Days 35 to 49',
    title: 'Collector concierge conversion',
    goal: 'Create a warm, high-touch path to a first original.',
    trigger: 'Subscriber engaged 2+ times or requested shortlist',
    angle: 'Offer early access to a tightly curated edit with concierge help from Sarah’s studio.',
    cta: 'Book a private first-collector preview or reply “originals” for 3 handpicked recommendations.',
    proof: ['24 to 48 hour preview window', 'First-collector edit', 'Soft urgency with limited availability'],
  },
];

const metrics = [
  'Welcome email click-through to preference poll',
  'Studio-story clicks to original product views',
  'Shortlist request rate',
  'First-original conversion within 45 days',
];

export function FirstTimeCollectorLadderCard() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-pink-500/15 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-pink-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">TMW-183 • First-Time Collector Ladder</h2>
              <p className="text-xs text-gray-500">Nurture newsletter subscribers toward a first original purchase</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-pink-300">Arty</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface-light p-3">
            <div className="flex items-center gap-2 text-xs text-pink-300 font-medium uppercase tracking-wide mb-2">
              <Mail className="w-4 h-4" />
              Entry point
            </div>
            <p className="text-sm text-white">New newsletter subscriber</p>
            <p className="text-xs text-gray-400 mt-1">Segment by aesthetic preference and engagement, not just signup date.</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-light p-3">
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium uppercase tracking-wide mb-2">
              <ShieldCheck className="w-4 h-4" />
              Core risk to solve
            </div>
            <p className="text-sm text-white">"I love it, but I’m not sure I’m ready for an original."</p>
            <p className="text-xs text-gray-400 mt-1">Use trust, fit, and concierge support to remove hesitation.</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-light p-3">
            <div className="flex items-center gap-2 text-xs text-orange-300 font-medium uppercase tracking-wide mb-2">
              <Target className="w-4 h-4" />
              Conversion event
            </div>
            <p className="text-sm text-white">Shortlist request → private preview → first original purchase</p>
            <p className="text-xs text-gray-400 mt-1">Track 45-day conversion, not only single-email revenue.</p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="rounded-lg border border-border bg-surface-light p-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                  {step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    <span className="text-[11px] text-gray-400 shrink-0">{step.window}</span>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">{step.goal}</p>
                  <div className="grid gap-2 md:grid-cols-3 text-xs">
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide mb-1">Trigger</p>
                      <p className="text-gray-300">{step.trigger}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide mb-1">Message angle</p>
                      <p className="text-gray-300">{step.angle}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide mb-1">CTA</p>
                      <p className="text-pink-200">{step.cta}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.proof.map((item) => (
                      <span key={item} className="px-2 py-1 rounded-full bg-black/20 border border-white/5 text-[11px] text-gray-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                {index < steps.length - 1 && <ArrowRight className="hidden md:block w-4 h-4 text-gray-500 shrink-0 mt-3" />}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-light p-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-emerald-300 font-medium uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4" />
              Recommended assets
            </div>
            <ul className="space-y-1 text-xs text-gray-300">
              <li>• Welcome email with preference capture</li>
              <li>• 1 studio-story email with testimonial block</li>
              <li>• FAQ email focused on shipping, scale, and buying confidence</li>
              <li>• Concierge shortlist intake form or reply keyword</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface-light p-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-yellow-300 font-medium uppercase tracking-wide">
              <Star className="w-4 h-4" />
              KPI stack
            </div>
            <ul className="space-y-1 text-xs text-gray-300">
              {metrics.map((metric) => (
                <li key={metric}>• {metric}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-pink-500/20 bg-pink-500/10 p-3">
          <div className="flex items-center gap-2 text-xs text-pink-200 font-medium uppercase tracking-wide mb-2">
            <Sparkles className="w-4 h-4" />
            Arty recommendation
          </div>
          <p className="text-sm text-white">
            Start with a 4-email sequence plus a concierge reply path. Sarah should not jump straight to “buy now” asks.
            First make the subscriber feel seen, then make the first original feel safe and special.
          </p>
        </div>
      </div>
    </div>
  );
}
