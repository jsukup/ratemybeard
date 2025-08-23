import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi', // Default assumption
  });

  // TODO: Add @react-native-community/netinfo when needed
  // For now, assume we're always connected
  useEffect(() => {
    // Placeholder for future network status monitoring
    // This would integrate with NetInfo when the dependency is added
  }, []);

  return networkStatus;
}