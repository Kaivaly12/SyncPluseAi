import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setFirestoreNetworkEnabled } from '../firebase/services';
import { FirestoreSyncMetadata, NetworkConnectionStatus, NetworkStateInfo } from '../types';

export interface NetworkContextType extends NetworkStateInfo {
  pendingWritesCount: number;
  toggleOfflineMode: () => Promise<void>;
  reconnect: () => Promise<void>;
  setFirestoreMetadata: (metadata: FirestoreSyncMetadata) => void;
  incrementPendingWrites: () => void;
  clearPendingWrites: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isUsingCache, setIsUsingCache] = useState<boolean>(false);
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [pendingWritesCount, setPendingWritesCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  // Listen to browser network changes (window 'online' and 'offline' events)
  useEffect(() => {
    const handleOnline = async () => {
      setIsBrowserOnline(true);
      if (!isSimulatedOffline) {
        setIsFirestoreConnected(true);
        setIsUsingCache(false);
        await setFirestoreNetworkEnabled(true);
        setLastSyncTime(new Date());
      }
    };

    const handleOffline = async () => {
      setIsBrowserOnline(false);
      setIsFirestoreConnected(false);
      setIsUsingCache(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Update from Firestore onSnapshot metadata
  const setFirestoreMetadata = useCallback((metadata: FirestoreSyncMetadata) => {
    setIsUsingCache(metadata.fromCache);
    setHasPendingWrites(metadata.hasPendingWrites);
    if (metadata.hasPendingWrites) {
      setPendingWritesCount((prev) => Math.max(prev, 1));
    } else {
      setPendingWritesCount(0);
    }
    if (!metadata.fromCache) {
      setIsFirestoreConnected(true);
      setLastSyncTime(new Date());
    }
  }, []);

  const incrementPendingWrites = useCallback(() => {
    setPendingWritesCount((prev) => prev + 1);
    setHasPendingWrites(true);
  }, []);

  const clearPendingWrites = useCallback(() => {
    setPendingWritesCount(0);
    setHasPendingWrites(false);
  }, []);

  // Toggle simulated offline mode
  const toggleOfflineMode = useCallback(async () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);

    if (nextState) {
      // Disconnect Firestore to force offline cache operation
      await setFirestoreNetworkEnabled(false);
      setIsFirestoreConnected(false);
      setIsUsingCache(true);
    } else {
      // Reconnect Firestore if browser has network connection
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setIsBrowserOnline(true);
        await setFirestoreNetworkEnabled(true);
        setIsFirestoreConnected(true);
        setIsUsingCache(false);
        setLastSyncTime(new Date());
      }
    }
  }, [isSimulatedOffline]);

  // Reconnect action
  const reconnect = useCallback(async () => {
    setIsSimulatedOffline(false);
    if (typeof navigator !== 'undefined') {
      setIsBrowserOnline(navigator.onLine);
    }
    await setFirestoreNetworkEnabled(true);
    setIsFirestoreConnected(true);
    setIsUsingCache(false);
    setLastSyncTime(new Date());
  }, []);

  // Effective status calculation
  const isOnline = isBrowserOnline && !isSimulatedOffline && isFirestoreConnected;
  const status: NetworkConnectionStatus = isOnline ? 'online' : 'offline';

  return (
    <NetworkContext.Provider
      value={{
        status,
        isOnline,
        isBrowserOnline,
        isFirestoreConnected,
        isUsingCache,
        hasPendingWrites,
        pendingWritesCount,
        lastSyncTime,
        isSimulatedOffline,
        toggleOfflineMode,
        reconnect,
        setFirestoreMetadata,
        incrementPendingWrites,
        clearPendingWrites,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
