import BaseRepository from './base.repository.js';
import { Complaint } from '../models/index.js';

class ComplaintRepository extends BaseRepository {
  constructor() {
    super(Complaint);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId }, {
      ...options,
      populate: 'serviceId bookingId',
      sort: { createdAt: -1 }
    });
  }

  async findPending(options = {}) {
    return this.find({ status: 'pending' }, {
      ...options,
      populate: 'userId serviceId bookingId',
      sort: { priority: -1, createdAt: -1 }
    });
  }

  async respond(complaintId, content, respondedBy) {
    return this.updateById(complaintId, {
      response: {
        content,
        respondedAt: new Date(),
        respondedBy
      },
      status: 'in_progress'
    });
  }

  async resolve(complaintId, resolution, resolutionNote, resolvedBy) {
    return this.updateById(complaintId, {
      resolution,
      resolutionNote,
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy
    });
  }

  async getStats() {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await this.aggregate(pipeline);
    
    const stats = {
      total: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    results.forEach(r => {
      stats[r._id] = r.count;
      stats.total += r.count;
    });

    return stats;
  }

  async getCategoryStats() {
    const pipeline = [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    return this.aggregate(pipeline);
  }
}

export default new ComplaintRepository();
