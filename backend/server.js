require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    error: null,
    meta: {
      timestamp: Date.now(),
      version: '1.0',
    },
  });
});

// API routes (placeholder)
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'ClientMapr API v1',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
      },
    },
    error: null,
  });
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
