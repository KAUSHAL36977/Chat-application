const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'username profilePicture')
    .populate('recipient', 'username profilePicture')
    .populate('replyTo');

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content, media, mediaType, replyTo } = req.body;

    const message = new Message({
      sender: req.user.userId,
      recipient: recipientId,
      content,
      media,
      mediaType,
      replyTo
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture')
      .populate('replyTo');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:senderId', auth, async (req, res) => {
  try {
    const messages = await Message.updateMany(
      {
        sender: req.params.senderId,
        recipient: req.user.userId,
        'readBy.user': { $ne: req.user.userId }
      },
      {
        $push: {
          readBy: {
            user: req.user.userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove existing reaction from the same user
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user.userId
    );

    // Add new reaction
    message.reactions.push({
      user: req.user.userId,
      emoji
    });

    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error adding reaction', error: error.message });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

module.exports = router; 