const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

console.log(`Starting application on port ${PORT}`);

console.log("Environment variables check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("- JWT_ACCESS_SECRET exists:", !!process.env.JWT_ACCESS_SECRET);
console.log("- JWT_REFRESH_SECRET exists:", !!process.env.JWT_REFRESH_SECRET);
console.log("- SESSION_SECRET exists:", !!process.env.SESSION_SECRET);

console.log("Checking directory structure:");
const checkDir = (dir) => {
  try {
    const files = fs.readdirSync(dir);
    console.log(`Directory ${dir} contains:`, files);
    return true;
  } catch (e) {
    console.error(`Error reading directory ${dir}:`, e.message);
    return false;
  }
};

checkDir('./routes');
checkDir('./controllers');
checkDir('./services');

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
    console.log("Database URL format check:");
    const dbUrl = process.env.DATABASE_URL || '';
    console.log("- Contains 'cloudsql':", dbUrl.includes('cloudsql'));
    console.log("- Contains 'postgresql':", dbUrl.includes('postgresql'));
    console.log("Attempting database connection with config:", {
      host: process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown',
      database: process.env.DATABASE_URL.split('/').pop() || 'unknown',
      ssl: process.env.NODE_ENV === 'production',
    });
    
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
    console.error("Database connection failed:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
};

const setupMemorySession = () => {
  console.log("Setting up memory session");
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
  console.log("Setting up session middleware");
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
      console.log("Database session setup complete");
    } catch (error) {
      console.error("Failed to setup database session:", error.message);
      setupMemorySession();
    }
  } else {
    console.log("No pool available, using memory session");
    setupMemorySession();
  }
};

const startServer = async () => {
  try {
    await initializeDatabase();
    setupSession();
    console.log("Setting up routes directly...");
    
    try {
      console.log("Loading userRoutes...");
      app.use("/api/v1", require("./routes/userRoutes"));
      console.log("userRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading userRoutes:", error.message);
    }
    
    try {
      console.log("Loading academicRoutes...");
      app.use("/api/v1", require("./routes/academicRoutes"));
      console.log("academicRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading academicRoutes:", error.message);
    }
    
    try {
      console.log("Loading attendanceRoutes...");
      app.use("/api/v1", require("./routes/attendanceRoutes"));
      console.log("attendanceRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading attendanceRoutes:", error.message);
    }
    
    try {
      console.log("Loading newsRoutes...");
      app.use("/api/v1", require("./routes/newsRoutes"));
      console.log("newsRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading newsRoutes:", error.message);
    }
    
    try {
      console.log("Loading staffRoutes...");
      app.use("/api/v1", require("./routes/staffRoutes"));
      console.log("staffRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading staffRoutes:", error.message);
    }
    
    try {
      console.log("Loading quoteRoutes...");
      app.use("/api/v1", require("./routes/quoteRoutes"));
      console.log("quoteRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading quoteRoutes:", error.message);
    }
    
    try {
      console.log("Loading pointRoutes...");
      app.use("/api/v1", require("./routes/pointRoutes"));
      console.log("pointRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading pointRoutes:", error.message);
    }
    
    try {
      console.log("Loading salarySlipRoutes...");
      app.use("/api/v1", require("./routes/salarySlipRoutes"));
      console.log("salarySlipRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading salarySlipRoutes:", error.message);
    }
    
    try {
      console.log("Loading studentRoutes...");
      app.use("/api/v1", require("./routes/studentRoutes"));
      console.log("studentRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading studentRoutes:", error.message);
    }
    
    try {
      console.log("Loading teacherRoutes...");
      app.use("/api/v1", require("./routes/teacherRoutes"));
      console.log("teacherRoutes loaded successfully");
    } catch (error) {
      console.error("Error loading teacherRoutes:", error.message);
    }
    
    console.log("All routes setup complete");

    app.use((req, res) => {
      res.status(404).json({
        status: false,
        message: "Route tidak ditemukan",
        path: req.originalUrl
      });
    });

    app.use((err, req, res, next) => {
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method
      });
      
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