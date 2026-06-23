import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/user.model.js';

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

const createUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const txtPath = path.join(__dirname, 'emails.txt');
    
    // Kiểm tra xem file emails.txt có tồn tại không
    if (!fs.existsSync(txtPath)) {
      console.log('❌ Không tìm thấy file emails.txt trong thư mục scripts.');
      console.log('👉 Vui lòng tạo file emails.txt và điền danh sách email (mỗi email 1 dòng).');
      process.exit(1);
    }

    // Đọc nội dung file và tách thành mảng các dòng
    const content = fs.readFileSync(txtPath, 'utf8');
    const emails = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Bỏ qua các dòng trống

    if (emails.length === 0) {
      console.log('⚠️ File emails.txt đang trống.');
      process.exit(0);
    }

    console.log(`📧 Tìm thấy ${emails.length} email. Bắt đầu tiến trình tạo tài khoản...`);
    let createdCount = 0;

    for (const email of emails) {
      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`  ⏭  Bỏ qua: ${email} (đã tồn tại)`);
        continue;
      }

      // Lấy tên từ email (ví dụ: namnv.2003@gmail.com -> namnv.2003)
      const usernamePart = email.split('@')[0];
      const assignedCity = getWeightedCity();

      await User.create({
        email: email,
        password: 'student123', // Mật khẩu mặc định
        fullName: usernamePart, // Dùng tạm username làm tên
        phone: generateVietnamesePhone(),
        city: assignedCity,
        role: 'user', // Mặc định là tài khoản thường (sinh viên)
        status: 'active',
        isMock: true,
        createdAt: new Date('2020-01-01T00:00:00.000Z'), // Đặt ngày cũ để luôn hiển thị ở cuối danh sách
      });

      createdCount++;
      console.log(`  ✅ Đã tạo thành công: ${email}`);
    }

    console.log(`\n🎉 Xong! Đã tạo ${createdCount} tài khoản mới.`);
    console.log('Mật khẩu mặc định cho các tài khoản này là: student123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Có lỗi xảy ra:', err);
    process.exit(1);
  }
};

createUsers();
