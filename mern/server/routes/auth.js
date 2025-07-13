import express from 'express';
const router = express.Router();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Signup
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashedPassword });

        const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { _id: newUser._id, username: newUser.username } });
    } catch (err) {
        res.status(500).json({ message: 'Signup failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, user: { _id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).json({ message: 'Login failed' });
    }
});

export default router;