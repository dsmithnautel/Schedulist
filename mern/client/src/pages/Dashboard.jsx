import { useState } from 'react';
import Calendar from '../components/Calendar.jsx';
import List from '../components/List.jsx';

function Dashboard({ user }) {
  const [events, setEvents] = useState([]);

  if (!user?._id) return <p>User not loaded. Please log in again.</p>;

  return (
    <div className="flex gap-4">
      <div className="flex-2 w-2/3">
        <Calendar user={user} events={events} setEvents={setEvents} />
      </div>
      <div className="flex-1 w-1/3">
        <List user={user} events={events} setEvents={setEvents} />
      </div>
    </div>
  );
}

export default Dashboard;
