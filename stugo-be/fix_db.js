import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://truongduymanh2512:mJqpi6cVHDmHQaUC@stugo.4vkrmmg.mongodb.net/stugo?appName=StuGo';

async function fix() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const Service = db.collection('services');
  const User = db.collection('users');

  const service = await Service.findOne({ name: { $regex: /Xe Ghép Anh Thư/i } });
  if (service) {
    console.log('Found service:', service.name);
    await Service.updateOne(
      { _id: service._id },
      { $set: { type: 'carpool' } }
    );
    console.log('Updated service type to carpool');

    await User.updateOne(
      { _id: service.ownerId },
      { $set: { phone: '0972327977' } }
    );
    console.log('Updated owner phone to 0972327977');
  } else {
    console.log('Service not found');
  }
  process.exit(0);
}

fix();
