import BaseRepository from './base.repository.js';
import { Payment } from '../models/index.js';

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByOrderCode(orderCode) {
    return this.model.findOne({ orderCode });
  }

  async findByBookingId(bookingId) {
    return this.model.findOne({ bookingId });
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId }, {
      ...options,
      populate: 'bookingId',
      sort: { createdAt: -1 }
    });
  }

  async updatePaymentStatus(orderCode, status, payosData = {}) {
    const updateData = { status };
    
    if (status === 'paid') {
      updateData.paidAt = new Date();
      updateData.payosTransactionId = payosData.transactionId;
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = payosData.cancelReason;
    }

    return this.model.findOneAndUpdate(
      { orderCode },
      { $set: updateData },
      { new: true }
    );
  }

  async getPendingPayments(userId = null) {
    const query = { status: 'pending' };
    if (userId) query.userId = userId;
    return this.find(query);
  }

  async getPaymentStats(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          status: 'paid',
          paidAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ];

    return this.aggregate(pipeline);
  }

  async getTotalRevenue() {
    const pipeline = [
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          bookingRevenue: {
            $sum: { $cond: [{ $ne: [{ $ifNull: ['$bookingId', 'MISSING'] }, 'MISSING'] }, '$amount', 0] }
          },
          subscriptionRevenue: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$bookingId', 'MISSING'] }, 'MISSING'] }, '$amount', 0] }
          }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    const data = result[0] || { total: 0, count: 0, bookingRevenue: 0, subscriptionRevenue: 0 };

    try {
      const Transaction = (await import('../models/transaction.model.js')).default;
      const withdrawnAgg = await Transaction.aggregate([
        { $match: { type: 'withdrawal', status: { $in: ['pending', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalWithdrawn = withdrawnAgg[0]?.total || 0;
      data.total = Math.max(0, data.total - totalWithdrawn);
      data.bookingRevenue = Math.max(0, data.bookingRevenue - totalWithdrawn);
    } catch (error) {
      console.error('Error deducting withdrawals from total revenue:', error);
    }

    return data;
  }
}

export default new PaymentRepository();
