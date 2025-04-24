import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import campaignRoutes from './routes/campaigns';
import reservationRoutes from './routes/reservations';
import assetRoutes from './routes/assets';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/assets', assetRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join-campaign', (campaignId) => {
    socket.join(campaignId);
  });

  socket.on('reserve-page', (data) => {
    io.to(data.campaignId).emit('page-reserved', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mamamag')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 