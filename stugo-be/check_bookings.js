import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './src/models/payment.model.js';
import Booking from './src/models/booking.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(3);
    for (const p of payments) {
      const b = await Booking.findById(p.bookingId);
      console.log(`Payment: ${p.orderCode}, Status: ${p.status}, Amount: ${p.amount}`);
      console.log(`  Booking ID: ${b?._id}, Status: ${b?.status}, PaymentStatus: ${b?.paymentStatus}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
