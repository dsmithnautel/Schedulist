import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Draggable as FullCalendarDraggable } from '@fullcalendar/interaction';
import EventForm from './EventForm';

const List = ({ user, events, setEvents }) => {
  const listRef = useRef(null);
  const draggableRef = useRef(null);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (listRef.current) {
      if (draggableRef.current) {
        draggableRef.current.destroy();
      }
      draggableRef.current = new FullCalendarDraggable(listRef.current, {
        itemSelector: '.fc-event',
        eventData: (el) => ({
          id: el.getAttribute('data-id'),
          title: el.getAttribute('data-title'),
          description: el.getAttribute('data-description'),
        }),
      });
    }
  }, [events]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      const data = await res.json();
      const sortedEvents = data
        .map(event => ({
          id: event._id,
          title: event.title,
          date: event.date,
          description: event.description,
          priority: event.priority,
        }))
        .sort((a, b) => a.priority - b.priority);

      setEvents(sortedEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const persistOrder = async (orderedEvents) => {
    try {
      const updatePromises = orderedEvents.map((event, index) => {
        return fetch(`http://localhost:5050/api/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: event.title,
            date: event.date,
            description: event.description,
            priority: index,
          }),
        });
      });

      await Promise.all(updatePromises);
      console.log('All events updated successfully.');
    } catch (err) {
      console.error('Failed to persist event order:', err);
    }
  };

  const onDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;

    const reordered = Array.from(events);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    setEvents(reordered);
    persistOrder(reordered);
  };

  const handleCreateClick = () => setShowForm(true);
  const handleFormSuccess = async () => {
    setShowForm(false);
    await fetchEvents();
  };
  const handleFormCancel = () => setShowForm(false);

  const handleAutoSchedule = () => {
    alert('Auto-Schedule clicked! Implement your logic here.');
  };

  const handleDelete = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      alert('Error deleting event: ' + err.message);
    }
  };

  // Format date to local time with 12-hour format and AM/PM
  const formatDateLocal = (dateStr) => {
    if (!dateStr) return 'No date chosen';
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return 'No date chosen';

    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const day = dt.getDate();

    let hours = dt.getHours();
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // Convert 0 to 12 for 12 AM/PM format

    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };

  if (!user?._id) return <p>User not loaded. Please log in again.</p>;

  const highestPriority = events.length === 0 ? -1 : Math.max(...events.map(e => e.priority ?? 0));

  return (
    <div
      ref={listRef}
      style={{ flex: 1, height: '100vh', overflowY: 'auto' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">ToDo List</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleAutoSchedule}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Auto-Schedule
          </button>
          <button
            onClick={handleCreateClick}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Create Event
          </button>
        </div>
      </div>

      {showForm && (
        <EventForm
          userId={user._id}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          maxPriority={highestPriority}
        />
      )}

      {events.length === 0 ? (
        <p>Nothing to Do!</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="eventsList">
            {(provided) => (
              <ul
                className="space-y-2"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {events.map((event, index) => (
                  <Draggable key={event.id} draggableId={event.id} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="fc-event group flex justify-between items-center cursor-grab"
                        data-id={event.id}
                        data-title={event.title}
                        data-description={event.description}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: event.date ? '#94a3b8' : '#3788d8',
                          color: 'white',
                          borderRadius: '4px',
                          opacity: snapshot.isDragging ? 0.7 : 1,
                          ...provided.draggableProps.style,
                        }}
                      >
                        <div>
                          <strong>{event.title}</strong>
                          <br />
                          <small>{formatDateLocal(event.date)}</small>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                          title="Delete event"
                          className="ml-2 text-sm text-white hover:text-red-300"
                        >
                          ✔️
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default List;
