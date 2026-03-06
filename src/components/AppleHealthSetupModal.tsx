import React from 'react';
import { X, Smartphone, Moon, Heart, Activity } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppleHealthSetupModal({ isOpen, onClose }: SetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-purple-500/30 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Apple Health Setup</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-light rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-400">
            Connect your iPhone/Apple Watch to enable proactive wellness monitoring.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">1</span>
              </div>
              <div>
                <p className="text-sm text-white">Create Shortcuts</p>
                <p className="text-xs text-gray-500 mt-1">Open Shortcuts app → Create 3 shortcuts:</p>
                <ul className="text-xs text-gray-500 mt-1 ml-4 list-disc">
                  <li>"Log Sleep to CLAWD"</li>
                  <li>"Log HRV to CLAWD"</li>
                  <li>"Log Steps to CLAWD"</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">2</span>
              </div>
              <div>
                <p className="text-sm text-white">Your Webhook URL</p>
                <div className="mt-1 p-2 bg-black/30 rounded text-xs font-mono text-green-400 break-all">
                  https://clawd-mission-control-v2.vercel.app/api/health/webhook
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">3</span>
              </div>
              <div>
                <p className="text-sm text-white">Automation</p>
                <p className="text-xs text-gray-500 mt-1">Set each shortcut to run automatically:</p>
                <ul className="text-xs text-gray-500 mt-1 ml-4 list-disc">
                  <li>Sleep: When I wake up</li>
                  <li>HRV: Daily at 11 AM</li>
                  <li>Steps: Daily at 6 PM</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-gray-500 mb-2">What gets tracked:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Moon className="w-3 h-3" />
                <span>Sleep duration & quality</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Heart className="w-3 h-3" />
                <span>HRV (stress indicator)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Activity className="w-3 h-3" />
                <span>Activity & movement</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Smartphone className="w-3 h-3" />
                <span>Screen time</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
