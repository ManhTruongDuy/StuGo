import SubscriptionPlan from '../models/subscription-plan.model.js';
import Subscription from '../models/subscription.model.js';
import User from '../models/user.model.js';
import Payment from '../models/payment.model.js';
import payos from '../config/payos.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: 'active' });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId; // From auth middleware

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói đăng ký' });
    }

    // Check if user has had any subscription before
    const existingSub = await Subscription.findOne({ userId });
    const isFirstSubscription = !existingSub;

    // Determine end date
    const startDate = new Date();
    const endDate = new Date(startDate);

    let finalDurationDays = plan.durationDays;
    let finalStatus = 'pending';
    let messageStr = 'Đăng ký tạm thời được tạo. Vui lòng thanh toán.';

    if (isFirstSubscription) {
      finalDurationDays = 28; // 4 weeks free trial
      finalStatus = 'active';
      messageStr = 'Đăng ký thành công. Bạn nhận được 4 tuần sử dụng miễn phí.';
    }

    endDate.setDate(startDate.getDate() + finalDurationDays);

    const subscription = new Subscription({
      userId,
      planId,
      startDate,
      endDate,
      status: finalStatus
    });

    await subscription.save();

    if (finalStatus === 'active') {
      await User.findByIdAndUpdate(userId, { activeSubscription: subscription._id });
    }

    res.status(201).json({ success: true, subscription, message: messageStr, isTrial: isFirstSubscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await Subscription.findOne({ userId, status: 'active' })
      .populate('planId')
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Bạn chưa có gói đăng ký nào đang kích hoạt' });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await Subscription.findOne({ userId, status: 'active' });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Không có gói đăng ký đang hoạt động' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    await User.findByIdAndUpdate(userId, { $unset: { activeSubscription: 1 } });

    res.json({ success: true, message: 'Đã hủy gói đăng ký thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const createSubscriptionPayment = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói đăng ký' });
    }

    // Check if this plan is free (e.g. trial or freemium)
    if (plan.price === 0) {
      // Activate directly without PayOS
      const startDate = new Date();
      const endDate = new Date(startDate);
      // If it's a partner trial, duration is 28 days, else use plan duration 
      const durationDays = plan.code === 'business_basic' ? 28 : (plan.durationDays || 30);
      endDate.setDate(startDate.getDate() + durationDays);

      const subscription = new Subscription({ userId, planId, startDate, endDate, status: 'active' });
      await subscription.save();
      await subscription.populate('planId');
      await User.findByIdAndUpdate(userId, { activeSubscription: subscription._id, plan: plan.code });

      return res.status(201).json({
        success: true,
        isTrial: true,
        subscription,
        message: 'Kích hoạt thành công!'
      });
    }

    // Paid plan — create PayOS payment link
    const orderCode = Number(String(Date.now()).slice(-6)); // Ensure it fits safely in common int types
    const amount = plan.price;
    const description = `StuGo ${plan.name}`.substring(0, 25);

    console.log(`[SubscriptionPayment] User ${userId} is buying plan ${plan.code} (${plan.name}) for ${amount}đ. OrderCode: ${orderCode}`);

    const paymentData = {
      orderCode,
      amount,
      description,
      cancelUrl: `${FRONTEND_URL}/subscription/payment?status=cancel`,
      returnUrl: `${FRONTEND_URL}/subscription/payment?status=success&orderCode=${orderCode}&planId=${planId}`,
      items: [{ name: plan.name.substring(0, 50), quantity: 1, price: amount }],
    };

    let checkoutUrl = null;
    let paymentLinkId = null;
    let qrCode = null;
    try {
      const payosResponse = await payos.paymentRequests.create(paymentData);
      if (payosResponse) {
        if (payosResponse.data) {
          checkoutUrl = payosResponse.data.checkoutUrl || payosResponse.data.link;
          qrCode = payosResponse.data.qrCode || payosResponse.data.qr;
          paymentLinkId = payosResponse.data.paymentLinkId || payosResponse.data.id;
        } else {
          checkoutUrl = payosResponse.checkoutUrl || payosResponse.link;
          qrCode = payosResponse.qrCode || payosResponse.qr;
          paymentLinkId = payosResponse.paymentLinkId || payosResponse.id;
        }
      }
    } catch (payosErr) {
      console.error('PayOS error:', payosErr.message || payosErr);
      return res.status(502).json({ success: false, message: 'Không thể tạo link thanh toán. Vui lòng thử lại sau.' });
    }

    // Save pending payment record to database
    await Payment.create({
      userId,
      orderCode,
      amount,
      description,
      status: 'pending',
      checkoutUrl,
      payosPaymentLinkId: paymentLinkId,
      qrCode
    });

    res.json({ success: true, checkoutUrl, orderCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const activateSubscriptionAfterPayment = async (req, res) => {
  try {
    const { planId, orderCode } = req.body;
    const userId = req.userId;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói đăng ký' });
    }

    // Verify payment status with PayOS API
    let isPaid = false;
    let payosTransactionId = '';
    try {
      let info;
      if (payos.paymentRequests?.getPaymentLinkInformation) {
        info = await payos.paymentRequests.getPaymentLinkInformation(parseInt(orderCode));
      } else if (payos.getPaymentLinkInformation) {
        info = await payos.getPaymentLinkInformation(parseInt(orderCode));
      }
      if (info?.status === 'PAID' || info?.data?.status === 'PAID') {
        isPaid = true;
        // Try to get transaction ID/reference from PayOS info
        const transactions = info?.data?.transactions || info?.transactions || [];
        if (transactions.length > 0) {
          payosTransactionId = transactions[0].reference || transactions[0].transactionId;
        }
      }
    } catch (payosErr) {
      console.warn('PayOS verification failed during subscription activation:', payosErr.message);
      // Fallback for dev/test environment if not production
      if (process.env.NODE_ENV !== 'production') {
        isPaid = true;
      }
    }

    if (!isPaid) {
      return res.status(400).json({ success: false, message: 'Giao dịch chưa được thanh toán trên PayOS hoặc không hợp lệ' });
    }

    // Update payment status in database
    const payment = await Payment.findOne({ orderCode: parseInt(orderCode) });
    if (payment) {
      payment.status = 'paid';
      payment.paidAt = new Date();
      if (payosTransactionId) {
        payment.payosTransactionId = payosTransactionId;
      }
      await payment.save();
      console.log(`[SubscriptionPayment] Updated payment ${orderCode} to paid.`);
    } else {
      // Fallback: create paid payment if it didn't exist for some reason
      await Payment.create({
        userId,
        orderCode: parseInt(orderCode),
        amount: plan.price,
        description: `StuGo ${plan.name}`.substring(0, 25),
        status: 'paid',
        paidAt: new Date(),
        payosTransactionId: payosTransactionId || `payos_${orderCode}_${Date.now()}`
      });
      console.log(`[SubscriptionPayment] Created fallback paid payment ${orderCode}.`);
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (plan.durationDays || 30));

    const subscription = new Subscription({ userId, planId, startDate, endDate, status: 'active', orderCode });
    await subscription.save();
    console.log(`[SubscriptionPayment] Created subscription ${subscription._id} for user ${userId}.`);
    
    await subscription.populate('planId');
    const updatedUser = await User.findByIdAndUpdate(userId, { activeSubscription: subscription._id, plan: plan.code }, { new: true });
    console.log(`[SubscriptionPayment] Updated user ${userId} plan to ${updatedUser?.plan}.`);

    res.json({ success: true, subscription, message: 'Kích hoạt gói thành công!' });
  } catch (error) {
    console.error(`[SubscriptionPayment] Error activating subscription:`, error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const checkAndExpireSubscriptions = async (req, res) => {
  try {
    const now = new Date();

    // Find all active subscriptions that have passed their end date
    const expired = await Subscription.find({ status: 'active', endDate: { $lt: now } });

    if (expired.length === 0) {
      const msg = 'Không có gói đăng ký nào hết hạn';
      if (res) return res.json({ success: true, message: msg, count: 0 });
      return;
    }

    const expiredIds = expired.map(s => s._id);
    const userIds = expired.map(s => s.userId);

    // Bulk expire
    await Subscription.updateMany({ _id: { $in: expiredIds } }, { $set: { status: 'expired' } });

    // Clear activeSubscription for affected users
    await User.updateMany(
      { activeSubscription: { $in: expiredIds } },
      { $unset: { activeSubscription: 1 } }
    );

    const msg = `Đã hết hạn ${expired.length} gói đăng ký`;
    if (res) return res.json({ success: true, message: msg, count: expired.length, userIds });
  } catch (error) {
    console.error('checkAndExpireSubscriptions error:', error.message);
    if (res) res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
