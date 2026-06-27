import dotenv from 'dotenv';
dotenv.config();

import emailService from './src/services/email.service.js';

const testAllEmails = async () => {
  const targetEmail = 'truongduymanhtest@gmail.com';
  const userName = 'Truong Duy Manh';

  console.log(`Bắt đầu test gửi tất cả các loại email đến: ${targetEmail}\n`);

  try {
    // 1. Test Payment Success Email
    console.log('1. Đang gửi email Thanh toán thành công (Payment Success)...');
    await emailService.sendPaymentSuccessEmail(targetEmail, userName);
    console.log('=> Đã gửi xong email Thanh toán thành công!\n');

    // 2. Test Premium Welcome Email
    console.log('2. Đang gửi email Nâng cấp Premium (Premium Welcome)...');
    await emailService.sendPremiumWelcomeEmail(targetEmail, userName);
    console.log('=> Đã gửi xong email Nâng cấp Premium!\n');

    // 3. Test Booking Success Email
    console.log('3. Đang gửi email Đặt dịch vụ thành công (Booking Success)...');
    const mockBookingData = {
      _id: '659a8f9b9c9d8e7f6a5b4c3d',
      bookingCode: 'STUGO-TEST-001',
      serviceName: 'Xe khách Đà Nẵng - Quy Nhơn (Giường nằm cao cấp)',
      date: new Date().toISOString(),
      timeSlot: '20:30',
      quantity: 2,
      totalAmount: 500000,
      depositAmount: 100000,
    };
    await emailService.sendBookingSuccessEmail(targetEmail, userName, mockBookingData);
    console.log('=> Đã gửi xong email Đặt dịch vụ thành công!\n');

    console.log('Hoàn tất test gửi tất cả các form email!');
  } catch (error) {
    console.error('Có lỗi xảy ra trong quá trình test:', error);
  }
};

testAllEmails();
