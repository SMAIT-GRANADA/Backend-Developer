const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

console.log(`Starting application on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

app.get("/_health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: "Granada API running",
  });
});

// Tambahkan penanganan CORS
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "https://testingbrok.vercel.app",
  ].filter(Boolean),
  credentials: true,
  exposedHeaders: ["New-Access-Token"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

let pool;
const initializeDatabase = async () => {
  try {
    let connectionConfig;

    if (
      process.env.NODE_ENV === "production" &&
      process.env.DATABASE_URL.includes("cloudsql")
    ) {
      connectionConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      };
    } else {
      connectionConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      };
    }

    pool = new Pool({
      ...connectionConfig,
      connectionTimeoutMillis: 10000,
      max: 20,
      idleTimeoutMillis: 30000,
      retryDelay: 3000,
    });
    await pool
      .query("SELECT 1")
      .then(() => {
        console.log("Database connection verified successfully");
      })
      .catch((err) => {
        console.error("Database connection test failed:", err.message);
      });
  } catch (error) {
    console.error("Failed to initialize database pool:", error.message);
  }
};

const setupSession = () => {
  if (pool) {
    try {
      const sessionSecret =
        process.env.SESSION_SECRET || "granada-session-fallback-key";

      if (!sessionSecret) {
        console.warn(
          "SESSION_SECRET not provided, using insecure default secret"
        );
      }

      app.use(
        session({
          store: new pgSession({
            pool,
            tableName: "sessions",
            createTableIfMissing: true,
          }),
          secret: sessionSecret,
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge:
              parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
            sameSite: "strict",
          },
          name: "sessionId",
        })
      );
      console.log("Session middleware configured with database");
    } catch (error) {
      console.error(
        "Failed to initialize session with database:",
        error.message
      );
      setupMemorySession();
    }
  } else {
    console.warn("Database not available, using memory session");
    setupMemorySession();
  }
};

const setupMemorySession = () => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "granada-session-fallback-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 86400000,
      },
    })
  );
  console.log("Session middleware configured with memory store");
};

const setupRoutes = () => {
  try {
    // Import routes
    const userRouter = require("./routes/userRoutes");
    const academicRouter = require("./routes/academicRoutes");
    const attendanceRouter = require("./routes/attendanceRoutes");
    const newsRouter = require("./routes/newsRoutes");
    const staffRoutes = require("./routes/staffRoutes");
    const quoteRoutes = require("./routes/quoteRoutes");
    const pointRouter = require("./routes/pointRoutes");
    const salarySlipRoutes = require("./routes/salarySlipRoutes");
    const studentRoutes = require("./routes/studentRoutes");
    const teacherRoutes = require("./routes/teacherRoutes");

    const apiRoutes = [
      newsRouter,
      staffRoutes,
      quoteRoutes,
      userRouter,
      academicRouter,
      attendanceRouter,
      pointRouter,
      salarySlipRoutes,
      studentRoutes,
      teacherRoutes,
    ];

    apiRoutes.forEach((router) => app.use("/api/v1", router));
    console.log("Routes configured successfully");
  } catch (error) {
    console.error("Error setting up routes:", error.message);
    app.use("/api/v1", (req, res) => {
      res.status(503).json({
        status: false,
        message: "API temporarily unavailable",
      });
    });
  }
};

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route tidak ditemukan",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: false,
    message: err.message || "Terjadi kesalahan internal server",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const startServer = async () => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });

  try {
    await initializeDatabase();
    setupSession();
    setupRoutes();
  } catch (error) {
    console.error("Error during application initialization:", error);
    console.log("Application continuing in degraded mode");
  }

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      if (pool) pool.end();
      console.log("Server closed");
    });
  });

  return server;
};

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  console.log("Server will continue running in minimal mode");
});

module.exports = app;
