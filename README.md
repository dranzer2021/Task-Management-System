# Task Management System

A full-stack MERN application for managing tasks and user assignments with document attachment capabilities.

## 🚀 Features

- User Authentication & Authorization (JWT)
- CRUD operations for Users and Tasks
- Document attachments (PDF) - up to 3 per task
- Real-time updates using WebSocket
- Responsive UI with Tailwind CSS
- Advanced filtering, sorting, and pagination
- Containerized with Docker
- Comprehensive test coverage

## 🛠️ Tech Stack

### Frontend
- React + Vite
- Redux Toolkit
- React Router DOM
- Tailwind CSS
- Axios
- PDF.js
- Socket.io-client

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (File uploads)
- Jest + Supertest
- Swagger UI Express

## 🏗️ Installation

### Prerequisites
- Docker and Docker Compose
- Node.js (v14 or higher)
- MongoDB

### Using Docker (Recommended)
1. Clone the repository
   ```bash
   git clone [repository-url]
   cd task-management-system
   ```

2. Create .env files
   ```bash
   cp .env.example .env
   ```

3. Start the application
   ```bash
   docker-compose up
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

### Manual Setup

1. Install dependencies
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

2. Start the development servers
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd client
   npm run dev
   ```

## 📚 API Documentation

API documentation is available through Swagger UI at `/api-docs` when the server is running.

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 🔐 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-management
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 📁 Project Structure

```
task-management-system/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── features/      # Redux slices
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── tests/           # Test files
│   └── utils/           # Utility functions
└── docker-compose.yml    # Docker composition file
```

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 