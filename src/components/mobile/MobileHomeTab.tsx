import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Dog, Navigation, Lock, Unlock, Eye } from 'lucide-react';
import { hapticFeedback } from '../../lib/ios-utils';

interface HAEntity {
  entity_id: string;
  state: string;
  attributes?: any;
}

interface SarahState {
  isHome: boolean;
  status: string;
  location: string;
}

interface PetLocation {
  name: string;
  location: string;
  battery?: number;
}

export function MobileHomeTab() {
  const [entities, setEntities] = useState<Record<string, HAEntity>>({});
  const [sarah, setSarah] = useState<SarahState | null>(null);
  const [pets, setPets] = useState<PetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHomeData = async () => {
    try {
      const [statesRes, petsRes, sarahRes] = await Promise.all([
        fetch('/api/ha/states'),
        fetch('/api/ha/pets'),
        fetch('/api/ha/sarah'),
      ]);

      if (statesRes.ok) {
        const states = await statesRes.json();
        const map: Record<string, HAEntity> = {};
        states.forEach((s: HAEntity) => {
          map[s.entity_id] = s;
        });
        setEntities(map);
      }

      if (petsRes.ok) {
        const petData = await petsRes.json();
        setPets(Array.isArray(petData) ? petData : petData.pets || []);
      }

      if (sarahRes.ok) {
        const data = await sarahRes.json();
        setSarah({
          isHome: !!data.isHome,
          status: data.status || 'unknown',
          location: data.location || 'Unknown location',
        });
      }
    } catch (err) {
      console.error('Error fetching mobile HA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async (command: string, actionKey: string) => {
    hapticFeedback('medium');
    setRunningAction(actionKey);
    try {
      await fetch('/api/ha/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      setTimeout(fetchHomeData, 700);
    } catch (err) {
      console.error('Error running HA command:', err);
    } finally {
      setRunningAction(null);
    }
  };

  const runEntityAction = async (entity_id: string, action: string, actionKey: string) => {
    hapticFeedback('medium');
    setRunningAction(actionKey);
    try {
      await fetch('/api/ha/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id, action }),
      });
      setTimeout(fetchHomeData, 700);
    } catch (err) {
      console.error('Error running HA entity action:', err);
    } finally {
      setRunningAction(null);
    }
  };

  const frontDoorEntity = entities['lock.front_door_2'] ? 'lock.front_door_2' : 'lock.front_door';
  const frontDoorState = entities[frontDoorEntity]?.state || 'unknown';

  const dogDoorEntity = 'lock.dog_door';
  const dogDoorState = entities[dogDoorEntity]?.state || 'unknown';

  const garageCoverEntity = entities['cover.garage_door'] ? 'cover.garage_door' : '';
  const garageLockEntity = entities['lock.garage_door'] ? 'lock.garage_door' : '';
  const garageState = entities['cover.garage_door']?.state || entities['lock.garage_door']?.state || 'unknown';

  const watchArea = entities['sensor.watch_area']?.state || 'Unknown';

  return (
    <div className="space-y-4">
      <motion.div
        className="bg-surface-light rounded-2xl p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-work" />
            <span className="font-medium">Home Status</span>
          </div>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} PT
          </span>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-surface rounded w-2/3" />
            <div className="h-4 bg-surface rounded w-1/2" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-surface rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {frontDoorState === 'locked' ? <Lock className="w-4 h-4 text-green-400" /> : <Unlock className="w-4 h-4 text-red-400" />}
                  <span className="text-xs text-gray-500">Front Door</span>
                </div>
                <span className={`text-sm font-semibold ${frontDoorState === 'locked' ? 'text-green-400' : 'text-red-400'}`}>{frontDoorState}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runEntityAction(frontDoorEntity, 'lock', 'front_lock')}
                  disabled={runningAction === 'front_lock'}
                  className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 text-xs disabled:opacity-50"
                >Lock</button>
                <button
                  onClick={() => runEntityAction(frontDoorEntity, 'unlock', 'front_unlock')}
                  disabled={runningAction === 'front_unlock'}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs disabled:opacity-50"
                >Unlock</button>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {dogDoorState === 'locked' ? <Lock className="w-4 h-4 text-green-400" /> : <Unlock className="w-4 h-4 text-yellow-400" />}
                  <span className="text-xs text-gray-500">Dog Door</span>
                </div>
                <span className={`text-sm font-semibold ${dogDoorState === 'locked' ? 'text-green-400' : 'text-yellow-400'}`}>{dogDoorState}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runEntityAction(dogDoorEntity, 'lock', 'dog_lock')}
                  disabled={runningAction === 'dog_lock'}
                  className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 text-xs disabled:opacity-50"
                >Lock</button>
                <button
                  onClick={() => runEntityAction(dogDoorEntity, 'unlock', 'dog_unlock')}
                  disabled={runningAction === 'dog_unlock'}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs disabled:opacity-50"
                >Unlock</button>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(garageState === 'closed' || garageState === 'locked') ? <Lock className="w-4 h-4 text-green-400" /> : <Unlock className="w-4 h-4 text-yellow-400" />}
                  <span className="text-xs text-gray-500">Smart Garage Door</span>
                </div>
                <span className={`text-sm font-semibold ${(garageState === 'closed' || garageState === 'locked') ? 'text-green-400' : 'text-yellow-400'}`}>{garageState}</span>
              </div>
              <div className="flex gap-2">
                {garageCoverEntity ? (
                  <>
                    <button
                      onClick={() => runEntityAction(garageCoverEntity, 'open_cover', 'garage_open')}
                      disabled={runningAction === 'garage_open'}
                      className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs disabled:opacity-50"
                    >Open</button>
                    <button
                      onClick={() => runEntityAction(garageCoverEntity, 'close_cover', 'garage_close')}
                      disabled={runningAction === 'garage_close'}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 text-xs disabled:opacity-50"
                    >Close</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => runEntityAction(garageLockEntity, 'unlock', 'garage_open')}
                      disabled={runningAction === 'garage_open'}
                      className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs disabled:opacity-50"
                    >Open</button>
                    <button
                      onClick={() => runEntityAction(garageLockEntity, 'lock', 'garage_close')}
                      disabled={runningAction === 'garage_close'}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 text-xs disabled:opacity-50"
                    >Close</button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-500">Watch Area</span>
              </div>
              <span className="text-sm text-cyan-300">{watchArea}</span>
            </div>
          </div>
        )}
      </motion.div>

      {sarah && (
        <motion.div
          className="bg-surface-light rounded-2xl p-4 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-fuchsia-400" />
              <span className="font-medium">Sarah</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${sarah.isHome ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              {sarah.isHome ? 'Home' : 'Away'}
            </span>
          </div>
          <p className="text-sm text-gray-300">{sarah.location}</p>
        </motion.div>
      )}

      <motion.div
        className="bg-surface-light rounded-2xl p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Dog className="w-5 h-5 text-emerald-400" />
          <span className="font-medium">Theo</span>
        </div>
        <button
          onClick={() => runCommand('feed theo', 'feed_theo')}
          disabled={runningAction === 'feed_theo'}
          className="w-full px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 text-sm font-medium"
        >
          {runningAction === 'feed_theo' ? 'Feeding Theo…' : 'Feed Theo'}
        </button>
      </motion.div>

      {pets.length > 0 && (
        <motion.div
          className="bg-surface-light rounded-2xl p-4 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h3 className="font-medium mb-3">Pet Tracker</h3>
          <div className="space-y-2">
            {pets.map((pet) => (
              <div key={pet.name} className="bg-surface rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{pet.name}</p>
                  <p className="text-xs text-gray-500">{pet.location}</p>
                </div>
                {typeof pet.battery === 'number' && <p className="text-xs text-gray-500">{pet.battery}%</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
