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
const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
const routers = [newsRouter, staffRoutes, quoteRoutes, userRouter, academicRouter, attendanceRouter, pointRouter, salarySlipRoutes];
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
  console.error(err.stack);
  res.status(500).json({
    status: false,
    message: "Terjadi kesalahan internal server",
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;