const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth');

// Create a new story
router.post('/', auth, async (req, res) => {
  try {
    const { media, mediaType, caption } = req.body;

    const story = new Story({
      user: req.user.userId,
      media,
      mediaType,
      caption
    });

    await story.save();

    const populatedStory = await Story.findById(story._id)
      .populate('user', 'username profilePicture');

    res.status(201).json(populatedStory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating story', error: error.message });
  }
});

// Get stories from users you follow
router.get('/feed', auth, async (req, res) => {
  try {
    const stories = await Story.find({
      user: { $in: req.user.following },
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePicture')
    .populate('viewers.user', 'username profilePicture');

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stories', error: error.message });
  }
});

// Get user's own stories
router.get('/my-stories', auth, async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.user.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('viewers.user', 'username profilePicture');

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stories', error: error.message });
  }
});

// Mark story as viewed
router.post('/:storyId/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user has already viewed the story
    const hasViewed = story.viewers.some(
      viewer => viewer.user.toString() === req.user.userId
    );

    if (!hasViewed) {
      story.viewers.push({
        user: req.user.userId,
        viewedAt: new Date()
      });
      await story.save();
    }

    res.json({ message: 'Story marked as viewed' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking story as viewed', error: error.message });
  }
});

// Delete story
router.delete('/:storyId', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    story.isActive = false;
    await story.save();

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting story', error: error.message });
  }
});

module.exports = router; 