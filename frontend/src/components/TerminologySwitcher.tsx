'use client';

import { useTerminology } from '@/contexts/TerminologyContext';
import { useState } from 'react';

/**
 * Terminology Switcher Component
 *
 * Allows switching between different terminology presets to see how the protocol
 * adapts for different use cases. Useful for:
 * - Demos and presentations
 * - Understanding protocol flexibility
 * - Testing different configurations
 *
 * Can be added to sidebar, settings page, or footer for easy access.
 */
export function TerminologySwitcher() {
  const { currentPreset, setPreset, presets, config } = useTerminology();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        title="Switch terminology mode"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18m-7 6h7" />
        </svg>
        <span className="hidden md:inline">{config.protocolName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white">Protocol Mode</h3>
              <p className="text-xs text-gray-400 mt-1">
                See how the protocol adapts for different use cases
              </p>
            </div>

            {/* Options */}
            <div className="max-h-96 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setPreset(preset.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                    currentPreset === preset.value ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{preset.label}</span>
                        {currentPreset === preset.value && (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{preset.config.tagline}</p>

                      {/* Example terminology */}
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <div className="flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span><span className="text-gray-400">Credits:</span> {preset.config.badge.singular}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span><span className="text-gray-400">Power:</span> {preset.config.mana.singular}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span><span className="text-gray-400">Funding:</span> {preset.config.lab.singular}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-white/5">
              <p className="text-xs text-gray-400">
                💡 This is a demo feature. In production, terminology is set at deployment time.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact Terminology Switcher (for mobile/small spaces)
 */
export function CompactTerminologySwitcher() {
  const { currentPreset, setPreset, presets } = useTerminology();

  return (
    <select
      value={currentPreset}
      onChange={(e) => setPreset(e.target.value)}
      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {presets.map((preset) => (
        <option key={preset.value} value={preset.value} className="bg-gray-900">
          {preset.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Terminology Info Badge (shows current mode)
 */
export function TerminologyBadge() {
  const { config } = useTerminology();

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      {config.protocolName}
    </div>
  );
}
