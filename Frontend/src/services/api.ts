import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Auction, 
  Bid, 
  CreateAuction, 
  CreateBid, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  ApiResponse,
  AuctionImage
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/auth/profile', userData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/auth/change-password', { currentPassword, newPassword });
  }

  // Auction endpoints
  async getAuctions(): Promise<Auction[]> {
    const response: AxiosResponse<Auction[]> = await this.api.get('/auctions');
    return response.data;
  }

  async getActiveAuctions(): Promise<Auction[]> {
    const response: AxiosResponse<Auction[]> = await this.api.get('/auctions/active');
    return response.data;
  }

  async getAuction(id: number): Promise<{ data: Auction }> {
    const response: AxiosResponse<Auction> = await this.api.get(`/auctions/${id}`);
    return { data: response.data };
  }

  async getAuctionsByCategory(category: string): Promise<Auction[]> {
    const response: AxiosResponse<Auction[]> = await this.api.get(`/auctions/category/${category}`);
    return response.data;
  }

  async getAuctionsBySeller(sellerId: string): Promise<Auction[]> {
    const response: AxiosResponse<Auction[]> = await this.api.get(`/auctions/seller/${sellerId}`);
    return response.data;
  }

  async searchAuctions(query: string): Promise<Auction[]> {
    const response: AxiosResponse<Auction[]> = await this.api.get(`/auctions/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/auctions/categories');
    return response.data;
  }

  async createAuction(auction: CreateAuction): Promise<Auction> {
    const response: AxiosResponse<Auction> = await this.api.post('/auctions', auction);
    return response.data;
  }

  async updateAuction(id: number, auction: Partial<CreateAuction>): Promise<Auction> {
    const response: AxiosResponse<Auction> = await this.api.put(`/auctions/${id}`, auction);
    return response.data;
  }

  async deleteAuction(id: number): Promise<void> {
    await this.api.delete(`/auctions/${id}`);
  }

  async startAuction(id: number): Promise<void> {
    await this.api.post(`/auctions/${id}/start`);
  }

  async endAuction(id: number): Promise<void> {
    await this.api.post(`/auctions/${id}/end`);
  }

  // Bid endpoints
  async getBidsByAuction(auctionId: number): Promise<Bid[]> {
    const response: AxiosResponse<Bid[]> = await this.api.get(`/bids/auction/${auctionId}`);
    return response.data;
  }

  async getBidsByUser(): Promise<Bid[]> {
    const response: AxiosResponse<Bid[]> = await this.api.get('/bids/user');
    return response.data;
  }

  async getHighestBid(auctionId: number): Promise<Bid | null> {
    try {
      const response: AxiosResponse<Bid> = await this.api.get(`/bids/auction/${auctionId}/highest`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async placeBid(bid: CreateBid): Promise<Bid> {
    const response: AxiosResponse<Bid> = await this.api.post('/bids', bid);
    return response.data;
  }

  async retractBid(bidId: number): Promise<void> {
    await this.api.delete(`/bids/${bidId}`);
  }

  async getBidHistory(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/bids/history');
    return response.data;
  }

  async getUserBids(): Promise<{ data: Bid[] }> {
    const response: AxiosResponse<Bid[]> = await this.api.get('/bids/user');
    return { data: response.data };
  }

  // Image upload endpoints
  async uploadAuctionImages(auctionId: number, files: File[]): Promise<AuctionImage[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response: AxiosResponse<AuctionImage[]> = await this.api.post(`/images/upload/${auctionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadSingleImage(auctionId: number, file: File, isPrimary: boolean = false): Promise<AuctionImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());

    const response: AxiosResponse<AuctionImage> = await this.api.post(`/images/upload-single/${auctionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAuctionImages(auctionId: number): Promise<AuctionImage[]> {
    const response: AxiosResponse<AuctionImage[]> = await this.api.get(`/images/auction/${auctionId}`);
    return response.data;
  }

  async deleteImage(imageId: number): Promise<void> {
    await this.api.delete(`/images/${imageId}`);
  }
}

export const apiService = new ApiService();
