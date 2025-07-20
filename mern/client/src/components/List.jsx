import { useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Draggable as FullCalendarDraggable } from '@fullcalendar/interaction';

const List = ({ user, events, setEvents }) => {
  const listRef = useRef(null);
  const draggableRef = useRef(null);

  // Initialize FullCalendar Draggable
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

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      const data = await res.json();
      setEvents(data.map(event => ({
        id: event._id,
        title: event.title,
        date: event.date,
        description: event.description,
        priority: event.priority,
      })));
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  // Persist reordered list to backend
  const persistOrder = async (orderedEvents) => {
    try {
      await fetch('http://localhost:5050/api/events/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          order: orderedEvents.map((e, idx) => ({ id: e.id, priority: idx })),
        }),
      });
    } catch (err) {
      console.error('Failed to persist order:', err);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = Array.from(events);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setEvents(reordered);
    persistOrder(reordered);
  };

  const handleCreate = async () => {
    const title = prompt('Enter event title:');
    if (!title) return;

    const newEvent = {
      userId: user._id,
      title,
      description: '',
      priority: events.length,
    };

    try {
      const res = await fetch('http://localhost:5050/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (!res.ok) throw new Error('Failed to create event');

      // After successful creation, refresh the list:
      await fetchEvents();

    } catch (err) {
      alert('Error creating event: ' + err.message);
    }
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

  const formatDateLocal = (dateStr) => {
    if (!dateStr) return 'No date chosen';

    const dtUtc = new Date(dateStr);
    if (isNaN(dtUtc.getTime())) return 'No date chosen';

    const year = dtUtc.getUTCFullYear();
    const month = dtUtc.getUTCMonth() + 1;
    const day = dtUtc.getUTCDate();
    const hours = dtUtc.getUTCHours().toString().padStart(2, '0');
    const minutes = dtUtc.getUTCMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  if (!user?._id) return <p>User not loaded. Please log in again.</p>;

  return (
    <div
      ref={listRef}
      style={{ flex: 1, maxHeight: '500px', overflowY: 'auto' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">ToDo List</h3>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          + Create Event
        </button>
      </div>

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
