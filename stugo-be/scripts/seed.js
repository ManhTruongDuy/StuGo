import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/database.js';
import User from '../src/models/user.model.js';
import Service from '../src/models/service.model.js';
import SubscriptionPlan from '../src/models/subscription-plan.model.js';
import Subscription from '../src/models/subscription.model.js';
import Booking from '../src/models/booking.model.js';
import Payment from '../src/models/payment.model.js';
import Review from '../src/models/review.model.js';
import Complaint from '../src/models/complaint.model.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      Subscription.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Complaint.deleteMany({})
    ]);

    console.log('Seeding Subscription Plans...');
    const plans = await SubscriptionPlan.insertMany([
      {
        name: 'Standard',
        description: 'Gói tiêu chuẩn dành cho đối tác — đăng ký tối đa 5 dịch vụ, quản lý đặt chỗ, xem thống kê',
        price: 1500000,
        durationDays: 30,
        features: ['Đăng ký tối đa 5 dịch vụ', 'Quản lý đặt chỗ cơ bản', 'Xem thống kê tổng quan', 'Hỗ trợ qua email'],
        status: 'active'
      },
      {
        name: 'Premium',
        description: 'Gói cao cấp dành cho đối tác lớn — không giới hạn dịch vụ, ưu tiên hiển thị, hỗ trợ 24/7',
        price: 2500000,
        durationDays: 30,
        features: ['Không giới hạn dịch vụ đăng ký', 'Đứng TOP trên kết quả tìm kiếm', 'Thống kê doanh thu chi tiết', 'Hỗ trợ trực tiếp 1-1 24/7'],
        status: 'active'
      }
    ]);

    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const users = await User.insertMany([
      { email: 'admin@stugo.com', password: 'password123', fullName: 'System Admin', role: 'admin', city: 'Da Nang', status: 'active' },
      { email: 'partner@stugo.com', password: 'password123', fullName: 'Partner Owner', role: 'partner', city: 'Da Nang', status: 'active' },
      { email: 'user@stugo.com', password: 'password123', fullName: 'Student User', role: 'user', city: 'Da Nang', status: 'active' }
    ]);

    const admin = users[0];
    const partner = users[1];
    const student = users[2];

    console.log('Seeding Subscriptions...');
    // Only seed a subscription for the partner (as an active trial), not admin/student
    // This ensures the trial logic works correctly for new partners
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
    const partnerSub = await Subscription.create({
      userId: partner._id,
      planId: plans[0]._id,
      startDate: now,
      endDate: trialEnd,
      status: 'active'
    });
    await User.findByIdAndUpdate(partner._id, { activeSubscription: partnerSub._id, plan: 'standard' });

    console.log('Seeding Services...');
    const services = await Service.insertMany([
      { name: 'Xe khách Đà Nẵng - Huế', type: 'transport', description: 'Chất lượng cao', address: 'Bến xe TT', city: 'Da Nang', district: 'Liên Chiểu', priceRange: { min: 80000, max: 120000 }, ownerId: partner._id, status: 'active', vehicleType: 'Car', seats: 16, location: { type: 'Point', coordinates: [108.18, 16.06] } },
      { name: 'Ký túc xá Sinh viên', type: 'accommodation', description: 'Sạch sẽ an toàn', address: 'Hòa Khánh', city: 'Da Nang', district: 'Liên Chiểu', priceRange: { min: 1000000, max: 2000000 }, ownerId: partner._id, status: 'active', roomTypes: [{ name: 'Phòng đơn', price: 2000000, capacity: 1, available: 5 }], amenities: ['Wifi', 'Giặt là'], location: { type: 'Point', coordinates: [108.15, 16.07] } },
      { name: 'Cơm phở Thủy', type: 'restaurant', description: 'Ngon sạch 10 điểm', address: 'Ngô Sĩ Liên', city: 'Da Nang', district: 'Liên Chiểu', priceRange: { min: 25000, max: 45000 }, ownerId: partner._id, status: 'active', cuisine: ['Vietnamese'], menuItems: [{ name: 'Phở bò', price: 30000, description: 'Đặc biệt' }], location: { type: 'Point', coordinates: [108.16, 16.06] } }
    ]);

    const transportSvc = services[0];
    const accomodationSvc = services[1];
    const restaurantSvc = services[2];

    console.log('Seeding Bookings...');
    const bookings = await Booking.insertMany([
      { userId: student._id, serviceId: transportSvc._id, serviceName: transportSvc.name, serviceType: transportSvc.type, date: now, timeSlot: '08:00', quantity: 1, unitPrice: 100000, totalAmount: 100000, depositAmount: 0, remainingAmount: 100000, status: 'confirmed', paymentStatus: 'fully_paid', customerInfo: { name: 'Student', phone: '0987654321', email: student.email } },
      { userId: student._id, serviceId: accomodationSvc._id, serviceName: accomodationSvc.name, serviceType: accomodationSvc.type, date: now, quantity: 1, unitPrice: 2000000, totalAmount: 2000000, depositAmount: 500000, remainingAmount: 1500000, status: 'pending', paymentStatus: 'deposit_paid', customerInfo: { name: 'Student', phone: '0987654321', email: student.email } },
      { userId: student._id, serviceId: restaurantSvc._id, serviceName: restaurantSvc.name, serviceType: restaurantSvc.type, date: now, timeSlot: '12:00', quantity: 2, unitPrice: 30000, totalAmount: 60000, depositAmount: 0, remainingAmount: 60000, status: 'completed', paymentStatus: 'fully_paid', customerInfo: { name: 'Student', phone: '0987654321', email: student.email } }
    ]);

    console.log('Seeding Payments...');
    await Payment.insertMany([
      { bookingId: bookings[0]._id, userId: student._id, orderCode: 1001, amount: 100000, description: 'Thanh toán vé xe', status: 'paid', paidAt: now },
      { bookingId: bookings[1]._id, userId: student._id, orderCode: 1002, amount: 500000, description: 'Cọc phòng trọ', status: 'paid', paidAt: now },
      { bookingId: bookings[2]._id, userId: student._id, orderCode: 1003, amount: 60000, description: 'Thanh toán ăn uống', status: 'paid', paidAt: now }
    ]);

    console.log('Seeding Reviews...');
    await Review.insertMany([
      { userId: student._id, serviceId: transportSvc._id, bookingId: bookings[0]._id, rating: 5, comment: 'Xe đi nhanh, êm ái.', isVerified: true, status: 'active' },
      { userId: student._id, serviceId: accomodationSvc._id, bookingId: bookings[1]._id, rating: 4, comment: 'Phòng tốt nhưng wifi hơi yếu.', isVerified: true, status: 'active' },
      { userId: admin._id, serviceId: restaurantSvc._id, rating: 5, comment: 'Đồ ăn ngon, phục vụ tốt.', isVerified: false, status: 'active' }
    ]);

    console.log('Seeding Complaints...');
    await Complaint.insertMany([
      { userId: student._id, serviceId: transportSvc._id, bookingId: bookings[0]._id, subject: 'Tài xế đến trễ', message: 'Hẹn 8h nhưng 8h15 mới tới.', priority: 'medium', category: 'service_quality', status: 'pending' },
      { userId: student._id, serviceId: accomodationSvc._id, subject: 'Mất đồ trong phòng', message: 'Tôi bị mất sạc điện thoại.', priority: 'high', category: 'other', status: 'in_progress', response: { content: 'Đang kiểm tra camera..', respondedBy: partner._id, respondedAt: now } },
      { userId: partner._id, subject: 'Lỗi rút tiền', message: 'Rút tiền chưa về tài khoản.', priority: 'urgent', category: 'payment', status: 'resolved', resolution: 'refund', resolvedBy: admin._id, resolvedAt: now }
    ]);

    console.log('Database seeded completely! All values inserted.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
