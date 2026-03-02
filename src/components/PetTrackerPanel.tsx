import React from 'react';
import { Dog, Cat, MapPin } from 'lucide-react';

export function PetTrackerPanel() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Dog className="w-5 h-5 text-orange-400" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase">Pet Tracker</h2>
      </div>
      
      <div className="space-y-3">
        {/* Diggy */}
        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Dog className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">Diggy</div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>Living Room</span>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        
        {/* Theo */}
        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Cat className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">Theo</div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>Kitchen</span>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>
  );
}
