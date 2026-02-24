import express from "express";
import { attachWebSocketServer } from "./src/ws/server.js";
import http from "http";
import { matchesRoutes, commentaryRoutes } from "./src/routes/index.js";
import { securityMiddleware } from "./src/configs/arcjet.js";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Sportz API" });
});

app.use(securityMiddleware());
app.use("/matches", matchesRoutes);
app.use("/matches", commentaryRoutes);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running on ${baseUrl}`);
  console.log(
    `WebSocket Server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
