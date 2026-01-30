const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const morgan = require("morgan");
const path = require("path");
const {
  generalLimiter,
  examLimiter,
  uploadLimiter,
  speedLimiter,
  securityHeaders,
  requestSizeLimiter,
  securityLogger,
} = require("./middleware/securityMiddleware");

// Import routes
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const questionRoutes = require("./routes/questionRoutes");
const resultRoutes = require("./routes/resultRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");

// Import middleware
const { errorHandler, notFound } = require("./middleware/errorHandler");
const logger = require("./config/logger");

// CORS allowed origins from environment variables
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:5173",    // Frontend URL (from .env or default)
  process.env.CLIENT_URL || "http://localhost:5173",    // Client URL (default or from env)
  "http://localhost:5173",                               // Local development frontend port
  "http://localhost:3000",                               // Local frontend port
  "http://46.37.122.240:5173",                          // VPS frontend URL (with port 5173)
  "http://46.37.122.240:3000",                          // VPS frontend URL (with port 3000)
].filter(Boolean); // Filter out any undefined/null values

const app = express();

// Trust proxy (for rate limiting behind reverse proxy like Nginx)
app.set("trust proxy", 1);

// Security headers
app.use(securityHeaders);

// Security logging
app.use(securityLogger);

// Request size limiting
app.use(requestSizeLimiter);

// Helmet security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log for debugging
      logger.warn(`CORS blocked origin: ${origin}`);
      logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
      
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 hours
  })
);

// Handle preflight OPTIONS requests globally for all routes
app.options("*", cors());  // Allow preflight requests for all routes

// Speed limiting
app.use(speedLimiter);

// General rate limiting for API
app.use("/api/", generalLimiter);

// Body parsing middleware (for parsing JSON and URL-encoded requests)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware for reducing response sizes
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution (e.g., ?foo=bar&foo=baz)
app.use(hpp());

// Logging middleware (morgan)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes with specific rate limiting
app.use("/api/auth", authRoutes);
app.use("/api/exams", examLimiter, examRoutes);
app.use("/api/questions", examLimiter, questionRoutes);
app.use("/api/results", examLimiter, resultRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/analytics", generalLimiter, analyticsRoutes);
app.use("/api/users", generalLimiter, userRoutes);

// Root endpoint (API information)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AIT Online Exam Platform API",
    version: "1.0.0",
    documentation: "/api/docs",
    health: "/health",
  });
});

// 404 handler (in case the route does not exist)
app.use(notFound);

// Global error handler (to handle errors)
app.use(errorHandler);

// Graceful shutdown handling (for SIGTERM and SIGINT)
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
