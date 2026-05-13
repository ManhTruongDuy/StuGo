import BaseRepository from './base.repository.js';
import { User } from '../models/index.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async findByGoogleId(googleId) {
    return this.model.findOne({ googleId });
  }

  async findPartners(options = {}) {
    const filter = { role: 'partner' };
    return this.find(filter, options);
  }

  async findAdmins() {
    return this.model.find({ role: 'admin' });
  }

  async searchUsers(query, options = {}) {
    const filter = {
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    };
    return this.find(filter, options);
  }

  async getStats() {
    const pipeline = [
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ];
    
    const results = await this.aggregate(pipeline);
    
    const stats = {
      total: 0,
      users: 0,
      partners: 0,
      admins: 0
    };

    results.forEach(r => {
      stats[r._id + 's'] = r.count;
      stats.total += r.count;
    });

    return stats;
  }

  async getNewUsersCount(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.count({
      createdAt: { $gte: startDate }
    });
  }
}

export default new UserRepository();
