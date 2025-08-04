import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
// Import your logo images
import gatorLogo from '../assets/gator-logo.png';
import ufLogo from '../assets/uf-logo.png';

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
            console.log('Login response data:', data);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                {/* UF Logo Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center space-x-4 mb-4">
                        {/* Actual Gator Head Logo */}
                        <img 
                            src={gatorLogo} 
                            alt="UF Gator" 
                            className="w-16 h-16 object-contain"
                        />
                        {/* Actual UF Text Logo */}
                        <img 
                            src={ufLogo} 
                            alt="University of Florida" 
                            className="h-12 object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Schedulist</h1>
                    <p className="text-gray-600">Gator Student Planning</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">Login</h2>
                    
                    <div>
                        <input 
                            id="username" 
                            name="username" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="Username" 
                            required 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    
                    <div>
                        <input 
                            id="password" 
                            name="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            type="password" 
                            placeholder="Password" 
                            required 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg"
                    >
                        Login
                    </button>
                    
                    <p className="text-center text-gray-600 mt-4">
                        Don&apos;t have an account? 
                        <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                            Sign up here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

Login.propTypes = {
    setUser: PropTypes.func.isRequired,
};

export default Login;