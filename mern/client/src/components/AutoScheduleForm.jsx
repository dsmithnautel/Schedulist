import { useState } from 'react';
import PropTypes from 'prop-types';

const AutoScheduleForm = ({ onSchedule, onCancel, eventCount }) => {
  const [form, setForm] = useState({
    startDate: '',
    startTime: '09:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!form.startDate) {
        throw new Error('Please select a start date.');
      }

      // Combine date and time
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
      
      if (startDateTime < new Date()) {
        throw new Error('Start date and time must be in the future.');
      }

      await onSchedule(startDateTime);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];

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
        <h3 className="text-lg font-semibold mb-4">Auto-Schedule Events</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Schedule {eventCount} events starting from your chosen date and time.
          </p>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Start Date *</label>
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            min={today}
            required
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Start Time *</label>
          <input
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500">
            Events will be scheduled based on their duration and available time, starting from your chosen date and time.
          </p>
        </div>

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
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Events'}
          </button>
        </div>
      </form>
    </>
  );
};

AutoScheduleForm.propTypes = {
  onSchedule: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  eventCount: PropTypes.number.isRequired,
};

export default AutoScheduleForm; 