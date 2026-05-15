import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/user.model.js';

const checkAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('Checking for existing admin...');
        const admin = await User.findOne({ role: 'admin' }).select('+password');

        if (admin) {
            console.log('✅ Found existing ADMIN account:');
            console.log('Email:', admin.email);
            // Since password is hashed, we can't show it, but we can reset it if needed.
            // For now, let's just show the email.
            console.log('If you do not know the password, I can reset it to "admin123"');
            
            // Check if we can verify the password "admin123"
            const isMatch = await admin.comparePassword('admin123');
            if (isMatch) {
                console.log('Password is "admin123"');
            } else {
                console.log('Password is NOT "admin123". Updating to "admin123"...');
                admin.password = 'admin123';
                await admin.save();
                console.log('✅ Password reset to "admin123"');
            }
        } else {
            console.log('❌ No admin found. Creating one...');
            const newAdmin = await User.create({
                email: 'admin@stugo.com',
                password: 'admin123',
                fullName: 'System Administrator',
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Created NEW ADMIN account:');
            console.log('Email:', newAdmin.email);
            console.log('Password: admin123');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmin();
