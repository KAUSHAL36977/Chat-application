const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    // ⚡ Bolt: lowercase modifier inherently handles case transformation, making a pre('save') hook redundant
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  // ⚡ Bolt: Use atomic updateOne to avoid save() middleware overhead during logins
  await this.model('User').updateOne(
    { _id: this._id },
    { $set: { lastLogin: this.lastLogin } },
    { runValidators: true }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User; 