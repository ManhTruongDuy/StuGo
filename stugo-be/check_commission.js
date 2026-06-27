import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, {strict:false}), 'bookings');
  const b = await Booking.find({status: {$in: ['confirmed', 'completed']}});
  let gmv = 0; 
  let commission1 = 0;
  let commission2 = 0;
  
  b.forEach(x => {
    gmv += x.totalAmount;
    
    // Logic 1: gmv - (gmv / 1.05)
    commission1 += x.totalAmount - Math.round(x.totalAmount / 1.05);
    
    // Logic 2: gmv * 0.05
    commission2 += x.totalAmount * 0.05;
  });
  
  console.log('Total GMV (sum of totalAmount):', gmv);
  console.log('Commission Logic 1 (totalAmount - basePrice):', commission1);
  console.log('Commission Logic 2 (totalAmount * 5%):', commission2);
  
  process.exit(0);
});
