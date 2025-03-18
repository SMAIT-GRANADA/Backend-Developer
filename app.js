const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

console.log(`Starting application on port ${PORT}`);
console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
console.log("Database URL format:", 
  process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/postgresql:\/\/[^:]+:[^@]+@/, "postgresql://user:****@") : 
  "DATABASE_URL not set");

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
    // "https://testingbrok.vercel.app",
  ].filter(Boolean),
  credentials: true,
  exposedHeaders: ["New-Access-Token"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

function formatDatabaseUrl(url) {
  try {
    if (!url) return url;
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    if (match) {
      const [_, username, password, host, port, database] = match;
      const encodedPassword = encodeURIComponent(password);
      return `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
    }
    return url;
  } catch (error) {
    console.error("Error formatting database URL:", error);
    return url;
  }
}
let pool;
const initializeDatabase = async () => {
  try {
    console.log("Attempting database connection...");
    let sslConfig;
    if (process.env.NODE_ENV === 'production') {
      sslConfig = { rejectUnauthorized: false };
    } else {
      sslConfig = false;
    }
    
    pool = new Pool({
      connectionString: formatDatabaseUrl(process.env.DATABASE_URL),
      ssl: sslConfig,
      connectionTimeoutMillis: 10000,
      max: 20,
      idleTimeoutMillis: 30000,
      retryDelay: 3000,
    });
    
    await pool.query("SELECT 1");
    console.log("Database connection verified successfully");
    try {
      const result = await pool.query("SELECT current_database();");
      console.log("Connected to database:", result.rows[0].current_database);
    } catch (dbNameError) {
      console.error("Could not determine database name:", dbNameError.message);
    }
    
    return true;
  } catch (sslError) {
    if (sslError.message && sslError.message.includes('SSL')) {
      console.log("SSL connection failed, retrying without SSL...");
      
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
        connectionTimeoutMillis: 10000,
        max: 20,
        idleTimeoutMillis: 30000,
        retryDelay: 3000,
      });
      
      try {
        await pool.query("SELECT 1");
        console.log("Database connection without SSL verified successfully");
        try {
          const result = await pool.query("SELECT current_database();");
          console.log("Connected to database:", result.rows[0].current_database);
        } catch (dbNameError) {
          console.error("Could not determine database name:", dbNameError.message);
        }
        
        return true;
      } catch (error) {
        console.error("Database connection failed:", error.message);
        if (error.message.includes('database')) {
          console.error("Database connection error details:", error);
        }
        return false;
      }
    } else {
      console.error("Database connection failed:", sslError.message);
      if (sslError.message.includes('database')) {
        console.error("Database connection error details:", sslError);
      }
      return false;
    }
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
  console.log("Memory session setup complete");
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

const setupRoutes = () => {
  try {
    const routes = [
      { name: 'newsRoutes', path: './routes/newsRoutes' },
      { name: 'staffRoutes', path: './routes/staffRoutes' },
      { name: 'quoteRoutes', path: './routes/quoteRoutes' },
      { name: 'userRoutes', path: './routes/userRoutes' },
      { name: 'academicRoutes', path: './routes/academicRoutes' },
      { name: 'attendanceRoutes', path: './routes/attendanceRoutes' },
      { name: 'pointRoutes', path: './routes/pointRoutes' },
      { name: 'salarySlipRoutes', path: './routes/salarySlipRoutes' },
      { name: 'studentRoutes', path: './routes/studentRoutes' },
      { name: 'teacherRoutes', path: './routes/teacherRoutes' }
    ];
    
    let loadedCount = 0;
    for (const route of routes) {
      try {
        const router = require(route.path);
        if (router) {
          app.use("/api/v1", router);
          loadedCount++;
        } else {
          console.error(`Router ${route.name} is undefined`);
        }
      } catch (routeError) {
        console.error(`Error loading ${route.name}:`, routeError.message);
      }
    }
    
    console.log(`Routes setup complete: ${loadedCount}/${routes.length} routes loaded successfully`);
    return loadedCount > 0;
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
    const dbConnected = await initializeDatabase();
    setupSession();
    const routesSetup = setupRoutes();
    
    // Handler untuk route 404
    app.use((req, res) => {
      res.status(404).json({
        status: false,
        message: "Route tidak ditemukan",
        path: req.originalUrl
      });
    });
    
    // Global error handler
    app.use((err, req, res, next) => {
      console.error("Error:", err.message);
      
      res.status(err.status || 500).json({
        status: false,
        message: err.message || "Terjadi kesalahan internal server",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    });

    const server = app.listen(PORT, "0.0.0.0", () => {
      if (dbConnected && routesSetup) {
        console.log(`Server is running at http://0.0.0.0:${PORT}`);
      } else {
        console.log(`Server running in degraded mode at http://0.0.0.0:${PORT}`);
      }
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