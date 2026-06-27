import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Booking = mongoose.model('Booking', new mongoose.Schema({}, {strict:false}), 'bookings');
    const bookings = await Booking.find({status: {$in: ['confirmed', 'completed']}});
    
    console.log(`Total bookings: ${bookings.length}`);
    
    // Group by serviceType
    const byType = {};
    const byPaymentStatus = {};
    let totalGmv = 0;
    
    bookings.forEach(b => {
      totalGmv += b.totalAmount;
      
      byType[b.serviceType] = byType[b.serviceType] || {count: 0, sum: 0};
      byType[b.serviceType].count++;
      byType[b.serviceType].sum += b.totalAmount;
      
      byPaymentStatus[b.paymentStatus] = byPaymentStatus[b.paymentStatus] || {count: 0, sum: 0};
      byPaymentStatus[b.paymentStatus].count++;
      byPaymentStatus[b.paymentStatus].sum += b.totalAmount;
    });
    
    console.log(`Total GMV: ${totalGmv}`);
    console.log(`5% of Total: ${totalGmv * 0.05}`);
    console.log('\nBy Service Type:');
    console.dir(byType);
    
    console.log('\nBy Payment Status:');
    console.dir(byPaymentStatus);
    
    // What if we only take 5% of a subset that gives 873,075?
    // 873,075 / 0.05 = 17,461,500
    console.log(`Target GMV for 873,075 commission: 17,461,500`);
    
    process.exit(0);
  });
