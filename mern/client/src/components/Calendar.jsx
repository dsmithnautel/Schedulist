import { useEffect, useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import PropTypes from 'prop-types';
import EventForm from './EventForm';

const Calendar = ({ user, events, setEvents }) => {
  const calendarRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calculate maxPriority safely with null check
  const maxPriority = events?.length === 0 ? -1 : Math.max(...events.filter(e => e.priority !== undefined && e.priority !== null).map(e => e.priority), -1);

  const fetchEvents = useCallback(async () => {
    if (!user?._id) return;

    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const formatted = data.map(event => ({
        id: event._id,
        title: event.title,
        date: event.date,
        details: event.details,
        priority: event.priority,
      }));
      setEvents(formatted);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, [user, setEvents]);

  const toLocalDateISO = (date) => {
    const d = new Date(date);
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return localDate.toISOString();
  };

  const handleDateClick = (info) => {
    setSelectedDate(toLocalDateISO(info.date));
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedDate(null);
    fetchEvents();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedDate(null);
  };

  const handleEventDrop = async (info) => {
    const eventId = info.event.id;
    const newDate = toLocalDateISO(info.event.start);

    try {
      const res = await fetch(`http://localhost:5050/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });

      if (!res.ok) throw new Error('Failed to update event');

      setEvents(prev =>
          prev.map(e => (e.id === eventId ? { ...e, date: newDate } : e))
      );
    } catch (err) {
      alert('Error updating event: ' + err.message);
      info.revert();
    }
  };

  const handleEventReceive = async (info) => {
    const droppedEvent = info.event;
    const newDate = toLocalDateISO(droppedEvent.start);

    try {
      const res = await fetch(`http://localhost:5050/api/events/${droppedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });

      if (!res.ok) throw new Error('Failed to update dropped event');

      setEvents(prev =>
          prev.map(e => (e.id === droppedEvent.id ? { ...e, date: newDate } : e))
      );
    } catch (err) {
      alert('Error saving dropped event: ' + err.message);
      droppedEvent.remove();
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (!user?._id) {
    return <div>Please log in to view your calendar.</div>;
  }

  return (
      <div style={{ flex: 2 }}>
        <h2 className="text-xl font-bold mb-4">Schedulist</h2>

        {isFormOpen && (
            <EventForm
                userId={user._id}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                maxPriority={maxPriority}
                initialDate={selectedDate}
            />
        )}

        <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            editable={true}
            droppable={true}
            events={events?.filter(e => e?.date) || []} // Safer filter with null checks
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventReceive={handleEventReceive}
            timeZone="local"
            height="auto"
            eventDisplay="block"
            eventDidMount={(info) => {
              if (info.event.extendedProps.details) {
                info.el.setAttribute('title', info.event.extendedProps.details);
              }
            }}
        />
      </div>
  );
};

Calendar.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }),
  events: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string,
    details: PropTypes.string,
    priority: PropTypes.number,
  })).isRequired,
  setEvents: PropTypes.func.isRequired,
};

export default Calendar;