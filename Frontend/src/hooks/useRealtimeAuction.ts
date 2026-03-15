import { useState, useEffect, useCallback } from 'react';
import { Auction } from '../types';
import { signalRService } from '../services/signalRService';

export const useRealtimeAuction = (auctionId: number) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const updateAuction = useCallback((updatedAuction: Auction) => {
    if (updatedAuction.id === auctionId) {
      setAuction(updatedAuction);
    }
  }, [auctionId]);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        await signalRService.connect();
        setIsConnected(true);
        
        // Listen for auction updates
        signalRService.onAuctionUpdated(updateAuction);
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
        setIsConnected(false);
      }
    };

    if (mounted) {
      connect();
    }

    return () => {
      mounted = false;
      signalRService.offAuctionUpdated();
    };
  }, [updateAuction]);

  return { auction, isConnected, setAuction };
};
