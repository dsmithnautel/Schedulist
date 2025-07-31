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
      const fetchRes = await fetch(`http://localhost:5050/api/events?userId=${userId}`);
      if (!fetchRes.ok) throw new Error('Failed to fetch events for priority adjustment.');
      const events = await fetchRes.json();

      const toShift = events
        .filter(e => e.priority >= form.priority)
        .sort((a, b) => b.priority - a.priority);

      const shiftPromises = toShift.map(event =>
        fetch(`http://localhost:5050/api/events/${event._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: event.priority + 1 }),
        })
      );
      await Promise.all(shiftPromises);

      const eventData = {
        userId,
        title: form.title.trim(),
        date: form.date || null,
        duration: form.duration === '' ? 0 : parseFloat(form.duration),
        details: form.details.trim() === '' ? '' : form.details.trim(),
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
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 999,
        }}
      />

      {/* Modal Content */}
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()} // Prevent overlay click closing when clicking form
        className="border rounded-md bg-gray-100 max-w-md w-full p-6 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000]"
        style={{
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
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
    </>
  );
};

export default EventForm;
