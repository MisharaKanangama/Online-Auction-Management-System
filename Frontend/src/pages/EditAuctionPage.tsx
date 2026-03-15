import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Auction } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, X } from 'lucide-react';

const schema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  category: yup.string().required('Category is required'),
  startingBid: yup.number().required('Starting bid is required').min(0.01, 'Starting bid must be greater than 0'),
  reservePrice: yup.number().min(0.01, 'Reserve price must be greater than 0'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  condition: yup.string().required('Condition is required'),
  location: yup.string().required('Location is required'),
});

type EditAuctionForm = yup.InferType<typeof schema>;

const EditAuctionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EditAuctionForm>({
    resolver: yupResolver(schema),
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  useEffect(() => {
    if (id) {
      loadAuction();
    }
  }, [id]);

  const loadAuction = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAuction(parseInt(id!));
      const auctionData = response.data;
      
      // Check if user owns this auction
      if (user && user.id !== auctionData.sellerId) {
        setError('You can only edit auctions you created');
        return;
      }

      setAuction(auctionData);
      
      // Pre-fill form with existing data
      setValue('title', auctionData.title);
      setValue('description', auctionData.description);
      setValue('category', auctionData.category);
      setValue('startingBid', auctionData.startingBid);
      setValue('reservePrice', auctionData.reservePrice || 0);
      // Convert to local time format for datetime-local input
      const startTimeLocal = new Date(auctionData.startTime);
      const endTimeLocal = new Date(auctionData.endTime);
      setValue('startTime', startTimeLocal.toISOString().slice(0, 16));
      setValue('endTime', endTimeLocal.toISOString().slice(0, 16));
      setValue('condition', auctionData.condition || '');
      setValue('location', auctionData.location || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditAuctionForm) => {
    if (!auction || !user) return;

    setSaving(true);
    setError(null);

    try {
      // Validate dates
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      const now = new Date();

      if (startDate >= endDate) {
        setError('End time must be after start time');
        return;
      }

      if (startDate < now) {
        setError('Start time cannot be in the past');
        return;
      }

      const updateData = {
        title: data.title,
        description: data.description,
        category: data.category,
        startingBid: data.startingBid,
        reservePrice: data.reservePrice || null,
        startTime: startDate.toISOString().slice(0, 19), // Remove 'Z' suffix for local time
        endTime: endDate.toISOString().slice(0, 19), // Remove 'Z' suffix for local time
        condition: data.condition,
        location: data.location,
      };

      await apiService.updateAuction(auction.id, updateData);
      navigate(`/auctions/${auction.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update auction');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/auctions')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Edit Auction</h1>
              <button
                onClick={() => navigate(`/auctions/${id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Auction
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter auction title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your item in detail"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category and Starting Bid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Art">Art</option>
                  <option value="Collectibles">Collectibles</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Sports">Sports</option>
                  <option value="Books">Books</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid ($) *
                </label>
                <input
                  {...register('startingBid')}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                {errors.startingBid && (
                  <p className="mt-1 text-sm text-red-600">{errors.startingBid.message}</p>
                )}
              </div>
            </div>

            {/* Reserve Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Price ($) <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                {...register('reservePrice')}
                type="number"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {errors.reservePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.reservePrice.message}</p>
              )}
            </div>

            {/* Start and End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  {...register('startTime')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  {...register('endTime')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            {/* Condition and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  {...register('condition')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, State/Country"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/auctions/${id}`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAuctionPage;
