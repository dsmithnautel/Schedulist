import mongoose from 'mongoose';

export async function connectDB(uri) {
    try {
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

export async function disconnectDB() {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
}