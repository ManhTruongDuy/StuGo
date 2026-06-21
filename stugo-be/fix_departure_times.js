import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/service.model.js';
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/stugo";

mongoose.connect(uri).then(async () => {
  const services = await Service.find({ type: 'carpool' });
  for (const s of services) {
    s.departureTime = ['06:00', '08:00', '10:00', '14:00', '16:00', '18:00'];
    await s.save();
  }
  console.log('Updated departure times');
  process.exit(0);
});
