const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    // ⚡ Bolt: Added .lean() to read-only query for performance improvement
    // This prevents Mongoose from returning fully hydrated documents with unnecessary overhead
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, bio, profilePicture } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (bio) updateData.bio = bio;
    if (profilePicture) updateData.profilePicture = profilePicture;

    // ⚡ Bolt: Replaced two-step findById+save with single atomic findByIdAndUpdate
    // This minimizes database roundtrips and avoids full document hydration overhead
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Follow user
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    if (req.params.userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const [userToFollow, currentUser] = await Promise.all([
      User.findById(req.params.userId).select('_id'),
      User.findById(req.user.userId).select('following')
    ]);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // ⚡ Bolt: Replaced two-step save with atomic update operations
    // This reduces database roundtrips and handles concurrency better than read-modify-write
    await Promise.all([
      User.updateOne(
        { _id: req.user.userId },
        { $addToSet: { following: req.params.userId } }
      ),
      User.updateOne(
        { _id: req.params.userId },
        { $addToSet: { followers: req.user.userId } }
      )
    ]);

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    res.status(500).json({ message: 'Error following user', error: error.message });
  }
});

// Unfollow user
router.post('/:userId/unfollow', auth, async (req, res) => {
  try {
    if (req.params.userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot unfollow yourself' });
    }

    const [userToUnfollow, currentUser] = await Promise.all([
      User.findById(req.params.userId).select('_id'),
      User.findById(req.user.userId).select('_id')
    ]);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ⚡ Bolt: Replaced two-step save with atomic update operations
    // This minimizes database roundtrips and avoids array filtering in memory
    await Promise.all([
      User.updateOne(
        { _id: req.user.userId },
        { $pull: { following: req.params.userId } }
      ),
      User.updateOne(
        { _id: req.params.userId },
        { $pull: { followers: req.user.userId } }
      )
    ]);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    res.status(500).json({ message: 'Error unfollowing user', error: error.message });
  }
});

// Search users
router.get('/search/:query', auth, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    // ⚡ Bolt: Added .lean() to read-only query for performance improvement
    // This skips Mongoose hydration which improves query speed and reduces memory usage
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(10)
    .lean();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

module.exports = router; 