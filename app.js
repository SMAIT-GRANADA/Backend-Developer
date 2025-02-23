const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");
const authConfig = require("./config/auth");

const userRouter = require("./routes/userRoutes");
const academicRouter = require("./routes/academicRoutes");
const attendanceRouter = require("./routes/attendanceRoutes");
const newsRouter = require("./routes/newsRoutes");
const staffRoutes = require("./routes/staffRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const pointRouter = require("./routes/pointRoutes");
const salarySlipRoutes = require("./routes/salarySlipRoutes")
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20,
  idleTimeoutMillis: 30000,
  retryDelay: 3000
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

app.get('/_health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["New-Access-Token"],
  })
);

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Increase payload limit for base64 images
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

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

// Routes
const routers = [newsRouter, staffRoutes, quoteRoutes, userRouter, academicRouter, attendanceRouter, pointRouter, salarySlipRoutes, studentRoutes];
routers.forEach((router) => app.use("/api/v1", router));


// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route tidak ditemukan",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: false,
    message: "Terjadi kesalahan internal server",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const startServer = () => {
  try {
    console.log('Starting server with configuration:');
    console.log('PORT:', PORT);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error occurred:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;