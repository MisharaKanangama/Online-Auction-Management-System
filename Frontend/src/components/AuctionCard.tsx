import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auction, AuctionStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { signalRService } from '../services/signalRService';
import { 
  formatCurrency, 
  formatDate, 
  formatTimeRemaining, 
  getAuctionStatusText, 
  getAuctionStatusColor,
  isAuctionActive 
} from '../utils/helpers';
import { Edit, Trash2 } from 'lucide-react';
import { Clock, Users, MapPin, Gavel } from 'lucide-react';

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction: initialAuction }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [auction, setAuction] = useState(initialAuction);
  const { user } = useAuth();
  const navigate = useNavigate();
  const timeRemaining = formatTimeRemaining(auction.endTime);
  const isActive = isAuctionActive(auction);

  // Listen for real-time auction updates
  useEffect(() => {
    const handleAuctionUpdate = (updatedAuction: Auction) => {
      if (updatedAuction.id === auction.id) {
        setAuction(updatedAuction);
      }
    };

    signalRService.onAuctionUpdated(handleAuctionUpdate);

    return () => {
      signalRService.offAuctionUpdated();
    };
  }, [auction.id]);

  const handleClick = () => {
    setIsNavigating(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${auction.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiService.deleteAuction(auction.id);
      // The parent component should handle refreshing the list
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to delete auction');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/auctions/${auction.id}/edit`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {auction.images && auction.images.length > 0 ? (
          <img
            src={auction.images[0].imageUrl}
            alt={auction.title}
            className="w-full h-48 object-cover"
          />
        ) : auction.imageUrl ? (
          <img
            src={auction.imageUrl}
            alt={auction.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <Gavel className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAuctionStatusColor(auction.status)}`}>
            {getAuctionStatusText(auction.status)}
          </span>
          {isActive && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {timeRemaining}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link 
            to={`/auctions/${auction.id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {auction.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {auction.description}
        </p>

        {/* Category */}
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {auction.category}
          </span>
        </div>

        {/* Location */}
        {auction.location && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {auction.location}
          </div>
        )}

        {/* Bid Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Current Bid</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(auction.currentBid || auction.startingBid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Bids</p>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-gray-600" />
              <span className="font-semibold">{auction.bidCount}</span>
            </div>
          </div>
        </div>

        {/* Seller and Time Info - 3 Rows */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Seller:</span>
            <span className="font-medium text-gray-900">{auction.sellerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Start Time:</span>
            <span className="font-medium text-gray-900">{formatDate(auction.startTime)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>End Time:</span>
            <span className="font-medium text-gray-900">{formatDate(auction.endTime)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* Owner Actions */}
          {user && user.id === auction.sellerId && (
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
          
          {/* Main Actions */}
          <div className="flex space-x-2">
            <Link
              to={`/auctions/${auction.id}`}
              onClick={handleClick}
              className={`flex-1 text-white text-center py-2 px-4 rounded-md transition-colors text-sm font-medium ${
                isNavigating 
                  ? 'bg-blue-500 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isNavigating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                'View Details'
              )}
            </Link>
            {isActive && user && user.id !== auction.sellerId && (
              <Link
                to={`/auctions/${auction.id}`}
                className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Bid Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
