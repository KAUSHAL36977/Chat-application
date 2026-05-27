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

    // Build update object only with defined fields
    const updateFields = {};
    if (username) updateFields.username = username;
    if (bio) updateFields.bio = bio;
    if (profilePicture) updateFields.profilePicture = profilePicture;

    // ⚡ Bolt: Replaced two-step findById + save with single atomic operation
    // This minimizes database roundtrips and avoids full document hydration overhead
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

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

    // ⚡ Bolt: Replace findById + save with lightweight existence checks and atomic operations
    // This avoids fully hydrating both user documents and limits database roundtrips
    const [userToFollowExists, currentUserExists] = await Promise.all([
      User.exists({ _id: req.params.userId }),
      User.exists({ _id: req.user.userId })
    ]);

    if (!userToFollowExists || !currentUserExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ⚡ Bolt: Use atomic updateOne with $addToSet to prevent duplicates and hydration overhead
    const [currentUserUpdateResult] = await Promise.all([
      User.updateOne(
        { _id: req.user.userId },
        { $addToSet: { following: req.params.userId } },
        { runValidators: true }
      ),
      User.updateOne(
        { _id: req.params.userId },
        { $addToSet: { followers: req.user.userId } },
        { runValidators: true }
      )
    ]);

    // If no document was modified, the user was already following
    if (currentUserUpdateResult.modifiedCount === 0) {
      return res.status(400).json({ message: 'Already following this user' });
    }

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

    // ⚡ Bolt: Replace findById + save with lightweight existence checks and atomic operations
    // This avoids fully hydrating both user documents and limits database roundtrips
    const [userToUnfollowExists, currentUserExists] = await Promise.all([
      User.exists({ _id: req.params.userId }),
      User.exists({ _id: req.user.userId })
    ]);

    if (!userToUnfollowExists || !currentUserExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ⚡ Bolt: Use atomic updateOne with $pull to avoid full document hydration overhead
    await Promise.all([
      User.updateOne(
        { _id: req.user.userId },
        { $pull: { following: req.params.userId } },
        { runValidators: true }
      ),
      User.updateOne(
        { _id: req.params.userId },
        { $pull: { followers: req.user.userId } },
        { runValidators: true }
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