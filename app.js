const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// const userRouter = require("./routes/userRouter");
// const productRouter = require("./routes/productRouter");

// const routers = [userRouter, productRouter];
// routers.forEach(router => app.use('/api/v1', router));

// Port
const PORT = process.env.PORT || 8080;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;