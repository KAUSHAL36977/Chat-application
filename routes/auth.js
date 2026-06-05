const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    // ⚡ Bolt: Replace findOne with exists for existence check
    // Why: exists() is faster as it only queries the _id field and avoids full document hydration
    // Impact: Reduces query execution time and memory allocation during registration
    // Measurement: Profile the registration endpoint memory usage and response time
    const existingUser = await User.exists({ $or: [{ email }, { username }] });
    if (existingUser) {
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
    const userId = req.user.userId;
    
    // ⚡ Bolt: Replace findById + save with single atomic findByIdAndUpdate
    // This avoids document hydration and limits the operation to a single roundtrip
    await User.findByIdAndUpdate(
      userId,
      { $set: { isOnline: false, lastSeen: new Date() } },
      { runValidators: true }
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
});

module.exports = router; 