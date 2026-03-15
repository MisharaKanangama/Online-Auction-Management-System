import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Auction, Bid, CreateBid } from '../types';
import { apiService } from '../services/api';
import { signalRService } from '../services/signalRService';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { 
  formatDate, 
  formatTimeRemaining, 
  isAuctionActive,
  getAuctionStatus,
  getRelativeTime 
} from '../utils/dateUtils';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadAuction();
      loadBids();
      connectToSignalR();
    }

    return () => {
      if (id) {
        signalRService.leaveAuctionGroup(parseInt(id));
      }
      signalRService.disconnect();
    };
  }, [id]);

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!auction?.images || auction.images.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : auction.images.length - 1);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex(selectedImageIndex < auction.images.length - 1 ? selectedImageIndex + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImageIndex, auction?.images]);

  const loadAuction = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAuction(parseInt(id!));
      setAuction(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      const response = await apiService.getBidsByAuction(parseInt(id!));
      setBids(response);
    } catch (err: any) {
      console.error('Failed to load bids:', err);
    }
  };

  const connectToSignalR = async () => {
    try {
      await signalRService.connect();
      
      // Join the auction group to receive updates
      await signalRService.joinAuctionGroup(parseInt(id!));
      
      // Listen for new bids
      signalRService.onNewBid((bid: Bid) => {
        if (bid.auctionId === parseInt(id!)) {
          setBids(prev => [bid, ...prev]);
        }
      });
      
      // Listen for auction updates (current bid, bid count, etc.)
      signalRService.onAuctionUpdated((updatedAuction: Auction) => {
        if (updatedAuction.id === parseInt(id!)) {
          setAuction(updatedAuction);
        }
      });
      
      // Listen for bid errors
      signalRService.onBidError((error: string) => {
        setError(error);
      });
    } catch (err) {
      console.error('Failed to connect to SignalR:', err);
    }
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auction) return;

    setBidding(true);
    setError(null);

    try {
      const bidData: CreateBid = {
        auctionId: auction.id,
        amount: parseFloat(bidAmount),
        comment: ''
      };

      await apiService.placeBid(bidData);
      setBidAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const handleDeleteAuction = async () => {
    if (!auction || !user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${auction.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiService.deleteAuction(auction.id);
      navigate('/auctions');
    } catch (err: any) {
      setError(err.message || 'Failed to delete auction');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Loading auction...</h2>
          <p className="mt-2 text-gray-600">Please wait while we fetch the auction details</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
          <button
            onClick={() => navigate('/auctions')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  // Determine if auction is active based on current time using dayjs
  const isActive = isAuctionActive(auction.startTime, auction.endTime);
  const status = getAuctionStatus(auction.startTime, auction.endTime);
  const canBid = user && isActive && user.id !== auction.sellerId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Image Gallery */}
              {auction.images && auction.images.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image Display */}
                  <div className="relative">
                    <img
                      src={auction.images[selectedImageIndex].imageUrl}
                      alt={auction.title}
                      className="w-full h-96 object-cover"
                      onError={(e) => {
                        console.error('Failed to load main image:', auction.images?.[selectedImageIndex]?.imageUrl);
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    {auction.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : auction.images!.length - 1)}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(selectedImageIndex < auction.images!.length - 1 ? selectedImageIndex + 1 : 0)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    {auction.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} of {auction.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {auction.images.length > 1 && (
                    <div className="px-6 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">All Images</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {auction.images.map((image, index) => (
                          <div key={image.id} className="relative group cursor-pointer">
                            <img
                              src={image.imageUrl}
                              alt={`${auction.title} - Image ${index + 1}`}
                              className={`w-full h-20 object-cover rounded-lg border-2 transition-colors ${
                                selectedImageIndex === index 
                                  ? 'border-primary-500 ring-2 ring-primary-200' 
                                  : 'border-gray-200 hover:border-primary-500'
                              }`}
                              onClick={() => setSelectedImageIndex(index)}
                              onError={(e) => {
                                console.error('Failed to load thumbnail image:', image.imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {image.isPrimary && (
                              <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : auction.imageUrl ? (
                <img
                  src={auction.imageUrl}
                  alt={auction.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Image Available</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{auction.title}</h1>
                  <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'Active' ? 'bg-green-100 text-green-800' : 
                      status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {status}
                    </span>
                    
                    {/* Winner Display */}
                    {status === 'Ended' && auction.winnerName && (
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Winner:</span>
                        <div className="font-semibold text-green-600">{auction.winnerName}</div>
                        <div className="text-sm text-gray-500">Winning Bid: ${auction.currentBid?.toFixed(2)}</div>
                      </div>
                    )}
                    
                    {status === 'Ended' && !auction.winnerName && (
                      <div className="text-right">
                        <span className="text-sm text-gray-600">No Winner</span>
                        <div className="text-sm text-gray-500">No bids placed</div>
                      </div>
                    )}
                  </div>
                    
                    {/* Owner Actions */}
                    {user && user.id === auction.sellerId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/auctions/${auction.id}/edit`)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          title="Edit Auction"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={handleDeleteAuction}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          title="Delete Auction"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 text-lg leading-relaxed">{auction.description}</p>
                </div>

                {/* Seller and Time Information - 3 Rows */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Seller:</span>
                      <span className="text-lg font-semibold text-gray-900">{auction.sellerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Start Time:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatDate(auction.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">End Time:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatDate(auction.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Starting Bid</h3>
                    <p className="text-2xl font-bold text-gray-900">${auction.startingBid.toFixed(2)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Bid</h3>
                    <p className="text-2xl font-bold text-primary-600">${(auction.currentBid || auction.startingBid).toFixed(2)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Time Remaining</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTimeRemaining(auction.endTime)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bids</h3>
                    <p className="text-lg font-semibold text-gray-900">{bids.length}</p>
                  </div>
                </div>

                {auction.category && (
                  <div className="mb-4">
                    <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {auction.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bidding Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Place a Bid</h2>
              
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Please log in to place a bid</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Log In
                  </button>
                </div>
              ) : !canBid ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {status === 'Scheduled' ? 'This auction has not started yet' :
                     status === 'Ended' ? 
                       (auction.winnerName ? 
                         `Auction ended. Winner: ${auction.winnerName} with $${auction.currentBid?.toFixed(2)}` :
                         'This auction has ended with no bids') :
                     'You cannot bid on your own auction'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBid} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bid Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={(auction.currentBid || auction.startingBid) + 0.01}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={`Minimum: $${((auction.currentBid || auction.startingBid) + 0.01).toFixed(2)}`}
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={bidding}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bidding ? 'Placing Bid...' : 'Place Bid'}
                  </button>
                </form>
              )}

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid History</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {bids.length === 0 ? (
                    <p className="text-gray-500 text-sm">No bids yet</p>
                  ) : (
                    bids.map((bid) => (
                      <div key={bid.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">${bid.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{bid.bidderName}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(bid.bidTime)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
