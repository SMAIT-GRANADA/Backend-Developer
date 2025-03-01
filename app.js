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
    await pool.query("SELECT 1");
    console.log("Database connection verified successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
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
};

const setupSession = () => {
  if (pool) {
    try {
      const sessionSecret =
        process.env.SESSION_SECRET || "granada-session-fallback-key";

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
    } catch (error) {
      console.error("Failed to setup database session:", error.message);
      setupMemorySession();
    }
  } else {
    setupMemorySession();
  }
};

const setupRoutes = () => {
  try {
    const userRouter = require("./routes/userRoutes");
    const academicRouter = require("./routes/academicRoutes");
    const attendanceRouter = require("./routes/attendanceRoutes");
    const newsRouter = require("./routes/newsRoutes");
    const staffRouter = require("./routes/staffRoutes");
    const quoteRouter = require("./routes/quoteRoutes");
    const pointRouter = require("./routes/pointRoutes");
    const salarySlipRouter = require("./routes/salarySlipRoutes");
    const studentRouter = require("./routes/studentRoutes");
    const teacherRouter = require("./routes/teacherRoutes");

    const apiRoutes = [
      newsRouter,
      staffRouter,
      quoteRouter,
      userRouter,
      academicRouter,
      attendanceRouter,
      pointRouter,
      salarySlipRouter,
      studentRouter,
      teacherRouter,
    ];

    apiRoutes.forEach((router, index) => {
      if (!router) {
        console.error(`Router at index ${index} is undefined`);
        return;
      }
      app.use("/api/v1", router);
    });
    
    return true;
  } catch (error) {
    console.error("Error setting up routes:", error);
    app.use("/api/v1", (req, res) => {
      res.status(503).json({
        status: false,
        message: "API temporarily unavailable",
        path: req.originalUrl
      });
    });
    return false;
  }
};

const startServer = async () => {
  try {
    await initializeDatabase();
    setupSession();
    setupRoutes();

    app.use((req, res) => {
      res.status(404).json({
        status: false,
        message: "Route tidak ditemukan",
        path: req.originalUrl
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

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running at http://0.0.0.0:${PORT}`);
    });
    
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        if (pool) pool.end();
      });
    });
    
    return server;
  } catch (error) {
    console.error("Error during application initialization:", error);

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in degraded mode at http://0.0.0.0:${PORT}`);
    });
    return server;
  }
};

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
});

module.exports = app;