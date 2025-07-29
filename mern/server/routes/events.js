// routes/events.js
import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';

const router = express.Router();

// GET all events for a user
router.get('/', async (req, res) => {
  const { userId } = req.query;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  try {
    const events = await Event.find({ userId }).sort({ priority: 1 }); // 👈 This sorts by priority ascending
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST create new event
router.post('/', async (req, res) => {
  const { userId, title, date, description } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: 'userId, title, and date are required' });
  }

  try {
    // Find the event with the highest priority for this user
    const highestPriorityEvent = await Event.findOne({ userId })
      .sort({ priority: -1 })
      .exec();

    const highestPriority = highestPriorityEvent ? highestPriorityEvent.priority : -1;

    const newEvent = new Event({
      userId,
      title,
      date,
      description: description || '',
      priority: highestPriority + 1,
    });

    const savedEvent = await newEvent.save();

    console.log('Created new event:', {
      id: savedEvent._id,
      userId: savedEvent.userId,
      title: savedEvent.title,
      date: savedEvent.date,
      description: savedEvent.description,
      priority: savedEvent.priority,
    });

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});




// PATCH update an event
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, date, description, priority } = req.body;

  console.log(`Received PATCH for event ${id}`, { title, date, description, priority }); // 👈 Log incoming data

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (title !== undefined) event.title = title;
    if (date !== undefined) event.date = date;
    if (description !== undefined) event.description = description;
    if (priority !== undefined) event.priority = priority;

    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});


// DELETE event by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Event not found' });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;