import { bookingRepository, serviceRepository, paymentRepository } from '../repositories/index.js';

/**
 * Get start and end of today in Vietnam timezone
 */
const getVietnamToday = () => {
    const now = new Date();

    // Vietnam is UTC+7
    const vnOffset = 7 * 60; // 7 hours in minutes
    const localOffset = now.getTimezoneOffset(); // Local offset in minutes (negative for UTC+)
    const totalOffset = vnOffset + localOffset; // Total offset to add

    // Get Vietnam time
    const vnTime = new Date(now.getTime() + totalOffset * 60 * 1000);

    // Start of day in Vietnam (00:00:00)
    const startOfDay = new Date(Date.UTC(
        vnTime.getFullYear(),
        vnTime.getMonth(),
        vnTime.getDate(),
        0, 0, 0, 0
    ));
    // Adjust back to UTC for database query
    startOfDay.setHours(startOfDay.getHours() - 7);

    // End of day in Vietnam (23:59:59.999)
    const endOfDay = new Date(Date.UTC(
        vnTime.getFullYear(),
        vnTime.getMonth(),
        vnTime.getDate(),
        23, 59, 59, 999
    ));
    // Adjust back to UTC for database query
    endOfDay.setHours(endOfDay.getHours() - 7);

    console.log('🕐 Vietnam Today:', {
        now: now.toISOString(),
        vnTime: vnTime.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
    });

    return { startOfDay, endOfDay };
};

/**
 * Get dashboard overview statistics
 * GET /api/dashboard/overview
 */
export const getDashboardOverview = async (req, res, next) => {
    try {
        const ownerId = req.userRole === 'admin' ? null : req.userId;

        console.log('📊 Dashboard Overview Request:', { ownerId, userRole: req.userRole });

        // Get services
        const Service = (await import('../models/service.model.js')).default;
        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);

        console.log('📦 Services found:', { count: services.length, serviceIds });

        // If no services, return empty data
        if (serviceIds.length === 0 && ownerId) {
            return res.json({
                success: true,
                data: {
                    services: {
                        total: 0,
                        active: 0,
                        inactive: 0
                    },
                    bookings: {
                        total: 0,
                        pending: 0,
                        confirmed: 0,
                        completed: 0,
                        cancelled: 0,
                        today: 0
                    },
                    revenue: {
                        total: 0,
                        thisMonth: 0
                    }
                }
            });
        }

        // Get bookings
        const bookingsQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};
        const Booking = (await import('../models/booking.model.js')).default;

        const [
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            cancelledBookings,
            todayBookings,
            totalRevenue,
            monthRevenue
        ] = await Promise.all([
            Booking.countDocuments(bookingsQuery),
            Booking.countDocuments({ ...bookingsQuery, status: 'pending' }),
            Booking.countDocuments({ ...bookingsQuery, status: 'confirmed' }),
            Booking.countDocuments({ ...bookingsQuery, status: 'completed' }),
            Booking.countDocuments({ ...bookingsQuery, status: 'cancelled' }),
            // Today bookings - Use Vietnam timezone
            (() => {
                const { startOfDay, endOfDay } = getVietnamToday();
                return Booking.countDocuments({
                    ...bookingsQuery,
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                });
            })(),
            // Total revenue = collected booking revenue + subscription revenue
            (async () => {
                const [bookingRevenue, subRevenue] = await Promise.all([
                    Booking.aggregate([
                        {
                            $match: {
                                ...bookingsQuery,
                                status: { $in: ['confirmed', 'completed'] },
                                paymentStatus: { $in: ['deposit_paid', 'fully_paid'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ['$paymentStatus', 'fully_paid'] },
                                            '$totalAmount',
                                            '$depositAmount'
                                        ]
                                    }
                                }
                            }
                        }
                    ]),
                    ownerId ? Promise.resolve([]) : (async () => {
                        const Subscription = (await import('../models/subscription.model.js')).default;
                        return Subscription.aggregate([
                            { $match: { status: 'active' } },
                            { $lookup: { from: 'subscriptionplans', localField: 'planId', foreignField: '_id', as: 'plan' } },
                            { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
                            { $group: { _id: null, total: { $sum: '$plan.price' } } }
                        ]);
                    })()
                ]);
                return [{ total: (bookingRevenue[0]?.total || 0) + (subRevenue[0]?.total || 0) }];
            })(),
            // This month revenue
            Booking.aggregate([
                {
                    $match: {
                        ...bookingsQuery,
                        status: { $in: ['confirmed', 'completed'] },
                        paymentStatus: { $in: ['deposit_paid', 'fully_paid'] },
                        date: {
                            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                            $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$paymentStatus', 'fully_paid'] },
                                    '$totalAmount',
                                    '$depositAmount'
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        // Debug: Check all bookings
        const allBookings = await Booking.find(bookingsQuery).select('serviceName paymentStatus totalAmount status createdAt date');
        console.log('🔍 All bookings:', allBookings.map(b => ({
            name: b.serviceName,
            status: b.status,
            paymentStatus: b.paymentStatus,
            amount: b.totalAmount,
            createdAt: b.createdAt,
            date: b.date
        })));

        // Debug: Check today's bookings specifically
        const { startOfDay: todayStart, endOfDay: todayEnd } = getVietnamToday();
        const todayBookingsDebug = await Booking.find({
            ...bookingsQuery,
            createdAt: { $gte: todayStart, $lt: todayEnd }
        }).select('serviceName createdAt');
        console.log('📅 Today bookings debug:', {
            todayStart: todayStart.toISOString(),
            todayEnd: todayEnd.toISOString(),
            todayBookingsCount: todayBookings,
            foundBookings: todayBookingsDebug.length,
            bookings: todayBookingsDebug.map(b => ({
                name: b.serviceName,
                createdAt: b.createdAt.toISOString()
            }))
        });

        // Debug: Check ALL bookings in DB (no filter)
        const allBookingsInDB = await Booking.find({}).select('serviceName paymentStatus totalAmount status serviceId').limit(10);
        console.log('🔍 ALL bookings in DB (first 10):', allBookingsInDB.map(b => ({
            name: b.serviceName,
            status: b.status,
            paymentStatus: b.paymentStatus,
            amount: b.totalAmount,
            serviceId: b.serviceId?.toString()
        })));

        console.log('📈 Stats:', {
            totalBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            monthRevenue: monthRevenue[0]?.total || 0
        });

        res.json({
            success: true,
            data: {
                services: {
                    total: services.length,
                    active: services.filter(s => s.status === 'active').length,
                    pending: services.filter(s => s.status === 'pending').length,
                    suspended: services.filter(s => ['suspended', 'rejected'].includes(s.status)).length
                },
                bookings: {
                    total: totalBookings,
                    pending: pendingBookings,
                    confirmed: confirmedBookings,
                    completed: completedBookings,
                    cancelled: cancelledBookings,
                    today: todayBookings
                },
                revenue: {
                    total: totalRevenue[0]?.total || 0,
                    thisMonth: monthRevenue[0]?.total || 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get revenue statistics by date range
 * GET /api/dashboard/revenue
 */
export const getRevenueStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const ownerId = req.userRole === 'admin' ? null : req.userId;

        // Default to last 12 months
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Get services
        const Service = (await import('../models/service.model.js')).default;
        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);

        // If no services, return empty data
        if (serviceIds.length === 0 && ownerId) {
            return res.json({
                success: true,
                data: []
            });
        }

        const matchQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};

        if (!ownerId) {
            // ADMIN: Query Payment collection to match Transaction History perfectly
            const Payment = (await import('../models/payment.model.js')).default;
            const revenueData = await Payment.aggregate([
                {
                    $match: {
                        status: 'paid',
                        $or: [
                            { paidAt: { $gte: start, $lte: end } },
                            { createdAt: { $gte: start, $lte: end } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: { $ifNull: ['$paidAt', '$createdAt'] } },
                            month: { $month: { $ifNull: ['$paidAt', '$createdAt'] } }
                        },
                        totalRevenue: { $sum: '$amount' },
                        bookingCount: { $sum: 1 } // Transactions count
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            return res.json({
                success: true,
                data: revenueData
            });
        }

        // PARTNER: Query Booking collection
        const Booking = (await import('../models/booking.model.js')).default;
        const bookingRevenue = await Booking.aggregate([
            {
                $match: {
                    ...matchQuery,
                    status: { $in: ['confirmed', 'completed'] },
                    paymentStatus: { $in: ['deposit_paid', 'fully_paid'] },
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    totalRevenue: { 
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentStatus', 'fully_paid'] },
                                '$totalAmount',
                                '$depositAmount'
                            ]
                        }
                    },
                    bookingCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            success: true,
            data: bookingRevenue
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get booking statistics by service type
 * GET /api/dashboard/bookings-by-type
 */
export const getBookingsByType = async (req, res, next) => {
    try {
        const ownerId = req.userRole === 'admin' ? null : req.userId;

        // Get services
        const Service = (await import('../models/service.model.js')).default;
        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);

        // If no services, return empty data
        if (serviceIds.length === 0 && ownerId) {
            return res.json({
                success: true,
                data: []
            });
        }

        const matchQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};

        const Booking = (await import('../models/booking.model.js')).default;
        const bookingsByType = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$serviceType',
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: bookingsByType
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get recent bookings
 * GET /api/dashboard/recent-bookings
 */
export const getRecentBookings = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        const ownerId = req.userRole === 'admin' ? null : req.userId;

        // Get services
        const Service = (await import('../models/service.model.js')).default;
        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);

        // If no services, return empty data
        if (serviceIds.length === 0 && ownerId) {
            return res.json({
                success: true,
                data: []
            });
        }

        const matchQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};

        const Booking = (await import('../models/booking.model.js')).default;
        const recentBookings = await Booking.find(matchQuery)
            .populate('userId', 'fullName email phone')
            .populate('serviceId', 'name type')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: recentBookings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get top services by revenue
 * GET /api/dashboard/top-services
 */
export const getTopServices = async (req, res, next) => {
    try {
        const { limit = 5 } = req.query;
        const ownerId = req.userRole === 'admin' ? null : req.userId;

        // Get services
        const Service = (await import('../models/service.model.js')).default;
        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);

        // If no services, return empty data
        if (serviceIds.length === 0 && ownerId) {
            return res.json({
                success: true,
                data: []
            });
        }

        const matchQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};

        const Booking = (await import('../models/booking.model.js')).default;
        const topServices = await Booking.aggregate([
            {
                $match: {
                    ...matchQuery,
                    status: 'confirmed',
                    paymentStatus: 'fully_paid'
                }
            },
            {
                $group: {
                    _id: '$serviceId',
                    serviceName: { $first: '$serviceName' },
                    serviceType: { $first: '$serviceType' },
                    totalRevenue: { $sum: '$totalAmount' },
                    bookingCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({
            success: true,
            data: topServices
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getDashboardOverview,
    getRevenueStats,
    getBookingsByType,
    getRecentBookings,
    getTopServices
};
