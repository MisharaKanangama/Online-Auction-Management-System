import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../types';
import { apiService } from '../services/api';
import AuctionCard from '../components/AuctionCard';
import { Search, TrendingUp, Clock, Users } from 'lucide-react';

const HomePage: React.FC = () => {
  const [featuredAuctions, setFeaturedAuctions] = useState<Auction[]>([]);
  const [endingSoonAuctions, setEndingSoonAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeAuctions, allAuctions] = await Promise.all([
          apiService.getActiveAuctions(),
          apiService.getAuctions()
        ]);

        // Get featured auctions (first 6 active auctions)
        setFeaturedAuctions(activeAuctions.slice(0, 6));

        // Get auctions ending soon (active auctions sorted by end time)
        const endingSoon = activeAuctions
          .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
          .slice(0, 4);
        setEndingSoonAuctions(endingSoon);

      } catch (error) {
        console.error('Error fetching auctions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Discover Amazing Auctions
          </h1>
          <p className="text-xl mb-6 text-blue-100">
            Bid on unique items from around the world. From art and antiques to electronics and collectibles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/auctions"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Auctions
            </Link>
            <Link
              to="/create-auction"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Create Auction
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Auctions</p>
              <p className="text-2xl font-bold text-gray-900">{featuredAuctions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bidders</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ending Soon</p>
              <p className="text-2xl font-bold text-gray-900">{endingSoonAuctions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Auctions */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Auctions</h2>
          <Link
            to="/auctions"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View All
            <Search className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {featuredAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No active auctions at the moment.</p>
          </div>
        )}
      </section>

      {/* Ending Soon */}
      {endingSoonAuctions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Ending Soon</h2>
            <Link
              to="/auctions?filter=ending-soon"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <Clock className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {endingSoonAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            'Art & Antiques',
            'Electronics',
            'Jewelry & Watches',
            'Collectibles',
            'Vehicles',
            'Sports & Recreation'
          ].map((category) => (
            <Link
              key={category}
              to={`/auctions?category=${encodeURIComponent(category)}`}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
            >
              <p className="font-medium text-gray-900">{category}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
