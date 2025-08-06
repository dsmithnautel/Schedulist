import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Draggable as FullCalendarDraggable } from '@fullcalendar/interaction';
import EventForm from './EventForm';
import AutoScheduleForm from './AutoScheduleForm';

const List = ({ user, events, setEvents }) => {
  const listRef = useRef(null);
  const draggableRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [showAutoScheduleForm, setShowAutoScheduleForm] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

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
            description: event.details,
            duration: event.duration,
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
            details: event.description,
            priority: index,
            duration: event.duration,
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
    if (events.length === 0) {
      alert('No events to schedule!');
      return;
    }
    setShowAutoScheduleForm(true);
  };

  const handleAutoScheduleSubmit = async (startDateTime) => {
    try {
      // Get all existing scheduled events to check for conflicts
      const existingEventsRes = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);
      const existingEvents = await existingEventsRes.json();
      const scheduledEvents = existingEvents.filter(e => e.date).map(e => ({
        start: new Date(e.date),
        end: new Date(new Date(e.date).getTime() + (e.duration || 0) * 60 * 60 * 1000),
        duration: e.duration || 0
      }));

      let currentTime = new Date(startDateTime);
      const updatePromises = events.map(async (event) => {
        const eventDuration = event.duration || 0; // Default 0 hours (no duration)
        const eventDurationMs = eventDuration * 60 * 60 * 1000;

        // Find the next available time slot starting from current time
        let scheduledTime = findNextAvailableTime(currentTime, scheduledEvents, eventDurationMs);
        
        // Add this event to the scheduled events for future conflict checking
        scheduledEvents.push({
          start: scheduledTime,
          end: new Date(scheduledTime.getTime() + eventDurationMs),
          duration: eventDuration
        });

        // Update current time to the end of this event for the next event
        currentTime = new Date(scheduledTime.getTime() + eventDurationMs);

        // Update the event with the new date
        const res = await fetch(`http://localhost:5050/api/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: event.title,
            date: scheduledTime.toISOString(),
            details: event.description || '',
            priority: event.priority,
            duration: eventDuration,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to update event ${event.title}`);
        }

        return res.json();
      });

      await Promise.all(updatePromises);
      
      // Refresh the events list to show the new dates
      await fetchEvents();
      
      setShowAutoScheduleForm(false);
      alert(`Successfully scheduled ${events.length} events starting from ${startDateTime.toLocaleDateString()}!`);
    } catch (err) {
      console.error('Auto-schedule error:', err);
      alert('Error auto-scheduling events: ' + err.message);
    }
  };

  // Helper function to find the next available time slot
  const findNextAvailableTime = (startTime, scheduledEvents, eventDuration) => {
    let currentTime = new Date(startTime);
    
    // Set business hours (9 AM to 6 PM)
    const businessStartHour = 9;
    const businessEndHour = 18;
    
    while (true) {
      // Skip weekends
      if (currentTime.getDay() === 0 || currentTime.getDay() === 6) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessStartHour, 0, 0, 0);
        continue;
      }
      
      // Skip outside business hours
      if (currentTime.getHours() < businessStartHour || currentTime.getHours() >= businessEndHour) {
        currentTime.setHours(businessStartHour, 0, 0, 0);
        continue;
      }
      
      const eventEnd = new Date(currentTime.getTime() + eventDuration);
      
      // Check if this time slot conflicts with any existing events
      const hasConflict = scheduledEvents.some(existingEvent => {
        return (currentTime < existingEvent.end && eventEnd > existingEvent.start);
      });
      
      if (!hasConflict) {
        return currentTime;
      }
      
      // Move to next available slot (increment by 30 minutes)
      currentTime.setTime(currentTime.getTime() + 30 * 60 * 1000);
    }
  };

  const handleAutoScheduleCancel = () => {
    setShowAutoScheduleForm(false);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setShowForm(true);
  };

  const handleEditSuccess = async () => {
    setShowForm(false);
    setEventToEdit(null);
    await fetchEvents();
  };

  const handleEditCancel = () => {
    setShowForm(false);
    setEventToEdit(null);
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
    
    // Ensure we're working with a proper date string
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return 'No date chosen';

    // Format the date in local timezone
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const day = dt.getDate();

    let hours = dt.getHours();
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // Convert 0 to 12 for 12 AM/PM format

    const formattedDate = `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    console.log('Original date string:', dateStr, 'Formatted date:', formattedDate);
    return formattedDate;
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
                onSuccess={eventToEdit ? handleEditSuccess : handleFormSuccess}
                onCancel={eventToEdit ? handleEditCancel : handleFormCancel}
                maxPriority={highestPriority}
                eventToEdit={eventToEdit}
            />
        )}

        {showAutoScheduleForm && (
            <AutoScheduleForm
                onSchedule={handleAutoScheduleSubmit}
                onCancel={handleAutoScheduleCancel}
                eventCount={events.length}
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
                                    onClick={() => handleEditEvent(event)}
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