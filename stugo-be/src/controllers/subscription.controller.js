import SubscriptionPlan from '../models/subscription-plan.model.js';
import Subscription from '../models/subscription.model.js';
import User from '../models/user.model.js';
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

    // Check if this is first subscription (free trial)
    const existingSub = await Subscription.findOne({ userId });
    if (!existingSub) {
      // First subscription = free trial, activate directly
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 28);

      const subscription = new Subscription({ userId, planId, startDate, endDate, status: 'active' });
      await subscription.save();
      await User.findByIdAndUpdate(userId, { activeSubscription: subscription._id, plan: plan.name?.toLowerCase() || 'standard' });

      return res.status(201).json({
        success: true,
        isTrial: true,
        subscription,
        message: 'Kích hoạt thành công! Bạn nhận được 4 tuần dùng thử miễn phí.'
      });
    }

    // Paid plan — create PayOS payment link
    const orderCode = Date.now();
    const amount = plan.price;
    const description = `StuGo ${plan.name}`.substring(0, 25);

    const paymentData = {
      orderCode,
      amount,
      description,
      cancelUrl: `${FRONTEND_URL}/subscription/payment?status=cancel`,
      returnUrl: `${FRONTEND_URL}/subscription/payment?status=success&orderCode=${orderCode}&planId=${planId}`,
      items: [{ name: plan.name.substring(0, 50), quantity: 1, price: amount }],
    };

    let checkoutUrl = null;
    try {
      // @payos/node v2: payos.createPaymentLink(data)
      const payosResponse = await payos.createPaymentLink(paymentData);
      checkoutUrl = payosResponse?.checkoutUrl;
    } catch (payosErr) {
      console.error('PayOS error:', payosErr.message);
      return res.status(502).json({ success: false, message: 'Không thể tạo link thanh toán. Vui lòng thử lại sau.' });
    }

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

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (plan.durationDays || 30));

    const subscription = new Subscription({ userId, planId, startDate, endDate, status: 'active', orderCode });
    await subscription.save();
    await User.findByIdAndUpdate(userId, { activeSubscription: subscription._id, plan: plan.name?.toLowerCase() || 'standard' });

    res.json({ success: true, subscription, message: 'Kích hoạt gói thành công!' });
  } catch (error) {
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
