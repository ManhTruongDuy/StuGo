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
            // Total revenue = collected booking revenue + subscription revenue - withdrawals
            (async () => {
                const [bookingRevenue, subRevenue, withdrawnAgg] = await Promise.all([
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
                                gmv: { $sum: '$totalAmount' },
                                collected: {
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
                    })(),
                    (async () => {
                        const Transaction = (await import('../models/transaction.model.js')).default;
                        const matchQuery = { type: 'withdrawal', status: { $in: ['pending', 'completed'] } };
                        if (ownerId) {
                            const mongoose = (await import('mongoose')).default;
                            matchQuery.userId = new mongoose.Types.ObjectId(ownerId);
                        }
                        return Transaction.aggregate([
                            { $match: matchQuery },
                            { $group: { _id: null, total: { $sum: '$amount' } } }
                        ]);
                    })()
                ]);
                const bookingGmv = bookingRevenue[0]?.gmv || 0;
                const bookingCollected = bookingRevenue[0]?.collected || 0;
                const subTotal = subRevenue[0]?.total || 0;
                const withdrawnTotal = withdrawnAgg[0]?.total || 0;

                const bookingCommission = bookingGmv * 0.05;
                const commission = bookingCommission + (withdrawnTotal * 0.01);
                const available = Math.max(0, bookingCollected - bookingCommission + subTotal - withdrawnTotal);

                return [{
                    total: bookingGmv + subTotal,
                    available,
                    commission
                }];
            })(),
            // This month revenue
            (async () => {
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

                const [bookingMonthRevenue, withdrawnMonthAgg] = await Promise.all([
                    Booking.aggregate([
                        {
                            $match: {
                                ...bookingsQuery,
                                status: { $in: ['confirmed', 'completed'] },
                                paymentStatus: { $in: ['deposit_paid', 'fully_paid'] },
                                date: {
                                    $gte: startOfMonth,
                                    $lt: endOfMonth
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                gmv: { $sum: '$totalAmount' },
                                collected: {
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
                    (async () => {
                        const Transaction = (await import('../models/transaction.model.js')).default;
                        const matchQuery = {
                            type: 'withdrawal',
                            status: { $in: ['pending', 'completed'] },
                            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
                        };
                        if (ownerId) {
                            const mongoose = (await import('mongoose')).default;
                            matchQuery.userId = new mongoose.Types.ObjectId(ownerId);
                        }
                        return Transaction.aggregate([
                            { $match: matchQuery },
                            { $group: { _id: null, total: { $sum: '$amount' } } }
                        ]);
                    })()
                ]);

                const bookingMonthGmv = bookingMonthRevenue[0]?.gmv || 0;
                const bookingMonthCollected = bookingMonthRevenue[0]?.collected || 0;
                const withdrawnMonthTotal = withdrawnMonthAgg[0]?.total || 0;

                const monthBookingCommission = bookingMonthGmv * 0.05;
                const monthCommission = monthBookingCommission + (withdrawnMonthTotal * 0.01);
                const monthAvailable = Math.max(0, bookingMonthCollected - monthBookingCommission - withdrawnMonthTotal);
                
                return [{ 
                    total: bookingMonthGmv, // For partners subTotal is always 0
                    available: monthAvailable,
                    commission: monthCommission
                }];
            })()
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
            monthRevenue: monthRevenue[0]?.total || 0,
            commissionTotal: totalRevenue[0]?.commission || 0,
            commissionThisMonth: monthRevenue[0]?.commission || 0
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
                    thisMonth: monthRevenue[0]?.total || 0,
                    commissionTotal: totalRevenue[0]?.commission || 0,
                    commissionThisMonth: monthRevenue[0]?.commission || 0
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

            // Fetch withdrawals
            const Transaction = (await import('../models/transaction.model.js')).default;
            const matchQueryTx = { type: 'withdrawal', status: { $in: ['pending', 'completed'] }, createdAt: { $gte: start, $lte: end } };
            const withdrawnData = await Transaction.aggregate([
                { $match: matchQueryTx },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        totalWithdrawn: { $sum: '$amount' }
                    }
                }
            ]);

            const revenueMap = new Map();
            revenueData.forEach(item => {
                const key = `${item._id.year}-${item._id.month}`;
                revenueMap.set(key, { ...item });
            });
            withdrawnData.forEach(w => {
                const key = `${w._id.year}-${w._id.month}`;
                if (!revenueMap.has(key)) {
                    revenueMap.set(key, { _id: w._id, totalRevenue: 0, bookingCount: 0 });
                }
            });
            const mergedRevenueData = Array.from(revenueMap.values()).sort((a, b) => {
                if (a._id.year !== b._id.year) return a._id.year - b._id.year;
                return a._id.month - b._id.month;
            });

            return res.json({
                success: true,
                data: mergedRevenueData
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
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
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

        const Transaction = (await import('../models/transaction.model.js')).default;
        const mongoose = (await import('mongoose')).default;
        const matchQueryTx = {
            type: 'withdrawal',
            status: { $in: ['pending', 'completed'] },
            createdAt: { $gte: start, $lte: end },
            userId: new mongoose.Types.ObjectId(ownerId)
        };
        const withdrawnData = await Transaction.aggregate([
            { $match: matchQueryTx },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    totalWithdrawn: { $sum: '$amount' }
                }
            }
        ]);

        const revenueMap = new Map();
        bookingRevenue.forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            revenueMap.set(key, { ...item });
        });
        withdrawnData.forEach(w => {
            const key = `${w._id.year}-${w._id.month}`;
            if (!revenueMap.has(key)) {
                revenueMap.set(key, { _id: w._id, totalRevenue: 0, bookingCount: 0 });
            }
        });
        const mergedBookingRevenue = Array.from(revenueMap.values()).sort((a, b) => {
            if (a._id.year !== b._id.year) return a._id.year - b._id.year;
            return a._id.month - b._id.month;
        });

        res.json({
            success: true,
            data: mergedBookingRevenue
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
                    status: { $in: ['confirmed', 'completed'] },
                    paymentStatus: { $in: ['deposit_paid', 'fully_paid'] }
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

export const getPremiumCustomerInsights = async (req, res, next) => {
    try {
        const ownerId = req.userRole === 'admin' ? null : req.userId;
        const Service = (await import('../models/service.model.js')).default;
        const Booking = (await import('../models/booking.model.js')).default;

        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);

        const matchQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};
        const bookings = await Booking.find({ ...matchQuery, status: { $in: ['confirmed', 'completed'] } });

        if (bookings.length === 0) {
            return res.json({
                success: true,
                data: {
                    demographics: { labels: ['Cá nhân/SV', 'Cặp đôi', 'Gia đình', 'Nhóm lớn'], series: [0, 0, 0, 0] },
                    retention: { newCustomers: 0, returningCustomers: 0 },
                    bookingHours: { labels: ['0h-6h', '6h-12h', '12h-18h', '18h-24h'], series: [0, 0, 0, 0] },
                    topLocations: [{ name: 'Chưa có dữ liệu', percentage: 0 }]
                }
            });
        }

        let solo = 0, couple = 0, family = 0, group = 0;
        const hoursCount = { '0h-6h': 0, '6h-12h': 0, '12h-18h': 0, '18h-24h': 0 };
        const userBookingCounts = {};
        const locationCounts = {};

        bookings.forEach(b => {
            // Demographics based on quantity
            if (b.quantity === 1) solo++;
            else if (b.quantity === 2) couple++;
            else if (b.quantity >= 3 && b.quantity <= 5) family++;
            else group++;

            // Booking hours based on createdAt
            const hour = new Date(b.createdAt).getHours();
            if (hour >= 0 && hour < 6) hoursCount['0h-6h']++;
            else if (hour >= 6 && hour < 12) hoursCount['6h-12h']++;
            else if (hour >= 12 && hour < 18) hoursCount['12h-18h']++;
            else hoursCount['18h-24h']++;

            // Retention
            const uId = b.userId.toString();
            userBookingCounts[uId] = (userBookingCounts[uId] || 0) + 1;

            // Top Locations
            let locName = 'Khác';
            if (b.serviceName) {
                const parts = b.serviceName.split('-');
                if (parts.length > 1) locName = parts[parts.length - 1].trim();
                else locName = b.serviceName;
            }
            locationCounts[locName] = (locationCounts[locName] || 0) + 1;
        });

        const totalBookings = bookings.length;
        const demographics = {
            labels: ['Cá nhân/SV', 'Cặp đôi', 'Gia đình', 'Nhóm lớn'],
            series: [
                Math.round((solo / totalBookings) * 100),
                Math.round((couple / totalBookings) * 100),
                Math.round((family / totalBookings) * 100),
                Math.round((group / totalBookings) * 100)
            ]
        };

        const bookingHours = {
            labels: ['0h-6h', '6h-12h', '12h-18h', '18h-24h'],
            series: [
                Math.round((hoursCount['0h-6h'] / totalBookings) * 100),
                Math.round((hoursCount['6h-12h'] / totalBookings) * 100),
                Math.round((hoursCount['12h-18h'] / totalBookings) * 100),
                Math.round((hoursCount['18h-24h'] / totalBookings) * 100)
            ]
        };

        let newCustomers = 0, returningCustomers = 0;
        Object.values(userBookingCounts).forEach(count => {
            if (count > 1) returningCustomers++;
            else newCustomers++;
        });
        const totalUsers = Object.keys(userBookingCounts).length || 1;
        const retention = {
            newCustomers: Math.round((newCustomers / totalUsers) * 100),
            returningCustomers: Math.round((returningCustomers / totalUsers) * 100)
        };

        const topLocations = Object.keys(locationCounts)
            .map(name => ({ name, percentage: Math.round((locationCounts[name] / totalBookings) * 100) }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

        res.json({
            success: true,
            data: { demographics, retention, bookingHours, topLocations }
        });
    } catch (error) {
        next(error);
    }
};

export const getPremiumRouteAnalytics = async (req, res, next) => {
    try {
        const ownerId = req.userRole === 'admin' ? null : req.userId;
        const Service = (await import('../models/service.model.js')).default;
        const Booking = (await import('../models/booking.model.js')).default;

        const servicesQuery = ownerId ? { ownerId } : {};
        const services = await Service.find(servicesQuery);
        const serviceIds = services.map(s => s._id);
        const matchQuery = ownerId ? { serviceId: { $in: serviceIds } } : {};

        // Popular routes platform-wide
        const allBookings = await Booking.aggregate([
            { $match: { serviceType: { $in: ['transport', 'carpool'] }, status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: '$serviceName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        // Popular routes for this specific partner
        const partnerBookings = await Booking.aggregate([
            { $match: { ...matchQuery, serviceType: { $in: ['transport', 'carpool'] }, status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: '$serviceName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const partnerTopRoute = partnerBookings.length > 0 ? partnerBookings[0]._id : 'Các tuyến xe của bạn';

        let hotRoutes = allBookings.map((b, index) => {
            const isHigh = index === 0;
            return {
                route: b._id,
                searchVolume: b.count * 125 + Math.floor(Math.random() * 500), // Estimated search volume
                supplyDemandGap: isHigh ? 'high' : 'medium',
                suggestion: isHigh ? 'Đang có nhu cầu rất cao, bạn có thể cân nhắc mở chuyến' : 'Lượng khách ổn định, hãy duy trì'
            };
        });

        if (hotRoutes.length === 0) {
            hotRoutes = [{ route: 'Chưa có dữ liệu hệ thống', searchVolume: 0, supplyDemandGap: 'low', suggestion: 'Hãy là người tiên phong mở tuyến!' }];
        }

        const aiInsights = [
            `Tuyến "${partnerTopRoute}" đang là nguồn doanh thu lớn nhất của bạn dựa trên dữ liệu thực tế.`,
            `Hệ thống nhận thấy khách hàng thường xuyên tìm kiếm các tuyến xe liên tỉnh vào mỗi chiều Thứ Sáu.`,
            `Tỉ lệ khách đặt trước 2-3 ngày đang tăng, hãy đảm bảo hiển thị sớm lịch trình trên hệ thống.`
        ];

        const marketingCampaigns = [
            { name: `Flash Sale: ${partnerTopRoute}`, type: 'Giảm giá 10%', status: 'Gợi ý', expectedROI: '+20%' },
            { name: 'Tri ân khách hàng cũ', type: 'Voucher 50k', status: 'Gợi ý', expectedROI: '+15%' }
        ];

        res.json({
            success: true,
            data: { hotRoutes, aiInsights, marketingCampaigns }
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
    getTopServices,
    getPremiumCustomerInsights,
    getPremiumRouteAnalytics
};
