import React, { useState, useEffect } from 'react';

const EventForm = ({ userId, onSuccess, onCancel, maxPriority, initialDate }) => {
  const [form, setForm] = useState({
    title: '',
    date: initialDate || '',
    duration: '',
    details: '',
    priority: maxPriority === -1 ? 0 : maxPriority + 1,
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      priority: maxPriority === -1 ? 0 : maxPriority + 1,
    }));
  }, [maxPriority]);

  // Update date if initialDate changes (e.g., new click)
  useEffect(() => {
    if (initialDate) {
      setForm((prev) => ({ ...prev, date: initialDate }));
    }
  }, [initialDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('Title is required.');
      return;
    }

    if (maxPriority >= 0) {
      if (
        !Number.isInteger(form.priority) ||
        form.priority < 0 ||
        form.priority > maxPriority + 1
      ) {
        alert(`Priority must be an integer between 0 and ${maxPriority + 1}.`);
        return;
      }
    }

    try {
      // Fetch current events for priority adjustment
      const fetchRes = await fetch(`http://localhost:5050/api/events?userId=${userId}`);
      if (!fetchRes.ok) throw new Error('Failed to fetch events for priority adjustment.');
      const events = await fetchRes.json();

      // Identify and sort events that need priority shift
      const toShift = events
        .filter(e => e.priority >= form.priority)
        .sort((a, b) => b.priority - a.priority); // Descending

      // Shift priorities to avoid conflicts
      const shiftPromises = toShift.map(event =>
        fetch(`http://localhost:5050/api/events/${event._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: event.priority + 1 }),
        })
      );
      await Promise.all(shiftPromises);

      // Prepare event data for creation
      const eventData = {
        userId,
        title: form.title.trim(),
        date: form.date || null,
        duration: form.duration === '' ? 0 : parseFloat(form.duration),
        details: form.details.trim() === '' ? 'No details provided' : form.details.trim(),
        priority: Number.isInteger(form.priority) ? form.priority : 0,
      };

      const createRes = await fetch('http://localhost:5050/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!createRes.ok) throw new Error('Failed to create event.');

      onSuccess();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded-md mb-4 bg-gray-100 max-w-md mx-auto">
      <div className="mb-2">
        <label className="block font-medium">Title *</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
          autoFocus
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
        />
      </div>

      <div className="mb-2">
        <label className="block font-medium">Details</label>
        <textarea
          name="details"
          value={form.details}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      {maxPriority >= 0 && (
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
          className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Save Event
        </button>
      </div>
    </form>
  );
};

export default EventForm;
