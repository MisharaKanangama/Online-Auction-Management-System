import { Auction, AuctionStatus } from '../types';
import { 
  formatDate as dayjsFormatDate, 
  formatTimeRemaining as dayjsFormatTimeRemaining,
  isAuctionActive as dayjsIsAuctionActive 
} from './dateUtils';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (dateString: string | undefined | null): string => {
  return dayjsFormatDate(dateString);
};

export const formatTimeRemaining = (endTime: string): string => {
  return dayjsFormatTimeRemaining(endTime);
};

export const getAuctionStatusText = (status: AuctionStatus): string => {
  switch (status) {
    case AuctionStatus.Scheduled:
      return 'Scheduled';
    case AuctionStatus.Active:
      return 'Active';
    case AuctionStatus.Ended:
      return 'Ended';
    case AuctionStatus.Cancelled:
      return 'Cancelled';
    case AuctionStatus.Completed:
      return 'Completed';
    default:
      return 'Unknown';
  }
};

export const getAuctionStatusColor = (status: AuctionStatus): string => {
  switch (status) {
    case AuctionStatus.Scheduled:
      return 'bg-blue-100 text-blue-800';
    case AuctionStatus.Active:
      return 'bg-green-100 text-green-800';
    case AuctionStatus.Ended:
      return 'bg-gray-100 text-gray-800';
    case AuctionStatus.Cancelled:
      return 'bg-red-100 text-red-800';
    case AuctionStatus.Completed:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const isAuctionActive = (auction: Auction): boolean => {
  return dayjsIsAuctionActive(auction.startTime, auction.endTime);
};

export const canPlaceBid = (auction: Auction, currentUserId?: string): boolean => {
  if (!isAuctionActive(auction)) {
    return false;
  }
  
  if (auction.sellerId === currentUserId) {
    return false;
  }

  return true;
};

export const getMinimumBid = (auction: Auction): number => {
  const currentBid = auction.currentBid || auction.startingBid;
  return currentBid + 1;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 digit
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
