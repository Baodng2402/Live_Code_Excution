import express from "express";
import cors from "cors";
import router from "./routes/api.routes";
import path from "path";
import { prisma } from "./config/db";
import { env } from "./config/env";

const app = express();

app.use(cors());
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.get("/", (req, res) => {
  res.render("index");
});

app.use("/api", router);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log("Shutting down API...");
  server.close();
  await prisma.$disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
