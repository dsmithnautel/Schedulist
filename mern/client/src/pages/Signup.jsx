import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
// Import your logo images
import gatorLogo from '../assets/gator-logo.png';
import ufLogo from '../assets/uf-logo.png';

function Signup({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [isValid, setIsValid] = useState(false);
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const newErrors = [];
        if (password.length < minLength) {
            newErrors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            newErrors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            newErrors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            newErrors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            newErrors.push('Password must contain at least one special character');
        }

        return {
            isValid: newErrors.length === 0,
            errors: newErrors
        };
    };

    useEffect(() => {
        if (password) {
            const { isValid, errors } = validatePassword(password);
            setErrors(errors);
            setIsValid(isValid);
        } else {
            setErrors([]);
            setIsValid(false);
        }
    }, [password]);

    async function handleSignup(e) {
        e.preventDefault();
        if (!isValid) {
            alert('Please fix password validation errors before submitting.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5050/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                navigate('/dashboard');
            } else {
                alert(data.message || 'Signup failed');
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

                <form onSubmit={handleSignup} className="space-y-4">
                    <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">Sign Up</h2>
                    
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
                        
                        {/* Password Requirements */}
                        {password && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                                {errors.length > 0 ? (
                                    <ul className="space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index} className="text-sm text-red-600 flex items-center">
                                                <span className="w-4 h-4 text-red-500 mr-2">✗</span>
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-green-600 flex items-center">
                                        <span className="w-4 h-4 text-green-500 mr-2">✓</span>
                                        Password meets all requirements
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!isValid || !username}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                    >
                        Sign Up
                    </button>
                    
                    <p className="text-center text-gray-600 mt-4">
                        Already have an account? 
                        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                            Log in here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

Signup.propTypes = {
    setUser: PropTypes.func.isRequired,
};

export default Signup;