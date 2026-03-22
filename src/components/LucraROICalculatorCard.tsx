// src/components/LucraROICalculatorCard.tsx
// Lucra ROI Calculator — Dashboard Card for Clawd Mission Control
// Mobile-responsive with touch-friendly targets

import React, { useState, useMemo } from 'react';

const PRESETS = [
  { n: 'Puttshack', v: 1100, a: 45, f: 2500, l: 16 },
  { n: "Dave & Buster's", v: 375, a: 45, f: 2000, l: 220 },
  { n: 'Topgolf', v: 2500, a: 38, f: 2500, l: 89 },
  { n: 'Bowlero', v: 300, a: 40, f: 2000, l: 360 },
  { n: 'Five Iron Golf', v: 120, a: 30, f: 1500, l: 50 },
  { n: 'PopStroke', v: 400, a: 35, f: 2000, l: 12 },
  { n: 'Avg Bowling', v: 175, a: 25, f: 1500, l: 1 },
  { n: 'Custom', v: 200, a: 30, f: 1500, l: 1 },
];

const SCENARIOS = {
  cons: { opt: 5, lift: 10 },
  avg: { opt: 20, lift: 12.5 },
  case: { opt: 40, lift: 15 },
};

function calc(vis: number, arpu: number, fee: number, optPct: number, liftPct: number) {
  const opt = optPct / 100, lift = liftPct / 100;
  const arpuLift = arpu * lift, lucraARPU = arpu + arpuLift;
  const dailyUsers = Math.round(vis * opt), moUsers = dailyUsers * 30;
  const moRev = dailyUsers * arpuLift * 30, netMo = moRev - fee, annROI = netMo * 12;
  const brkUsers = arpuLift > 0 ? Math.ceil(fee / (arpuLift * 30)) : Infinity;
  const brkVis = opt > 0 ? Math.ceil(brkUsers / opt) : Infinity;
  const roiX = fee > 0 ? (moRev / fee).toFixed(1) : '0';
  const paybackDays = moRev > 0 ? Math.round(fee / (moRev / 30) * 10) / 10 : Infinity;
  return { arpu, lucraARPU, arpuLift, dailyUsers, moUsers, moRev, netMo, annROI, brkUsers, brkVis, roiX, paybackDays };
}

const fmt = (n: number) => '$' + Math.round(n).toLocaleString();
const fq = (n: number) => n % 1 === 0 ? '' + n : n.toFixed(2);

export default function LucraROICalculatorCard() {
  const [tab, setTab] = useState<'roi' | 'compare' | 'pricing' | 'discount'>('roi');
  const [sel, setSel] = useState(0);
  const [scn, setScn] = useState('');
  const [vis, setVis] = useState(1100);
  const [arpu, setArpu] = useState(45);
  const [fee, setFee] = useState(2500);
  const [optIn, setOptIn] = useState(10);
  const [lift, setLift] = useState(15);
  const [loc, setLoc] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const r = useMemo(() => calc(vis, arpu, fee, optIn, lift), [vis, arpu, fee, optIn, lift]);
  const ap = arpu % 1 === 0 ? '$' + arpu : '$' + fq(arpu);
  const lp = fq(lift), op = fq(optIn);
  const locN = Math.max(1, Math.round(loc));

  const pickPreset = (i: number) => {
    setSel(i);
    setVis(PRESETS[i].v);
    setArpu(PRESETS[i].a);
    setFee(PRESETS[i].f);
    setLoc(PRESETS[i].l);
  };

  const pickScenario = (k: string) => {
    if (scn === k) { setScn(''); return; }
    setScn(k);
    const s = SCENARIOS[k as keyof typeof SCENARIOS];
    setOptIn(s.opt);
    setLift(s.lift);
  };

  // Compact preview when collapsed - Mobile responsive
  if (!expanded) {
    return (
      <div className="card" style={{ cursor: 'pointer', padding: '12px' }} onClick={() => setExpanded(true)}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>💰</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lucra ROI Calc</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Tap to expand</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#10B981' }}>{r.roiX}x</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>ROI</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#10B981' }}>{fmt(r.moRev)}</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>mo. lift</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#F59E0B' }}>{r.paybackDays}d</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>payback</div>
            </div>
            <a href="https://lucra-roi-calculator.vercel.app" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: '#10B981', textDecoration: 'none', padding: '6px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, whiteSpace: 'nowrap' }}>Full ↗</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#141416', zIndex: 10, paddingBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lucra ROI Calc</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>{r.roiX}x ROI</span>
          <a href="https://lucra-roi-calculator.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#10B981', textDecoration: 'none', padding: '4px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: 6 }}>Full ↗</a>
          <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 20, padding: '4px 8px' }}>×</button>
        </div>
      </div>

      {/* Tabs - Mobile responsive */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {(['roi', 'compare', 'pricing', 'discount'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: '0 0 auto', padding: '10px 12px', fontSize: 12, fontWeight: 500,
            background: tab === t ? '#1E1E22' : 'transparent',
            color: tab === t ? 'white' : '#6B7280',
            border: 'none', cursor: 'pointer', borderRadius: 6,
            borderBottom: tab === t ? '2px solid #10B981' : '2px solid transparent',
            minWidth: '60px',
          }}>{t === 'roi' ? 'ROI' : t === 'compare' ? 'Scenarios' : t === 'pricing' ? 'Pricing' : 'Discount'}</button>
        ))}
      </div>

      {/* Presets */}
      {tab === 'roi' && (
        <>
          {/* Venue presets - Touch friendly */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8, WebkitOverflowScrolling: 'touch' }}>
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => pickPreset(i)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12,
                border: sel === i ? '1px solid #10B981' : '1px solid #2A2A2E',
                background: sel === i ? 'rgba(16,185,129,0.08)' : '#1E1E22',
                color: sel === i ? '#10B981' : '#9CA3AF',
                cursor: 'pointer', whiteSpace: 'nowrap',
                minHeight: '36px',
              }}>{p.n}</button>
            ))}
          </div>
          {/* Scenario buttons - Touch friendly */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {[{ k: 'cons', label: 'Conservative', color: '#F59E0B' }, { k: 'avg', label: 'Average', color: '#3B82F6' }, { k: 'case', label: 'Case Study', color: '#10B981' }].map(s => (
              <button key={s.k} onClick={() => pickScenario(s.k)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: scn === s.k ? `1px solid ${s.color}` : '1px solid #2A2A2E',
                background: scn === s.k ? `${s.color}15` : '#1E1E22',
                color: scn === s.k ? s.color : '#9CA3AF',
                cursor: 'pointer',
                minHeight: '36px',
              }}>{s.label}</button>
            ))}
          </div>

          {/* Quick stats - Responsive grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 8, 
            marginBottom: 12 
          }}>
            <Stat label="Monthly Lift" value={fmt(r.moRev)} color="#10B981" />
            <Stat label="Net Monthly" value={fmt(r.netMo)} color={r.netMo > 0 ? '#10B981' : '#EF4444'} />
            <Stat label="Payback" value={r.paybackDays === Infinity ? '—' : r.paybackDays + 'd'} color="#10B981" />
            <Stat label="Break-Even" value={r.brkVis === Infinity ? '—' : r.brkVis + ' vis'} color="#F59E0B" />
          </div>

          {/* ARPU flow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, fontSize: 12 }}>
            <span style={{ color: '#9CA3AF' }}>{ap}</span>
            <span style={{ color: '#4B5563' }}>→</span>
            <span style={{ color: '#F59E0B' }}>+${r.arpuLift.toFixed(2)}</span>
            <span style={{ color: '#4B5563' }}>=</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>${r.lucraARPU.toFixed(2)}</span>
            <span style={{ color: '#6B7280', fontSize: 10 }}>({r.dailyUsers} users/day)</span>
          </div>

          {/* Quota */}
          {locN >= 1 && (
            <div style={{ background: '#1E1E22', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginBottom: 4 }}>
                <span>Quota: {fmt(fee * locN * 12)} / $1.5M ARR</span>
                <span>{Math.min(100, fee * locN * 12 / 1500000 * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 4, background: '#2A2A2E', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(100, fee * locN * 12 / 1500000 * 100) + '%', background: '#10B981', borderRadius: 2 }} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Pitch line - Mobile readable */}
      <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: 12, fontSize: 12, color: '#A7F3D0', lineHeight: 1.5 }}>
        <strong style={{ color: '#10B981' }}>Pitch:</strong><br/>
        <span style={{ wordBreak: 'break-word' }}>
          "{vis.toLocaleString()} visitors/day, {op}% opt-in = {r.dailyUsers} Lucra users. ARPU {ap} → ${r.lucraARPU.toFixed(2)}. {fmt(r.moRev)}/mo on {fmt(fee)} fee = {r.roiX}x ROI. Payback: {r.paybackDays}d."
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#1E1E22', borderRadius: 10, padding: 12, textAlign: 'center', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
