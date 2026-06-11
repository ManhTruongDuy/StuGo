import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';
import Service from '../src/models/service.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedMockData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo');
    console.log('Connected to MongoDB');

    // Create a mock partner user
    let partner = await User.findOne({ email: 'partner_mock@stugo.com' });
    if (!partner) {
      partner = new User({
        email: 'partner_mock@stugo.com',
        password: 'password123',
        fullName: 'Nguyễn Văn Đối Tác',
        phone: '0987654321',
        role: 'partner',
        status: 'active',
        isMock: true
      });
      await partner.save();
    }
    const partnerId = partner._id;

    console.log('Partner ID:', partnerId);

    // Food DB
    const foodServices = [
      {
        name: 'Nhà hàng Bếp Lửa',
        type: 'restaurant',
        description: 'Nhà hàng chuyên các món nướng và lẩu gia đình.',
        address: '123 Nguyễn Trãi',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Thành',
        location: { type: 'Point', coordinates: [106.6926, 10.7716] }, // lng, lat
        images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop'],
        openTime: '10:00',
        closeTime: '23:00',
        priceRange: { min: 50000, max: 300000 },
        rating: 4.8,
        reviewCount: 156,
        isAvailable: true,
        popularity: 90,
        ownerId: partnerId,
        status: 'active',
        cuisine: ['Đồ nướng', 'Lẩu'],
        hasReservation: true,
        hasDelivery: true,
        menuItems: [
          { name: 'Sườn bò nướng tảng', price: 250000, description: 'Sườn bò cao cấp nướng sốt ướp đặc biệt', category: 'Món chính', image: 'https://images.unsplash.com/photo-1544025162-811cceceadbb?w=500&auto=format&fit=crop' },
          { name: 'Lẩu thái Tomyum', price: 180000, description: 'Lẩu thái chua cay với hải sản tươi', category: 'Lẩu', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&auto=format&fit=crop' }
        ]
      },
      {
        name: 'Trà Sữa Koi Thé',
        type: 'restaurant',
        description: 'Thương hiệu trà sữa hàng đầu với nhiều topping đa dạng.',
        address: '45 Lê Lợi',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        location: { type: 'Point', coordinates: [106.7025, 10.7745] },
        images: ['https://images.unsplash.com/photo-1558857563-b37103fac9eb?w=500&auto=format&fit=crop'],
        openTime: '08:00',
        closeTime: '22:30',
        priceRange: { min: 35000, max: 80000 },
        rating: 4.5,
        reviewCount: 320,
        isAvailable: true,
        popularity: 95,
        ownerId: partnerId,
        status: 'active',
        cuisine: ['Đồ uống', 'Trà sữa'],
        hasReservation: false,
        hasDelivery: true,
        menuItems: [
          { name: 'Trà sữa trân châu hoàng kim', price: 55000, description: 'Trà sữa đen truyền thống với trân châu dai giòn', category: 'Trà Sữa', image: 'https://images.unsplash.com/photo-1558857563-b37103fac9eb?w=500&auto=format&fit=crop' },
          { name: 'Trà dâu Machiato', price: 65000, description: 'Trà dâu tươi mát cùng lớp kem cheese béo ngậy', category: 'Trà Trái Cây', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop' }
        ]
      }
    ];

    // Transport DB
    const transportServices = [
      {
        name: 'Nhà Xe Phương Trang',
        type: 'transport',
        description: 'Dịch vụ xe khách giường nằm cao cấp tuyến Sài Gòn - Đà Lạt.',
        address: 'Bến xe Miền Đông mới',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 9',
        ward: 'Phường Long Bình',
        location: { type: 'Point', coordinates: [106.8208, 10.8703] },
        images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
        openTime: '00:00',
        closeTime: '23:59',
        priceRange: { min: 300000, max: 300000 },
        rating: 4.2,
        reviewCount: 500,
        isAvailable: true,
        popularity: 98,
        ownerId: partnerId,
        status: 'active',
        vehicleType: 'Xe giường nằm 34 chỗ',
        seats: 34,
        routes: ['Sài Gòn - Đà Lạt', 'Đà Lạt - Sài Gòn'],
        departureTime: ['21:00', '22:00', '23:00']
      },
      {
        name: 'Limousine Hoa Mai',
        type: 'transport',
        description: 'Xe Limousine 9 chỗ VIP tuyến TP.HCM - Vũng Tàu.',
        address: '44 Nguyễn Thái Bình',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Nguyễn Thái Bình',
        location: { type: 'Point', coordinates: [106.6991, 10.7686] },
        images: ['https://images.unsplash.com/photo-1570125909232-eb263c18f5bb?w=500&auto=format&fit=crop'],
        openTime: '04:00',
        closeTime: '20:00',
        priceRange: { min: 200000, max: 200000 },
        rating: 4.7,
        reviewCount: 215,
        isAvailable: true,
        popularity: 85,
        ownerId: partnerId,
        status: 'active',
        vehicleType: 'Limousine 9 chỗ',
        seats: 9,
        routes: ['Bến Thành - Vũng Tàu', 'Vũng Tàu - Bến Thành'],
        departureTime: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00']
      }
    ];

    // Accommodation DB
    const accommodationServices = [
      {
        name: 'Green View Homestay',
        type: 'accommodation',
        description: 'Homestay với không gian xanh mát, yên tĩnh, phù hợp để thư giãn cuối tuần.',
        address: '15/2 Hẻm Rừng Thông',
        city: 'Đà Lạt',
        district: 'Phường 3',
        ward: 'Phường 3',
        location: { type: 'Point', coordinates: [108.4355, 11.9363] },
        images: ['https://images.unsplash.com/photo-1573041932644-88ab92e0df40?w=500&auto=format&fit=crop'],
        openTime: '00:00',
        closeTime: '23:59',
        priceRange: { min: 400000, max: 1200000 },
        rating: 4.9,
        reviewCount: 88,
        isAvailable: true,
        popularity: 80,
        ownerId: partnerId,
        status: 'active',
        amenities: ['Wifi miễn phí', 'BBQ ngoài trời', 'Bếp chung', 'Ban công view núi'],
        rules: ['Không hút thuốc trong phòng', 'Không mang theo thú cưng', 'Giữ yên lặng sau 22h'],
        roomTypes: [
          { name: 'Phòng Đôi Standard', price: 400000, capacity: 2, available: 5, images: ['https://images.unsplash.com/photo-1522771731470-53ff2ee8c28b?w=500&auto=format&fit=crop'] },
          { name: 'Phòng Gia Đình Family', price: 900000, capacity: 4, available: 2, images: ['https://images.unsplash.com/photo-1536250766468-19e3fe6be3d0?w=500&auto=format&fit=crop'] }
        ]
      },
      {
        name: 'The Lighthouse Villa',
        type: 'accommodation',
        description: 'Biệt thự nghỉ dưỡng sang trọng ngắm biển Vũng Tàu tuyệt đẹp.',
        address: 'Bãi Sau',
        city: 'Vũng Tàu',
        district: 'Thắng Lợi',
        ward: 'Phường 2',
        location: { type: 'Point', coordinates: [107.0865, 10.3396] },
        images: ['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=500&auto=format&fit=crop'],
        openTime: '00:00',
        closeTime: '23:59',
        priceRange: { min: 2500000, max: 8000000 },
        rating: 4.6,
        reviewCount: 120,
        isAvailable: true,
        popularity: 92,
        ownerId: partnerId,
        status: 'active',
        amenities: ['Hồ bơi riêng', 'Wifi miễn phí', 'Karaoke', 'BBQ ngoài trời', 'Gần biển'],
        rules: ['Không vứt rác xuống hồ bơi', 'Thiết bị hư hỏng sẽ bị bồi thường'],
        roomTypes: [
          { name: 'Phòng Đôi View Biển', price: 2500000, capacity: 2, available: 8, images: ['https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&auto=format&fit=crop'] },
          { name: 'Nguyên Căn Villa 4 Phòng Ngủ', price: 8000000, capacity: 12, available: 1, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop'] }
        ]
      }
    ];

    const allServices = [...foodServices, ...transportServices, ...accommodationServices];
    
    // Insert if not exists based on name
    for (const data of allServices) {
      const existing = await Service.findOne({ name: data.name });
      if (!existing) {
        await Service.create(data);
        console.log(`Created service: ${data.name}`);
      } else {
        console.log(`Service already exists: ${data.name}`);
      }
    }

    console.log('Finished seeding mock services!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedMockData();
