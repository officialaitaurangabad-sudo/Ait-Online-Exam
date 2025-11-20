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
  authLimiter,
  examLimiter,
  uploadLimiter,
  passwordResetLimiter,
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
  process.env.CORS_ORIGIN || "http://localhost:5173",
  process.env.CLIENT_URL || "http://localhost:5173",
  // Add common development origins
  "http://localhost:5173",
  "http://localhost:3000",
  // Add VPS frontend URL (with both common ports)
  "http://46.37.122.240:5173",
  "http://46.37.122.240:3000",
].filter(Boolean); // Remove any undefined values

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
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
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Speed limiting
app.use(speedLimiter);

// General rate limiting
app.use("/api/", generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Logging middleware
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

// Static files
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
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/exams", examLimiter, examRoutes);
app.use("/api/questions", examLimiter, questionRoutes);
app.use("/api/results", examLimiter, resultRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/analytics", generalLimiter, analyticsRoutes);
app.use("/api/users", generalLimiter, userRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AIT Online Exam Platform API",
    version: "1.0.0",
    documentation: "/api/docs",
    health: "/health",
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
