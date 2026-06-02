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

// Hàm helper sinh số điện thoại Việt Nam ngẫu nhiên trông như thật
const generateVietnamesePhone = () => {
  const prefixes = ['091', '098', '090', '035', '086', '094', '038', '077'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 chữ số sau
  return `${randomPrefix}${randomSuffix}`;
};

// Hàm helper gán thành phố với tỷ lệ phần lớn ở Hà Nội (~75%)
const getWeightedCity = () => {
  const roll = Math.random();
  if (roll < 0.75) return 'Hà Nội';
  const otherCities = ['TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Huế'];
  return otherCities[Math.floor(Math.random() * otherCities.length)];
};

const PARTNER_DATA = [
  { fullName: 'Trần Văn Hùng', email: 'hungtran.transport@gmail.com' },
  { fullName: 'Nguyễn Thị Lan', email: 'lannguyen.shuttle@gmail.com' },
  { fullName: 'Lê Minh Đức', email: 'ducminh.le92@gmail.com' },
  { fullName: 'Phạm Thị Hoa', email: 'hoapham.busline@gmail.com' },
  { fullName: 'Hoàng Văn Nam', email: 'namhoang.garage@gmail.com' },
  { fullName: 'Vũ Thị Mai', email: 'maivu.logistics@gmail.com' },
  { fullName: 'Đặng Quốc Tuấn', email: 'tuandang.limo@gmail.com' },
  { fullName: 'Bùi Thị Thu', email: 'thubui.dailybus@gmail.com' },
  { fullName: 'Đinh Văn Khoa', email: 'khoadinh.xe02@gmail.com' },
  { fullName: 'Lý Thị Ngọc', email: 'ngocly.travel90@gmail.com' },
];

const STUDENT_DATA = [
  { fullName: 'Nguyễn Hoàng Anh', email: 'anhnh.student@gmail.com' },
  { fullName: 'Trần Minh Quang', email: 'quangtm2004@gmail.com' },
  { fullName: 'Lê Thùy Linh', email: 'linhlt.k62@gmail.com' },
  { fullName: 'Phạm Đức Duy', email: 'duypd.graphics@gmail.com' },
  { fullName: 'Hoàng Ngọc Diệp', email: 'diephn.art@gmail.com' },
  { fullName: 'Vũ Minh Triết', email: 'trietvm.tech@gmail.com' },
  { fullName: 'Đỗ Thị Giang', email: 'giangdt.hust@gmail.com' },
  { fullName: 'Bùi Quang Hiếu', email: 'hieubq.neu@gmail.com' },
  { fullName: 'Trịnh Tiến Đạt', email: 'dattne.design@gmail.com' },
  { fullName: 'Đinh Tuấn Kiên', email: 'kiendt2005@gmail.com' },
  { fullName: 'Phan Bảo Nam', email: 'nampb.ftu@gmail.com' },
  { fullName: 'Cao Phương Linh', email: 'linhcp.bka@gmail.com' },
  { fullName: 'Đặng Quốc Minh', email: 'minhdq.dev@gmail.com' },
  { fullName: 'Hồ Thanh Nga', email: 'ngaht.media@gmail.com' },
  { fullName: 'Lý Bảo Oanh', email: 'oanhlb.edu@gmail.com' },
  { fullName: 'Tô Hồng Phúc', email: 'phucth.student@gmail.com' },
  { fullName: 'Lưu Minh Quân', email: 'quanlm2003@gmail.com' },
  { fullName: 'Trương Hoàng Long', email: 'longth.uiux@gmail.com' },
  { fullName: 'Dương Khánh Sơn', email: 'sondk.digital@gmail.com' },
  { fullName: 'Ngô Thanh Tùng', email: 'tungnt.it@gmail.com' },
  { fullName: 'Vương Thu Uyên', email: 'uyenvt.marketing@gmail.com' },
  { fullName: 'Đào Quốc Vinh', email: 'vinhdq.2004@gmail.com' },
  { fullName: 'Lê Thanh Xuân', email: 'xuanlt.student@gmail.com' },
  { fullName: 'Trần Hải Yến', email: 'yenth.ajc@gmail.com' },
  { fullName: 'Bùi Tiến Dũng', email: 'dungbt.hnu@gmail.com' },
  { fullName: 'Phạm Tuấn Anh', email: 'anhpt.creative@gmail.com' },
  { fullName: 'Nguyễn Gia Bảo', email: 'baong2005@gmail.com' },
  { fullName: 'Hoàng Minh Châu', email: 'chaohm.design@gmail.com' },
  { fullName: 'Vũ Khánh Duy', email: 'duyvk.stu@gmail.com' },
  { fullName: 'Đỗ Thục Anh', email: 'anhdt.vnu@gmail.com' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get hoặc Tạo Subscription Plans mặc định
    let plans = await SubscriptionPlan.find({ status: 'active' });
    if (plans.length === 0) {
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

    const studentPlan = plans.find(p => p.name.includes('Student') || (p.name.includes('Premium') && !p.name.includes('Business')));
    const partnerBasicPlan = plans.find(p => p.name.includes('Basic'));
    const partnerPremiumPlan = plans.find(p => p.name.includes('Business Premium') || (p.name.includes('Premium') && p.name.includes('Business')));

    let created = 0;

    // ─── Tạo 10 Đối Tác (Partners) ───────────────────────────────────────────
    console.log('\n👔 Creating partner accounts...');
    for (let i = 0; i < PARTNER_DATA.length; i++) {
      const p = PARTNER_DATA[i];
      const existing = await User.findOne({ email: p.email });
      if (existing) {
        console.log(`  ⏭  ${p.email} already exists`);
        continue;
      }

      const assignedCity = getWeightedCity();
      const user = await User.create({
        email: p.email,
        password: 'partner123',
        fullName: p.fullName,
        phone: generateVietnamesePhone(),
        city: assignedCity,
        role: 'partner',
        status: 'active',
      });
      created++;

      // Cấp Subscription cho 7/10 đối tác
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
        console.log(`  ✅ ${p.fullName} [${assignedCity}] — ${plan.name}`);
      } else {
        console.log(`  ✅ ${p.fullName} [${assignedCity}] — no subscription`);
      }
    }

    // ─── Tạo 30 Sinh Viên (Students) ─────────────────────────────────────────
    console.log('\n🎓 Creating student accounts...');
    for (let i = 0; i < STUDENT_DATA.length; i++) {
      const s = STUDENT_DATA[i];
      const existing = await User.findOne({ email: s.email });
      if (existing) {
        console.log(`  ⏭  ${s.email} already exists`);
        continue;
      }

      const assignedCity = getWeightedCity();
      const user = await User.create({
        email: s.email,
        password: 'student123',
        fullName: s.fullName,
        phone: generateVietnamesePhone(),
        city: assignedCity,
        role: 'user',
        status: 'active',
      });
      created++;

      // Cấp Premium cho 10/30 sinh viên đầu tiên
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
        console.log(`  ✅ ${s.fullName} [${assignedCity}] — StuGo Student Premium`);
      } else {
        console.log(`  ✅ ${s.fullName} [${assignedCity}] — free account`);
      }
    }

    console.log(`\n🎉 Done! Created ${created} new accounts.`);
    console.log('📋 Summary:');
    console.log('  - Toàn bộ tài khoản chuyển sang sử dụng Gmail cá nhân (@gmail.com).');
    console.log('  - Định dạng SĐT thực tế, phân bổ ~75% tại Hà Nội.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
};

seed();