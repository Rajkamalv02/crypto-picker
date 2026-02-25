require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/logger");

const requestLogger = require("./middleware/requestLogger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
const apiRoutes = require("./routes/api");
const stockApiRoutes = require("./routes/stockApi");
const analysisRoutes = require("./routes/analysisApi");
app.use("/api", apiRoutes);
app.use("/api/stock", stockApiRoutes);
app.use("/api/analysis", analysisRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "UP", timestamp: new Date() });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});
