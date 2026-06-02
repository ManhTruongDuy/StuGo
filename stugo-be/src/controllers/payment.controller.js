import { getPayOS } from '../config/payos.js';
import { paymentRepository, bookingRepository } from '../repositories/index.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Generate unique order code
 */
const generateOrderCode = () => {
  return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
};

/**
 * Common payment creation logic
 */
const createPaymentLink = async (req, booking, items) => {
  const { bookingId, paymentType = 'deposit' } = req.body;
  const payos = getPayOS();

  // Check if booking belongs to user
  if (booking.userId.toString() !== req.userId) {
    const error = new Error('Không có quyền thanh toán đặt chỗ này');
    error.statusCode = 403;
    throw error;
  }

  // Check if payment already exists
  const existingPayment = await paymentRepository.findByBookingId(bookingId);
  if (existingPayment && existingPayment.status === 'paid') {
    const error = new Error('Đặt chỗ đã được thanh toán');
    error.statusCode = 400;
    throw error;
  }

  // Generate order code
  const orderCode = generateOrderCode();
  // Calculate amount based on payment type
  const amount = paymentType === 'full' ? booking.totalAmount : booking.depositAmount;
  const description = paymentType === 'full'
    ? `StuGo - ${booking.serviceName} (Thanh toán toàn bộ)`.substring(0, 25)
    : `StuGo - ${booking.serviceName}`.substring(0, 25);

  // Create PayOS payment link
  const paymentData = {
    orderCode,
    amount,
    description,
    cancelUrl: `${FRONTEND_URL}/payment/cancel?orderCode=${orderCode}`,
    returnUrl: `${FRONTEND_URL}/payment/success?orderCode=${orderCode}`,
    items,
    buyerName: booking.customerInfo?.name || '',
    buyerEmail: booking.customerInfo?.email || '',
    buyerPhone: booking.customerInfo?.phone || ''
  };

  // Use PayOS v2.x API - try different method names
  let payosResponse;
  try {
    // Log PayOS structure for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('PayOS instance keys:', Object.keys(payos));
      if (payos.paymentRequests) {
        console.log('paymentRequests keys:', Object.keys(payos.paymentRequests));
        console.log('paymentRequests methods:', Object.getOwnPropertyNames(payos.paymentRequests));
      }
    }

    // Try different PayOS v2.x API methods
    if (payos.paymentRequests) {
      // Try paymentRequests.create (PayOS v2.x)
      if (typeof payos.paymentRequests.create === 'function') {
        payosResponse = await payos.paymentRequests.create(paymentData);
      }
      // Try paymentRequests.createPaymentLink
      else if (typeof payos.paymentRequests.createPaymentLink === 'function') {
        payosResponse = await payos.paymentRequests.createPaymentLink(paymentData);
      }
      // Try paymentRequests.createPaymentRequest
      else if (typeof payos.paymentRequests.createPaymentRequest === 'function') {
        payosResponse = await payos.paymentRequests.createPaymentRequest(paymentData);
      }
    }

    // Try direct methods on payos instance
    if (!payosResponse) {
      if (typeof payos.create === 'function') {
        payosResponse = await payos.create(paymentData);
      } else if (typeof payos.createPaymentLink === 'function') {
        payosResponse = await payos.createPaymentLink(paymentData);
      }
    }

    if (!payosResponse) {
      throw new Error('PayOS API method not found. Available methods: ' + JSON.stringify({
        payosKeys: Object.keys(payos),
        paymentRequestsKeys: payos.paymentRequests ? Object.keys(payos.paymentRequests) : null
      }));
    }
  } catch (error) {
    console.error('PayOS API Error:', error);
    console.error('PayOS instance:', {
      keys: Object.keys(payos),
      hasPaymentRequests: !!payos.paymentRequests,
      paymentRequestsKeys: payos.paymentRequests ? Object.keys(payos.paymentRequests) : null
    });
    throw error;
  }

  // PayOS v2.x response structure - handle different response formats
  // Response might be: { code, desc, data: { checkoutUrl, qrCode, ... }, signature }
  // Or direct: { checkoutUrl, qrCode, paymentLinkId, ... }
  let checkoutUrl, qrCode, paymentLinkId;

  if (payosResponse.data) {
    // PayOS v2.x wrapped response
    checkoutUrl = payosResponse.data.checkoutUrl || payosResponse.data.link;
    qrCode = payosResponse.data.qrCode || payosResponse.data.qr;
    paymentLinkId = payosResponse.data.paymentLinkId || payosResponse.data.id;
  } else {
    // Direct response
    checkoutUrl = payosResponse.checkoutUrl || payosResponse.link;
    qrCode = payosResponse.qrCode || payosResponse.qr;
    paymentLinkId = payosResponse.paymentLinkId || payosResponse.id;
  }

  // Save payment to database
  const payment = await paymentRepository.create({
    bookingId,
    userId: req.userId,
    orderCode,
    amount,
    description,
    status: 'pending',
    checkoutUrl: checkoutUrl,
    qrCode: qrCode,
    payosPaymentLinkId: paymentLinkId,
    paymentType: paymentType // 'deposit' or 'full'
  });

  // DO NOT update booking paymentStatus here - only update when payment is confirmed via webhook
  // The booking paymentStatus should remain 'pending' until payment is actually completed

  return {
    payment,
    checkoutUrl: checkoutUrl,
    qrCode: qrCode,
    orderCode
  };
};

/**
 * Create payment link for accommodation booking
 * POST /api/payments/accommodation
 */
export const createAccommodationPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Get booking
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    if (booking.serviceType !== 'accommodation') {
      return res.status(400).json({
        success: false,
        message: 'Đây không phải đặt chỗ chỗ ở'
      });
    }

    // Create items for PayOS - Accommodation specific
    const items = [
      {
        name: booking.roomTypeName || booking.serviceName,
        quantity: booking.quantity,
        price: booking.unitPrice
      }
    ];

    const result = await createPaymentLink(req, booking, items);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Tạo link thanh toán thành công'
    });
  } catch (error) {
    console.error('PayOS Error:', error);
    next(error);
  }
};

/**
 * Create payment link for restaurant booking
 * POST /api/payments/restaurant
 */
export const createRestaurantPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Get booking
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    if (booking.serviceType !== 'restaurant') {
      return res.status(400).json({
        success: false,
        message: 'Đây không phải đặt chỗ nhà hàng'
      });
    }

    // Create items for PayOS - Restaurant specific
    let items = [];

    if (booking.bookingType === 'order' && booking.orderItems && booking.orderItems.length > 0) {
      // For order: list all menu items
      items = booking.orderItems.map(item => ({
        name: item.name || 'Món ăn',
        quantity: item.quantity || 1,
        price: item.price || 0
      }));
    } else if (booking.bookingType === 'reservation') {
      // For reservation: just the service name
      items = [
        {
          name: `${booking.serviceName} - Đặt bàn`,
          quantity: booking.quantity || 1,
          price: booking.unitPrice || 0
        }
      ];
    } else {
      items = [
        {
          name: booking.serviceName,
          quantity: booking.quantity || 1,
          price: booking.unitPrice || 0
        }
      ];
    }

    const result = await createPaymentLink(req, booking, items);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Tạo link thanh toán thành công'
    });
  } catch (error) {
    console.error('PayOS Error:', error);
    next(error);
  }
};

/**
 * Create payment link for transport booking
 * POST /api/payments/transport
 */
export const createTransportPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Get booking
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    if (booking.serviceType !== 'transport') {
      return res.status(400).json({
        success: false,
        message: 'Đây không phải đặt chỗ vận chuyển'
      });
    }

    // Create items for PayOS - Transport specific
    const routeInfo = booking.route ? ` - ${booking.route}` : '';
    const timeInfo = booking.timeSlot ? ` (${booking.timeSlot})` : '';

    const items = [
      {
        name: `${booking.serviceName}${routeInfo}${timeInfo}`,
        quantity: booking.quantity,
        price: booking.unitPrice
      }
    ];

    const result = await createPaymentLink(req, booking, items);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Tạo link thanh toán thành công'
    });
  } catch (error) {
    console.error('PayOS Error:', error);
    next(error);
  }
};

/**
 * Create payment link for booking (Legacy - for backward compatibility)
 * POST /api/payments
 */
export const createPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Get booking
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    // Route to specific payment handler based on service type
    if (booking.serviceType === 'accommodation') {
      return createAccommodationPayment(req, res, next);
    } else if (booking.serviceType === 'restaurant') {
      return createRestaurantPayment(req, res, next);
    } else if (booking.serviceType === 'transport') {
      return createTransportPayment(req, res, next);
    }

    // Fallback for unknown types
    const items = [
      {
        name: booking.serviceName,
        quantity: booking.quantity,
        price: booking.unitPrice
      }
    ];

    const result = await createPaymentLink(req, booking, items);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Tạo link thanh toán thành công'
    });
  } catch (error) {
    console.error('PayOS Error:', error);
    next(error);
  }
};

/**
 * Get payment by order code
 * GET /api/payments/:orderCode
 */
export const getPaymentByOrderCode = async (req, res, next) => {
  try {
    const { orderCode } = req.params;

    // Find payment and populate booking
    const payment = await paymentRepository.model
      .findOne({ orderCode: parseInt(orderCode) })
      .populate({
        path: 'bookingId',
        select: 'serviceName serviceType date timeSlot route roomTypeName quantity totalAmount depositAmount paymentStatus status customerInfo'
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán'
      });
    }

    // If user is authenticated, check if they own this payment
    // If not authenticated, still allow viewing (for payment success/cancel pages)
    if (req.userId) {
      // Check if payment belongs to user
      if (payment.userId.toString() !== req.userId) {
        // Check if user is admin or service owner
        if (req.userRole !== 'admin') {
          // Check if user is service owner
          if (payment.bookingId && payment.bookingId.serviceId) {
            const { serviceRepository } = await import('../repositories/index.js');
            const service = await serviceRepository.findById(payment.bookingId.serviceId);
            if (!service || service.ownerId.toString() !== req.userId) {
              return res.status(403).json({
                success: false,
                message: 'Không có quyền xem thanh toán này'
              });
            }
          } else {
            return res.status(403).json({
              success: false,
              message: 'Không có quyền xem thanh toán này'
            });
          }
        }
      }
    }

    // Convert to plain object and format response
    const paymentObj = payment.toObject ? payment.toObject() : payment;

    res.json({
      success: true,
      data: paymentObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status — verifies with PayOS before marking paid
 * GET /api/payments/:orderCode/status
 */
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderCode } = req.params;

    const payment = await paymentRepository.findOne({ orderCode: parseInt(orderCode) });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }

    // Already confirmed — return immediately
    if (payment.status === 'paid') {
      return res.json({
        success: true,
        data: { orderCode: payment.orderCode, status: 'PAID', amount: payment.amount, amountPaid: payment.amount, amountRemaining: 0 }
      });
    }

    // Verify with PayOS before writing anything
    let payosStatus = null;
    try {
      const payos = getPayOS();
      let info;
      if (payos.paymentRequests?.getPaymentLinkInformation) {
        info = await payos.paymentRequests.getPaymentLinkInformation(parseInt(orderCode));
      } else if (payos.getPaymentLinkInformation) {
        info = await payos.getPaymentLinkInformation(parseInt(orderCode));
      }
      if (info?.data) payosStatus = info.data.status;
      else if (info?.status) payosStatus = info.status;
    } catch (payosErr) {
      console.warn('PayOS verification failed, falling back to returnUrl trust:', payosErr.message);
      // If PayOS is not configured yet (dev mode), trust the returnUrl
      if (process.env.NODE_ENV !== 'production') payosStatus = 'PAID';
    }

    if (payosStatus !== 'PAID') {
      return res.json({
        success: true,
        data: { orderCode: parseInt(orderCode), status: payosStatus || 'PENDING', amount: payment.amount, amountPaid: 0, amountRemaining: payment.amount }
      });
    }

    // Payment confirmed — update records
    const booking = await bookingRepository.findById(payment.bookingId);
    const isRemainingPayment = payment.description?.includes('Phần còn lại');

    const updatedPayment = await paymentRepository.updatePaymentStatus(
      parseInt(orderCode), 'paid', { transactionId: `payos_${orderCode}_${Date.now()}` }
    );

    if (updatedPayment && booking) {
      let bookingPaymentStatus = 'deposit_paid';
      if (isRemainingPayment) bookingPaymentStatus = 'fully_paid';
      else if (updatedPayment.amount >= booking.totalAmount) bookingPaymentStatus = 'fully_paid';

      await bookingRepository.updatePaymentStatus(updatedPayment.bookingId, bookingPaymentStatus);
      await bookingRepository.confirmBooking(updatedPayment.bookingId);
    }

    res.json({
      success: true,
      data: { orderCode: updatedPayment.orderCode, status: 'PAID', amount: updatedPayment.amount, amountPaid: updatedPayment.amount, amountRemaining: 0 }
    });
  } catch (error) {
    console.error('Check Payment Status Error:', error);
    next(error);
  }
};

/**
 * PayOS webhook handler
 * POST /api/payments/webhook
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const payos = getPayOS();
    // Use PayOS webhook verification - try paymentRequests first, fallback to direct method
    let webhookData;
    if (payos.paymentRequests && typeof payos.paymentRequests.verifyPaymentWebhookData === 'function') {
      webhookData = payos.paymentRequests.verifyPaymentWebhookData(req.body);
    } else if (typeof payos.verifyPaymentWebhookData === 'function') {
      webhookData = payos.verifyPaymentWebhookData(req.body);
    } else {
      throw new Error('PayOS verifyPaymentWebhookData method not found');
    }

    if (!webhookData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook data'
      });
    }

    const { orderCode, code } = webhookData;

    // Payment successful
    if (code === '00') {
      const payment = await paymentRepository.updatePaymentStatus(
        orderCode,
        'paid',
        { transactionId: webhookData.reference }
      );

      if (payment) {
        // Update booking payment status based on payment type
        const bookingPaymentStatus = payment.paymentType === 'full' ? 'fully_paid' : 'deposit_paid';
        await bookingRepository.updatePaymentStatus(payment.bookingId, bookingPaymentStatus);
        await bookingRepository.confirmBooking(payment.bookingId);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    next(error);
  }
};

/**
 * Cancel payment
 * POST /api/payments/:orderCode/cancel
 */
export const cancelPayment = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const { reason } = req.body;
    const payos = getPayOS();

    // Cancel on PayOS - try paymentRequests first, fallback to direct method
    if (payos.paymentRequests && typeof payos.paymentRequests.cancelPaymentLink === 'function') {
      await payos.paymentRequests.cancelPaymentLink(parseInt(orderCode), reason);
    } else if (typeof payos.cancelPaymentLink === 'function') {
      await payos.cancelPaymentLink(parseInt(orderCode), reason);
    } else {
      throw new Error('PayOS cancelPaymentLink method not found');
    }

    // Update local payment
    const payment = await paymentRepository.updatePaymentStatus(
      parseInt(orderCode),
      'cancelled',
      { cancelReason: reason }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán'
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Đã hủy thanh toán'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's payment history
 * GET /api/payments
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page || DEFAULT_PAGE,
      limit: req.query.limit || DEFAULT_LIMIT,
      populate: 'bookingId userId', // Populate both booking and user
      sort: { createdAt: -1 }
    };

    const userId = req.userRole === 'admin' ? null : req.userId;

    let result;
    if (userId) {
      result = await paymentRepository.findByUser(userId, options);
    } else {
      result = await paymentRepository.find({}, options);
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
 * Get payment statistics (Admin)
 * GET /api/payments/stats
 */
export const getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
    const end = endDate || new Date().toISOString();

    const [dailyStats, totalRevenue] = await Promise.all([
      paymentRepository.getPaymentStats(start, end),
      paymentRepository.getTotalRevenue()
    ]);

    res.json({
      success: true,
      data: {
        dailyStats,
        totalRevenue: totalRevenue.total,
        totalTransactions: totalRevenue.count
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment link for remaining amount
 * POST /api/payments/remaining
 */
export const createRemainingPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Get booking
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ'
      });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thanh toán đặt chỗ này'
      });
    }

    // Check if deposit was paid
    if (booking.paymentStatus !== 'deposit_paid') {
      return res.status(400).json({
        success: false,
        message: 'Đặt chỗ chưa được đặt cọc hoặc đã thanh toán đủ'
      });
    }

    // Check if already has a pending remaining payment
    const existingRemainingPayment = await paymentRepository.model.findOne({
      bookingId,
      description: { $regex: /Phần còn lại/i },
      status: 'pending'
    });

    if (existingRemainingPayment) {
      // Return existing pending payment link
      return res.status(200).json({
        success: true,
        data: {
          payment: existingRemainingPayment,
          checkoutUrl: existingRemainingPayment.checkoutUrl,
          qrCode: existingRemainingPayment.qrCode,
          orderCode: existingRemainingPayment.orderCode
        },
        message: 'Đã có link thanh toán phần còn lại đang chờ xử lý'
      });
    }

    const payos = getPayOS();
    const orderCode = generateOrderCode();
    const remainingAmount = booking.totalAmount - booking.depositAmount;

    // Create items based on service type
    let items = [];
    if (booking.serviceType === 'transport') {
      const routeInfo = booking.route ? ` - ${booking.route}` : '';
      const timeInfo = booking.timeSlot ? ` (${booking.timeSlot})` : '';
      items = [{
        name: `${booking.serviceName}${routeInfo}${timeInfo} - Phần còn lại`,
        quantity: booking.quantity,
        price: Math.round(remainingAmount / booking.quantity)
      }];
    } else if (booking.serviceType === 'accommodation') {
      items = [{
        name: `${booking.roomTypeName || booking.serviceName} - Phần còn lại`,
        quantity: booking.quantity,
        price: Math.round(remainingAmount / booking.quantity)
      }];
    } else if (booking.serviceType === 'restaurant') {
      if (booking.bookingType === 'order' && booking.orderItems?.length > 0) {
        items = booking.orderItems.map(item => ({
          name: `${item.name} - Phần còn lại`,
          quantity: item.quantity,
          price: Math.round((item.price * item.quantity * 0.7) / item.quantity)
        }));
      } else {
        items = [{
          name: `${booking.serviceName} - Phần còn lại`,
          quantity: booking.quantity,
          price: Math.round(remainingAmount / booking.quantity)
        }];
      }
    }

    const description = `Phần còn lại #${bookingId.toString().slice(-8).toUpperCase()}`;

    const paymentData = {
      orderCode,
      amount: remainingAmount,
      description,
      cancelUrl: `${FRONTEND_URL}/payment/cancel?orderCode=${orderCode}`,
      returnUrl: `${FRONTEND_URL}/payment/success?orderCode=${orderCode}`,
      items,
      buyerName: booking.customerInfo?.name || '',
      buyerEmail: booking.customerInfo?.email || '',
      buyerPhone: booking.customerInfo?.phone || ''
    };

    // Create PayOS payment link
    let payosResponse;
    if (payos.paymentRequests?.create) {
      payosResponse = await payos.paymentRequests.create(paymentData);
    } else if (payos.create) {
      payosResponse = await payos.create(paymentData);
    } else {
      throw new Error('PayOS API method not found');
    }

    let checkoutUrl, qrCode, paymentLinkId;
    if (payosResponse.data) {
      checkoutUrl = payosResponse.data.checkoutUrl || payosResponse.data.link;
      qrCode = payosResponse.data.qrCode || payosResponse.data.qr;
      paymentLinkId = payosResponse.data.paymentLinkId || payosResponse.data.id;
    } else {
      checkoutUrl = payosResponse.checkoutUrl || payosResponse.link;
      qrCode = payosResponse.qrCode || payosResponse.qr;
      paymentLinkId = payosResponse.paymentLinkId || payosResponse.id;
    }

    // Create NEW payment record for remaining amount (70%)
    const remainingPayment = await paymentRepository.create({
      bookingId,
      userId: req.userId,
      orderCode,
      amount: remainingAmount,
      description,
      status: 'pending',
      checkoutUrl,
      qrCode,
      payosPaymentLinkId: paymentLinkId
    });

    res.status(201).json({
      success: true,
      data: {
        payment: remainingPayment,
        checkoutUrl,
        qrCode,
        orderCode
      },
      message: 'Tạo link thanh toán phần còn lại thành công'
    });
  } catch (error) {
    console.error('PayOS Error:', error);
    next(error);
  }
};

export default {
  createPayment,
  createAccommodationPayment,
  createRestaurantPayment,
  createTransportPayment,
  createRemainingPayment,
  getPaymentByOrderCode,
  checkPaymentStatus,
  handleWebhook,
  cancelPayment,
  getPaymentHistory,
  getPaymentStats
};
