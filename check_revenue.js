import mongoose from 'mongoose';
import Booking from './stugo-be/src/models/booking.model.js';
import dotenv from 'dotenv';
dotenv.config({ path: './stugo-be/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo');
  const agg = await Booking.aggregate([
    {
      $match: {
        status: { $in: ['confirmed', 'completed'] },
        paymentStatus: { $in: ['deposit_paid', 'fully_paid'] }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'fully_paid'] },
              '$totalAmount',
              '$depositAmount'
            ]
          }
        }
      }
    }
  ]);
  console.log('Total Booking Revenue (confirmed+completed):', agg[0]?.total || 0);

  const agg2 = await Booking.aggregate([
    {
      $match: {
        status: 'confirmed',
        paymentStatus: { $in: ['deposit_paid', 'fully_paid'] }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'fully_paid'] },
              '$totalAmount',
              '$depositAmount'
            ]
          }
        }
      }
    }
  ]);
  console.log('Total Booking Revenue (confirmed only):', agg2[0]?.total || 0);
  
  process.exit(0);
}
run();
