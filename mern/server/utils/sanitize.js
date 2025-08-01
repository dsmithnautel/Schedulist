import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a fake window using jsdom
const window = new JSDOM('').window;

// Create a DOMPurify instance bound to the fake window
const DOMPurify = createDOMPurify(window);

export const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove any HTML/script tags and encode special characters
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: [], // No HTML tags allowed
            ALLOWED_ATTR: [], // No attributes allowed
        }).trim();
    } else if (typeof input === 'number') {
        // Ensure number is within safe bounds
        return Math.min(Math.max(input, Number.MIN_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
    }
    return input;
};

export const sanitizeEventData = (eventData) => {
    return {
        ...eventData,
        title: sanitizeInput(eventData.title),
        details: eventData.details ? sanitizeInput(eventData.details) : '',
        priority: typeof eventData.priority === 'number' ?
            Math.min(Math.max(Math.floor(eventData.priority), 0), 999999) : 0,
        duration: typeof eventData.duration === 'number' ?
            Math.min(Math.max(eventData.duration, 0), 24) : 0,
    };
};

export const validateEventData = (eventData) => {
    const errors = [];

    if (!eventData.title?.trim()) {
        errors.push('Title is required');
    }

    if (eventData.title?.length > 100) {
        errors.push('Title must be less than 100 characters');
    }

    if (eventData.details?.length > 500) {
        errors.push('Details must be less than 500 characters');
    }

    if (eventData.duration != null && (eventData.duration < 0 || eventData.duration > 24)) {
        errors.push('Duration must be between 0 and 24 hours');
    }

    if (eventData.priority != null && (!Number.isInteger(eventData.priority) || eventData.priority < 0)) {
        errors.push('Priority must be a positive integer');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
