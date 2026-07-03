const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
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

app.use((req, res, next) => {
  if (req.originalUrl === "/api-docs") {
    return res.redirect(301, "/api-docs/");
  }

  return next();
});

app.get("/api-docs/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cellphone Store API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api-docs.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout"
        });
      };
    </script>
  </body>
</html>`);
});

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
