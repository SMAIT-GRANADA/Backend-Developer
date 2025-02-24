const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");
const authConfig = require("./config/auth");

// Import routes
const userRouter = require("./routes/userRoutes");
const academicRouter = require("./routes/academicRoutes");
const attendanceRouter = require("./routes/attendanceRoutes");
const newsRouter = require("./routes/newsRoutes");
const staffRoutes = require("./routes/staffRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const pointRouter = require("./routes/pointRoutes");
const salarySlipRoutes = require("./routes/salarySlipRoutes");
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require("./routes/teacherRoutes");

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

console.log(`Starting application on port ${PORT}`);
console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    max: 20,
    idleTimeoutMillis: 30000,
    retryDelay: 3000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  console.log('Database pool created successfully');
} catch (error) {
  console.error('Failed to create database pool:', error);
}

if (pool) {
  pool.on('connect', () => {
    console.log('Database connected successfully');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

// Health check route
app.get('/_health', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(200).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: true,
    message: "Granada API running"
  });
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  exposedHeaders: ["New-Access-Token"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

if (pool) {
  try {
    const sessionConfig = {
      store: new pgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || authConfig.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || authConfig.session.cookie.maxAge,
        sameSite: "strict"
      },
      name: "sessionId"
    };

    app.use(session(sessionConfig));
    console.log('Session middleware configured successfully');
  } catch (error) {
    console.error('Failed to initialize session middleware:', error);
  }
}

// Routes
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
  teacherRoutes
];

apiRoutes.forEach((router) => app.use("/api/v1", router));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route tidak ditemukan"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: false,
    message: err.message || "Terjadi kesalahan internal server",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const startServer = async () => {
  try {
    let dbConnected = false;
    
    if (pool) {
      try {
        await pool.query('SELECT 1');
        console.log('Database connection verified');
        dbConnected = true;
      } catch (dbError) {
        console.error('Database connection check failed:', dbError);
        console.log('Starting server without confirmed DB connection');
      }
    } else {
      console.log('Starting server without database pool');
    }

    console.log('Attempting to start server on port:', PORT);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running at http://0.0.0.0:${PORT}`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Database connected:', dbConnected);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error occurred:', error);
      }
      process.exit(1);
    });
    
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        if (pool) {
          pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});

module.exports = app;