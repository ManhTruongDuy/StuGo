import Transaction from '../models/transaction.model.js';
import { bookingRepository, serviceRepository } from '../repositories/index.js';
import Booking from '../models/booking.model.js';

const FEE_RATE = 0.01; // 1% withdrawal fee
const MIN_WITHDRAWAL = 100000;

/**
 * Get available balance for a partner
 */
const getAvailableBalance = async (userId) => {
  // Get all services owned by this partner
  const Service = (await import('../models/service.model.js')).default;
  const services = await Service.find({ ownerId: userId }).select('_id');
  const serviceIds = services.map(s => s._id);

  // Total collected revenue (70% after platform commission)
  const revenueAgg = await Booking.aggregate([
    {
      $match: {
        serviceId: { $in: serviceIds },
        status: 'confirmed',
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
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  // Platform takes 5% commission
  const partnerRevenue = Math.round(totalRevenue * 0.95);

  // Total already withdrawn or pending
  const withdrawnAgg = await Transaction.aggregate([
    { $match: { userId: userId, type: 'withdrawal', status: { $in: ['pending', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const withdrawn = withdrawnAgg[0]?.total || 0;

  return {
    totalRevenue: totalRevenue,
    withdrawn,
    available: Math.max(0, partnerRevenue - withdrawn)
  };
};

/**
 * GET /api/transactions/balance
 */
export const getBalance = async (req, res, next) => {
  try {
    const balance = await getAvailableBalance(req.userId);
    res.json({ success: true, data: balance });
  } catch (err) { next(err); }
};

/**
 * GET /api/transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { userId: req.userId };
    if (status && status !== 'all') query.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/transactions/withdraw
 */
export const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, accountHolder } = req.body;

    if (!amount || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ success: false, message: `Số tiền tối thiểu là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')}đ` });
    }
    if (!bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin ngân hàng' });
    }

    const balance = await getAvailableBalance(req.userId);
    if (amount > balance.available) {
      return res.status(400).json({ success: false, message: 'Số dư không đủ để rút' });
    }

    const fee = Math.round(amount * FEE_RATE);
    const netAmount = amount - fee;

    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'withdrawal',
      amount,
      fee,
      netAmount,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Yêu cầu rút tiền đã được gửi. Chúng tôi sẽ xử lý trong 1-3 ngày làm việc.'
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/transactions/:id/status  (Admin only)
 */
export const updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status, processedBy: req.userId, processedAt: new Date() },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    res.json({ success: true, data: transaction, message: 'Cập nhật trạng thái thành công' });
  } catch (err) { next(err); }
};

/**
 * GET /api/transactions/admin  (Admin — all transactions)
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('userId', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
};

export default { getBalance, getTransactions, requestWithdrawal, updateTransactionStatus, getAllTransactions };
