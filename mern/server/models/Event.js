import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // <--- Links it to your User.js
    required: true,
  },
  title: { type: String, required: true },
  date: { type: Date, default: null }, 
  description: { type: String, default: '' },
  priority: { type: Number, default: 0 }, 
});

export default mongoose.model('Event', eventSchema);