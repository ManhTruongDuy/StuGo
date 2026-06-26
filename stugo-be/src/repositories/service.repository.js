import BaseRepository from './base.repository.js';
import { Service } from '../models/index.js';

class ServiceRepository extends BaseRepository {
  constructor() {
    super(Service);
  }

  async findWithFilters(filters, options = {}) {
    const query = {};
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    } else if (!options.isAdmin) {
      query.status = 'active';
    }

    // Type filter
    if (filters.type) {
      if (filters.type === 'transport' || filters.type === 'carpool') {
        query.type = { $in: ['transport', 'carpool'] };
      } else {
        query.type = filters.type;
      }
    }

    // Location filter - search in address field for flexible location search
    if (filters.city) {
      query.address = { $regex: filters.city, $options: 'i' };
    }

    // District filter
    if (filters.district) {
      query.district = { $regex: filters.district, $options: 'i' };
    }

    // Price range filter
    if (filters.priceMin) {
      query['priceRange.min'] = { $gte: parseInt(filters.priceMin) };
    }
    if (filters.priceMax) {
      query['priceRange.max'] = { $lte: parseInt(filters.priceMax) };
    }

    // Rating filter
    if (filters.rating) {
      query.rating = { $gte: parseFloat(filters.rating) };
    }

    // Availability filter
    if (filters.isAvailable === 'true' || filters.isAvailable === true) {
      query.isAvailable = true;
    }

    // Search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { address: { $regex: filters.search, $options: 'i' } },
        { 'routes.name': { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Sort options
    let sort = { popularity: -1 };
    switch (filters.sortBy) {
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'price_asc':
        sort = { 'priceRange.min': 1 };
        break;
      case 'price_desc':
        sort = { 'priceRange.min': -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
    }

    const limit = parseInt(options.limit || 20);
    const page = parseInt(options.page || 1);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: query },
      { $lookup: { from: 'users', localField: 'ownerId', foreignField: '_id', as: 'owner' } },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      { $addFields: { 
          isPremiumPartner: { $eq: ['$owner.plan', 'business_premium'] },
          ownerPlan: '$owner.plan'
        } 
      },
      { $sort: { isPremiumPartner: -1, ...sort } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const [data, total] = await Promise.all([
      this.model.aggregate(pipeline),
      this.model.countDocuments(query)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByOwner(ownerId, options = {}) {
    return this.find({ ownerId }, options);
  }

  async findNearby(longitude, latitude, maxDistance = 5000, limit = 20) {
    return this.model.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(limit);
  }

  async incrementPopularity(serviceId) {
    return this.model.findByIdAndUpdate(
      serviceId,
      { $inc: { popularity: 1 } },
      { new: true }
    );
  }

  async updateRating(serviceId) {
    // This would normally aggregate reviews to calculate average rating
    // For now, we'll just increment reviewCount
    return this.model.findByIdAndUpdate(
      serviceId,
      { $inc: { reviewCount: 1 } },
      { new: true }
    );
  }

  async getPopularServices(type = null, limit = 10) {
    const query = { status: 'active', isAvailable: true };
    if (type) {
      if (type === 'transport' || type === 'carpool') {
        query.type = { $in: ['transport', 'carpool'] };
      } else {
        query.type = type;
      }
    }

    return this.model.aggregate([
      { $match: query },
      { $lookup: { from: 'users', localField: 'ownerId', foreignField: '_id', as: 'owner' } },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      { $addFields: { 
          isPremiumPartner: { $eq: ['$owner.plan', 'business_premium'] },
          ownerPlan: '$owner.plan'
        } 
      },
      { $sort: { isPremiumPartner: -1, popularity: -1, rating: -1 } },
      { $limit: limit }
    ]);
  }

  async getServicesByType(type) {
    return this.find({ type, status: 'active' });
  }

  async getPendingServices(options = {}) {
    return this.find({ status: 'pending' }, options);
  }

  async getStats() {
    const pipeline = [
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ];

    return this.aggregate(pipeline);
  }
}

export default new ServiceRepository();
