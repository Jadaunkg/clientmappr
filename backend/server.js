require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const logger = require('./src/utils/logger');

// Firebase Authentication
const { initializeFirebase } = require('./src/utils/firebaseConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Firebase Initialization
// ============================================

try {
  initializeFirebase();
  logger.info('✅ Firebase Admin SDK initialized');
} catch (error) {
  logger.error('❌ Failed to initialize Firebase:', error);
  // Continue running but auth endpoints will fail
}

// ============================================
// Middleware Setup
// ============================================

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================
// Routes
// ============================================

// Import route modules
import('./src/routes/healthRoutes.js').then((module) => {
  const healthRoutes = module.default;
  app.use('/', healthRoutes);
  app.use('/api/v1', healthRoutes);
  logger.info('✅ Health routes mounted');
}).catch((err) => {
  logger.error('Failed to load health routes:', err);
});

import('./src/routes/userRoutes.js').then((module) => {
  const userRoutes = module.default;
  app.use('/api/v1', userRoutes);
  logger.info('✅ User routes mounted');
}).catch((err) => {
  logger.error('Failed to load user routes:', err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      message: 'Route not found',
      path: req.path,
      method: req.method,
    },
    meta: {
      timestamp: Date.now(),
    },
  });
});

// ============================================
// Error Handling Middleware
// ============================================

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
    },
    meta: {
      timestamp: Date.now(),
    },
  });
});

// ============================================
// Server Startup
// ============================================

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
