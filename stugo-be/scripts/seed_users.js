import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/user.model.js';
import Subscription from '../src/models/subscription.model.js';
import SubscriptionPlan from '../src/models/subscription-plan.model.js';

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Huế'];

const PARTNER_DATA = [
  { fullName: 'Trần Văn Hùng', email: 'partner01@stugo.com', phone: '0901000001', city: 'Hà Nội' },
  { fullName: 'Nguyễn Thị Lan', email: 'partner02@stugo.com', phone: '0901000002', city: 'TP. Hồ Chí Minh' },
  { fullName: 'Lê Minh Đức', email: 'partner03@stugo.com', phone: '0901000003', city: 'Đà Nẵng' },
  { fullName: 'Phạm Thị Hoa', email: 'partner04@stugo.com', phone: '0901000004', city: 'Hà Nội' },
  { fullName: 'Hoàng Văn Nam', email: 'partner05@stugo.com', phone: '0901000005', city: 'TP. Hồ Chí Minh' },
  { fullName: 'Vũ Thị Mai', email: 'partner06@stugo.com', phone: '0901000006', city: 'Cần Thơ' },
  { fullName: 'Đặng Quốc Tuấn', email: 'partner07@stugo.com', phone: '0901000007', city: 'Huế' },
  { fullName: 'Bùi Thị Thu', email: 'partner08@stugo.com', phone: '0901000008', city: 'Đà Nẵng' },
  { fullName: 'Đinh Văn Khoa', email: 'partner09@stugo.com', phone: '0901000009', city: 'Hà Nội' },
  { fullName: 'Lý Thị Ngọc', email: 'partner10@stugo.com', phone: '0901000010', city: 'TP. Hồ Chí Minh' },
];

const STUDENT_NAMES = [
  'An Trần', 'Bình Lê', 'Chi Nguyễn', 'Dũng Phạm', 'Em Hoàng',
  'Fang Vũ', 'Giang Đỗ', 'Hiếu Bùi', 'Inh Trịnh', 'Jame Đinh',
  'Kiên Phan', 'Linh Cao', 'Minh Đặng', 'Nga Hồ', 'Oanh Lý',
  'Phúc Tô', 'Quân Lưu', 'Rồng Trương', 'Sơn Dương', 'Tùng Ngô',
  'Uyên Vương', 'Vinh Đào', 'Xuân Lê', 'Yến Trần', 'Zung Bùi',
  'Anh Phạm', 'Bảo Nguyễn', 'Châu Hoàng', 'Duy Vũ', 'Emi Đỗ',
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get subscription plans
    let plans = await SubscriptionPlan.find({ status: 'active' });
    if (plans.length === 0) {
      // Create default plans if none exist
      plans = await SubscriptionPlan.insertMany([
        {
          name: 'StuGo Student Premium',
          description: 'Gói cao cấp dành cho sinh viên',
          price: 49000,
          durationDays: 30,
          features: ['Ưu tiên giữ chỗ', 'Tích điểm', 'Gợi ý AI'],
          status: 'active'
        },
        {
          name: 'Business Basic',
          description: 'Gói cơ bản cho đối tác',
          price: 0,
          durationDays: 60,
          features: ['Đăng tuyến xe', 'Quản lý đặt vé'],
          status: 'active'
        },
        {
          name: 'Business Premium',
          description: 'Gói cao cấp cho đối tác',
          price: 479000,
          durationDays: 30,
          features: ['Tất cả Basic', 'Ưu tiên hiển thị', 'Badge xác minh'],
          status: 'active'
        }
      ]);
      console.log('✅ Created default subscription plans');
    }

    const studentPlan = plans.find(p => p.name.includes('Student') || p.name.includes('Premium') && !p.name.includes('Business'));
    const partnerBasicPlan = plans.find(p => p.name.includes('Basic'));
    const partnerPremiumPlan = plans.find(p => p.name.includes('Business Premium') || (p.name.includes('Premium') && p.name.includes('Business')));

    console.log('Plans found:', plans.map(p => p.name));

    let created = 0;

    // ─── Create 10 Partners ───────────────────────────────────────────────────
    console.log('\n👔 Creating partner accounts...');
    for (let i = 0; i < PARTNER_DATA.length; i++) {
      const p = PARTNER_DATA[i];
      const existing = await User.findOne({ email: p.email });
      if (existing) {
        console.log(`  ⏭  ${p.email} already exists`);
        continue;
      }

      const user = await User.create({
        email: p.email,
        password: 'partner123',
        fullName: p.fullName,
        phone: p.phone,
        city: p.city,
        role: 'partner',
        status: 'active',
      });
      created++;

      // Give subscriptions to 7 out of 10 partners
      if (i < 7 && partnerBasicPlan) {
        const now = new Date();
        const isBasic = i < 4;
        const plan = isBasic ? partnerBasicPlan : (partnerPremiumPlan || partnerBasicPlan);
        const durationDays = plan.durationDays || 30;
        const sub = await Subscription.create({
          userId: user._id,
          planId: plan._id,
          startDate: now,
          endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
          status: 'active',
        });
        await User.findByIdAndUpdate(user._id, {
          activeSubscription: sub._id,
          plan: isBasic ? 'business_basic' : 'business_premium',
        });
        console.log(`  ✅ ${p.fullName} (partner) — ${plan.name}`);
      } else {
        console.log(`  ✅ ${p.fullName} (partner) — no subscription`);
      }
    }

    // ─── Create 30 Students ──────────────────────────────────────────────────
    console.log('\n🎓 Creating student accounts...');
    for (let i = 0; i < 30; i++) {
      const email = `student${String(i + 1).padStart(2, '0')}@stugo.com`;
      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`  ⏭  ${email} already exists`);
        continue;
      }

      const user = await User.create({
        email,
        password: 'student123',
        fullName: STUDENT_NAMES[i],
        phone: `09020000${String(i + 1).padStart(2, '0')}`,
        city: CITIES[i % CITIES.length],
        role: 'user',
        status: 'active',
      });
      created++;

      // Give premium subscription to 10 out of 30 students
      if (i < 10 && studentPlan) {
        const now = new Date();
        const sub = await Subscription.create({
          userId: user._id,
          planId: studentPlan._id,
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        });
        await User.findByIdAndUpdate(user._id, {
          activeSubscription: sub._id,
          plan: 'premium',
        });
        console.log(`  ✅ ${STUDENT_NAMES[i]} (student) — StuGo Student Premium`);
      } else {
        console.log(`  ✅ ${STUDENT_NAMES[i]} (student) — free`);
      }
    }

    console.log(`\n🎉 Done! Created ${created} new accounts.`);
    console.log('📋 Summary:');
    console.log('   Partners: partner01@stugo.com — partner10@stugo.com (password: partner123)');
    console.log('   Students: student01@stugo.com — student30@stugo.com (password: student123)');
    console.log('   10 students have StuGo Student Premium');
    console.log('   7 partners have subscriptions (4 Basic, 3 Premium)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

seed();
