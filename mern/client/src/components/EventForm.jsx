
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EventForm = ({ userId, onSuccess, onCancel, maxPriority, initialDate, eventToEdit }) => {
  // Helper function to format date for input field (same as Calendar component)
  const formatDateForInput = (date) => {
    const local = new Date(date);
    const yyyy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, '0');
    const dd = String(local.getDate()).padStart(2, '0');
    const hh = String(local.getHours()).padStart(2, '0');
    const mi = String(local.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const [form, setForm] = useState({
    title: eventToEdit?.title || '',
    date: eventToEdit?.date ? formatDateForInput(eventToEdit.date) : (initialDate || ''),
    duration: eventToEdit?.duration || '',
    details: eventToEdit?.details || '',
    priority: eventToEdit?.priority || (maxPriority === -1 ? 0 : maxPriority + 1),
  });

  // Debug logging
  useEffect(() => {
    if (eventToEdit?.date) {
      console.log('EventForm - Original date:', eventToEdit.date);
      console.log('EventForm - Formatted date:', formatDateForInput(eventToEdit.date));
    }
  }, [eventToEdit]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!eventToEdit) {
      setForm((prev) => ({
        ...prev,
        priority: maxPriority === -1 ? 0 : maxPriority + 1,
      }));
    }
  }, [maxPriority, eventToEdit]);

  useEffect(() => {
    if (initialDate && !eventToEdit) {
      setForm((prev) => ({ ...prev, date: formatDateForInput(initialDate) }));
    }
  }, [initialDate, eventToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'priority' || name === 'duration'
          ? value === '' ? '' : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!form.title.trim()) {
        throw new Error('Title is required.');
      }

      const eventData = {
        title: form.title.trim(),
        date: form.date || null,
        duration: form.duration === '' ? 0 : parseFloat(form.duration),
        details: form.details.trim(),
        priority: Number.isInteger(form.priority) ? form.priority : 0,
      };

      if (eventToEdit) {
        // Editing existing event
        const updateRes = await fetch(`http://localhost:5050/api/events/${eventToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });

        if (!updateRes.ok) throw new Error('Failed to update event.');
      } else {
        // Creating new event
        if (maxPriority >= 0) {
          if (
              !Number.isInteger(form.priority) ||
              form.priority < 0 ||
              form.priority > maxPriority + 1
          ) {
            throw new Error(`Priority must be an integer between 0 and ${maxPriority + 1}.`);
          }
        }

        const fetchRes = await fetch(`http://localhost:5050/api/events?userId=${userId}`);
        if (!fetchRes.ok) throw new Error('Failed to fetch events for priority adjustment.');
        const events = await fetchRes.json();

        const toShift = events
            .filter(e => e.priority >= form.priority)
            .sort((a, b) => b.priority - a.priority);

        // Shift existing events' priorities
        await Promise.all(toShift.map(event =>
            fetch(`http://localhost:5050/api/events/${event._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ priority: event.priority + 1 }),
            }).then(res => {
              if (!res.ok) throw new Error('Failed to update event priority');
            })
        ));

        const createRes = await fetch('http://localhost:5050/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...eventData,
            userId,
          }),
        });

        if (!createRes.ok) throw new Error('Failed to create event.');
      }

      onSuccess();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <>
        <div
            onClick={onCancel}
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
        />

        <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="border rounded-md bg-gray-100 max-w-md w-full p-6 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </h3>
          <div className="mb-2">
            <label className="block font-medium">Title *</label>
            <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                autoFocus
                maxLength={100}
            />
          </div>

          <div className="mb-2">
            <label className="block font-medium">Date</label>
            <input
                name="date"
                type="datetime-local"
                value={form.date}
                onChange={handleChange}
                className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-2">
            <label className="block font-medium">Duration (hours)</label>
            <input
                name="duration"
                type="number"
                min="0"
                step="0.5"
                value={form.duration}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                max={24}
            />
          </div>

          <div className="mb-2">
            <label className="block font-medium">Details</label>
            <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                maxLength={500}
                rows={3}
            />
          </div>

          {maxPriority >= -1 && (
              <div className="mb-4">
                <label className="block font-medium">
                  Priority (0 to {maxPriority + 1})
                </label>
                <input
                    name="priority"
                    type="number"
                    min="0"
                    max={maxPriority + 1}
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                />
              </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
                type="button"
                onClick={onCancel}
                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
                disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (eventToEdit ? 'Update Event' : 'Save Event')}
            </button>
          </div>
        </form>
      </>
  );
};

EventForm.propTypes = {
  userId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  maxPriority: PropTypes.number.isRequired,
  initialDate: PropTypes.string,
  eventToEdit: PropTypes.object,
};

export default EventForm;