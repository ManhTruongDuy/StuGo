import BaseRepository from './base.repository.js';
import { Review } from '../models/index.js';

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByService(serviceId, options = {}) {
    return this.find(
      { serviceId, status: 'active' }, 
      {
        ...options,
        populate: 'userId',
        sort: { createdAt: -1 }
      }
    );
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId }, {
      ...options,
      populate: 'serviceId',
      sort: { createdAt: -1 }
    });
  }

  async addReply(reviewId, content, repliedBy) {
    return this.updateById(reviewId, {
      reply: {
        content,
        repliedAt: new Date(),
        repliedBy
      }
    });
  }

  async getServiceRatingStats(serviceId) {
    const pipeline = [
      { $match: { serviceId, status: 'active' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    if (result.length === 0) {
      return { avgRating: 0, totalReviews: 0, distribution: {} };
    }

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result[0].ratings.forEach(r => {
      distribution[r] = (distribution[r] || 0) + 1;
    });

    return {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      distribution
    };
  }

  async hasUserReviewed(userId, serviceId, bookingId = null) {
    const query = { userId, serviceId };
    if (bookingId) query.bookingId = bookingId;
    return this.exists(query);
  }
}

export default new ReviewRepository();
