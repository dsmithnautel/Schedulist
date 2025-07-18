import { useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const List = ({ user, events, setEvents }) => {
  const listRef = useRef(null);

  useEffect(() => {
    // Optionally, you can add FullCalendar Draggable here if needed for calendar drag-out
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      const data = await res.json();
      setEvents(
        data.map(event => ({
          id: event._id,
          title: event.title,
          date: event.date,
          description: event.description,
        }))
      );
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const handleCreate = async () => {
    const title = prompt('Enter event title:');
    if (!title) return;

    const newEvent = {
      userId: user._id,
      title,
      description: '',
      priority: events.length, // Set priority to end of list
    };

    try {
      const res = await fetch('http://localhost:5050/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (!res.ok) throw new Error('Failed to create event');
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
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      alert('Error deleting event: ' + err.message);
    }
  };

  // Reorder helper
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // Persist order to backend
  const persistOrder = async (orderedEvents) => {
    try {
      await fetch('http://localhost:5050/api/events/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          order: orderedEvents.map((e, idx) => ({ id: e.id, priority: idx }))
        }),
      });
    } catch (err) {
      console.error('Failed to persist order:', err);
    }
  };

  // Handle drag end
  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    setEvents(prev => {
      const reordered = reorder(prev, result.source.index, result.destination.index);
      persistOrder(reordered); // Save to backend
      return reordered;
    });
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
        <p className="text-center text-gray-500 py-4">No events found. Create an event!</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="eventsList">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
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
                          ...provided.draggableProps.style,
                          padding: '6px 10px',
                          backgroundColor: event.date ? '#94a3b8' : '#3788d8',
                          color: 'white',
                          borderRadius: '4px',
                          opacity: snapshot.isDragging ? 0.7 : 1,
                        }}
                      >
                        <div>
                          <strong>{event.title}</strong><br />
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