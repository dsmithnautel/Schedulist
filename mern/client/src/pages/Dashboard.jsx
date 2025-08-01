import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Calendar from '../components/Calendar.jsx';
import List from '../components/List.jsx';

function Dashboard({ user }) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInitialEvents = async () => {
            if (!user?._id) return;

            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(`http://localhost:5050/api/events?userId=${user._id}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const formattedEvents = data.map(event => ({
                    id: event._id,
                    title: event.title,
                    date: event.date,
                    details: event.details,
                    priority: event.priority,
                }));

                setEvents(formattedEvents);
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError('Failed to load events. Please refresh the page or try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialEvents();
    }, [user?._id]);

    if (!user?._id) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-600">Please log in to access your dashboard.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600">Loading your events...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 h-screen p-4">
            <div className="md:w-2/3 h-full">
                <Calendar
                    user={user}
                    events={events}
                    setEvents={setEvents}
                />
            </div>
            <div className="md:w-1/3 h-full">
                <List
                    user={user}
                    events={events}
                    setEvents={setEvents}
                />
            </div>
        </div>
    );
}

Dashboard.propTypes = {
    user: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
    }),
};

export default Dashboard;