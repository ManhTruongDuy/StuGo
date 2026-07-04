import mongoose from 'mongoose';
import { bookingRepository, serviceRepository } from '../repositories/index.js';
import emailService from '../services/email.service.js';

/**
 * Get user's bookings
 * GET /api/bookings
 */
export const getBookings = async (req, res, next) => {
  try {
    const { status, serviceType, startDate, endDate } = req.query;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20
    };

    // Build query filters
    const query = {};

    if (status) {
      query.status = status;
    }

    if (serviceType) {
      if (serviceType === 'transport' || serviceType === 'carpool') {
        query.serviceType = { $in: ['transport', 'carpool'] };
      } else {
        query.serviceType = serviceType;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    let result;

    if (req.userRole === 'admin') {
      // Admin can see all bookings
      result = await bookingRepository.find(query, {
        ...options,
        populate: 'serviceId userId',
        sort: { createdAt: -1 }
      });
    } else if (req.userRole === 'partner') {
      // Partner sees their services' bookings
      // First get all services by owner, then apply filters
      const Service = (await import('../models/service.model.js')).default;
      const services = await Service.find({ ownerId: req.userId }).select('_id');
      const serviceIds = services.map(s => s._id);

      query.serviceId = { $in: serviceIds };
      result = await bookingRepository.find(query, {
        ...options,
        populate: 'userId serviceId',
        sort: { createdAt: -1 }
      });
    } else {
      // User sees their own bookings
      query.userId = req.userId;
      result = await bookingRepository.find(query, {
        ...options,
        populate: 'serviceId',
        sort: { createdAt: -1 }
      });
    }

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
 * Get booking by ID
 * GET /api/bookings/:id
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingRepository.findById(req.params.id, 'userId serviceId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    // Check access permission
    const service = await serviceRepository.findById(booking.serviceId);
    const isOwner = booking.userId.toString() === req.userId;
    const isServiceOwner = service && service.ownerId.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isOwner && !isServiceOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem đặt chỗ này'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new booking
 * POST /api/bookings
 */
export const createBooking = async (req, res, next) => {
  try {
    const { serviceId, comboId, date, timeSlot, quantity, route, roomTypeId, customerInfo, orderItems, seats, tourOptions } = req.body;

    if (comboId) {
      const Combo = (await import('../models/combo.model.js')).default;
      const comboDoc = await Combo.findById(comboId).populate('linkedServices.serviceId');
      
      if (!comboDoc) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy Combo' });
      }

      if (comboDoc.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Combo hiện không khả dụng' });
      }

      if (!tourOptions || !tourOptions.serviceType) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn loại hình phục vụ (served/unserved/private)' });
      }

      const optionPrices = comboDoc.pricing || {};
      let basePrice = 0;
      if (tourOptions.serviceType === 'served') basePrice = optionPrices.servedPrice;
      else if (tourOptions.serviceType === 'unserved') basePrice = optionPrices.unservedPrice;
      else if (tourOptions.serviceType === 'private') basePrice = optionPrices.privateRentalPrice;

      if (!basePrice) {
        return res.status(400).json({ success: false, message: 'Loại hình phục vụ này chưa được cấu hình giá' });
      }

      let totalNetPrice = 0;
      const splitPayments = [];
      comboDoc.linkedServices.forEach(ls => {
        const netPrice = ls.netPriceAtBooking || 0;
        totalNetPrice += netPrice;
        if (netPrice > 0) {
          splitPayments.push({
            supplierId: ls.supplierId,
            serviceId: ls.serviceId._id,
            amount: netPrice,
            status: 'pending'
          });
        }
      });

      const bookingQuantity = quantity || 1;
      const totalAmount = basePrice * bookingQuantity;
      
      // Prevent selling combo for loss
      if (totalAmount < totalNetPrice * bookingQuantity) {
        return res.status(400).json({ success: false, message: 'Giá bán Combo không hợp lệ (thấp hơn giá vốn gốc)' });
      }

      const depositAmount = totalAmount;

      const comboBookingDate = new Date(date);
      comboBookingDate.setHours(0, 0, 0, 0);

      const booking = await bookingRepository.create({
        userId: req.userId,
        comboId,
        serviceName: comboDoc.name,
        serviceType: 'combo',
        date: comboBookingDate,
        quantity: bookingQuantity,
        unitPrice: basePrice,
        totalAmount,
        depositAmount,
        customerInfo,
        tourOptions,
        splitPayments,
        status: 'pending',
        paymentStatus: 'pending'
      });

      emailService.sendBookingSuccessEmail(req.user.email, req.user.fullName, booking).catch(console.error);

      return res.status(201).json({
        success: true,
        data: booking,
        message: 'Tạo đặt Combo thành công. Vui lòng thanh toán để xác nhận.'
      });
    }

    // Get service details - convert to plain object to ensure subdocument _id is accessible
    const serviceDoc = await serviceRepository.findById(serviceId);

    if (!serviceDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Convert to plain object to ensure subdocument _id is properly accessible
    const service = serviceDoc.toObject ? serviceDoc.toObject() : serviceDoc;

    if (!service.isAvailable || service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Dịch vụ hiện không khả dụng'
      });
    }

    // Validate based on service type
    if (service.type === 'transport') {
      // TRANSPORT: Validate route, departureTime, and seats
      if (!route || !timeSlot) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn chuyến và giờ khởi hành'
        });
      }

      // Check if departureTime exists
      if (!service.departureTime || !service.departureTime.includes(timeSlot)) {
        return res.status(400).json({
          success: false,
          message: 'Giờ khởi hành không hợp lệ'
        });
      }

      // Check if route exists
      const selectedRouteObj = service.routes?.find(r => (typeof r === 'string' ? r === route : r.name === route));
      if (!selectedRouteObj) {
        return res.status(400).json({
          success: false,
          message: 'Tuyến đường không hợp lệ'
        });
      }

      // Check available seats for this route and time
      // Normalize date to start of day for accurate comparison
      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(bookingDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const bookingsForSlot = await bookingRepository.model.find({
        serviceId,
        date: { $gte: bookingDate, $lt: nextDay },
        timeSlot,
        route,
        status: { $nin: ['cancelled'] }
      });

      const bookedSeats = bookingsForSlot.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const availableSeats = (service.seats || 0) - bookedSeats;

      const bookingQuantity = (seats && Array.isArray(seats) && seats.length > 0) ? seats.length : quantity;

      if (availableSeats < bookingQuantity) {
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${availableSeats} ghế trống. Vui lòng chọn số lượng ít hơn.`
        });
      }

      // Check if selected seats are already booked
      if (seats && Array.isArray(seats) && seats.length > 0) {
        const alreadyBookedSeats = [];
        bookingsForSlot.forEach(b => {
          if (b.seats && Array.isArray(b.seats)) {
            alreadyBookedSeats.push(...b.seats);
          }
        });
        const conflictSeats = seats.filter(s => alreadyBookedSeats.includes(s));
        if (conflictSeats.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Ghế ${conflictSeats.join(', ')} đã có người đặt. Vui lòng chọn chỗ ngồi khác.`
          });
        }
      }

      // Calculate pricing
      const isPremium = req.user && (req.user.plan === 'premium_user' || req.user.plan === 'premium');
      const basePrice = selectedRouteObj && typeof selectedRouteObj !== 'string' ? selectedRouteObj.price : service.priceRange.min;
      const unitPrice = isPremium ? basePrice : Math.round(basePrice * 1.05);
      const totalAmount = unitPrice * bookingQuantity;
      const depositAmount = totalAmount;

      // Use the already normalized bookingDate from above
      // Create booking
      const booking = await bookingRepository.create({
        userId: req.userId,
        serviceId,
        serviceName: service.name,
        serviceType: service.type,
        date: bookingDate,
        timeSlot,
        route,
        quantity: bookingQuantity,
        seats: seats || [],
        unitPrice,
        totalAmount,
        depositAmount,
        customerInfo,
        status: 'pending',
        paymentStatus: 'pending'
      });

      emailService.sendBookingSuccessEmail(req.user.email, req.user.fullName, booking).catch(console.error);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Tạo đặt chỗ thành công. Vui lòng thanh toán để xác nhận.'
      });

    } else if (service.type === 'accommodation') {
      // ACCOMMODATION: Validate roomType and available rooms
      if (!roomTypeId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn loại phòng'
        });
      }

      const roomType = service.roomTypes?.find(r => r._id.toString() === roomTypeId);
      if (!roomType) {
        return res.status(400).json({
          success: false,
          message: 'Loại phòng không hợp lệ'
        });
      }

      // Check available rooms for this date
      // Normalize date to start of day for accurate comparison
      const roomBookingDate = new Date(date);
      roomBookingDate.setHours(0, 0, 0, 0);
      const roomNextDay = new Date(roomBookingDate);
      roomNextDay.setDate(roomNextDay.getDate() + 1);

      const bookingsForDate = await bookingRepository.model.find({
        serviceId,
        date: { $gte: roomBookingDate, $lt: roomNextDay },
        roomTypeId,
        status: { $nin: ['cancelled'] }
      });

      const bookedRooms = bookingsForDate.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const availableRooms = (roomType.available || 0) - bookedRooms;

      if (availableRooms < quantity) {
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${availableRooms} phòng trống. Vui lòng chọn số lượng ít hơn.`
        });
      }

      // Calculate pricing
      const isPremium = req.user && (req.user.plan === 'premium_user' || req.user.plan === 'premium');
      const basePrice = roomType.price || service.priceRange.min;
      const unitPrice = isPremium ? basePrice : Math.round(basePrice * 1.05);
      const totalAmount = unitPrice * quantity;
      const depositAmount = totalAmount;

      // Normalize date to start of day for consistency
      const accommodationBookingDate = new Date(date);
      accommodationBookingDate.setHours(0, 0, 0, 0);

      // Create booking
      const booking = await bookingRepository.create({
        userId: req.userId,
        serviceId,
        serviceName: service.name,
        serviceType: service.type,
        date: accommodationBookingDate,
        roomTypeId,
        roomTypeName: roomType.name,
        quantity,
        unitPrice,
        totalAmount,
        depositAmount,
        customerInfo,
        status: 'pending',
        paymentStatus: 'pending'
      });

      emailService.sendBookingSuccessEmail(req.user.email, req.user.fullName, booking).catch(console.error);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Tạo đặt chỗ thành công. Vui lòng thanh toán để xác nhận.'
      });

    } else if (service.type === 'restaurant') {
      // RESTAURANT: Validate reservation/delivery and operating hours
      // Convert service to plain object to ensure subdocument _id is accessible
      const serviceObj = service.toObject ? service.toObject() : service;
      const bookingType = req.body.bookingType; // 'reservation' or 'order'

      if (bookingType === 'reservation') {
        if (!serviceObj.hasReservation) {
          return res.status(400).json({
            success: false,
            message: 'Nhà hàng không hỗ trợ đặt bàn'
          });
        }

        if (!timeSlot) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn khung giờ'
          });
        }

        // Check operating hours
        const slotHour = parseInt(timeSlot.split(':')[0]);
        const openHour = parseInt(serviceObj.openTime.split(':')[0]);
        const closeHour = parseInt(serviceObj.closeTime.split(':')[0]);

        if (slotHour < openHour || slotHour >= closeHour) {
          return res.status(400).json({
            success: false,
            message: 'Khung giờ ngoài giờ mở cửa'
          });
        }

        // Check available tables for this time slot
        // Normalize date to start of day for accurate comparison
        const reservationDate = new Date(date);
        reservationDate.setHours(0, 0, 0, 0);
        const reservationNextDay = new Date(reservationDate);
        reservationNextDay.setDate(reservationNextDay.getDate() + 1);

        const bookingsForSlot = await bookingRepository.model.find({
          serviceId,
          date: { $gte: reservationDate, $lt: reservationNextDay },
          timeSlot,
          bookingType: 'reservation',
          status: { $nin: ['cancelled'] }
        });

        // Assuming max 20 tables (can be configurable)
        const maxTables = 20;
        const bookedTables = bookingsForSlot.length;

        if (bookedTables >= maxTables) {
          return res.status(400).json({
            success: false,
            message: 'Khung giờ này đã hết bàn. Vui lòng chọn khung giờ khác.'
          });
        }

        const unitPrice = 0; // Reservation might be free or have a deposit
        const totalAmount = 0;
        const depositAmount = 0;

        // Normalize date to start of day for consistency
        const restaurantReservationDate = new Date(date);
        restaurantReservationDate.setHours(0, 0, 0, 0);

        const booking = await bookingRepository.create({
          userId: req.userId,
          serviceId,
          serviceName: serviceObj.name,
          serviceType: serviceObj.type,
          date: restaurantReservationDate,
          timeSlot,
          quantity,
          bookingType: 'reservation',
          unitPrice,
          totalAmount,
          depositAmount,
          customerInfo,
          status: 'pending',
          paymentStatus: 'pending'
        });

        emailService.sendBookingSuccessEmail(req.user.email, req.user.fullName, booking).catch(console.error);

        res.status(201).json({
          success: true,
          data: booking,
          message: 'Đặt bàn thành công. Vui lòng đến đúng giờ.'
        });

      } else if (bookingType === 'order') {
        const orderType = req.body.orderType || 'delivery'; // 'delivery' | 'pickup' | 'dine_in'

        // Validate delivery mode support
        if (orderType === 'delivery' && !serviceObj.hasDelivery) {
          return res.status(400).json({
            success: false,
            message: 'Nhà hàng không hỗ trợ giao hàng'
          });
        }

        if (!orderItems || orderItems.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn món'
          });
        }

        // Validate menu items and calculate total
        const isPremium = req.user && (req.user.plan === 'premium_user' || req.user.plan === 'premium');
        let totalAmount = 0;
        const processedOrderItems = [];

        for (const item of orderItems) {
          // Try multiple ways to find menuItem
          let menuItem = null;

          if (serviceObj.menuItems && Array.isArray(serviceObj.menuItems)) {
            // Method 1: Find by _id
            menuItem = serviceObj.menuItems.find(m => {
              if (m._id) {
                return m._id.toString() === item.menuItemId || String(m._id) === String(item.menuItemId);
              }
              return false;
            });

            // Method 2: If not found, try by index or other identifier
            if (!menuItem && mongoose.Types.ObjectId.isValid(item.menuItemId)) {
              const itemObjectId = new mongoose.Types.ObjectId(item.menuItemId);
              menuItem = serviceObj.menuItems.find(m => {
                if (m._id && m._id.equals) {
                  return m._id.equals(itemObjectId);
                }
                return false;
              });
            }
          }

          if (!menuItem) {
            console.error('Menu item not found:', {
              menuItemId: item.menuItemId,
              availableMenuItems: serviceObj.menuItems?.map(m => ({
                _id: m._id?.toString(),
                name: m.name
              })) || []
            });

            return res.status(400).json({
              success: false,
              message: `Món "${item.name}" không tồn tại hoặc đã bị xóa`
            });
          }

          const basePrice = menuItem.price;
          const itemPrice = isPremium ? basePrice : Math.round(basePrice * 1.05);
          totalAmount += itemPrice * item.quantity;
          processedOrderItems.push({
            menuItemId: item.menuItemId,
            name: item.name,
            price: itemPrice,
            quantity: item.quantity
          });
        }

        const depositAmount = totalAmount;

        // Normalize date to start of day for consistency
        const orderDate = new Date(date);
        orderDate.setHours(0, 0, 0, 0);

        const booking = await bookingRepository.create({
          userId: req.userId,
          serviceId,
          serviceName: serviceObj.name,
          serviceType: serviceObj.type,
          date: orderDate,
          quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
          bookingType: 'order',
          orderType,
          orderItems: processedOrderItems,
          unitPrice: 0,
          totalAmount,
          depositAmount,
          customerInfo,
          status: 'pending',
          paymentStatus: 'pending'
          // Note: timeSlot is not required for order type
        });

        emailService.sendBookingSuccessEmail(req.user.email, req.user.fullName, booking).catch(console.error);

        res.status(201).json({
          success: true,
          data: booking,
          message: 'Đặt món thành công. Vui lòng thanh toán để xác nhận.'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn loại đặt chỗ (reservation hoặc order)'
        });
      }
    } else if (service.type === 'carpool') {
      // CARPOOL: Validate route, timeSlot, and carpoolDetails
      const { carpoolDetails } = req.body;
      if (!route || !timeSlot || !carpoolDetails) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn chuyến, giờ khởi hành và thông tin xe ghép'
        });
      }

      // Check if departureTime exists
      if (!service.departureTime || !service.departureTime.includes(timeSlot)) {
        return res.status(400).json({
          success: false,
          message: 'Giờ khởi hành không hợp lệ'
        });
      }

      // Check if route exists
      const selectedRouteObj = service.carpoolOptions?.routes?.find(r => r.name === route);
      if (!selectedRouteObj) {
        return res.status(400).json({
          success: false,
          message: 'Tuyến đường không hợp lệ'
        });
      }

      // Calculate total amount
      let totalAmount = 0;
      if (carpoolDetails.bookingType === 'shared') {
        const pricing = selectedRouteObj.sharedPricing;
        if (carpoolDetails.passengers === 1) {
          totalAmount = pricing.pricePerGuest;
        } else {
          totalAmount = pricing.twoGuestsDiscountedPrice || (pricing.pricePerGuest * carpoolDetails.passengers);
        }
        if (carpoolDetails.isAirport) totalAmount += (pricing.airportSurcharge || 0);
        if (carpoolDetails.pickupPoints > 1) totalAmount += (pricing.extraPointSurcharge || 0);
      } else {
        const pricing = selectedRouteObj.privatePricing;
        if (carpoolDetails.passengers === 5) {
          totalAmount = carpoolDetails.isRoundTrip ? pricing.seats5.twoWayPrice : pricing.seats5.oneWayPrice;
        } else {
          totalAmount = carpoolDetails.isRoundTrip ? pricing.seats7.twoWayPrice : pricing.seats7.oneWayPrice;
        }
      }

      const isPremium = req.user && (req.user.plan === 'premium_user' || req.user.plan === 'premium');
      const finalAmount = isPremium ? totalAmount : Math.round(totalAmount * 1.05);

      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0);

      const booking = await bookingRepository.create({
        userId: req.userId,
        serviceId,
        serviceName: service.name,
        serviceType: service.type,
        date: bookingDate,
        timeSlot,
        route,
        quantity: carpoolDetails.passengers,
        carpoolDetails,
        unitPrice: finalAmount,
        totalAmount: finalAmount,
        depositAmount: finalAmount,
        customerInfo,
        status: 'pending',
        paymentStatus: 'pending'
      });

      emailService.sendBookingSuccessEmail(req.user.email, req.user.fullName, booking).catch(console.error);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Tạo đặt xe ghép thành công. Vui lòng thanh toán để xác nhận.'
      });
    } else {
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
 * Confirm booking (by service owner or admin)
 * PATCH /api/bookings/:id/confirm
 */
export const confirmBooking = async (req, res, next) => {
  try {
    const booking = await bookingRepository.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    // serviceId may be a populated object or a raw ObjectId
    const serviceId = booking.serviceId?._id || booking.serviceId;

    // Admin can always confirm
    if (req.userRole !== 'admin') {
      const service = await serviceRepository.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ liên quan'
        });
      }
      if (service.ownerId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xác nhận đặt chỗ này'
        });
      }
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Không thể xác nhận đặt chỗ có trạng thái "${booking.status}"`
      });
    }

    const updated = await bookingRepository.confirmBooking(booking._id);

    res.json({
      success: true,
      data: updated,
      message: 'Xác nhận đặt chỗ thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete booking
 * PATCH /api/bookings/:id/complete
 */
export const completeBooking = async (req, res, next) => {
  try {
    const booking = await bookingRepository.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    const serviceId = booking.serviceId?._id || booking.serviceId;

    if (req.userRole !== 'admin') {
      const service = await serviceRepository.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ liên quan'
        });
      }
      if (service.ownerId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền hoàn thành đặt chỗ này'
        });
      }
    }

    const updated = await bookingRepository.completeBooking(booking._id);

    res.json({
      success: true,
      data: updated,
      message: 'Hoàn thành đặt chỗ thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await bookingRepository.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    // Check if user can cancel
    const isOwner = booking.userId.toString() === req.userId;
    const service = await serviceRepository.findById(booking.serviceId);
    const isServiceOwner = service && service.ownerId.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isOwner && !isServiceOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền hủy đặt chỗ này'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đặt chỗ đã hoàn thành'
      });
    }

    let refundPercentage = 0;
    let refundAmount = 0;
    let createRefundRequest = false;

    if (booking.paymentStatus !== 'pending') {
      const amountPaid = booking.depositAmount + (booking.paymentStatus === 'fully_paid' ? booking.remainingAmount : 0);
      
      // Calculate time difference
      const departureDateTime = new Date(booking.date);
      if (booking.timeSlot) {
        const [hours, minutes] = booking.timeSlot.split(':');
        departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Default to 14:00 (Check-in time) for services without timeSlot (like accommodation)
        departureDateTime.setHours(14, 0, 0, 0);
      }

      const hoursUntilDeparture = (departureDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

      // Fetch user to check premium
      const User = (await import('../models/user.model.js')).default;
      const user = await User.findById(req.userId);
      const isPremium = user && (user.plan === 'premium_user' || user.plan === 'premium');

      if (isPremium) {
        // Premium user gets better refund policy
        // < 12h: 50%; 12-24h: 80%; > 24h: 100%
        if (hoursUntilDeparture >= 24) refundPercentage = 100;
        else if (hoursUntilDeparture >= 12) refundPercentage = 80;
        else if (hoursUntilDeparture > 0) refundPercentage = 50;
        else refundPercentage = 0;
      } else {
        // Regular user policy:
        // < 12h: 0%; 12-24h: 50%; 24-48h: 80%; > 48h: 100%
        if (hoursUntilDeparture >= 48) refundPercentage = 100;
        else if (hoursUntilDeparture >= 24) refundPercentage = 80;
        else if (hoursUntilDeparture >= 12) refundPercentage = 50;
        else refundPercentage = 0;
      }

      if (refundPercentage > 0) {
        refundAmount = Math.round(amountPaid * (refundPercentage / 100));
        createRefundRequest = true;
      }
    }

    const updated = await bookingRepository.cancelBooking(booking._id, req.userId, reason, Math.round(refundAmount));

    if (createRefundRequest) {
      let { bankInfo } = req.body;
      if (!bankInfo || !bankInfo.bankName || !bankInfo.bankAccount || !bankInfo.bankAccountName) {
         // Fallback to user profile if not provided in body (optional, but good to have)
         const User = (await import('../models/user.model.js')).default;
         const user = await User.findById(req.userId);
         if (!user.bankName || !user.bankAccount || !user.bankAccountName) {
            return res.status(400).json({
               success: false,
               message: 'Vui lòng cung cấp thông tin ngân hàng để nhận hoàn tiền'
            });
         }
         bankInfo = {
            bankName: user.bankName,
            bankAccount: user.bankAccount,
            bankAccountName: user.bankAccountName
         };
      }

      const RefundRequest = (await import('../models/refund-request.model.js')).default;
      
      const departureDateTime = new Date(booking.date);
      if (booking.timeSlot) {
        const [hours, minutes] = booking.timeSlot.split(':');
        departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const amountPaid = booking.depositAmount + (booking.paymentStatus === 'fully_paid' ? booking.remainingAmount : 0);

      await RefundRequest.create({
        bookingId: booking._id,
        userId: req.userId,
        amountPaid,
        refundPercentage,
        refundAmount,
        departureDate: departureDateTime,
        status: 'pending',
        userReason: reason,
        bankInfo
      });

      await bookingRepository.updateById(booking._id, { paymentStatus: 'refund_pending' });
      updated.paymentStatus = 'refund_pending';
    }

    res.json({
      success: true,
      data: updated,
      message: createRefundRequest
        ? `Hủy đặt chỗ thành công. Yêu cầu hoàn tiền ${refundPercentage}% (${Math.round(refundAmount).toLocaleString('vi-VN')}đ) đã được gửi đến Admin.`
        : 'Hủy đặt chỗ thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available slots for a service on a date
 * GET /api/bookings/slots/:serviceId
 */
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { date, route } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày'
      });
    }

    const serviceDoc = await serviceRepository.findById(serviceId);
    if (!serviceDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Convert to plain object to ensure subdocument _id is properly accessible
    const service = serviceDoc.toObject ? serviceDoc.toObject() : serviceDoc;

    if (service.type === 'transport' || service.type === 'carpool') {
      // TRANSPORT/CARPOOL: Return routes and departure times with available seats
      const routes = service.type === 'carpool' ? (service.carpoolOptions?.routes || []) : (service.routes || []);
      const departureTimes = service.departureTime || [];
      const totalSeats = service.type === 'carpool' ? 7 : (service.seats || 0);

      const slots = [];

      // Normalize date to start of day for accurate comparison
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const queryNextDay = new Date(queryDate);
      queryNextDay.setDate(queryNextDay.getDate() + 1);

      for (const routeItem of routes) {
        const routeName = typeof routeItem === 'string' ? routeItem : routeItem.name;
        const routePrice = typeof routeItem === 'string' ? service.priceRange.min : routeItem.price;

        for (const timeSlot of departureTimes) {
          const bookingsForSlot = await bookingRepository.model.find({
            serviceId,
            date: { $gte: queryDate, $lt: queryNextDay },
            timeSlot,
            route: routeName,
            status: { $nin: ['cancelled'] }
          });

          const bookedSeats = bookingsForSlot.reduce((sum, b) => sum + (b.quantity || 0), 0);
          const availableSeats = totalSeats - bookedSeats;

          const bookedSeatsList = [];
          bookingsForSlot.forEach(b => {
            if (b.seats && Array.isArray(b.seats)) {
              bookedSeatsList.push(...b.seats);
            }
          });

          slots.push({
            route: routeName,
            time: timeSlot,
            available: availableSeats > 0,
            availableSeats,
            totalSeats,
            bookedSeats,
            price: routePrice,
            bookedSeatsList
          });
        }
      }

      res.json({
        success: true,
        data: { slots, type: 'transport' }
      });

    } else if (service.type === 'accommodation') {
      // ACCOMMODATION: Return room types with available rooms
      // Ensure service is converted to plain object to access subdocument _id
      const serviceObj = service.toObject ? service.toObject() : service;
      const roomTypes = serviceObj.roomTypes || [];

      const slots = [];

      for (const roomType of roomTypes) {
        // Get roomTypeId - handle both _id and id fields
        let roomTypeId = null;
        if (roomType._id) {
          roomTypeId = roomType._id.toString();
        } else if (roomType.id) {
          roomTypeId = roomType.id.toString();
        } else {
          console.error('Room type missing _id:', roomType);
          continue; // Skip this roomType if no _id
        }

        // Normalize date to start of day for accurate comparison
        const slotQueryDate = new Date(date);
        slotQueryDate.setHours(0, 0, 0, 0);
        const slotQueryNextDay = new Date(slotQueryDate);
        slotQueryNextDay.setDate(slotQueryNextDay.getDate() + 1);

        const bookingsForDate = await bookingRepository.model.find({
          serviceId,
          date: { $gte: slotQueryDate, $lt: slotQueryNextDay },
          roomTypeId: roomTypeId,
          status: { $nin: ['cancelled'] }
        });

        const bookedRooms = bookingsForDate.reduce((sum, b) => sum + (b.quantity || 0), 0);
        const availableRooms = (roomType.available || 0) - bookedRooms;

        slots.push({
          roomTypeId: roomTypeId, // Use the extracted roomTypeId
          roomTypeName: roomType.name,
          price: roomType.price,
          capacity: roomType.capacity,
          available: availableRooms > 0,
          availableRooms,
          totalRooms: roomType.available,
          bookedRooms
        });
      }

      res.json({
        success: true,
        data: { slots, type: 'accommodation' }
      });

    } else if (service.type === 'restaurant') {
      // RESTAURANT: Return time slots for reservation
      if (!service.hasReservation) {
        return res.json({
          success: true,
          data: { slots: [], type: 'restaurant', hasReservation: false }
        });
      }

      const existingBookings = await bookingRepository.getAvailableSlots(serviceId, date);
      const slots = [];
      const startHour = parseInt(service.openTime.split(':')[0]);
      const endHour = parseInt(service.closeTime.split(':')[0]);
      const maxTables = 20; // Configurable

      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        const bookedSlot = existingBookings.find(b => b.timeSlot === timeSlot);
        const bookedTables = bookedSlot ? 1 : 0; // Count bookings, not quantity

        slots.push({
          time: timeSlot,
          available: bookedTables < maxTables,
          availableTables: maxTables - bookedTables,
          totalTables: maxTables,
          bookedTables
        });
      }

      res.json({
        success: true,
        data: { slots, type: 'restaurant', hasReservation: true }
      });

    } else {
      // Generic time slots
      const existingBookings = await bookingRepository.getAvailableSlots(serviceId, date);
      const slots = [];
      const startHour = parseInt(service.openTime.split(':')[0]);
      const endHour = parseInt(service.closeTime.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        const bookedSlot = existingBookings.find(b => b.timeSlot === timeSlot);

        slots.push({
          time: timeSlot,
          available: !bookedSlot,
          bookedQuantity: bookedSlot?.quantity || 0
        });
      }

      res.json({
        success: true,
        data: { slots, type: 'generic' }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking statistics
 * GET /api/bookings/stats
 */
export const getBookingStats = async (req, res, next) => {
  try {
    const ownerId = req.userRole === 'admin' ? null : req.userId;
    const stats = await bookingRepository.getBookingStats(ownerId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getBookings,
  getBookingById,
  createBooking,
  confirmBooking,
  completeBooking,
  cancelBooking,
  getAvailableSlots,
  getBookingStats
};
