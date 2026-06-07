const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    // ⚡ Bolt: Use .exists() instead of .findOne() for a lightweight existence check
    // Why: Avoids full document hydration overhead when we only need a boolean result.
    // Impact: Reduces DB memory footprint and speeds up the validation query.
    // Measurement: Compare API response time and memory usage under concurrent registration load.
    const userExists = await User.exists({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ⚡ Bolt: Replace user.save() with atomic updateOne
    // This reduces hydration overhead and prevents potential race conditions on document save
    await User.updateOne(
      { _id: user._id },
      { $set: { isOnline: true, lastSeen: new Date() } },
      { runValidators: true }
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    // ⚡ Bolt: Replace findByIdAndUpdate with updateOne
    // This avoids fetching the document back from the database when it is not needed.
    await User.updateOne(
      { _id: userId },
      { $set: { isOnline: false, lastSeen: new Date() } },
      { runValidators: true }
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
});

module.exports = router; 