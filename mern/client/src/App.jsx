import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
    const [user, setUser] = useState(null);

    console.log('Current user state:', user);

    return (
        <Routes>
            {/* Show Login at root path */}
            <Route path="/" element={<Login setUser={setUser} />} />

            {/* Signup page */}
            <Route path="/signup" element={<Signup setUser={setUser} />} />

            {/* Protected route: redirect to login if not logged in */}
            <Route
                path="/dashboard"
                element={
                    user ? (
                        <Dashboard user={user} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />

            {/* Catch-all route for unknown paths */}
            <Route path="*" element={<h2>404 - Page Not Found</h2>} />
        </Routes>
    );
}


export default App;