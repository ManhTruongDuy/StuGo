import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './src/models/payment.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(10);
    console.log('Latest 10 payments:');
    payments.forEach(p => {
      console.log(`OrderCode: ${p.orderCode}, Status: ${p.status}, Amount: ${p.amount}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
