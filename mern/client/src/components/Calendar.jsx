import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const Calendar = ({ user }) => {
  const [events, setEvents] = useState([]);

  // Fetch events and map _id to id for FullCalendar
  const fetchEvents = async () => {
    if (!user?._id) return;

    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      const data = await res.json();

      const eventsWithId = data.map(event => ({
        id: event._id,
        title: event.title,
        date: event.date,
        description: event.description,
      }));

      setEvents(eventsWithId);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  // Add new event on date click
  const handleDateClick = async (info) => {
    const title = prompt('Enter event title:');
    if (!title) return;

    const newEvent = {
      userId: user._id,
      title,
      date: info.dateStr,
      description: '',
    };

    try {
      const res = await fetch('http://localhost:5050/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (!res.ok) throw new Error('Failed to save event');

      await fetchEvents();
    } catch (err) {
      alert('Error creating event: ' + err.message);
    }
  };

  // Update event date on drag and drop
  const handleEventDrop = async (info) => {
    const eventId = info.event.id;
    const newDate = info.event.startStr;

    try {
      const res = await fetch(`http://localhost:5050/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });

      if (!res.ok) {
        throw new Error('Failed to update event');
      }

      await fetchEvents();
    } catch (err) {
      alert('Error updating event: ' + err.message);
      info.revert(); // revert drag if update fails
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchEvents();
    }
  }, [user]);

  if (!user?._id) {
    return <p>User not loaded. Please log in again.</p>;
  }

  return (
    <div className="p-4 flex flex-col md:flex-row gap-6">
      <div style={{ flex: 2 }}>
        <h2 className="text-xl font-bold mb-4">My Calendar</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          editable={true}
          events={events}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          height="auto"
          eventDidMount={(info) => {
            if (info.event.extendedProps.description) {
              info.el.setAttribute('title', info.event.extendedProps.description);
            }
          }}
        />
      </div>

      <div style={{ flex: 1, maxHeight: '500px', overflowY: 'auto' }}>
        <h3 className="text-lg font-semibold mb-2">ToDo List</h3>
        {events.length === 0 ? (
          <p>Nothing to Do!.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong> — {new Date(event.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Calendar;
