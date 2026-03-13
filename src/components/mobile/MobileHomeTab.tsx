import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Lock, Unlock, Lightbulb, Thermometer, 
  MapPin, Battery, Wifi, Tv, Speaker, Fan,
  Dog, Cat, Navigation, Zap, Calendar, Mail, TrendingUp
} from 'lucide-react';
import { hapticFeedback } from '../../lib/ios-utils';

interface HAEntity {
  entity_id: string;
  state: string;
  attributes: any;
  last_updated: string;
}

interface PetLocation {
  name: string;
  location: string;
  last_seen: string;
  battery?: number;
}

export function MobileHomeTab() {
  const [entities, setEntities] = useState<Record<string, HAEntity>>({});
  const [pets, setPets] = useState<PetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'locks' | 'lights' | 'climate' | 'media'>('all');

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHomeData = async () => {
    try {
      // Fetch all entities
      const statesRes = await fetch('/api/ha/states');
      if (statesRes.ok) {
        const states = await statesRes.json();
        const entityMap: Record<string, HAEntity> = {};
        states.forEach((s: HAEntity) => {
          entityMap[s.entity_id] = s;
        });
        setEntities(entityMap);
      }

      // Fetch pet locations
      const petsRes = await fetch('/api/ha/pets');
      if (petsRes.ok) {
        const petsData = await petsRes.json();
        setPets(petsData.pets || []);
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntity = async (entityId: string, domain: string) => {
    hapticFeedback('medium');
    try {
      const action = domain === 'lock' ? 'lock' : 'toggle';
      await fetch('/api/ha/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId, action })
      });
      // Refresh after action
      setTimeout(fetchHomeData, 500);
    } catch (err) {
      console.error('Error toggling entity:', err);
    }
  };

  // Filter entities by category
  const getFilteredEntities = () => {
    const entries = Object.entries(entities);
    if (selectedCategory === 'all') return entries;
    
    return entries.filter(([id]) => {
      if (selectedCategory === 'locks') return id.startsWith('lock.');
      if (selectedCategory === 'lights') return id.startsWith('light.') || id.startsWith('switch.');
      if (selectedCategory === 'climate') return id.startsWith('climate.') || id.startsWith('thermostat.');
      if (selectedCategory === 'media') return id.startsWith('media_player.');
      return true;
    });
  };

  const getEntityIcon = (entityId: string, state: string) => {
    if (entityId.includes('lock')) return state === 'locked' ? Lock : Unlock;
    if (entityId.includes('light')) return Lightbulb;
    if (entityId.includes('thermostat') || entityId.includes('climate')) return Thermometer;
    if (entityId.includes('media')) return Tv;
    if (entityId.includes('fan')) return Fan;
    return Home;
  };

  const categories = [
    { id: 'all', label: 'All', icon: Home },
    { id: 'locks', label: 'Locks', icon: Lock },
    { id: 'lights', label: 'Lights', icon: Lightbulb },
    { id: 'climate', label: 'Climate', icon: Thermometer },
    { id: 'media', label: 'Media', icon: Tv },
  ];

  return (
    <div className="space-y-4">
      {/* Status Overview */}
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
            <div className="h-4 bg-surface rounded w-3/4"></div>
            <div className="h-4 bg-surface rounded w-1/2"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3"
          >
            {/* Quick Status Cards */}
            {[
              { 
                label: 'Front Door', 
                state: entities['lock.front_door']?.state === 'locked' ? 'Locked' : 'Unlocked',
                color: entities['lock.front_door']?.state === 'locked' ? 'text-green-400' : 'text-red-400',
                icon: entities['lock.front_door']?.state === 'locked' ? Lock : Unlock
              },
              { 
                label: 'Garage', 
                state: entities['cover.garage_door']?.state === 'closed' ? 'Closed' : 'Open',
                color: entities['cover.garage_door']?.state === 'closed' ? 'text-green-400' : 'text-yellow-400',
                icon: entities['cover.garage_door']?.state === 'closed' ? Lock : Unlock
              },
              { 
                label: 'Temperature', 
                state: `${entities['climate.living_room']?.attributes?.current_temperature || '--'}°F`,
                color: 'text-blue-400',
                icon: Thermometer
              },
              { 
                label: 'WiFi', 
                state: 'Online',
                color: 'text-green-400',
                icon: Wifi
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-surface rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-1"
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                  <p className={`text-lg font-semibold ${item.color}`}>{item.state}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Pet Tracker */}
      {pets.length > 0 && (
        <motion.div 
          className="bg-surface-light rounded-2xl p-4 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4"
          >
            <Dog className="w-5 h-5 text-orange-400" />
            <span className="font-medium">Pet Tracker</span>
          </div>

          <div className="space-y-3"
          >
            {pets.map((pet) => (
              <div key={pet.name} className="flex items-center justify-between bg-surface rounded-xl p-3"
              >
                <div className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"
                  >
                    {pet.name.toLowerCase().includes('dog') ? (
                      <Dog className="w-5 h-5 text-orange-400" />
                    ) : (
                      <Cat className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-sm text-gray-500">{pet.location}</p>
                  </div>
                </div>
                <div className="text-right"
                >
                  {pet.battery && (
                    <div className="flex items-center gap-1 text-xs text-gray-500"
                    >
                      <Battery className="w-3 h-3" />
                      {pet.battery}%
                    </div>
                  )}
                  <p className="text-xs text-gray-600">{pet.last_seen}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        className="bg-surface-light rounded-2xl p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="font-medium mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: 'Calendar', color: 'text-blue-400', bg: 'bg-blue-400/10', action: () => window.open('/api/calendar/events', '_blank') },
            { icon: Mail, label: 'Emails', color: 'text-pink-400', bg: 'bg-pink-400/10', action: () => window.open('/api/emails/recent', '_blank') },
            { icon: TrendingUp, label: 'Pipeline', color: 'text-cyan-400', bg: 'bg-cyan-400/10', action: () => window.open('/api/pipeline/sheet', '_blank') },
            { icon: Zap, label: 'All Off', color: 'text-yellow-400', bg: 'bg-yellow-400/10', action: () => console.log('Turn all lights off') },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${action.bg}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  hapticFeedback('light');
                  action.action();
                }}
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2"
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap ${
                selectedCategory === cat.id 
                  ? 'bg-work text-white' 
                  : 'bg-surface-light text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Entity Controls */}
      <div className="space-y-3"
      >
        <AnimatePresence>
          {getFilteredEntities()
            .filter(([id]) => !id.includes('device_tracker') && !id.includes('sensor'))
            .slice(0, 20)
            .map(([id, entity]) => {
              const Icon = getEntityIcon(id, entity.state);
              const isOn = entity.state === 'on' || entity.state === 'locked' || entity.state === 'playing';
              const domain = id.split('.')[0];
              
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-surface-light rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOn ? 'bg-work/20' : 'bg-surface'
                    }`}
                    >
                      <Icon className={`w-5 h-5 ${isOn ? 'text-work' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{entity.attributes.friendly_name || id}</p>
                      <p className="text-sm text-gray-500 capitalize">{entity.state}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleEntity(id, domain)}
                    className={`px-4 py-2 rounded-xl font-medium ${
                      isOn 
                        ? 'bg-work text-white' 
                        : 'bg-surface text-gray-400'
                    }`}
                  >
                    {isOn ? 'On' : 'Off'}
                  </button>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}
