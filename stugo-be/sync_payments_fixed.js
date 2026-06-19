import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './src/models/payment.model.js';
import Booking from './src/models/booking.model.js';
import { getPayOS } from './src/config/payos.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Syncing pending payments with PayOS...');
    
    const pendingPayments = await Payment.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(20);
    const payos = getPayOS();
    
    for (const payment of pendingPayments) {
      try {
        console.log(`Checking orderCode: ${payment.orderCode}`);
        
        let payosStatus = null;
        let info;
        try {
            if (typeof payos.paymentRequests?.get === 'function') {
                info = await payos.paymentRequests.get(payment.orderCode);
            } else if (typeof payos.getPaymentLinkInformation === 'function') {
                info = await payos.getPaymentLinkInformation(payment.orderCode);
            }
            if (info?.data) payosStatus = info.data.status;
            else if (info?.status) payosStatus = info.status;
        } catch (e) {
            console.log(`  PayOS not found or error: ${e.message}`);
        }
        
        if (payosStatus === 'PAID') {
            console.log(`  Updating ${payment.orderCode} to PAID`);
            
            // Update payment
            payment.status = 'paid';
            payment.paidAt = new Date();
            payment.payosTransactionId = `payos_${payment.orderCode}_${Date.now()}`;
            await payment.save();
            
            // Update booking
            if (payment.bookingId) {
                const booking = await Booking.findById(payment.bookingId);
                if (booking) {
                    const isRemainingPayment = payment.description?.includes('Phần còn lại');
                    let bookingPaymentStatus = 'deposit_paid';
                    if (isRemainingPayment) bookingPaymentStatus = 'fully_paid';
                    else if (payment.amount >= booking.totalAmount) bookingPaymentStatus = 'fully_paid';
                    
                    booking.paymentStatus = bookingPaymentStatus;
                    await booking.save();
                    console.log(`  Updated booking ${booking._id} to ${bookingPaymentStatus}`);
                }
            }
        }
      } catch (err) {
        console.error(`Error processing ${payment.orderCode}:`, err.message);
      }
    }
    
    console.log('Sync complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
