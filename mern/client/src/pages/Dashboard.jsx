import Calendar from '../components/Calendar.jsx';

function Dashboard({ user }) {
    if (!user?._id) {
    return <p>User not loaded. Please log in again.</p>;
  }

  return (
    <div>
      <Calendar user={user} />
    </div>
  );
}

export default Dashboard;
