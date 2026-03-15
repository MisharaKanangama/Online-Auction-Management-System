import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreateAuction } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { 
  convertLocalToUTC, 
  getDefaultStartTime, 
  getDefaultEndTime, 
  validateDateRange,
  getTimezoneInfo 
} from '../utils/dateUtils';

const schema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  startingBid: yup.number().required('Starting bid is required').min(0.01, 'Starting bid must be greater than 0'),
  reservePrice: yup.number().min(0.01, 'Reserve price must be greater than 0'),
  category: yup.string().required('Category is required'),
  condition: yup.string().required('Condition is required'),
  location: yup.string().required('Location is required'),
  startTime: yup.string().required('Start time is required').test('future-date', 'Start time must be in the future', function(value) {
    if (!value) return false;
    const startDate = new Date(value);
    const now = new Date();
    return startDate > now;
  }),
  endTime: yup.string().required('End time is required').test('after-start', 'End time must be after start time', function(value) {
    const { startTime } = this.parent;
    if (!value || !startTime) return false;
    const startDate = new Date(startTime);
    const endDate = new Date(value);
    return endDate > startDate;
  }).test('future-date', 'End time must be in the future', function(value) {
    if (!value) return false;
    const endDate = new Date(value);
    const now = new Date();
    return endDate > now;
  }),
  // imageUrl: yup.string().url('Must be a valid URL'), // Removed - using file upload instead
});

// Set default times for testing - 09:07 PM to 09:10 PM today (as datetime-local strings)
const today = new Date();
const defaultStartTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 7, 0);
const defaultEndTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 10, 0);

// Convert to datetime-local format (YYYY-MM-DDTHH:MM)
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const defaultStartTimeString = formatDateTimeLocal(defaultStartTime);
const defaultEndTimeString = formatDateTimeLocal(defaultEndTime);

const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateAuction>({
    resolver: yupResolver(schema),
    defaultValues: {
      startTime: defaultStartTimeString,
      endTime: defaultEndTimeString,
    },
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // No auto-update - user selects exact times

  const onSubmit = async (data: CreateAuction) => {
    if (!user) {
      setError('You must be logged in to create an auction');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate date range first
      if (data.startTime && data.endTime) {
        const dateValidation = validateDateRange(data.startTime, data.endTime);
        if (!dateValidation.isValid) {
          setError(dateValidation.error || 'Invalid date range');
          return;
        }
      }

      // Use local time directly - no UTC conversion
      // datetime-local format: "YYYY-MM-DDTHH:MM" (local time)
      const startTimeLocal = data.startTime + ':00';
      const endTimeLocal = data.endTime + ':00';
      
      // Debug local time handling
      console.log('🕐 LOCAL TIME MODE - No UTC Conversion:');
      console.log('📅 Start Time (local):', startTimeLocal);
      console.log('📅 End Time (local):', endTimeLocal);
      console.log('⏰ Duration:', Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60)), 'minutes');

      const auctionData = {
        ...data,
        startingBid: parseFloat(data.startingBid.toString()),
        reservePrice: data.reservePrice ? parseFloat(data.reservePrice.toString()) : undefined,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
      };

      // Create the auction first
      const createdAuction = await apiService.createAuction(auctionData);

      // Upload images if any
      if (uploadedImages.length > 0) {
        try {
          await apiService.uploadAuctionImages(createdAuction.id, uploadedImages);
        } catch (imageError: any) {
          console.error('Failed to upload images:', imageError);
          // Don't fail the entire operation if image upload fails
        }
      }

      navigate('/auctions');
    } catch (err: any) {
      setError(err.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You must be logged in to create an auction</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Auction</h1>
            <p className="mt-2 text-gray-600">Fill in the details below to create your auction listing</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter auction title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your item in detail"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid *
                </label>
                <input
                  {...register('startingBid')}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.startingBid && (
                  <p className="mt-1 text-sm text-red-600">{errors.startingBid.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reserve Price
                </label>
                <input
                  {...register('reservePrice')}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional"
                />
                {errors.reservePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.reservePrice.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Art & Collectibles">Art & Collectibles</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Antiques">Antiques</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Sports & Recreation">Sports & Recreation</option>
                  <option value="Books & Media">Books & Media</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  {...register('condition')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                {...register('location')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="City, State/Country"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <ImageUpload
                onImagesChange={setUploadedImages}
                maxImages={10}
                className="mb-4"
              />
              <p className="text-sm text-gray-500">
                Upload up to 10 images. The first image will be used as the primary image.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  {...register('startTime')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  When the auction will become active and bidding can begin
                </p>
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
                  min={startTime}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  When the auction will end and the highest bidder will win
                </p>
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/auctions')}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Auction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionPage;
