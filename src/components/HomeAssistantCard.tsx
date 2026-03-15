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
  Unlock,
  ShieldAlert,
  Wifi,
  Headphones,
  Car,
} from 'lucide-react';

type Status = 'live' | 'stale' | 'disconnected';

interface LockState {
  name: string;
  state: string;
  entityId: string;
  statusCategory?: string;
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
  audioOutput: string;
  wifi: string;
  likelyDriving: boolean;
  sarah?: {
    status: string;
    isHome: boolean;
    location: string;
  };
  diggyLocation: string;
  theoLocation: string;
  allDoorsLocked: boolean;
  unlockedLocks: LockState[];
  unknownOrUnavailableLocks?: LockState[];
  locks: LockState[];
  garageDoor?: {
    name: string;
    state: string;
    entityId: string;
  };
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
  audioOutput: 'iPhone',
  wifi: 'Unknown',
  likelyDriving: false,
  diggyLocation: 'Living Room',
  theoLocation: 'Living Room',
  allDoorsLocked: true,
  unlockedLocks: [],
  unknownOrUnavailableLocks: [],
  locks: [
    { name: 'Den Door', state: 'Unknown (HA not connected)', entityId: 'lock.den_door', statusCategory: 'unknown_or_unavailable' },
    { name: 'Front Door', state: 'Unknown (HA not connected)', entityId: 'lock.front_door_2', statusCategory: 'unknown_or_unavailable' },
    { name: 'Living Room Door', state: 'Unknown (HA not connected)', entityId: 'lock.living_room_3', statusCategory: 'unknown_or_unavailable' },
    { name: 'Hallway Lock', state: 'Unknown (HA not connected)', entityId: 'lock.hallway_lock', statusCategory: 'unknown_or_unavailable' },
    { name: 'Dog Door', state: 'Unknown (HA not connected)', entityId: 'lock.d017695baf16', statusCategory: 'unknown_or_unavailable' },
  ],
  garageDoor: {
    name: 'Smart Garage Door',
    state: 'Unknown (HA not connected)',
    entityId: 'cover.smart_garage_door_2111034444328436105448e1e97b5dfe_garage',
  },
  lastUpdated: new Date().toISOString(),
};

export function HomeAssistantCard() {
  const [state, setState] = useState<PresenceState>(fallbackState);
  const [status, setStatus] = useState<Status>('stale');
  const [source, setSource] = useState('Home Assistant');
  const [loading, setLoading] = useState(false);
  const [haConfigured, setHaConfigured] = useState(true);
  const [controllingLock, setControllingLock] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const sameRoom = useMemo(() => {
    return state.diggyLocation.trim().toLowerCase() === state.theoLocation.trim().toLowerCase();
  }, [state.diggyLocation, state.theoLocation]);

  const runCommand = async (command: string, actionKey: string) => {
    setRunningAction(actionKey);
    try {
      const response = await fetch('/api/ha/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Command failed: ${error.error || 'Unknown error'}`);
      } else {
        setTimeout(() => load(), 800);
      }
    } catch (err) {
      alert(`Command failed: ${err}`);
    } finally {
      setRunningAction(null);
    }
  };

  const controlLock = async (entityId: string, action: 'lock' | 'unlock') => {
    setControllingLock(entityId);
    try {
      const response = await fetch('/api/ha/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, action }),
      });

      if (response.ok) {
        // Refresh data after a short delay to let HA update
        setTimeout(() => load(), 1000);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} door: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Failed to ${action} door: ${err}`);
    } finally {
      setControllingLock(null);
    }
  };

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
        setHaConfigured(true);
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
          audioOutput: presence.audioOutput || current.audioOutput,
          wifi: presence.wifi || current.wifi,
          likelyDriving: presence.likelyDriving ?? current.likelyDriving,
          sarah: presence.sarah || current.sarah,
          diggyLocation: diggy?.location || current.diggyLocation,
          theoLocation: theo?.location || current.theoLocation,
          allDoorsLocked: presence.allDoorsLocked ?? current.allDoorsLocked,
          unlockedLocks: presence.unlockedLocks || current.unlockedLocks,
          unknownOrUnavailableLocks: presence.unknownOrUnavailableLocks || current.unknownOrUnavailableLocks,
          locks: presence.locks || current.locks,
          garageDoor: presence.garageDoor || current.garageDoor,
          lastUpdated: presence.lastUpdated || new Date().toISOString(),
        }));
        setStatus(presence.status || 'live');
        setSource(presence.source || 'Home Assistant');
      } else {
        const errorBody = await presenceResponse.json().catch(() => null);
        const haMissing = errorBody?.error === 'Missing HA_URL or HA_TOKEN';
        setHaConfigured(!haMissing);
        setState((current) => ({
          ...current,
          diggyLocation: diggy?.location || current.diggyLocation,
          theoLocation: theo?.location || current.theoLocation,
          lastUpdated: new Date().toISOString(),
        }));
        setStatus(haMissing ? 'disconnected' : 'stale');
        setSource(haMissing ? 'Home Assistant unavailable (missing HA_URL/HA_TOKEN)' : 'Home Assistant pets + fallback device data');
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
        <InfoTile icon={<Headphones className="w-4 h-4 text-pink-400" />} label="Audio Output" value={state.audioOutput} sub={state.likelyDriving ? '🚗 Likely driving' : 'Audio destination'} />
        <InfoTile icon={<Wifi className="w-4 h-4 text-blue-400" />} label="WiFi" value={state.wifi === 'Unknown' || state.wifi === 'Not Connected' ? 'Not connected' : state.wifi} sub={state.likelyDriving ? '🚗 Likely driving' : 'Network connection'} />
      </div>

      {state.likelyDriving && (
        <div className="mb-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 flex items-center gap-2">
          <Car className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-orange-200">Likely driving: Not on WiFi + connected to Bluetooth audio</span>
        </div>
      )}

      {state.sarah && (
        <div className="mb-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-fuchsia-200 font-medium">Sarah</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${state.sarah.isHome ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              {state.sarah.isHome ? 'Home' : 'Away'}
            </span>
          </div>
          <div className="text-xs text-fuchsia-100">{state.sarah.location}</div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => runCommand('feed theo', 'feed_theo')}
          disabled={runningAction === 'feed_theo'}
          className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 disabled:opacity-50"
        >
          {runningAction === 'feed_theo' ? 'Feeding…' : 'Feed Theo'}
        </button>
        <button
          onClick={() => runCommand('lock it down', 'lock_it_down')}
          disabled={runningAction === 'lock_it_down'}
          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30 disabled:opacity-50"
        >
          {runningAction === 'lock_it_down' ? 'Locking…' : 'Lock it down'}
        </button>
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
          <span className={`font-semibold ${!haConfigured ? 'text-yellow-300' : state.allDoorsLocked ? 'text-green-400' : 'text-red-300'}`}>
            {!haConfigured ? 'HA unavailable' : state.allDoorsLocked ? 'All locked' : `${state.unlockedLocks.length} unlocked`}
          </span>
        </div>

        {!haConfigured && (
          <div className="mb-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Home Assistant is not configured in this runtime. Lock and garage states are unknown.
          </div>
        )}

        <div className="space-y-2">
          {state.locks.map((lock) => {
            const locked = lock.state.toLowerCase() === 'locked';
            const isControlling = controllingLock === lock.entityId;
            return (
              <div key={lock.entityId} className="flex items-center justify-between rounded-lg bg-[#161616] px-3 py-2 border border-border/60 text-xs">
                <span className="text-gray-300">{lock.name}</span>
                <div className="flex items-center gap-2">
                  <span className={!haConfigured ? 'text-yellow-300' : locked ? 'text-green-400' : 'text-red-300'}>
                    {lock.state}
                  </span>
                  {haConfigured && (
                    <button
                      onClick={() => controlLock(lock.entityId, locked ? 'unlock' : 'lock')}
                      disabled={isControlling}
                      className={`p-1.5 rounded transition-colors ${
                        locked 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      } ${isControlling ? 'opacity-50' : ''}`}
                      title={locked ? 'Unlock' : 'Lock'}
                    >
                      {isControlling ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : locked ? (
                        <Unlock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {state.garageDoor && (
            <div className="flex items-center justify-between rounded-lg bg-[#161616] px-3 py-2 border border-border/60 text-xs">
              <span className="text-gray-300">{state.garageDoor.name}</span>
              <span className={!haConfigured ? 'text-yellow-300' : 'text-gray-300'}>{state.garageDoor.state}</span>
            </div>
          )}
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
