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
console.log("- GCS_KEYFILE exists:", !!process.env.GCS_KEYFILE);
console.log("- GOOGLE_CLOUD_PROJECT_ID exists:", !!process.env.GOOGLE_CLOUD_PROJECT_ID);
console.log("- GOOGLE_CLOUD_BUCKET_NAME exists:", !!process.env.GOOGLE_CLOUD_BUCKET_NAME);

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
checkDir('./config');

if (process.env.GCS_KEYFILE) {
  checkDir('./config/keys');
}

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
      host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
      database: process.env.DATABASE_URL?.split('/').pop() || 'unknown',
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
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
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
    const dbConnected = await initializeDatabase();
    setupSession();
    
    console.log("Setting up routes individually...");
    const setupRoute = (name, routePath) => {
      try {
        console.log(`Loading ${name}...`);
        const router = require(routePath);
        app.use("/api/v1", router);
        console.log(`${name} loaded successfully`);
        return true;
      } catch (error) {
        console.error(`Error loading ${name}:`, error.message);
        console.error(error.stack);
        return false;
      }
    };
    
    // Define routes with their paths
    const routes = [
      { name: 'userRoutes', path: './routes/userRoutes' },
      { name: 'academicRoutes', path: './routes/academicRoutes' },
      { name: 'attendanceRoutes', path: './routes/attendanceRoutes' },
      { name: 'newsRoutes', path: './routes/newsRoutes' },
      { name: 'staffRoutes', path: './routes/staffRoutes' },
      { name: 'quoteRoutes', path: './routes/quoteRoutes' },
      { name: 'pointRoutes', path: './routes/pointRoutes' },
      { name: 'salarySlipRoutes', path: './routes/salarySlipRoutes' },
      { name: 'studentRoutes', path: './routes/studentRoutes' },
      { name: 'teacherRoutes', path: './routes/teacherRoutes' }
    ];

    const results = routes.map(route => setupRoute(route.name, route.path));
    const successCount = results.filter(Boolean).length;
    
    console.log(`Routes setup complete: ${successCount}/${routes.length} routes loaded successfully`);

    // 404 handler for routes that don't exist
    app.use((req, res) => {
      res.status(404).json({
        status: false,
        message: "Route tidak ditemukan",
        path: req.originalUrl
      });
    });

    // Global error handler
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