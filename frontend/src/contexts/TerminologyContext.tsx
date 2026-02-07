'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TerminologyConfig, getTerminologyConfig, TERMINOLOGY_PRESETS } from '@/config/terminology';

interface TerminologyContextType {
  /** Current terminology configuration */
  config: TerminologyConfig;

  /** Get a term (automatically handles singular/plural) */
  term: (key: keyof Pick<TerminologyConfig, 'badge' | 'mana' | 'lab' | 'scholarship' | 'funder' | 'proposal' | 'vote' | 'governance'>, plural?: boolean) => string;

  /** Get an action verb */
  action: (key: keyof TerminologyConfig['actions']) => string;

  /** Get a UI label */
  ui: (key: keyof TerminologyConfig['ui']) => string;

  /** Change terminology preset */
  setPreset: (preset: string) => void;

  /** Current preset name */
  currentPreset: string;

  /** Available presets */
  presets: typeof TERMINOLOGY_PRESETS;
}

const TerminologyContext = createContext<TerminologyContextType | undefined>(undefined);

const STORAGE_KEY = 'karn-terminology-preset';

export function TerminologyProvider({ children }: { children: ReactNode }) {
  // Get initial preset from localStorage or environment
  const getInitialPreset = (): string => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    }
    return process.env.NEXT_PUBLIC_TERMINOLOGY_PRESET || 'karn';
  };

  const [currentPreset, setCurrentPreset] = useState<string>(getInitialPreset());
  const [config, setConfig] = useState<TerminologyConfig>(() => getTerminologyConfig(getInitialPreset()));

  // Update config when preset changes
  useEffect(() => {
    const newConfig = getTerminologyConfig(currentPreset);
    setConfig(newConfig);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, currentPreset);
    }
  }, [currentPreset]);

  /**
   * Get a terminology term (singular or plural)
   *
   * @example
   * term('badge') // "Badge"
   * term('badge', true) // "Badges"
   * term('mana') // "Mana" (same in singular/plural)
   */
  const term = (
    key: keyof Pick<TerminologyConfig, 'badge' | 'mana' | 'lab' | 'scholarship' | 'funder' | 'proposal' | 'vote' | 'governance'>,
    plural: boolean = false
  ): string => {
    const termObj = config[key];
    return plural ? termObj.plural : termObj.singular;
  };

  /**
   * Get an action verb
   *
   * @example
   * action('propose') // "Propose" or "Submit Motion" depending on config
   */
  const action = (key: keyof TerminologyConfig['actions']): string => {
    return config.actions[key];
  };

  /**
   * Get a UI label
   *
   * @example
   * ui('dashboard') // "Dashboard" or "Worker Dashboard" depending on config
   */
  const ui = (key: keyof TerminologyConfig['ui']): string => {
    return config.ui[key];
  };

  /**
   * Change the terminology preset
   */
  const setPreset = (preset: string) => {
    setCurrentPreset(preset);
  };

  return (
    <TerminologyContext.Provider
      value={{
        config,
        term,
        action,
        ui,
        setPreset,
        currentPreset,
        presets: TERMINOLOGY_PRESETS
      }}
    >
      {children}
    </TerminologyContext.Provider>
  );
}

/**
 * Hook to access terminology configuration
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { term, action, config } = useTerminology();
 *
 *   return (
 *     <div>
 *       <h1>{term('badge', true)}</h1>
 *       <p>Earn {term('badge', true)} to gain {term('mana')}</p>
 *       <button>{action('mint')}</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTerminology(): TerminologyContextType {
  const context = useContext(TerminologyContext);
  if (!context) {
    throw new Error('useTerminology must be used within a TerminologyProvider');
  }
  return context;
}

/**
 * HOC to provide terminology context to a component
 */
export function withTerminology<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function TerminologyWrappedComponent(props: P) {
    return (
      <TerminologyProvider>
        <Component {...props} />
      </TerminologyProvider>
    );
  };
}
