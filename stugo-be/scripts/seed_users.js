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
  { fullName: 'Nguyễn Quốc Hùng', email: 'quochung.nguyen80@gmail.com' },
  { fullName: 'Phạm Minh Tuấn', email: 'tuanpham.hanoi@gmail.com' },
  { fullName: 'Đỗ Thị Mai', email: 'maido.hcm@gmail.com' },
];

const STUDENT_DATA = [
  { fullName: 'Nguyễn Văn Nam', email: 'namnv.2003@gmail.com' },
  { fullName: 'Trần Thị Hương', email: 'huongtt.99@gmail.com' },
  { fullName: 'Lê Anh Tuấn', email: 'anhtuan.le01@gmail.com' },
  { fullName: 'Phạm Hải Đăng', email: 'haidang.pham2002@gmail.com' },
  { fullName: 'Hoàng Thanh Trúc', email: 'tructh.04@gmail.com' },
  { fullName: 'Vũ Quốc Khánh', email: 'khanhvq.hn@gmail.com' },
  { fullName: 'Đỗ Minh Quân', email: 'quanmd2003@gmail.com' },
  { fullName: 'Bùi Phương Thảo', email: 'thaobp.work@gmail.com' },
  { fullName: 'Trịnh Gia Huy', email: 'huygia.trinh@gmail.com' },
  { fullName: 'Đinh Ngọc Diệp', email: 'diepnd.hanoi@gmail.com' },
  { fullName: 'Phan Văn Lâm', email: 'lamphan99@gmail.com' },
  { fullName: 'Cao Minh Hải', email: 'haicm.2002@gmail.com' },
  { fullName: 'Đặng Tiến Đạt', email: 'datdat.tien98@gmail.com' },
  { fullName: 'Hồ Mỹ Linh', email: 'linhmh.97@gmail.com' },
  { fullName: 'Lý Quang Thắng', email: 'thangq.ly@gmail.com' },
  { fullName: 'Tô Minh Đức', email: 'ducminh.to@gmail.com' },
  { fullName: 'Lưu Khánh Huyền', email: 'huyenlk.2004@gmail.com' },
  { fullName: 'Trương Quốc Bảo', email: 'baotrung.truong@gmail.com' },
  { fullName: 'Dương Thùy Trang', email: 'trangdt.96@gmail.com' },
  { fullName: 'Ngô Minh Hiếu', email: 'hieunm.2001@gmail.com' },
  { fullName: 'Vương Quốc Cường', email: 'cuongvq.hn@gmail.com' },
  { fullName: 'Đào Thị Thắm', email: 'thamdao.99@gmail.com' },
  { fullName: 'Lê Minh Sơn', email: 'sonminh.le@gmail.com' },
  { fullName: 'Trần Thu Hà', email: 'hatran.1999@gmail.com' },
  { fullName: 'Bùi Văn Quyết', email: 'quyetbv@gmail.com' },
  { fullName: 'Phạm Thúy Quỳnh', email: 'quynhpt.2003@gmail.com' },
  { fullName: 'Nguyễn Hữu Thắng', email: 'thangnh.haiphong@gmail.com' },
  { fullName: 'Hoàng Đức Mạnh', email: 'manhhoang03@gmail.com' },
  { fullName: 'Vũ Thị Ngọc', email: 'ngocvt.2002@gmail.com' },
  { fullName: 'Đỗ Hồng Đăng', email: 'danghongdo@gmail.com' },
  { fullName: 'Lê Thanh Bình', email: 'binhthanh.le@gmail.com' },
  { fullName: 'Trần Văn Sơn', email: 'sontran.vch@gmail.com' },
  { fullName: 'Hoàng Thu Thảo', email: 'thaohoang91@gmail.com' },
  { fullName: 'Vũ Anh Kiệt', email: 'kietvu.99@gmail.com' },
  { fullName: 'Bùi Quốc Anh', email: 'quocanh.bui99@gmail.com' },
  { fullName: 'Phan Thị Tuyết', email: 'tuyetphan.dn@gmail.com' },
  { fullName: 'Nguyễn Văn Đạt', email: 'datvannguyen02@gmail.com' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up existing seeded users and their subscriptions to ensure correct roles
    const allEmails = [
      ...PARTNER_DATA.map(p => p.email),
      ...STUDENT_DATA.map(s => s.email),
      // Clean up previous variants
      'kietvu.business@gmail.com',
      'quocanh.bui78@gmail.com',
      'datvannguyen75@gmail.com'
    ];
    const usersToDelete = await User.find({ email: { $in: allEmails } }).select('_id');
    const userIdsToDelete = usersToDelete.map(u => u._id);
    await Subscription.deleteMany({ userId: { $in: userIdsToDelete } });
    await User.deleteMany({ email: { $in: allEmails } });
    console.log('🧹 Cleaned up existing users and their subscriptions to ensure clean state');

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

    // ─── Tạo 3 Đối Tác (Partners) ───────────────────────────────────────────
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

      // Cấp Subscription cho 2/3 đối tác (1 Basic, 1 Premium, 1 no sub)
      if (i < 2 && partnerBasicPlan) {
        const now = new Date();
        const isBasic = i < 1;
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

    // ─── Tạo 37 Sinh Viên (Students) ─────────────────────────────────────────
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
      if (i < 4 && studentPlan) {
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