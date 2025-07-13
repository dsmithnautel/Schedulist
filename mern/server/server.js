import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';

const mongoURI = process.env.MONGO_URI || 'your_mongo_connection_string_here';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    });

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/events', eventsRoutes);

app.get('/', (req, res) => {
  res.send(`Backend is running on port ${process.env.PORT || 5050}!`);
});


app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});