export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  lastLoginAt?: string;
  fullName: string;
}

export interface Auction {
  id: number;
  title: string;
  description: string;
  category: string;
  startingBid: number;
  reservePrice?: number;
  currentBid?: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  imageUrl?: string;
  condition?: string;
  location?: string;
  sellerId: string;
  winnerId?: string;
  createdAt: string;
  updatedAt?: string;
  sellerName: string;
  winnerName?: string;
  bidCount: number;
  timeRemaining?: string;
  images?: AuctionImage[];
}

export interface AuctionImage {
  id: number;
  auctionId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export const AuctionStatus = {
  Scheduled: 0,
  Active: 1,
  Ended: 2,
  Cancelled: 3,
  Completed: 4
} as const;

export type AuctionStatus = typeof AuctionStatus[keyof typeof AuctionStatus];

export interface Bid {
  id: number;
  auctionId: number;
  bidderId: string;
  bidderName: string;
  amount: number;
  bidTime: string;
  comment?: string;
  isWinningBid: boolean;
  auctionTitle: string;
  auctionStatus: AuctionStatus;
}

export interface CreateAuction {
  title: string;
  description: string;
  category: string;
  startingBid: number;
  reservePrice?: number;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  condition?: string;
  location?: string;
}

export interface CreateBid {
  auctionId: number;
  amount: number;
  comment?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}
