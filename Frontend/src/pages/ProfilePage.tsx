import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Auction, Bid } from '../types';
import { apiService } from '../services/api';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'auctions' | 'bids'>('auctions');
  const [userAuctions, setUserAuctions] = useState<Auction[]>([]);
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load user's auctions
      const auctionsResponse = await apiService.getAuctions();
      const userAuctionsData = auctionsResponse.filter(auction => auction.sellerId === user.id);
      setUserAuctions(userAuctionsData);

      // Load user's bids
      const bidsResponse = await apiService.getUserBids();
      setUserBids(bidsResponse.data);
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-gray-100 text-gray-800';
      case 3: return 'bg-red-100 text-red-800';
      case 4: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Scheduled';
      case 1: return 'Active';
      case 2: return 'Ended';
      case 3: return 'Cancelled';
      case 4: return 'Completed';
      default: return 'Unknown';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('auctions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'auctions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Auctions ({userAuctions.length})
              </button>
              <button
                onClick={() => setActiveTab('bids')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bids'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Bids ({userBids.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* My Auctions Tab */}
                {activeTab === 'auctions' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Auctions</h2>
                    {userAuctions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't created any auctions yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userAuctions.map((auction) => (
                          <div key={auction.id} className="bg-gray-50 rounded-lg p-6">
                            {auction.imageUrl && (
                              <img
                                src={auction.imageUrl}
                                alt={auction.title}
                                className="w-full h-32 object-cover rounded-lg mb-4"
                              />
                            )}
                            <h3 className="font-semibold text-gray-900 mb-2">{auction.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Current Bid:</span>
                                <span className="font-semibold">${auction.currentBid.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Bids:</span>
                                <span>{auction.bidCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Ends:</span>
                                <span>{formatDate(auction.endTime)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(auction.status)}`}>
                                {getStatusText(auction.status)}
                              </span>
                              <button
                                onClick={() => window.location.href = `/auctions/${auction.id}`}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* My Bids Tab */}
                {activeTab === 'bids' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Bids</h2>
                    {userBids.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't placed any bids yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userBids.map((bid) => (
                          <div key={bid.id} className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">{bid.auctionTitle}</h3>
                                <p className="text-sm text-gray-600">Bid placed on {formatDate(bid.bidTime)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary-600">${bid.amount.toFixed(2)}</p>
                                {bid.isWinningBid && (
                                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Winning Bid
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {bid.comment && (
                              <p className="text-sm text-gray-600 mb-3">"{bid.comment}"</p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.auctionStatus)}`}>
                                {getStatusText(bid.auctionStatus)}
                              </span>
                              <button
                                onClick={() => window.location.href = `/auctions/${bid.auctionId}`}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                View Auction
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
