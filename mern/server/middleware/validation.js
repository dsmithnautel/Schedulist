import { sanitizeEventData, validateEventData } from '../utils/sanitize.js';
import mongoose from 'mongoose';

export const validateEvent = (req, res, next) => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeEventData(req.body);

        // Validate sanitized data
        const validation = validateEventData(sanitizedData);
        if (!validation.isValid) {
            return res.status(400).json({
                message: 'Invalid event data',
                errors: validation.errors
            });
        }

        // Validate userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // If all validations pass, attach sanitized data to request
        req.sanitizedData = sanitizedData;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Validation error', error: error.message });
    }
};

export const validateId = (req, res, next) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }
    next();
};