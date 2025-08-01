
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

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
        <div className="signup-container">
            <form onSubmit={handleSignup}>
                <h2>Sign Up</h2>
                <div className="form-group">
                    <input
                        id="username"
                        name="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        id="password"
                        name="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                        placeholder="Password"
                        required
                    />
                    {password && (
                        <div className="password-requirements">
                            {errors.length > 0 ? (
                                <ul className="error-list">
                                    {errors.map((error, index) => (
                                        <li key={index} className="error-item">
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="valid-password">Password meets all requirements ✓</p>
                            )}
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!isValid || !username}
                >
                    Sign Up
                </button>
                <p>Already have an account? <Link to="/">Log in here</Link>.</p>
            </form>
        </div>
    );
}

Signup.propTypes = {
    setUser: PropTypes.func.isRequired,
};

export default Signup;