import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';
import Service from './src/models/service.model.js';

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/stugo";

mongoose.connect(uri).then(async () => {
  console.log("Connected to MongoDB.");

  // Find partner
  const partner = await User.findOne({ email: 'daominhtruong77@gmail.com' });
  if (!partner) {
    console.error("Partner not found.");
    process.exit(1);
  }

  console.log("Partner found:", partner.fullName);

  const carpoolService = {
    ownerId: partner._id,
    type: 'carpool',
    name: 'Dịch vụ Xe Ghép Cao Cấp',
    description: 'Dịch vụ xe ghép chất lượng cao, đón trả tận nơi, chuyên tuyến Hà Nội - Hải Phòng - Hạ Long - Cẩm Phả.',
    address: 'Bến xe Mỹ Đình, Hà Nội',
    city: 'Hà Nội',
    district: 'Nam Từ Liêm',
    ward: 'Mỹ Đình 2',
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop'],
    openTime: '00:00',
    closeTime: '23:59',
    priceRange: { min: 250000, max: 2700000 },
    rating: 5,
    reviewCount: 10,
    isAvailable: true,
    status: 'active',
    popularity: 100,
    carpoolOptions: {
      vehicleInfo: {
        engineType: 'gasoline',
        brand: 'Kia',
        vehicleName: 'Carnival',
        seats: 7
      },
      routes: [
        {
          name: 'HÀ NỘI - HẢI PHÒNG',
          isHighwayDefault: true,
          sharedPricing: {
            pricePerGuest: 400000,
            airportSurcharge: 450000 - 400000,
            extraPointSurcharge: 135000, // 0.75đ * 180k
            twoGuestsDiscountedPrice: 700000
          },
          privatePricing: {
            seats5: { oneWayPrice: 900000, twoWayPrice: 1600000 },
            seats7: { oneWayPrice: 1000000, twoWayPrice: 1800000 }
          }
        },
        {
          name: 'HÀ NỘI - HẠ LONG',
          isHighwayDefault: true,
          sharedPricing: {
            pricePerGuest: 450000,
            airportSurcharge: 500000 - 450000,
            extraPointSurcharge: 135000,
            twoGuestsDiscountedPrice: 800000
          },
          privatePricing: {
            seats5: { oneWayPrice: 1100000, twoWayPrice: 2000000 },
            seats7: { oneWayPrice: 1200000, twoWayPrice: 2200000 }
          }
        },
        {
          name: 'HÀ NỘI - CẨM PHẢ',
          isHighwayDefault: true,
          sharedPricing: {
            pricePerGuest: 500000,
            airportSurcharge: 550000 - 500000,
            extraPointSurcharge: 135000,
            twoGuestsDiscountedPrice: 900000
          },
          privatePricing: {
            seats5: { oneWayPrice: 1200000, twoWayPrice: 2300000 },
            seats7: { oneWayPrice: 1300000, twoWayPrice: 2500000 }
          }
        },
        {
          name: 'HẢI PHÒNG - CẨM PHẢ',
          isHighwayDefault: true,
          sharedPricing: {
            pricePerGuest: 300000,
            airportSurcharge: 0,
            extraPointSurcharge: 0,
            twoGuestsDiscountedPrice: 600000
          },
          privatePricing: {
            seats5: { oneWayPrice: 500000, twoWayPrice: 800000 },
            seats7: { oneWayPrice: 600000, twoWayPrice: 1000000 }
          }
        },
        {
          name: 'HẢI PHÒNG - HẠ LONG',
          isHighwayDefault: true,
          sharedPricing: {
            pricePerGuest: 250000,
            airportSurcharge: 0,
            extraPointSurcharge: 0,
            twoGuestsDiscountedPrice: 500000
          },
          privatePricing: {
            seats5: { oneWayPrice: 400000, twoWayPrice: 700000 },
            seats7: { oneWayPrice: 500000, twoWayPrice: 900000 }
          }
        }
      ]
    }
  };

  const newService = new Service(carpoolService);
  await newService.save();
  console.log("Service created!");

  process.exit(0);

}).catch(err => {
  console.error("DB connection error:", err);
  process.exit(1);
});
