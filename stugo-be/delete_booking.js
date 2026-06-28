import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

mongoose.connect(dbUrl)
  .then(async () => {
    console.log('Connected to DB');
    const Booking = (await import('./src/models/booking.model.js')).default;
    
    const bookings = await Booking.find({});
    const targetBooking = bookings.find(b => b._id.toString().toUpperCase().endsWith('51FDF30E'));
    
    if (targetBooking) {
      console.log('Found booking:', targetBooking._id, targetBooking.paymentStatus);
      await Booking.findByIdAndDelete(targetBooking._id);
      console.log('Booking deleted');
    } else {
      console.log('Booking not found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
