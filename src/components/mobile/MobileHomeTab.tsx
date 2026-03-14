import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Lock, Unlock, Lightbulb, Thermometer, 
  MapPin, Battery, Wifi, Tv, Speaker, Fan,
  Dog, Cat, Navigation, Zap, Calendar, Mail, TrendingUp,
  Eye, EyeOff, Settings, X
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
  const [hiddenEntities, setHiddenEntities] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [quickView, setQuickView] = useState<'calendar' | 'emails' | 'pipeline' | null>(null);

  // Load hidden entities from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ha-hidden-entities');
    if (saved) {
      setHiddenEntities(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save hidden entities to localStorage
  useEffect(() => {
    localStorage.setItem('ha-hidden-entities', JSON.stringify(Array.from(hiddenEntities)));
  }, [hiddenEntities]);

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
  const toggleHideEntity = (entityId: string) => {
    hapticFeedback('light');
    setHiddenEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const turnAllLightsOff = async () => {
    hapticFeedback('medium');
    try {
      // Find all lights that are on
      const lightsOn = Object.entries(entities)
        .filter(([id, entity]) => 
          (id.startsWith('light.') || id.startsWith('switch.')) && 
          entity.state === 'on'
        );
      
      // Turn them all off
      for (const [id] of lightsOn) {
        await fetch('/api/ha/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_id: id, action: 'off' })
        });
      }
      
      // Refresh after a moment
      setTimeout(fetchHomeData, 500);
    } catch (err) {
      console.error('Error turning off lights:', err);
    }
  };

  const getFilteredEntities = () => {
    const entries = Object.entries(entities);
    let filtered = entries;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = entries.filter(([id]) => {
        if (selectedCategory === 'locks') return id.startsWith('lock.');
        if (selectedCategory === 'lights') return id.startsWith('light.') || id.startsWith('switch.');
        if (selectedCategory === 'climate') return id.startsWith('climate.') || id.startsWith('thermostat.');
        if (selectedCategory === 'media') return id.startsWith('media_player.');
        return true;
      });
    }

    // Apply hidden filter
    if (!showHidden) {
      filtered = filtered.filter(([id]) => !hiddenEntities.has(id));
    }

    return filtered;
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
            { icon: Calendar, label: 'Calendar', color: 'text-blue-400', bg: 'bg-blue-400/10', action: () => setQuickView('calendar') },
            { icon: Mail, label: 'Emails', color: 'text-pink-400', bg: 'bg-pink-400/10', action: () => setQuickView('emails') },
            { icon: TrendingUp, label: 'Pipeline', color: 'text-cyan-400', bg: 'bg-cyan-400/10', action: () => setQuickView('pipeline') },
            { icon: Zap, label: 'All Off', color: 'text-yellow-400', bg: 'bg-yellow-400/10', action: () => turnAllLightsOff() },
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

        {/* Quick View Panel */}
        <AnimatePresence>
          {quickView && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="bg-surface rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize">{quickView}</h4>
                  <button onClick={() => setQuickView(null)}>
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <QuickViewContent type={quickView} data={null} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category Filter & Edit Mode */}
      <div className="flex items-center justify-between gap-2"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1"
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

        <button
          onClick={() => {
            hapticFeedback('light');
            setEditMode(!editMode);
          }}
          className={`p-2 rounded-xl ${editMode ? 'bg-work text-white' : 'bg-surface-light text-gray-400'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden Entities Toggle */}
      {hiddenEntities.size > 0 && (
        <button
          onClick={() => setShowHidden(!showHidden)}
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showHidden ? 'Hide' : 'Show'} {hiddenEntities.size} hidden entities
        </button>
      )}

      {/* Entity Controls */}
      <div className="space-y-3">
        <AnimatePresence>
          {getFilteredEntities()
            .filter(([id]) => !id.includes('device_tracker') && !id.includes('sensor'))
            .slice(0, 20)
            .map(([id, entity]) => {
              const Icon = getEntityIcon(id, entity.state);
              const isOn = entity.state === 'on' || entity.state === 'locked' || entity.state === 'playing';
              const domain = id.split('.')[0];
              const isHidden = hiddenEntities.has(id);

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`bg-surface-light rounded-2xl p-4 flex items-center justify-between ${
                    isHidden ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOn ? 'bg-work/20' : 'bg-surface'
                    }`}>
                      <Icon className={`w-5 h-5 ${isOn ? 'text-work' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{entity.attributes.friendly_name || id}</p>
                      <p className="text-sm text-gray-500 capitalize">{entity.state}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editMode && (
                      <button
                        onClick={() => toggleHideEntity(id)}
                        className={`p-2 rounded-xl ${
                          isHidden ? 'bg-work/20 text-work' : 'bg-surface text-gray-400'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
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
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Quick View Content Component */}
      <QuickViewPanel 
        quickView={quickView}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}

// Quick View Panel Component
function QuickViewPanel({ quickView, onClose }: { quickView: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quickView) return;
    
    setLoading(true);
    const fetchData = async () => {
      try {
        let url = '';
        if (quickView === 'calendar') url = '/api/calendar/events';
        else if (quickView === 'emails') url = '/api/emails/recent';
        else if (quickView === 'pipeline') url = '/api/pipeline/sheet';
        
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching quick view:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [quickView]);

  if (!quickView) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-4 bottom-24 bg-surface rounded-2xl border border-border shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold capitalize">{quickView}</h3>
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-work border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <QuickViewContent type={quickView} data={data} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Quick View Content
function QuickViewContent({ type, data }: { type: string; data: any }) {
  if (!data) return <p className="text-gray-500 text-center py-4">No data available</p>;

  if (type === 'calendar') {
    const events = data.events || [];
    return (
      <div className="space-y-3">
        {events.slice(0, 5).map((event: any, i: number) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-surface-light rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex flex-col items-center justify-center">
              <span className="text-xs text-blue-400">
                {new Date(event.start).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold text-blue-400">
                {new Date(event.start).getDate()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium">{event.summary}</p>
              <p className="text-sm text-gray-500">
                {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-500 text-center">No upcoming events</p>}
      </div>
    );
  }

  if (type === 'emails') {
    const emails = data.emails || [];
    return (
      <div className="space-y-3">
        {emails.slice(0, 5).map((email: any, i: number) => (
          <div key={i} className="p-3 bg-surface-light rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-pink-400">
                  {email.from?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{email.from}</p>
                <p className="text-xs text-gray-500 truncate">{email.subject}</p>
              </div>
            </div>
          </div>
        ))}
        {emails.length === 0 && <p className="text-gray-500 text-center">No emails</p>}
      </div>
    );
  }

  if (type === 'pipeline') {
    const deals = data.deals || [];
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['Qualification', 'Discovery', 'Evaluation'].map((stage) => (
            <div key={stage} className="text-center p-2 bg-surface-light rounded-xl">
              <p className="text-lg font-bold text-cyan-400">
                {deals.filter((d: any) => d.stage === stage).length}
              </p>
              <p className="text-xs text-gray-500">{stage}</p>
            </div>
          ))}
        </div>
        {deals.slice(0, 5).map((deal: any, i: number) => (
          <div key={i} className="p-3 bg-surface-light rounded-xl">
            <p className="font-medium">{deal.company}</p>
            <p className="text-sm text-gray-500">{deal.stage} • ${deal.mrr}/mo</p>
          </div>
        ))}
        {deals.length === 0 && <p className="text-gray-500 text-center">No deals</p>}
      </div>
    );
  }

  return null;
}
