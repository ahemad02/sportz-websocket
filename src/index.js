import AgentAPI from "apminsight";
AgentAPI.config();

import express from "express";
import { matchRouter } from "./routes/matches.js";
import http from "http";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

const server = http.createServer(app);

app.use(express.json());
app.use(securityMiddleware());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

const { broadCastMatchCreated, broadcastCommentary } =
  attachWebSocketServer(server);

app.locals.broadCastMatchCreated = broadCastMatchCreated;

app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Example app listening on ${baseUrl}`);
  console.log(
    `Websocket server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
