require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const paymentRoutes = require('./routes/payment');
const webhookRoutes = require('./routes/webhook');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Webhook raw body middleware BEFORE express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/api', paymentRoutes);
app.use('/api', webhookRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('TrackPay Backend API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
