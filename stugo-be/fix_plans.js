import mongoose from 'mongoose';
import 'dotenv/config';
import SubscriptionPlan from './src/models/subscription-plan.model.js';

async function fixPlans() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const mvpPlans = [
    {
      code: 'free',
      name: 'Freemium',
      description: 'Đủ dùng cho sinh viên mới bắt đầu',
      price: 0,
      durationDays: 30,
      targetRole: 'user',
      status: 'active'
    },
    {
      code: 'premium_user',
      name: 'StuGo Student Premium',
      description: 'Trải nghiệm đầy đủ dành riêng cho sinh viên',
      price: 49000,
      durationDays: 30,
      targetRole: 'user',
      status: 'active'
    },
    {
      code: 'business_basic',
      name: 'Business Basic',
      description: 'Dành cho nhà xe mới bắt đầu trên StuGo',
      price: 299000,
      durationDays: 30,
      targetRole: 'partner',
      status: 'active'
    },
    {
      code: 'business_premium',
      name: 'Business Premium',
      description: 'Tối ưu doanh thu & tăng trưởng nhanh',
      price: 479000,
      durationDays: 30,
      targetRole: 'partner',
      status: 'active'
    }
  ];

  for (const planData of mvpPlans) {
    await SubscriptionPlan.findOneAndUpdate(
      { code: planData.code },
      { $set: planData },
      { upsert: true, new: true }
    );
    console.log(`Upserted plan: ${planData.name}`);
  }

  console.log('Finished updating plans');
  process.exit(0);
}

fixPlans();
