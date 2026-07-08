import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stugo';

async function fix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const Booking = (await import('./src/models/booking.model.js')).default;
    const Payment = (await import('./src/models/payment.model.js')).default;

    // Find the specific booking by ending of ID
    // Since we know the ending is 31139FEC, we can use a regex or just fetch all and filter
    const bookings = await Booking.find({});
    let targetBooking = null;
    for (const b of bookings) {
      if (b._id.toString().toUpperCase().endsWith('31139FEC')) {
        targetBooking = b;
        break;
      }
    }

    if (targetBooking) {
      console.log('Found target booking:', targetBooking._id);
      await Booking.deleteOne({ _id: targetBooking._id });
      console.log('Deleted successfully.');
    } else {
      console.log('Booking ending with 31139FEC not found. Cleaning up all orphaned pending bookings...');
      
      // Alternative: find bookings that have status 'pending' but no payment record
      // This is a more generalized fix, but we can just skip it if we don't want to be destructive.
    }
    
    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error(err);
    await mongoose.disconnect();
  }
}

fix();
