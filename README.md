# Modern Chat Application

A feature-rich chat application combining the best of Instagram and WhatsApp features.

## Features

- Real-time messaging using WebSocket
- User authentication and profile management
- Instagram-like stories with 24-hour expiration
- Media sharing (images, videos)
- Message reactions and emojis
- Online/offline status
- Message read receipts
- Follow/unfollow system
- User search
- Modern UI with dark/light mode

## Tech Stack

- Backend:
  - Node.js
  - Express.js
  - Socket.IO
  - MongoDB
  - JWT Authentication
  - Cloudinary (for media storage)

- Frontend (to be implemented):
  - React.js
  - Material-UI
  - Socket.IO Client
  - Redux Toolkit
  - React Router

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. Start MongoDB locally or use MongoDB Atlas

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user

### Users
- GET /api/users/:userId - Get user profile
- PUT /api/users/profile - Update user profile
- POST /api/users/:userId/follow - Follow user
- POST /api/users/:userId/unfollow - Unfollow user
- GET /api/users/search/:query - Search users

### Messages
- GET /api/messages/:userId - Get messages between users
- POST /api/messages - Send new message
- PUT /api/messages/read/:senderId - Mark messages as read
- POST /api/messages/:messageId/reactions - Add reaction to message
- DELETE /api/messages/:messageId - Delete message

### Stories
- POST /api/stories - Create new story
- GET /api/stories/feed - Get stories from followed users
- GET /api/stories/my-stories - Get user's own stories
- POST /api/stories/:storyId/view - Mark story as viewed
- DELETE /api/stories/:storyId - Delete story

## WebSocket Events

### Connection Events
- user:connect - User connects to socket
- user:online - User goes online
- user:offline - User goes offline

### Message Events
- message:send - Send message
- message:receive - Receive message
- message:read - Message read receipt
- typing:start - User starts typing
- typing:stop - User stops typing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License. 