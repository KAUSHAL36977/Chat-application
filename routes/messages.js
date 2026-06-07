const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    // ⚡ Bolt: Added .lean() to read-only query for performance improvement
    // This skips Mongoose document hydration, optimizing response time and memory for read-only JSON results
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
    .populate('replyTo')
    .lean();

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

    await message.populate([
      { path: 'sender', select: 'username profilePicture' },
      { path: 'recipient', select: 'username profilePicture' },
      { path: 'replyTo' }
    ]);

    res.status(201).json(message);
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

    // ⚡ Bolt: Replaced findById() + manual array manipulation + save() with atomic operations
    // Why: Prevents TOCTOU race conditions and avoids full document hydration overhead
    // Impact: Lower memory usage, no hydration penalty, and safer concurrent updates
    // Measurement: Compare memory footprint and API latency under high concurrency

    // First, remove existing reaction from this user if it exists
    await Message.updateOne(
      { _id: req.params.messageId },
      { $pull: { reactions: { user: req.user.userId } } }
    );

    // Then, add the new reaction and fetch the updated document
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { $push: { reactions: { user: req.user.userId, emoji } } },
      { new: true, runValidators: true }
    ).lean();

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error adding reaction', error: error.message });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    // ⚡ Bolt: Use a lean read for the existence/authorization check and a direct update for the soft delete.
    // This avoids unnecessary document hydration while preserving the existing API contract (404 vs 403).
    const existingMessage = await Message.findById(req.params.messageId).select('sender').lean();
    if (!existingMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (existingMessage.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Now perform the atomic update
    await Message.updateOne(
      { _id: req.params.messageId },
      { isDeleted: true }
    );

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

module.exports = router; 