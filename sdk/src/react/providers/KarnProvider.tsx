import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ValocracyClient, GovernorClient, TreasuryClient } from '../../clients';

export interface KarnConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contracts: {
    valocracy: string;
    governor: string;
    treasury: string;
  };
}

interface KarnContextValue {
  valocracy: ValocracyClient;
  governor: GovernorClient;
  treasury: TreasuryClient;
  config: KarnConfig;
}

const KarnContext = createContext<KarnContextValue | null>(null);

export const useKarn = () => {
  const context = useContext(KarnContext);
  if (!context) {
    throw new Error('useKarn must be used within a KarnProvider');
  }
  return context;
};

interface KarnProviderProps {
  config: KarnConfig;
  children: ReactNode;
}

export const KarnProvider: React.FC<KarnProviderProps> = ({ config, children }) => {
  const clients = useMemo(() => {
    return {
      valocracy: new ValocracyClient(
        config.networkPassphrase,
        config.rpcUrl,
        config.contracts.valocracy
      ),
      governor: new GovernorClient(
        config.networkPassphrase,
        config.rpcUrl,
        config.contracts.governor
      ),
      treasury: new TreasuryClient(
        config.networkPassphrase,
        config.rpcUrl,
        config.contracts.treasury
      ),
    };
  }, [config.networkPassphrase, config.rpcUrl, config.contracts.valocracy, config.contracts.governor, config.contracts.treasury]);

  const value: KarnContextValue = {
    ...clients,
    config,
  };

  return <KarnContext.Provider value={value}>{children}</KarnContext.Provider>;
};
