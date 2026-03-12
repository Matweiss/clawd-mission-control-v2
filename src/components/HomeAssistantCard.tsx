import React, { useEffect, useMemo, useState } from 'react';
import {
  Smartphone,
  MapPin,
  Moon,
  Footprints,
  Battery,
  PlugZap,
  PawPrint,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Home,
  Watch,
  Lock,
  ShieldAlert,
} from 'lucide-react';

type Status = 'live' | 'stale' | 'disconnected';

interface LockState {
  name: string;
  state: string;
  entityId: string;
}

interface PresenceState {
  iphoneBattery: number;
  iphoneCharging: boolean;
  zone: string;
  geocodedLocation?: string;
  away?: boolean;
  focusMode: string;
  steps: number;
  watchArea: string;
  diggyLocation: string;
  theoLocation: string;
  allDoorsLocked: boolean;
  unlockedLocks: LockState[];
  locks: LockState[];
  lastUpdated: string;
}

const fallbackState: PresenceState = {
  iphoneBattery: 82,
  iphoneCharging: false,
  zone: 'Sherman Oaks',
  geocodedLocation: 'Sherman Oaks',
  away: false,
  focusMode: 'Off',
  steps: 4514,
  watchArea: 'Living Room',
  diggyLocation: 'Living Room',
  theoLocation: 'Living Room',
  allDoorsLocked: true,
  unlockedLocks: [],
  locks: [
    { name: 'Front Door', state: 'Locked', entityId: 'lock.front_door' },
    { name: 'Back Door', state: 'Locked', entityId: 'lock.back_door' },
    { name: 'Dog Door', state: 'Locked', entityId: 'lock.d017695baf16' },
  ],
  lastUpdated: new Date().toISOString(),
};

export function HomeAssistantCard() {
  const [state, setState] = useState<PresenceState>(fallbackState);
  const [status, setStatus] = useState<Status>('stale');
  const [source, setSource] = useState('Home Assistant');
  const [loading, setLoading] = useState(false);

  const sameRoom = useMemo(() => {
    return state.diggyLocation.trim().toLowerCase() === state.theoLocation.trim().toLowerCase();
  }, [state.diggyLocation, state.theoLocation]);

  const load = async () => {
    setLoading(true);
    try {
      const [presenceResponse, petsResponse] = await Promise.all([
        fetch('/api/ha/presence'),
        fetch('/api/ha/pets'),
      ]);

      const pets = petsResponse.ok ? await petsResponse.json() : [];
      const diggy = pets.find((p: any) => (p.name || '').toLowerCase().includes('diggy'));
      const theo = pets.find((p: any) => (p.name || '').toLowerCase().includes('theo'));

      if (presenceResponse.ok) {
        const presence = await presenceResponse.json();
        setState((current) => ({
          ...current,
          iphoneBattery: presence.iphoneBattery ?? current.iphoneBattery,
          iphoneCharging: presence.iphoneCharging ?? current.iphoneCharging,
          zone: presence.zone || current.zone,
          geocodedLocation: presence.geocodedLocation || current.geocodedLocation,
          away: presence.away ?? current.away,
          focusMode: presence.focusMode || current.focusMode,
          steps: presence.steps ?? current.steps,
          watchArea: presence.watchArea || current.watchArea,
          diggyLocation: diggy?.location || current.diggyLocation,
          theoLocation: theo?.location || current.theoLocation,
          allDoorsLocked: presence.allDoorsLocked ?? current.allDoorsLocked,
          unlockedLocks: presence.unlockedLocks || current.unlockedLocks,
          locks: presence.locks || current.locks,
          lastUpdated: presence.lastUpdated || new Date().toISOString(),
        }));
        setStatus(presence.status || 'live');
        setSource(presence.source || 'Home Assistant');
      } else {
        setState((current) => ({
          ...current,
          diggyLocation: diggy?.location || current.diggyLocation,
          theoLocation: theo?.location || current.theoLocation,
          lastUpdated: new Date().toISOString(),
        }));
        setStatus('stale');
        setSource('Home Assistant pets + fallback device data');
      }
    } catch {
      setStatus('stale');
      setSource('Fallback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusColor = status === 'live' ? 'text-green-400' : status === 'stale' ? 'text-yellow-400' : 'text-red-400';
  const statusIcon = status === 'live' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />;

  return (
    <div className="bg-surface border border-cyan-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center">
            <Home className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Home Assistant</h2>
            <p className="text-xs text-gray-500">Presence, pets, and security</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
            {statusIcon}
            <span className="capitalize">{status}</span>
          </div>
          <button
            onClick={load}
            className="p-2 rounded-lg bg-surface-light hover:bg-border transition-colors"
            aria-label="Refresh Home Assistant"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <InfoTile icon={<Smartphone className="w-4 h-4 text-cyan-400" />} label="iPhone Battery" value={`${state.iphoneBattery}%`} sub={state.iphoneCharging ? 'Charging' : 'On battery'} />
        <InfoTile icon={state.iphoneCharging ? <PlugZap className="w-4 h-4 text-green-400" /> : <Battery className="w-4 h-4 text-gray-300" />} label="Phone Power" value={state.iphoneCharging ? 'Charging' : 'Unplugged'} sub="Power state" />
        <InfoTile icon={<MapPin className="w-4 h-4 text-emerald-400" />} label="Zone" value={state.zone} sub={state.geocodedLocation || 'Current location / zone'} />
        <InfoTile icon={<Moon className="w-4 h-4 text-violet-400" />} label="Focus" value={state.focusMode} sub="Current mode" />
        <InfoTile icon={<Footprints className="w-4 h-4 text-orange-400" />} label="Steps" value={state.steps.toLocaleString()} sub="Today" />
        <InfoTile icon={<Watch className="w-4 h-4 text-indigo-400" />} label="Watch Area" value={state.watchArea} sub="Current watch location" />
      </div>

      <div className={`border rounded-xl p-3 mb-3 ${state.away ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-surface-light/60'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {state.away ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Lock className="w-4 h-4 text-green-400" />}
            <span className="text-sm font-medium text-white">Away Check</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${state.away ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-400'}`}>
            {state.away ? 'Away' : 'Home'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Door security</span>
          <span className={`font-semibold ${state.allDoorsLocked ? 'text-green-400' : 'text-red-300'}`}>
            {state.allDoorsLocked ? 'All locked' : `${state.unlockedLocks.length} unlocked`}
          </span>
        </div>

        <div className="space-y-2">
          {state.locks.map((lock) => {
            const locked = lock.state.toLowerCase() === 'locked';
            return (
              <div key={lock.entityId} className="flex items-center justify-between rounded-lg bg-[#161616] px-3 py-2 border border-border/60 text-xs">
                <span className="text-gray-300">{lock.name}</span>
                <span className={locked ? 'text-green-400' : 'text-red-300'}>{lock.state}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border border-border rounded-xl p-3 bg-surface-light/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-orange-300" />
            <span className="text-sm font-medium text-white">Pet presence</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${sameRoom ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
            {sameRoom ? 'Same room' : 'Different rooms'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PetRow name="Diggy" location={state.diggyLocation} />
          <PetRow name="Theo" location={state.theoLocation} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Source: {source}</span>
        <span>Updated {new Date(state.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
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

function PetRow({ name, location }: { name: string; location: string }) {
  return (
    <div className="rounded-lg bg-[#161616] px-3 py-2 border border-border/60">
      <div className="text-sm font-medium text-white">{name}</div>
      <div className="text-xs text-gray-400 mt-1">{location}</div>
    </div>
  );
}
