import 'dotenv/config'; // Load environment variables first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import configurePassport from './config/passport.js';
import { checkAndExpireSubscriptions } from './controllers/subscription.controller.js';
import emailService from './services/email.service.js';

// Environment constants
const PORT = parseInt(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Validate required configurations
const validateConfig = () => {
  const warnings = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'stugo-dev-secret-key-2026') {
    warnings.push('JWT_SECRET should be changed in production');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    warnings.push('GOOGLE_CLIENT_ID not configured');
  }

  if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    warnings.push('PayOS not fully configured');
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    warnings.push('SMTP email not configured (welcome/payment/booking/refund emails will be skipped)');
  }

  if (warnings.length > 0 && NODE_ENV === 'production') {
    warnings.forEach(w => console.warn(`⚠️ ${w}`));
  }

  return warnings.length === 0;
};

import connectDB from './config/database.js';
import { validatePayOSConfig } from './config/payos.js';

// Import routes
import {
  authRoutes,
  serviceRoutes,
  bookingRoutes,
  userRoutes,
  paymentRoutes,
  complaintRoutes,
  dashboardRoutes,
  reviewRoutes,
  subscriptionRoutes,
  transactionRoutes,
  chatbotRoutes,
  refundRoutes,
  comboRoutes
} from './routes/index.js';

const app = express();

app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      FRONTEND_URL,
      /\.vercel\.app$/,
    ];
    const isAllowed = allowed.some(pattern =>
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );
    if (isAllowed) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
// Handle preflight for all routes
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// Ensure Database Connection for Serverless (Vercel)
app.use(async (req, res, next) => {
  if (process.env.VERCEL) {
    try {
      await connectDB();
    } catch (error) {
      console.error('Vercel DB Connection Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed. Please check MONGODB_URI in Vercel settings and ensure IP is whitelisted (0.0.0.0/0) in MongoDB Atlas.',
        error: error.message 
      });
    }
  }
  next();
});


// Health check endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'StuGo API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// /health and /api/health both work (Railway + docker-compose use /health)
const healthHandler = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    environment: NODE_ENV
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Dedicated mail health check endpoint
app.get('/api/health/email', async (req, res) => {
  const result = await emailService.verifyEmailConnection();
  const statusCode = result.ok ? 200 : 503;

  res.status(statusCode).json({
    success: result.ok,
    status: result.ok ? 'healthy' : 'unhealthy',
    service: 'email',
    data: result
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/combos', comboRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đã tồn tại',
      field: Object.keys(err.keyValue)[0]
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID không hợp lệ'
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Validate configuration
    validateConfig();
    validatePayOSConfig();

    // Log MongoDB URI (masked)
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    console.log('� MontgoDB URI configured:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    // Connect to MongoDB with retry
    let retries = 3;
    while (retries > 0) {
      try {
        await connectDB();
        break;
      } catch (error) {
        retries--;
        console.log(`⚠️ MongoDB connection failed. Retries left: ${retries}`);
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
      }
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 StuGo API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      // Run expiry check on startup
      checkAndExpireSubscriptions(null, null).catch(err =>
        console.error('Subscription expiry check failed:', err.message)
      );

      // Keep-alive ping every 10 minutes to prevent Railway cold starts
      if (NODE_ENV === 'production') {
        const SELF_URL = process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/health`
          : `http://localhost:${PORT}/health`;
        setInterval(async () => {
          try {
            await fetch(SELF_URL);
          } catch {
            // silently ignore
          }
        }, 10 * 60 * 1000); // every 10 minutes
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);

    // Start server anyway for development (without DB)
    if (NODE_ENV === 'development') {
      console.log('⚠️ Starting server without database connection...');
      app.listen(PORT, () => {
        console.log(`🚀 StuGo API Server running on port ${PORT} (no DB)`);
      });
    } else {
      process.exit(1);
    }
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

if (!process.env.VERCEL) {
  startServer();
}


export default app;
