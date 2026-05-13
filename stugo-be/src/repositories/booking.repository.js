import BaseRepository from './base.repository.js';
import { Booking } from '../models/index.js';

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId }, {
      ...options,
      populate: 'serviceId',
      sort: { createdAt: -1 }
    });
  }

  async findByService(serviceId, options = {}) {
    return this.find({ serviceId }, {
      ...options,
      populate: 'userId',
      sort: { date: 1 }
    });
  }

  async findByOwner(ownerId, options = {}) {
    // First get all services by owner, then get bookings
    const Service = (await import('../models/service.model.js')).default;
    const services = await Service.find({ ownerId }).select('_id');
    const serviceIds = services.map(s => s._id);

    return this.find({ serviceId: { $in: serviceIds } }, {
      ...options,
      populate: 'userId serviceId',
      sort: { createdAt: -1 }
    });
  }

  async findByDateRange(startDate, endDate, options = {}) {
    return this.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }, options);
  }

  async getAvailableSlots(serviceId, date) {
    // Normalize date to start of day for accurate comparison
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await this.model.find({
      serviceId,
      date: { $gte: queryDate, $lt: nextDay },
      status: { $nin: ['cancelled'] }
    }).select('timeSlot quantity');

    return bookings;
  }

  async confirmBooking(bookingId) {
    return this.updateById(bookingId, {
      status: 'confirmed',
      confirmedAt: new Date()
    });
  }

  async completeBooking(bookingId) {
    return this.updateById(bookingId, {
      status: 'completed',
      completedAt: new Date()
    });
  }

  async cancelBooking(bookingId, userId, reason, refundAmount = 0) {
    return this.updateById(bookingId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancelReason: reason,
      refundAmount: refundAmount
    });
  }

  async updatePaymentStatus(bookingId, paymentStatus) {
    const updateData = { paymentStatus };

    // If fully paid, set remainingAmount to 0
    if (paymentStatus === 'fully_paid') {
      updateData.remainingAmount = 0;
    }

    return this.updateById(bookingId, updateData);
  }

  async getTodayBookings(serviceId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled'] }
    };

    if (serviceId) query.serviceId = serviceId;

    return this.find(query);
  }

  async getRevenueStats(ownerId, startDate, endDate) {
    const Service = (await import('../models/service.model.js')).default;
    const services = await Service.find({ ownerId }).select('_id');
    const serviceIds = services.map(s => s._id);

    const pipeline = [
      {
        $match: {
          serviceId: { $in: serviceIds },
          status: 'completed',
          paymentStatus: { $in: ['deposit_paid', 'fully_paid'] },
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalDeposit: { $sum: '$depositAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ];

    return this.aggregate(pipeline);
  }

  async getBookingStats(ownerId = null) {
    const matchStage = {};

    if (ownerId) {
      const Service = (await import('../models/service.model.js')).default;
      const services = await Service.find({ ownerId }).select('_id');
      const serviceIds = services.map(s => s._id);
      matchStage.serviceId = { $in: serviceIds };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ];

    return this.aggregate(pipeline);
  }
}

export default new BookingRepository();
