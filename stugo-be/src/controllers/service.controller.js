import { serviceRepository, reviewRepository } from '../repositories/index.js';
import Booking from '../models/booking.model.js';

/**
 * Get all services with filters
 * GET /api/services
 */
export const getServices = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      city: req.query.city,
      district: req.query.district,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,
      rating: req.query.rating,
      isAvailable: req.query.isAvailable,
      search: req.query.search,
      sortBy: req.query.sortBy
    };

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20
    };

    const result = await serviceRepository.findWithFilters(filters, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get service by ID
 * GET /api/services/:id
 */
export const getServiceById = async (req, res, next) => {
  try {
    const service = await serviceRepository.findById(req.params.id, 'ownerId');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Increment popularity view count
    await serviceRepository.incrementPopularity(service._id);

    // Get reviews stats
    const reviewStats = await reviewRepository.getServiceRatingStats(service._id);

    res.json({
      success: true,
      data: {
        ...service.toObject(),
        reviewStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new transport service (Partner/Admin only)
 * POST /api/services/transport
 */
export const createTransportService = async (req, res, next) => {
  try {
    const { vehicleType, seats, routes, departureTime } = req.body;

    // Validate transport-specific fields
    if (!vehicleType || !seats || !routes || !departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: loại xe, số ghế, tuyến đường, giờ khởi hành'
      });
    }

    if (!Array.isArray(routes) || routes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm ít nhất 1 tuyến đường'
      });
    }

    if (!Array.isArray(departureTime) || departureTime.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm ít nhất 1 giờ khởi hành'
      });
    }

    // Calculate priceRange from routes
    const cleanRoutes = routes.map(r => {
      if (typeof r === 'string') {
        return { name: r, price: req.body.priceRange?.min || 0 };
      }
      return { name: r.name, price: Number(r.price) || 0 };
    });
    const prices = cleanRoutes.map(r => r.price || 0);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    };

    const ownerId = (req.userRole === 'admin' && req.body.ownerId) ? req.body.ownerId : req.userId;
    const status = req.userRole === 'admin' ? (req.body.status || 'active') : 'pending';

    const serviceData = {
      type: 'transport',
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      ward: req.body.ward,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude) || 0,  // longitude TRƯỚC
          parseFloat(req.body.latitude) || 0     // latitude SAU
        ]
      },
      images: req.body.images || [],
      openTime: req.body.openTime || '05:00',
      closeTime: req.body.closeTime || '22:00',
      priceRange,
      ownerId,
      status,
      // Transport specific
      vehicleType,
      seats: parseInt(seats),
      routes: cleanRoutes,
      departureTime
    };

    const service = await serviceRepository.create(serviceData);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Tạo dịch vụ nhà xe thành công. Đang chờ phê duyệt.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new accommodation service (Partner/Admin only)
 * POST /api/services/accommodation
 */
export const createAccommodationService = async (req, res, next) => {
  try {
    const { roomTypes, amenities } = req.body;

    // Validate accommodation-specific fields
    if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm ít nhất 1 loại phòng'
      });
    }

    // Validate each room type
    for (const room of roomTypes) {
      if (!room.name || !room.price || !room.capacity || room.available === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin loại phòng không đầy đủ (cần: tên, giá, sức chứa, số phòng trống)'
        });
      }
    }

    const ownerId = (req.userRole === 'admin' && req.body.ownerId) ? req.body.ownerId : req.userId;
    const status = req.userRole === 'admin' ? (req.body.status || 'active') : 'pending';

    const serviceData = {
      type: 'accommodation',
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      ward: req.body.ward,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude) || 0,  // longitude TRƯỚC
          parseFloat(req.body.latitude) || 0     // latitude SAU
        ]
      },
      images: req.body.images || [],
      openTime: req.body.openTime || '00:00',
      closeTime: req.body.closeTime || '23:59',
      priceRange: req.body.priceRange,
      ownerId,
      status,
      // Accommodation specific
      roomTypes: roomTypes.map(rt => ({
        name: rt.name,
        price: parseInt(rt.price),
        capacity: parseInt(rt.capacity),
        available: parseInt(rt.available),
        images: rt.images || []
      })),
      amenities: amenities || [],
      rules: req.body.rules || []
    };

    const service = await serviceRepository.create(serviceData);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Tạo dịch vụ nhà trọ thành công. Đang chờ phê duyệt.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new restaurant service (Partner/Admin only)
 * POST /api/services/restaurant
 */
export const createRestaurantService = async (req, res, next) => {
  try {
    const { menuItems, cuisine, hasDelivery, hasReservation } = req.body;

    // Validate restaurant-specific fields
    if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm ít nhất 1 món ăn'
      });
    }

    // Validate each menu item
    for (const item of menuItems) {
      if (!item.name || !item.price) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin món ăn không đầy đủ (cần: tên, giá)'
        });
      }
    }

    const ownerId = (req.userRole === 'admin' && req.body.ownerId) ? req.body.ownerId : req.userId;
    const status = req.userRole === 'admin' ? (req.body.status || 'active') : 'pending';

    const serviceData = {
      type: 'restaurant',
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      ward: req.body.ward,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude) || 0,  // longitude TRƯỚC
          parseFloat(req.body.latitude) || 0     // latitude SAU
        ]
      },
      images: req.body.images || [],
      openTime: req.body.openTime || '08:00',
      closeTime: req.body.closeTime || '22:00',
      priceRange: req.body.priceRange,
      ownerId,
      status,
      // Restaurant specific
      cuisine: cuisine || [],
      menuItems: menuItems.map(item => ({
        name: item.name,
        price: parseInt(item.price),
        description: item.description || '',
        image: item.image || '',
        category: item.category || ''
      })),
      hasDelivery: hasDelivery === true,
      hasReservation: hasReservation === true
    };

    const service = await serviceRepository.create(serviceData);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Tạo dịch vụ quán ăn thành công. Đang chờ phê duyệt.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new service (Generic - routes to specific handlers)
 * POST /api/services
 */
export const createService = async (req, res, next) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn loại dịch vụ'
      });
    }

    // Route to specific handler based on type
    switch (type) {
      case 'transport':
        return createTransportService(req, res, next);
      case 'accommodation':
        return createAccommodationService(req, res, next);
      case 'restaurant':
        return createRestaurantService(req, res, next);
      default:
        return res.status(400).json({
          success: false,
          message: 'Loại dịch vụ không hợp lệ'
        });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update service
 * PUT /api/services/:id
 */
export const updateService = async (req, res, next) => {
  try {
    const service = await serviceRepository.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Check ownership (unless admin)
    if (service.ownerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa'
      });
    }

    const updateData = { ...req.body };

    // Prevent non-admin users from changing ownerId
    if (req.userRole !== 'admin') {
      delete updateData.ownerId;
    }

    // Update location if coordinates provided
    if (req.body.longitude && req.body.latitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ]
      };
    }

    // Update priceRange for transport dynamically based on route prices
    if (service.type === 'transport' && updateData.routes && Array.isArray(updateData.routes)) {
      const cleanRoutes = updateData.routes.map(r => {
        if (typeof r === 'string') {
          return { name: r, price: updateData.priceRange?.min || service.priceRange?.min || 0 };
        }
        return { name: r.name, price: Number(r.price) || 0 };
      });
      updateData.routes = cleanRoutes;
      if (cleanRoutes.length > 0) {
        const prices = cleanRoutes.map(r => r.price || 0);
        updateData.priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
      }
    }

    const updated = await serviceRepository.updateById(req.params.id, updateData);

    res.json({
      success: true,
      data: updated,
      message: 'Cập nhật dịch vụ thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete service
 * DELETE /api/services/:id
 */
export const deleteService = async (req, res, next) => {
  try {
    const service = await serviceRepository.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Check ownership (unless admin)
    if (service.ownerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa'
      });
    }

    await serviceRepository.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Xóa dịch vụ thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get owner's services
 * GET /api/services/my
 */
export const getMyServices = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20
    };

    const result = await serviceRepository.findByOwner(req.userId, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular services
 * GET /api/services/popular
 */
export const getPopularServices = async (req, res, next) => {
  try {
    const { type, limit = 10 } = req.query;

    const services = await serviceRepository.getPopularServices(type, parseInt(limit));

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby services with flash deals and live vehicles
 * GET /api/services/nearby
 */
export const getNearbyServices = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 5000, limit = 50, types } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tọa độ vị trí'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Tọa độ không hợp lệ'
      });
    }

    // Build type filter
    const typeFilter = types
      ? { type: { $in: Array.isArray(types) ? types : types.split(',') } }
      : {};

    // Geospatial query using $geoNear aggregation
    const services = await serviceRepository.model.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: { status: 'active', isAvailable: true, ...typeFilter }
        }
      },
      { $limit: parseInt(limit) }
    ]);

    // Extract active flash deals from result set
    const now = new Date();
    const flashDeals = services
      .filter(s => s.flashDeal && s.flashDeal.isActive && s.flashDeal.expiresAt > now)
      .map(s => ({
        serviceId: s._id,
        serviceName: s.name,
        originalPrice: s.priceRange.min,
        dealPrice: s.flashDeal.dealPrice,
        discountPercent: s.flashDeal.discountPercent,
        expiresAt: s.flashDeal.expiresAt,
        location: s.location
      }));

    // Live vehicles: confirmed transport bookings for today scoped to requesting user
    let liveVehicles = [];
    if (req.userId) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const transportBookings = await Booking.find({
        userId: req.userId,
        serviceType: 'transport',
        status: 'confirmed',
        date: { $gte: todayStart, $lte: todayEnd }
      }).populate('serviceId', 'name location routes');

      liveVehicles = transportBookings.map(b => ({
        bookingId: b._id,
        serviceId: b.serviceId?._id,
        serviceName: b.serviceId?.name,
        currentLocation: b.serviceId?.location,
        route: b.route,
        timeSlot: b.timeSlot
      }));
    }

    res.json({
      success: true,
      data: { services, flashDeals, liveVehicles }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve/Reject service (Admin only)
 * PATCH /api/services/:id/status
 */
export const updateServiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'pending', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const service = await serviceRepository.updateById(req.params.id, { status });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    res.json({
      success: true,
      data: service,
      message: `Dịch vụ đã được ${status === 'active' ? 'phê duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật'}`
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getServices,
  getServiceById,
  createService,
  createTransportService,
  createAccommodationService,
  createRestaurantService,
  updateService,
  deleteService,
  getMyServices,
  getPopularServices,
  getNearbyServices,
  updateServiceStatus
};
