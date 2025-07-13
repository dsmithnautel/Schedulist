import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5050/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                navigate('/dashboard');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Network error. Please try again.');
            console.error(err);
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input id="username" name="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
            <input id="password" name="password" value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required />
            <button type="submit">Login</button>
            <p>Don&apos;t have an account? <Link to="/signup">Sign up here</Link>.</p>
        </form>
    );
}

Login.propTypes = {
    setUser: PropTypes.func.isRequired,
};

export default Login;
