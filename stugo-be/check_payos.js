import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './src/models/payment.model.js';
import { getPayOS } from './src/config/payos.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Checking first pending payment with PayOS...');
    
    const payment = await Payment.findOne({ status: 'pending' }).sort({ createdAt: -1 });
    const payos = getPayOS();
    
    if (payment) {
      console.log(`Checking orderCode: ${payment.orderCode}`);
      try {
        let info;
        if (typeof payos.paymentRequests?.get === 'function') {
            info = await payos.paymentRequests.get(payment.orderCode);
        } else if (typeof payos.getPaymentLinkInformation === 'function') {
            info = await payos.getPaymentLinkInformation(payment.orderCode);
        }
        console.log('PayOS response:', JSON.stringify(info, null, 2));
      } catch (e) {
        console.log(`PayOS error: ${e.message}`);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
