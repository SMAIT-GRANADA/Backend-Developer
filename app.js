const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
const userRouter = require("./routes/userRoutes");
const academicRouter = require("./routes/academicRoutes");
const newsRouter = require("./routes/newsRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
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
const routers = [userRouter, academicRouter, newsRouter];
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
