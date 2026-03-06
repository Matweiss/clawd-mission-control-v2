import React from 'react';
import { Dog, Cat, MapPin, RefreshCw, Lock, WifiOff, Home, Thermometer, Lightbulb } from 'lucide-react';

export function OfficeView() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Office</h1>
        <p className="text-sm text-gray-500 mt-1">Home Assistant, pets, and environment controls</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pet Tracker Card */}
        <div className="bg-[#161616] border-2 border-orange-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-orange-400" />
              <h2 className="text-sm font-semibold text-gray-400 uppercase">Pet Tracker</h2>
            </div>
            <button className="p-2 hover:bg-[#2A2A2A] rounded-lg">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Dog className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Diggy</div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Master Bedroom</span>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Cat className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Theo</div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Living Room</span>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>

        {/* Home Status */}
        <div className="bg-[#161616] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase">Home Status</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Temperature</span>
              </div>
              <span className="text-sm text-white">72°F</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">Lights On</span>
              </div>
              <span className="text-sm text-white">8 lights</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Doors</span>
              </div>
              <span className="text-sm text-green-400">All Locked</span>
            </div>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="col-span-2 bg-[#161616] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase">Quick Controls</h2>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {['Living Room', 'Kitchen', 'Bedroom', 'Office'].map((room) => (
              <button
                key={room}
                className="p-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg text-sm text-gray-300 transition-colors"
              >
                {room}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
