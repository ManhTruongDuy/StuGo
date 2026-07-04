import { RefundRequest, Booking, User } from '../models/index.js';
import emailService from '../services/email.service.js';

export const getRefundRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      RefundRequest.find(query)
        .populate('bookingId', 'bookingCode serviceName')
        .populate('userId', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RefundRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const reviewRefundRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Hành động không hợp lệ' });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lí do từ chối' });
    }

    const refundRequest = await RefundRequest.findById(id).populate('userId', 'email fullName');
    if (!refundRequest) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hoàn tiền' });
    }

    if (refundRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu này đã được xử lý' });
    }

    refundRequest.status = action === 'approve' ? 'approved' : 'rejected';
    refundRequest.adminReason = reason;
    refundRequest.resolvedAt = new Date();
    await refundRequest.save();

    // Update booking
    const paymentStatus = action === 'approve' ? 'refunded' : 'refund_rejected';
    await Booking.findByIdAndUpdate(refundRequest.bookingId, { paymentStatus });

    // Try to send email to user
    try {
      if (action === 'approve') {
        const text = `Xin chào ${refundRequest.userId.fullName},\n\nYêu cầu hoàn tiền của bạn đã được phê duyệt. Số tiền ${refundRequest.refundAmount.toLocaleString('vi-VN')}đ đã được chuyển khoản đến tài khoản ${refundRequest.bankInfo.bankName} - ${refundRequest.bankInfo.bankAccount} (${refundRequest.bankInfo.bankAccountName}).\nLí do: ${reason || 'Hoàn tiền theo chính sách hệ thống'}\n\nTrân trọng.`;
        await emailService.sendEmail({
          to: refundRequest.userId.email,
          subject: 'Xác nhận hoàn tiền thành công',
          text
        });
      } else {
        const text = `Xin chào ${refundRequest.userId.fullName},\n\nYêu cầu hoàn tiền của bạn đã bị từ chối.\nLí do: ${reason}\n\nTrân trọng.`;
        await emailService.sendEmail({
          to: refundRequest.userId.email,
          subject: 'Thông báo từ chối hoàn tiền',
          text
        });
      }
    } catch (emailError) {
      console.error('Error sending refund email:', emailError);
    }

    res.json({
      success: true,
      message: action === 'approve' ? 'Đã duyệt yêu cầu hoàn tiền' : 'Đã từ chối yêu cầu hoàn tiền',
      data: refundRequest
    });
  } catch (error) {
    next(error);
  }
};
