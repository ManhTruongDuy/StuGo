import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation result handler
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log validation errors for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Validation errors:', errors.array());
      console.log('Request path:', req.path);
      console.log('Request body:', req.body);
    }
    
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Booking validations
 * Note: timeSlot is optional for restaurant orders, required for reservations/transport
 * Accommodation doesn't need timeSlot, only roomTypeId
 */
export const createBookingRules = [
  body('serviceId')
    .notEmpty().withMessage('serviceId là bắt buộc')
    .isMongoId().withMessage('serviceId không hợp lệ'),
  body('date')
    .notEmpty().withMessage('Ngày là bắt buộc')
    .isISO8601().withMessage('Ngày không hợp lệ'),
  body('timeSlot')
    .optional()
    .custom((value, { req }) => {
      // timeSlot validation is handled in controller based on service type
      // For restaurant orders: not required
      // For restaurant reservations: required (checked in controller)
      // For transport: required (checked in controller)
      // For accommodation: not required (uses roomTypeId instead)
      return true;
    }),
  body('quantity')
    .notEmpty().withMessage('Số lượng là bắt buộc')
    .isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  validate
];

/**
 * Service validations
 */
export const createServiceRules = [
  body('name')
    .notEmpty().withMessage('Tên dịch vụ là bắt buộc')
    .isLength({ min: 3, max: 200 }).withMessage('Tên phải từ 3-200 ký tự'),
  body('type')
    .notEmpty().withMessage('Loại dịch vụ là bắt buộc')
    .isIn(['transport', 'accommodation', 'restaurant', 'carpool']).withMessage('Loại dịch vụ không hợp lệ'),
  body('description')
    .notEmpty().withMessage('Mô tả là bắt buộc')
    .isLength({ min: 10 }).withMessage('Mô tả phải ít nhất 10 ký tự'),
  body('address')
    .notEmpty().withMessage('Địa chỉ là bắt buộc'),
  body('city')
    .notEmpty().withMessage('Thành phố là bắt buộc'),
  body('district')
    .notEmpty().withMessage('Quận/Huyện là bắt buộc'),
  body('priceRange.min')
    .notEmpty().withMessage('Giá thấp nhất là bắt buộc')
    .isInt({ min: 0 }).withMessage('Giá phải >= 0'),
  body('priceRange.max')
    .notEmpty().withMessage('Giá cao nhất là bắt buộc')
    .isInt({ min: 0 }).withMessage('Giá phải >= 0'),
  validate
];

/**
 * User update validations
 */
export const updateUserRules = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Tên phải từ 2-100 ký tự'),
  body('phone')
    .optional()
    .matches(/^0[0-9]{9}$/).withMessage('Số điện thoại không hợp lệ'),
  body('email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ'),
  validate
];

/**
 * Complaint validations
 */
export const createComplaintRules = [
  body('subject')
    .notEmpty().withMessage('Tiêu đề là bắt buộc')
    .isLength({ min: 5, max: 200 }).withMessage('Tiêu đề phải từ 5-200 ký tự'),
  body('message')
    .notEmpty().withMessage('Nội dung là bắt buộc')
    .isLength({ min: 10, max: 2000 }).withMessage('Nội dung phải từ 10-2000 ký tự'),
  body('category')
    .optional()
    .isIn(['service_quality', 'payment', 'booking', 'behavior', 'other'])
    .withMessage('Danh mục không hợp lệ'),
  validate
];

/**
 * Withdrawal validations
 */
export const withdrawalRules = [
  body('amount')
    .notEmpty().withMessage('Số tiền là bắt buộc')
    .isInt({ min: 100000 }).withMessage('Số tiền tối thiểu là 100,000đ'),
  body('bankName')
    .notEmpty().withMessage('Ngân hàng là bắt buộc'),
  body('accountNumber')
    .notEmpty().withMessage('Số tài khoản là bắt buộc')
    .matches(/^[0-9]{6,20}$/).withMessage('Số tài khoản không hợp lệ'),
  body('accountHolder')
    .notEmpty().withMessage('Tên chủ tài khoản là bắt buộc'),
  validate
];

/**
 * Payment validations - Only validate bookingId, no timeSlot required
 * Note: We only validate bookingId, all other fields are ignored
 */
export const createPaymentRules = [
  body('bookingId')
    .notEmpty().withMessage('bookingId là bắt buộc')
    .isMongoId().withMessage('bookingId không hợp lệ'),
  body('paymentType')
    .optional()
    .isIn(['deposit', 'full']).withMessage('paymentType không hợp lệ'),
  // Don't validate any other fields - payment only needs bookingId
  validate
];

/**
 * MongoID param validation
 */
export const mongoIdParam = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('ID không hợp lệ'),
  validate
];

export default {
  validate,
  createBookingRules,
  createServiceRules,
  updateUserRules,
  createComplaintRules,
  withdrawalRules,
  createPaymentRules,
  mongoIdParam
};
