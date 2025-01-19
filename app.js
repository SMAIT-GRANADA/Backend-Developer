const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");
const authConfig = require("./config/auth");
const userRouter = require("./routes/userRoutes");
const academicRouter = require("./routes/academicRoutes");
const attendanceRouter = require("./routes/attendanceRoutes");
const newsRouter = require("./routes/newsRoutes");

dotenv.config();

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    exposedHeaders: ["New-Access-Token"],
  })
);

// Increase payload limit for base64 images
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: authConfig.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: authConfig.session.cookie.maxAge,
      sameSite: "strict",
    },
    name: "sessionId",
  })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    message: "Terjadi kesalahan internal server",
  });
});

// Routes
const routers = [userRouter, academicRouter, attendanceRouter, newsRouter];
routers.forEach((router) => app.use("/api/v1", router));

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route tidak ditemukan",
  });
});

const PORT = process.env.PORT || 8080;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
