const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const { openApiSpec } = require("./docs/openapi");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const masterDataRoutes = require("./routes/masterDataRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const { sendError, sendSuccess } = require("./utils/response");

const app = express();

app.get("/api-docs.json", (req, res) => {
  res.json(openApiSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  sendSuccess(res, {
    message: "Health check passed",
    data: { status: "ok" }
  });
});

app.use("/api", authRoutes);
app.use("/api", productRoutes);
app.use("/api", masterDataRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", customerRoutes);
app.use("/api", orderRoutes);
app.use("/api", userRoutes);

app.use((req, res) => {
  sendError(res, {
    statusCode: 404,
    message: "Route not found",
    errors: { route: ["Route not found."] }
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  sendError(res, {
    statusCode: 500,
    message: "Internal server error",
    errors: { server: ["Internal server error."] }
  });
});

module.exports = app;
