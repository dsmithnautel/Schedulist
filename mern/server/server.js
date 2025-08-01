import express from 'express';
import cors from 'cors';
import auth from './routes/auth.js';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', auth);

// Export the app without connecting to MongoDB
export default app;

// Only connect to MongoDB if this file is being run directly (not imported)
if (process.argv[1] === new URL(import.meta.url).pathname) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected successfully'))
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        });

    const port = process.env.PORT || 5050;
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    });
}