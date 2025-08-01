
import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import { validateEvent, validateId } from '../middleware/validation.js';
import { sanitizeInput } from '../utils/sanitize.js';

const router = express.Router();

// GET all events for a user
router.get('/', async (req, res) => {
  const userId = sanitizeInput(req.query.userId);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  try {
    const events = await Event.find({ userId }).sort({ priority: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST create new event
router.post('/', validateEvent, async (req, res) => {
  try {
    const { userId } = req.sanitizedData;

    const highestPriorityEvent = await Event.findOne({ userId })
        .sort({ priority: -1 })
        .exec();

    const highestPriority = highestPriorityEvent ? highestPriorityEvent.priority : -1;
    const eventPriority = req.sanitizedData.priority ?? (highestPriority + 1);

    const newEvent = new Event({
      ...req.sanitizedData,
      priority: eventPriority
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// PATCH update an event
router.patch('/:id', validateId, validateEvent, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the event belongs to the user
    if (event.userId.toString() !== req.sanitizedData.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this event' });
    }

    // Update only the fields that are present in sanitizedData
    Object.keys(req.sanitizedData).forEach(key => {
      if (req.sanitizedData[key] !== undefined) {
        event[key] = req.sanitizedData[key];
      }
    });

    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event by ID
router.delete('/:id', validateId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify userId if provided in query
    const requestUserId = sanitizeInput(req.query.userId);
    if (requestUserId && event.userId.toString() !== requestUserId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Additional endpoint to reorder events
router.post('/reorder', async (req, res) => {
  const { userId, eventIds } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  if (!Array.isArray(eventIds)) {
    return res.status(400).json({ error: 'eventIds must be an array' });
  }

  try {
    const updatePromises = eventIds.map((eventId, index) => {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new Error(`Invalid event ID: ${eventId}`);
      }

      return Event.findOneAndUpdate(
          { _id: eventId, userId }, // ensure the event belongs to the user
          { priority: index },
          { new: true }
      );
    });

    await Promise.all(updatePromises);
    const updatedEvents = await Event.find({ userId }).sort({ priority: 1 });
    res.json(updatedEvents);
  } catch (error) {
    console.error('Error reordering events:', error);
    res.status(500).json({ error: 'Failed to reorder events' });
  }
});

export default router;