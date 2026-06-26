import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from './src/models/review.model.js';
import Service from './src/models/service.model.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Delete all reviews
        const result = await Review.deleteMany({});
        console.log(`Deleted ${result.deletedCount} reviews`);

        // Reset all service ratings
        const updateResult = await Service.updateMany({}, {
            $set: {
                rating: 0,
                reviewCount: 0,
                'reviewStats.averageRating': 0,
                'reviewStats.totalReviews': 0,
                'reviewStats.ratingDistribution': {
                    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
                }
            }
        });
        console.log(`Updated ${updateResult.modifiedCount} services ratings to 0`);
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
