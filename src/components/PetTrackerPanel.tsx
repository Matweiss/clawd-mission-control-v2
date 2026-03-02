import React, { useState, useEffect } from 'react';
import { Dog, Cat, MapPin, Home, Loader2 } from 'lucide-react';

interface PetLocation {
  name: string;
  entityId: string;
  location: string;
  lastUpdated: string;
  icon: 'dog' | 'cat';
  color: string;
}

interface PetTrackerPanelProps {
  onRefresh?: () => void;
}

export function PetTrackerPanel({ onRefresh }: PetTrackerPanelProps) {
  const [pets, setPets] = useState<PetLocation[]>([
    {
      name: 'Diggy',
      entityId: 'sensor.diggy_big_beacon_area',
      location: 'Loading...',
      lastUpdated: '',
      icon: 'dog',
      color: '#F97316' // Orange
    },
    {
      name: 'Theo',
      entityId: 'sensor.theo_white_ibeacon_area',
      location: 'Loading...',
      lastUpdated: '',
      icon: 'cat',
      color: '#8B5CF6' // Purple
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPetLocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call our HA API endpoint
      const response = await fetch('/api/ha/pets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pet locations');
      }
      
      const data = await response.json();
      
      // Update pet locations
      setPets(prevPets => 
        prevPets.map(pet => {
          const updatedPet = data.find((p: any) => p.entityId === pet.entityId);
          if (updatedPet) {
            return {
              ...pet,
              location: updatedPet.location || 'Unknown',
              lastUpdated: updatedPet.lastUpdated || new Date().toISOString()
            };
          }
          return pet;
        })
      );
    } catch (err) {
      setError('Could not fetch pet locations');
      console.error('Pet tracker error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetLocations();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPetLocations, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dog className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Pet Tracker
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
          <button 
            onClick={() => { fetchPetLocations(); onRefresh?.(); }}
            className="p-1.5 hover:bg-surface-light rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {pets.map((pet) => (
          <div 
            key={pet.entityId}
            className="flex items-center gap-3 p-3 bg-surface-light rounded-lg"
          >
            {/* Pet Icon */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${pet.color}20` }}
            >
              {pet.icon === 'dog' ? (
                <Dog className="w-5 h-5" style={{ color: pet.color }} />
              ) : (
                <Cat className="w-5 h-5" style={{ color: pet.color }} />
              )}
            </div>
            
            {/* Pet Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{pet.name}</span>
                {pet.lastUpdated && (
                  <span className="text-xs text-gray-500">
                    {formatTime(pet.lastUpdated)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm text-gray-300">
                  {loading && pet.location === 'Loading...' ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Finding...
                    </span>
                  ) : (
                    pet.location
                  )}
                </span>
              </div>
            </div>
            
            {/* Location Indicator */}
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: pet.location !== 'Unknown' && pet.location !== 'Loading...' 
                  ? '#10B981' 
                  : '#6B7280'
              }}
            />
          </div>
        ))}
        
        {error && (
          <div className="text-sm text-red-400 text-center py-2">
            {error}
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="pt-2 border-t border-border">
          <div className="flex gap-2">
            <button 
              onClick={() => window.open('https://homeassistant.local:8123', '_blank')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface-light hover:bg-border rounded-lg text-xs text-gray-400 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Open HA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
