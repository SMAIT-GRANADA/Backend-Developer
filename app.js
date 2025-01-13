const express = require("express");
const dotenv = require("dotenv");
const userRouter = require("./routes/userRoutes");
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

const routers = [userRouter];
routers.forEach(router => app.use('/api/v1', router));

const PORT = process.env.PORT || 8080;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;