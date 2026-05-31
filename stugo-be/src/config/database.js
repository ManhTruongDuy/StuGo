import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,        // maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000,  // fail fast if can't connect
            socketTimeoutMS: 45000,
        });
        
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error("MongoDB connection failed: ", error);
        process.exit(1);
    }
};

export default connectDB;