const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const mediaRoutes = require("./routes/media");
const userRoutes = require("./routes/users");
const aiRoutes = require("./routes/ai");

const app = express();

const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
      continue;
    }

    value[key] = sanitizeObject(value[key]);
  }

  return value;
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
}));

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any localhost port in development, or the configured FRONTEND_URL in production
      if (!origin || origin.startsWith("http://localhost:") || origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

module.exports = app;
