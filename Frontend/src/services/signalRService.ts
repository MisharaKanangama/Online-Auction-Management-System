import * as signalR from '@microsoft/signalr';
import { Bid, Auction } from '../types';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.connection && this.isConnected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5000/auctionHub?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log('SignalR connection established');
    } catch (error) {
      console.error('SignalR connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.isConnected = false;
      console.log('SignalR connection closed');
    }
  }

  async joinAuctionGroup(auctionId: number): Promise<void> {
    if (!this.connection || !this.isConnected) {
      await this.connect();
    }
    await this.connection!.invoke('JoinAuctionGroup', auctionId);
  }

  async leaveAuctionGroup(auctionId: number): Promise<void> {
    if (this.connection && this.isConnected) {
      await this.connection.invoke('LeaveAuctionGroup', auctionId);
    }
  }

  async placeBid(auctionId: number, amount: number, comment?: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      await this.connect();
    }
    await this.connection!.invoke('PlaceBid', auctionId, amount, comment);
  }

  async getAuctionUpdates(auctionId: number): Promise<void> {
    if (!this.connection || !this.isConnected) {
      await this.connect();
    }
    await this.connection!.invoke('GetAuctionUpdates', auctionId);
  }

  // Event handlers
  onNewBid(callback: (bid: Bid) => void): void {
    if (this.connection) {
      this.connection.on('NewBid', callback);
    }
  }

  onAuctionUpdated(callback: (auction: Auction) => void): void {
    if (this.connection) {
      this.connection.on('AuctionUpdated', callback);
    }
  }

  onBidError(callback: (error: string) => void): void {
    if (this.connection) {
      this.connection.on('BidError', callback);
    }
  }

  onAuctionData(callback: (auction: Auction) => void): void {
    if (this.connection) {
      this.connection.on('AuctionData', callback);
    }
  }

  onBidHistory(callback: (bids: Bid[]) => void): void {
    if (this.connection) {
      this.connection.on('BidHistory', callback);
    }
  }

  onError(callback: (error: string) => void): void {
    if (this.connection) {
      this.connection.on('Error', callback);
    }
  }

  // Remove event handlers
  offNewBid(): void {
    if (this.connection) {
      this.connection.off('NewBid');
    }
  }

  offAuctionUpdated(): void {
    if (this.connection) {
      this.connection.off('AuctionUpdated');
    }
  }

  offBidError(): void {
    if (this.connection) {
      this.connection.off('BidError');
    }
  }

  offAuctionData(): void {
    if (this.connection) {
      this.connection.off('AuctionData');
    }
  }

  offBidHistory(): void {
    if (this.connection) {
      this.connection.off('BidHistory');
    }
  }

  offError(): void {
    if (this.connection) {
      this.connection.off('Error');
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }
}

export const signalRService = new SignalRService();
