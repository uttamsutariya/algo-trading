import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import cors from "cors";
import { handleWebhook } from "./rest/controllers/webhook.controller";
import strategyRoutes from "./rest/routes/strategy.routes";
import instrumentsRoutes from "./rest/routes/instruments.routes";
import authRoutes from "./rest/routes/auth";
import fyresAuthRoutes from "./rest/routes/fyres.routes";
import brokerRoutes from "./rest/routes/broker.routes";

import "./cron/instrumentsUpdate"; // Import the cron job to update symbols daily

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3200"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Content-Length", "X-Requested-With"]
  })
);
app.use(express.json());

// Routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/fyresAuth", fyresAuthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/strategies", strategyRoutes); // make it protected later
app.use("/api", instrumentsRoutes); // make it protected later
app.use("/api", brokerRoutes); // make it protected later
app.post("/api/webhook", handleWebhook);

export default app;
