import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const Calendar = ({ user, events, setEvents }) => {
  const calendarRef = useRef(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      const data = await res.json();
      const formatted = data.map(event => ({
        id: event._id,
        title: event.title,
        date: event.date,
        description: event.description,
      }));
      setEvents(formatted);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

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

  const handleEventDrop = async (info) => {
    const eventId = info.event.id;
    const newDate = info.event.startStr;

    try {
      const res = await fetch(`http://localhost:5050/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });

      if (!res.ok) throw new Error('Failed to update event');

      setEvents(prev =>
        prev.map(e => e.id === eventId ? { ...e, date: newDate } : e)
      );
    } catch (err) {
      alert('Error updating event: ' + err.message);
      info.revert();
    }
  };

  const handleEventReceive = async (info) => {
    const droppedEvent = info.event;
    const newDate = droppedEvent.startStr;

    try {
      const res = await fetch(`http://localhost:5050/api/events/${droppedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });

      if (!res.ok) throw new Error('Failed to update dropped event');

      setEvents(prev =>
        prev.map(e => e.id === droppedEvent.id ? { ...e, date: newDate } : e)
      );
    } catch (err) {
      alert('Error saving dropped event: ' + err.message);
      droppedEvent.remove();
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchEvents();
    }
  }, [user]);

  return (
    <div style={{ flex: 2 }}>
      <h2 className="text-xl font-bold mb-4">Schedulist</h2>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        droppable={true}
        events={events.filter(e => e.date)} // Only show events with a date
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        eventReceive={handleEventReceive}
        timeZone="local"
        height="auto"
        eventDidMount={(info) => {
          if (info.event.extendedProps.description) {
            info.el.setAttribute('title', info.event.extendedProps.description);
          }
        }}
      />
    </div>
  );
};

export default Calendar;
