
import { useEffect, useRef, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Draggable as FullCalendarDraggable } from '@fullcalendar/interaction';
import PropTypes from 'prop-types';
import EventForm from './EventForm';

const List = ({ user, events, setEvents }) => {
  const listRef = useRef(null);
  const draggableRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
          details: el.getAttribute('data-details'),
        }),
      });
    }

    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
      }
    };
  }, [events]);

  const fetchEvents = useCallback(async () => {
    const handleError = (error, message) => {
      alert(message || 'An error occurred');
    };

    if (!user?._id) return;

    try {
      const res = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();
      const sortedEvents = data
          .map(event => ({
            id: event._id,
            title: event.title,
            date: event.date,
            details: event.details,
            priority: event.priority,
          }))
          .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

      setEvents(sortedEvents);
    } catch (err) {
      handleError(err, 'Failed to load events. Please try again.');
      alert('Failed to load events. Please try again.');
    }
  }, [user, setEvents]);

  const persistOrder = async (orderedEvents) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const updatePromises = orderedEvents.map((event, index) =>
          fetch(`http://localhost:5050/api/events/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: event.title,
              date: event.date,
              details: event.details,
              priority: index,
            }),
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to update event ${event.id}`);
          })
      );

      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Failed to persist event order:', err);
      alert('Failed to update event order. Please try again.');
      await fetchEvents(); // Reload original order
    } finally {
      setIsUpdating(false);
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
    alert('Auto-Schedule feature coming soon!');
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`http://localhost:5050/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Error deleting event: ' + err.message);
    }
  };

  const formatDateLocal = (dateStr) => {
    if (!dateStr) return 'No date chosen';
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return 'No date chosen';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(dt);
  };

  if (!user?._id) {
    return <div className="p-4 text-red-600">Please log in to view your todo list.</div>;
  }

  const highestPriority = events?.length === 0 ? -1 :
      Math.max(...events.map(e => e.priority ?? 0));

  return (
      <div
          ref={listRef}
          className="flex-1 h-screen overflow-y-auto p-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">ToDo List</h3>
          <div className="flex space-x-2">
            <button
                onClick={handleAutoSchedule}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isUpdating}
            >
              Auto-Schedule
            </button>
            <button
                onClick={handleCreateClick}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isUpdating}
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

        {!events?.length ? (
            <p className="text-gray-500 text-center py-4">Nothing to Do!</p>
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
                          <Draggable
                              key={event.id}
                              draggableId={event.id}
                              index={index}
                              isDragDisabled={isUpdating}
                          >
                            {(provided, snapshot) => (
                                <li
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="fc-event group flex justify-between items-center cursor-grab"
                                    data-id={event.id}
                                    data-title={event.title}
                                    data-details={event.details}
                                    style={{
                                      padding: '8px 12px',
                                      backgroundColor: event.date ? '#94a3b8' : '#3788d8',
                                      color: 'white',
                                      borderRadius: '4px',
                                      opacity: snapshot.isDragging ? 0.7 : 1,
                                      ...provided.draggableProps.style,
                                    }}
                                >
                                  <div className="flex-1">
                                    <strong className="block">{event.title}</strong>
                                    <small className="block text-gray-200">
                                      {formatDateLocal(event.date)}
                                    </small>
                                  </div>
                                  <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(event.id);
                                      }}
                                      title="Delete event"
                                      className="ml-2 p-1 text-white hover:text-red-300 transition-colors"
                                      disabled={isUpdating}
                                  >
                                    ✖️
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

List.propTypes = {
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

export default List;