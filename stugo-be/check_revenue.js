import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './src/models/payment.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const pipeline = [
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ];

    const result = await Payment.aggregate(pipeline);
    console.log('Total Revenue:', result[0] || { total: 0, count: 0 });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
